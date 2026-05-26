// Mann-Whitney (Q1) and paired Wilcoxon signed-rank (Q2) on Palmer Penguins,
// validated against R's wilcox.test(... exact = FALSE).
//
// CSV note: this fixture uses pre-rename column names — `culmenLengthMm` and
// `flipperLengthMm` (the palmerpenguins R package later renamed these to
// `bill_length_mm` and `flipper_length_mm`). We treat `culmenLengthMm` as the
// bill-length analog the prompt asks about. Species column contains the full
// scientific name ("Adelie Penguin (Pygoscelis adeliae)"); we derive a short
// label by taking the first token.

import { readCSV, createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const CSV_PATH =
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/penguins.csv";

const schema = z.object({
  species: z.string(),
  culmenLengthMm: z.number().nullable(),
  flipperLengthMm: z.number().nullable(),
});

const raw = await readCSV(CSV_PATH, schema);

// Short species label (first whitespace-separated token).
const labelled = raw.mutate({
  species_short: (r) => r.species.split(" ")[0],
});

// ---------- Q1: Mann-Whitney, Adelie vs Chinstrap on flipperLengthMm ----------

const ac = labelled
  .filter((r) => r.species_short === "Adelie" || r.species_short === "Chinstrap")
  .removeNull("flipperLengthMm");

const adelie = ac
  .filter((r) => r.species_short === "Adelie")
  .flipperLengthMm;
const chinstrap = ac
  .filter((r) => r.species_short === "Chinstrap")
  .flipperLengthMm;

console.log(`Q1 sample sizes — Adelie: ${adelie.length}, Chinstrap: ${chinstrap.length}`);

// R sorts factor levels alphabetically: Adelie first, Chinstrap second, so
// x = Adelie, y = Chinstrap matches `wilcox.test(flipperLengthMm ~ species)`.
const q1 = s.test.nonparametric.mannWhitney({ x: adelie, y: chinstrap });

console.log("\nQ1 raw tidy-ts result:");
console.log(q1);

// ---------- Q2: paired Wilcoxon signed-rank, Gentoo flipper vs 3 * culmen ----

const gentoo = labelled
  .filter((r) => r.species_short === "Gentoo")
  .removeNull("flipperLengthMm", "culmenLengthMm");

const flipper = gentoo.flipperLengthMm;
const tripleBill = gentoo.culmenLengthMm.map((b) => 3 * b);

console.log(`\nQ2 sample size: ${flipper.length}`);

const q2 = s.test.nonparametric.wilcoxon({ x: flipper, y: tripleBill });

console.log("\nQ2 raw tidy-ts result:");
console.log(q2);

// ---------- R reference values (from /tmp/run56_ref.R) -----------------------
// These mirror the wilcox.test(...exact = FALSE) outputs and the
// rank-biserial effect sizes computed from W / V.

// Notes on effect-size conventions:
// - tidy-ts labels its Mann-Whitney effect "Rank Biserial Correlation" but the
//   value matches Rosenthal r = z / sqrt(N), not the 1 - 2U/(n1*n2) form.
//   We use the z/sqrt(N) value computed directly from R for comparison.
// - tidy-ts reports Cohen's d for paired Wilcoxon (mean(diff) / sd(diff)).
//   R doesn't return this from wilcox.test, so we compute it from the same
//   diff vector R uses, in R.
const R_REF = {
  q1: {
    W: 2733.5,
    p: 3.0280346002234e-8,
    // |r| = |z| / sqrt(N) with continuity-corrected z; sign follows the U sign
    // (group order Adelie - Chinstrap gives a negative z, hence negative r).
    r_eff: -0.3744235216,
  },
  q2: {
    V: 7626,
    p: 0,                    // R underflows to 0 (true p < 2.2e-16)
    cohens_d: 10.749788430762246, // mean(diff) / sd(diff)
  },
};

// Pull tidy-ts numbers in a defensive way — the skill says every test has
// testStatistic.value and effectSize.value.
const q1Stat = q1.testStatistic.value;
const q1P = q1.pValue;
const q1Eff = q1.effectSize.value;
const q1EffName = q1.effectSize.name;
const q1StatName = q1.testStatistic.name;

const q2Stat = q2.testStatistic.value;
const q2P = q2.pValue;
const q2Eff = q2.effectSize.value;
const q2EffName = q2.effectSize.name;
const q2StatName = q2.testStatistic.name;

// ---------- Compare ----------------------------------------------------------

const TOL = 1e-6;

interface Check {
  test: string;
  metric: string;
  tidyts: number;
  r: number;
  absDiff: number;
  pass: boolean;
}

function check(
  test: string,
  metric: string,
  tidyts: number,
  r: number,
  tol: number = TOL,
): Check {
  // p-value comparison handles R's 0 underflow: if R==0, accept anything ≤ tol.
  let absDiff: number;
  let pass: boolean;
  if (metric === "p-value" && r === 0) {
    absDiff = Math.abs(tidyts);
    pass = tidyts < 1e-15;
  } else {
    absDiff = Math.abs(tidyts - r);
    pass = absDiff < tol;
  }
  return { test, metric, tidyts, r, absDiff, pass };
}

// Effect-size tolerance is wider because z is recomputed from p via qnorm
// (continuity-correction discretisation propagates ~1e-3 differences).
const EFF_TOL = 1e-3;

const checks: Check[] = [
  check("Q1 Mann-Whitney", `statistic (${q1StatName})`, q1Stat, R_REF.q1.W),
  check("Q1 Mann-Whitney", "p-value", q1P, R_REF.q1.p),
  check("Q1 Mann-Whitney", `effect (${q1EffName})`, q1Eff, R_REF.q1.r_eff, EFF_TOL),
  check("Q2 Wilcoxon", `statistic (${q2StatName})`, q2Stat, R_REF.q2.V),
  check("Q2 Wilcoxon", "p-value", q2P, R_REF.q2.p),
  check("Q2 Wilcoxon", `effect (${q2EffName})`, q2Eff, R_REF.q2.cohens_d),
];

// Pretty-print using tidy-ts itself.
const table = createDataFrame(checks).mutate({
  tidyts: (r) => Number.isFinite(r.tidyts) ? r.tidyts : r.tidyts,
  r: (r) => r.r,
  absDiff: (r) => r.absDiff,
  pass: (r) => r.pass ? "PASS" : "FAIL",
});

console.log("\n=== Pass/Fail Table (tolerance 1e-6) ===");
table.print();

// Also dump raw numbers in case formatting truncates.
console.log("\n=== Raw values ===");
for (const c of checks) {
  console.log(
    `${c.test} | ${c.metric}: tidy-ts=${c.tidyts}, R=${c.r}, |diff|=${c.absDiff}, ${c.pass ? "PASS" : "FAIL"}`,
  );
}

const allPass = checks.every((c) => c.pass);
console.log(`\nOverall: ${allPass ? "PASS" : "FAIL"}`);
