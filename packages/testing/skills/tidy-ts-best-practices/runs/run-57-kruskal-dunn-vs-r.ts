// Run 57: Kruskal-Wallis omnibus + Dunn's post-hoc (Bonferroni) on penguins
// bill depth across species, validated against R's stats::kruskal.test and
// dunn.test::dunn.test. Uses only knowledge from the tidy-ts-best-practices
// skill rules.

import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const CSV_PATH =
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/penguins.csv";

// Per io.md: schema keys must match CSV headers exactly. Only load the
// columns we need. culmenDepthMm in the CSV is the same column R calls
// bill_depth_mm. .nullable() with default naValues handles the "NA" strings.
const schema = z.object({
  species: z.string(),
  culmenDepthMm: z.number().nullable(),
});

const raw = await readCSV(CSV_PATH, schema);

// Normalize the long species name ("Adelie Penguin (Pygoscelis adeliae)")
// to short labels matching R: Adelie / Chinstrap / Gentoo.
const labeled = raw.mutate({
  species_short: (r) =>
    r.species.includes("Adelie")
      ? "Adelie"
      : r.species.includes("Chinstrap")
      ? "Chinstrap"
      : r.species.includes("Gentoo")
      ? "Gentoo"
      : "Other",
});

// Per stats-tests.md / cardinal rule #5: removeNull narrows the row type.
// Drop rows missing the dependent variable (R's complete.cases on these cols).
const clean = labeled
  .removeNull("culmenDepthMm")
  .filter((r) => r.species_short !== "Other");

console.log("N rows (complete cases):", clean.nrows());

// Build the three groups in a stable order (matching R's factor order).
const speciesOrder = ["Adelie", "Chinstrap", "Gentoo"] as const;

const groups = speciesOrder.map((sp) =>
  clean.filter((r) => r.species_short === sp).culmenDepthMm
);

console.log("Group sizes:");
for (let i = 0; i < speciesOrder.length; i++) {
  console.log(`  ${speciesOrder[i]}: ${groups[i].length}`);
}

// === Kruskal-Wallis omnibus ===
const kw = s.test.nonparametric.kruskalWallis(groups);

console.log("\n=== Kruskal-Wallis (tidy-ts) ===");
console.log("Full result keys:", Object.keys(kw));
console.log("Full result:", kw);

const kwH = kw.testStatistic.value;
const kwP = kw.pValue;
// degreesOfFreedom is part of the universal-ish shape for tests where it
// applies; for Kruskal-Wallis df = k - 1.
// Skill doesn't promise this property, so probe defensively.
const kwDf = (kw as unknown as { degreesOfFreedom?: number }).degreesOfFreedom;
const kwDfFallback = groups.length - 1;

console.log(`tidy-ts H = ${kwH}`);
console.log(`tidy-ts df = ${kwDf ?? kwDfFallback} (from-result=${kwDf})`);
console.log(`tidy-ts p = ${kwP}`);

// === Dunn's post-hoc (Bonferroni) ===
const dunn = s.compare.postHoc.dunn(groups);
console.log("\n=== Dunn's post-hoc (tidy-ts) ===");
console.log("Correction:", dunn.correctionMethod);
console.log("Comparisons:");
for (const c of dunn.comparisons) {
  console.log(
    `  ${c.group1} vs ${c.group2}: z=${c.testStatistic.value}, adjP=${c.adjustedPValue}, rawP=${c.pValue}`,
  );
}

// === Compare with R reference values ===
const R = {
  H: 224.563147479943069,
  df: 2,
  p: 1.724773636640663e-49,
  // R's dunn.test uses pair label "A - B" where A and B are in the factor's
  // sort order. R reported pairs:
  //   Adelie - Chinstrap : Z = -0.444969041838479, adjP = 9.845131901785016e-01
  //   Adelie - Gentoo    : Z = 13.729619955677645, adjP = 1.012298684058968e-42
  //   Chinstrap - Gentoo : Z = 11.465303868924524, adjP = 2.955999915665936e-30
  pairs: {
    "Adelie|Chinstrap": { z: -0.444969041838479, adjP: 9.845131901785016e-01 },
    "Adelie|Gentoo": { z: 13.729619955677645, adjP: 1.012298684058968e-42 },
    "Chinstrap|Gentoo": { z: 11.465303868924524, adjP: 2.955999915665936e-30 },
  } as Record<string, { z: number; adjP: number }>,
};

// === Build pass/fail table ===
const TOL = 1e-6;

type Row = {
  metric: string;
  tidyts: number;
  r: number;
  absDiff: number;
  pass: boolean;
};
const rows: Row[] = [];

const push = (metric: string, tidyts: number, r: number) => {
  const absDiff = Math.abs(tidyts - r);
  rows.push({ metric, tidyts, r, absDiff, pass: absDiff < TOL });
};

push("KW H statistic", kwH, R.H);
push("KW degrees of freedom", kwDf ?? kwDfFallback, R.df);
push("KW p-value", kwP, R.p);

// Map tidy-ts comparison group labels back to species names by position.
// stats-tests.md says group1/group2 are "Group_1", "Group_2", ... indexed by
// input position. So we need to translate our positional index to the species
// name to compare to R's pair labels.
function speciesFromGroupLabel(label: string): string | null {
  // Try "Group_<n>" first.
  const m = /Group_?(\d+)/i.exec(label);
  if (m) {
    const idx = Number(m[1]) - 1;
    return speciesOrder[idx] ?? null;
  }
  // It might already be a species name if the API does that.
  if (speciesOrder.includes(label as (typeof speciesOrder)[number])) {
    return label;
  }
  return null;
}

for (const c of dunn.comparisons) {
  const a = speciesFromGroupLabel(c.group1);
  const b = speciesFromGroupLabel(c.group2);
  if (a == null || b == null) {
    console.log(`Could not map labels: ${c.group1} / ${c.group2}`);
    continue;
  }
  // Build a canonical key matching R's order (Adelie<Chinstrap<Gentoo).
  const ordered = [a, b].sort(
    (x, y) => speciesOrder.indexOf(x as (typeof speciesOrder)[number]) -
      speciesOrder.indexOf(y as (typeof speciesOrder)[number]),
  );
  const key = `${ordered[0]}|${ordered[1]}`;
  const ref = R.pairs[key];
  if (!ref) {
    console.log(`No R reference for pair ${key}`);
    continue;
  }
  // R orders the pair as "A - B" in the same factor order, so if tidy-ts has
  // (a,b) flipped vs the canonical order, the sign of Z should flip too.
  const flip = a !== ordered[0];
  const tidyZ = flip ? -c.testStatistic.value : c.testStatistic.value;

  push(`Dunn Z: ${ordered[0]} - ${ordered[1]}`, tidyZ, ref.z);
  push(
    `Dunn |Z|: ${ordered[0]} - ${ordered[1]}`,
    Math.abs(tidyZ),
    Math.abs(ref.z),
  );
  push(`Dunn adjP: ${ordered[0]} - ${ordered[1]}`, c.adjustedPValue, ref.adjP);
}

// === Print pass/fail table ===
console.log("\n========== PASS/FAIL TABLE (tol = 1e-6) ==========");
console.log(
  "metric                                    | tidy-ts             | R                   | |diff|              | pass",
);
console.log(
  "------------------------------------------+---------------------+---------------------+---------------------+-----",
);
for (const row of rows) {
  const m = row.metric.padEnd(41).slice(0, 41);
  const t = String(row.tidyts).padEnd(19).slice(0, 19);
  const r = String(row.r).padEnd(19).slice(0, 19);
  const d = row.absDiff.toExponential(6).padEnd(19).slice(0, 19);
  console.log(`${m} | ${t} | ${r} | ${d} | ${row.pass ? "PASS" : "FAIL"}`);
}

const allPass = rows.every((r) => r.pass);
console.log(`\nOverall: ${allPass ? "ALL PASS" : "FAILURES PRESENT"}`);
