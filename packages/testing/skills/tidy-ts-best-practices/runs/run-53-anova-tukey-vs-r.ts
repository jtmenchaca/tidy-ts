// run-53-anova-tukey-vs-r.ts
// Validate one-way ANOVA + Tukey HSD on Palmer Penguins body mass by species
// against canonical R values produced by /tmp/penguins-anova.R.
//
// Skill rules consulted:
//   - SKILL.md (imports, cardinal rules)
//   - rules/io.md (readCSV + Zod schema)
//   - rules/stats-tests.md (s.test.anova.oneWay, s.compare.postHoc.tukey)
//   - rules/dataframe-grouping.md, rules/dataframe-missing-data.md
//   - rules/dataframe-pipeline.md (mutate, filter, removeNull, column access)

import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const CSV_PATH =
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/penguins.csv";

// Schema — only the columns we need. Per io.md, schema keys must match
// CSV headers exactly. bodyMassG is .nullable() to absorb NA values.
const schema = z.object({
  species: z.string(),
  bodyMassG: z.number().nullable(),
});

const raw = await readCSV(CSV_PATH, schema, { naValues: ["NA", ""] });

// Reduce species to first word ("Adelie Penguin (...)" → "Adelie") to
// match the R reference where we did sub(" .*", "", species).
const tidied = raw
  .mutate({ species_short: (r) => r.species.split(" ")[0] })
  .removeNull("bodyMassG");

console.log(`Rows after removing null bodyMassG: ${tidied.nrows()}`);

// Per-group n
const counts = tidied
  .groupBy("species_short")
  .summarize({ n: (g) => g.nrows() })
  .arrange("species_short");
counts.print();

// Build the three groups in alphabetical order: Adelie, Chinstrap, Gentoo.
// This matches R's default factor level ordering and TukeyHSD output order.
const speciesOrder = ["Adelie", "Chinstrap", "Gentoo"] as const;
const groups: number[][] = speciesOrder.map((sp) =>
  tidied
    .filter((r) => r.species_short === sp)
    .bodyMassG.filter((v): v is number => v !== null)
);

console.log(
  `Group sizes: ${speciesOrder.map((sp, i) => `${sp}=${groups[i].length}`).join(", ")}`,
);

// ----- one-way ANOVA -----
const anova = s.test.anova.oneWay(groups);

// ----- Tukey HSD post-hoc -----
const tukey = s.compare.postHoc.tukey(groups);

// ----- R reference values (from /tmp/penguins-anova.R) -----
const R_REF = {
  F: 343.62627520548318,
  pValue: 2.8923681333753333e-82,
  dfBetween: 2,
  dfWithin: 339,
  ssBetween: 146864214.15551981,
  ssWithin: 72443483.212902412,
  tukey: {
    "Chinstrap-Adelie": {
      diff: 32.425983638491289,
      lwr: -126.50019596792973,
      upr: 191.3521632449123,
      padj: 0.88066658650872343,
    },
    "Gentoo-Adelie": {
      diff: 1375.354008506982154,
      lwr: 1243.17862833538379,
      upr: 1507.5293886785805,
      padj: 0.0,
    },
    "Gentoo-Chinstrap": {
      diff: 1342.928024868490866,
      lwr: 1178.48101250224704,
      upr: 1507.3750372347347,
      padj: 0.0,
    },
  },
} as const;

// Per stats-tests.md: F lives at testStatistic.value; dfBetween / dfWithin
// are top-level on the ANOVA result.
interface AnovaResultShape {
  testStatistic: { value: number; name: string };
  pValue: number;
  dfBetween: number;
  dfWithin: number;
  // Skill doesn't document SS fields explicitly — we'll probe at runtime.
}

const a = anova as unknown as AnovaResultShape & Record<string, unknown>;

// SS lives on `sumOfSquares: [between, within, total]` (discovered at
// runtime — not documented in stats-tests.md).
const anovaKeys = Object.keys(anova);
console.log(`\nANOVA result keys: ${anovaKeys.join(", ")}`);

const ssArray = a.sumOfSquares as readonly number[] | undefined;
const ssBetween = ssArray?.[0];
const ssWithin = ssArray?.[1];

// ----- assemble checks -----
type Check = {
  name: string;
  tidy: number | undefined;
  r: number;
  absDiff: number;
  tol: number;
  pass: boolean;
};

const TOL = 1e-6;

function check(name: string, tidy: number | undefined, r: number): Check {
  if (tidy === undefined || !Number.isFinite(tidy)) {
    return { name, tidy, r, absDiff: NaN, tol: TOL, pass: false };
  }
  const absDiff = Math.abs(tidy - r);
  // For tiny p-values, absolute difference can still meet 1e-6; use relative
  // only if both are tiny.
  let pass = absDiff <= TOL;
  if (!pass && Math.abs(r) < 1e-10 && Math.abs(tidy) < 1e-10) pass = true;
  return { name, tidy, r, absDiff, tol: TOL, pass };
}

const checks: Check[] = [];
checks.push(check("ANOVA F", anova.testStatistic.value, R_REF.F));
checks.push(check("ANOVA p", anova.pValue, R_REF.pValue));
checks.push(check("ANOVA df_between", anova.dfBetween, R_REF.dfBetween));
checks.push(check("ANOVA df_within", anova.dfWithin, R_REF.dfWithin));
checks.push(check("ANOVA SS_between", ssBetween, R_REF.ssBetween));
checks.push(check("ANOVA SS_within", ssWithin, R_REF.ssWithin));

// Tukey: per skill, comparisons[i] has group1/group2 named "Group_1" etc.
// Input order was [Adelie, Chinstrap, Gentoo] → indices 1,2,3:
//   Group_1 vs Group_2 → Chinstrap-Adelie (sign: g2 - g1, see below)
//   Group_1 vs Group_3 → Gentoo-Adelie
//   Group_2 vs Group_3 → Gentoo-Chinstrap
// We map each comparison object to the R "B-A" label using the index → species
// map, taking absolute value of meanDifference to compare magnitudes
// (sign ambiguity until we inspect actual output).
console.log("\nTukey comparisons raw:");
for (const c of tukey.comparisons) {
  console.log(JSON.stringify(c));
}

type TukeyPair = "Chinstrap-Adelie" | "Gentoo-Adelie" | "Gentoo-Chinstrap";
function pairLabel(g1: string, g2: string): TukeyPair | null {
  // Group_N → speciesOrder[N-1]
  const idx1 = Number.parseInt(g1.replace(/^Group_/, ""), 10) - 1;
  const idx2 = Number.parseInt(g2.replace(/^Group_/, ""), 10) - 1;
  if (!Number.isFinite(idx1) || !Number.isFinite(idx2)) return null;
  const sp1 = speciesOrder[idx1];
  const sp2 = speciesOrder[idx2];
  // R label is "later-earlier" where R's order is Adelie<Chinstrap<Gentoo.
  // speciesOrder is already in that order, so the second index (larger) is the
  // "B" in "B-A".
  const ordered = idx2 > idx1 ? [sp1, sp2] : [sp2, sp1];
  return `${ordered[1]}-${ordered[0]}` as TukeyPair;
}

for (const c of tukey.comparisons) {
  const label = pairLabel(c.group1, c.group2);
  if (label === null) continue;
  const ref = R_REF.tukey[label];

  // Empirically (this run): tidy-ts emits comparisons in upper-triangle order
  // (group1 has lower index than group2) with meanDifference = mean(g1) - mean(g2).
  // R reports B - A where B has the *higher* factor level. With Adelie<Chinstrap<Gentoo,
  // R's B is speciesOrder[max(idx1,idx2)] and A is speciesOrder[min]. So when
  // tidy's idx2 > idx1 (always, in this run), R's value = -tidy.meanDifference,
  // and R's [lwr, upr] = [-tidy.CI.upper, -tidy.CI.lower].
  const idx1 = Number.parseInt(c.group1.replace(/^Group_/, ""), 10) - 1;
  const idx2 = Number.parseInt(c.group2.replace(/^Group_/, ""), 10) - 1;
  const signedDiff = idx2 > idx1 ? -c.meanDifference : c.meanDifference;
  const lower = idx2 > idx1
    ? -c.confidenceInterval.upper
    : c.confidenceInterval.lower;
  const upper = idx2 > idx1
    ? -c.confidenceInterval.lower
    : c.confidenceInterval.upper;

  checks.push(check(`Tukey ${label} mean diff`, signedDiff, ref.diff));
  checks.push(check(`Tukey ${label} CI lower`, lower, ref.lwr));
  checks.push(check(`Tukey ${label} CI upper`, upper, ref.upr));
  checks.push(check(`Tukey ${label} adj p`, c.adjustedPValue, ref.padj));
}

// ----- print table -----
console.log("\n========================================================");
console.log("Pass/fail table (tolerance = 1e-6)");
console.log("========================================================");
const header =
  "name".padEnd(38) +
  " | " +
  "tidy-ts".padStart(24) +
  " | " +
  "R".padStart(24) +
  " | " +
  "abs diff".padStart(14) +
  " | pass";
console.log(header);
console.log("-".repeat(header.length));
for (const c of checks) {
  const tidyStr = c.tidy === undefined
    ? "undefined"
    : Number.isFinite(c.tidy)
    ? c.tidy.toString()
    : String(c.tidy);
  const diffStr = Number.isFinite(c.absDiff) ? c.absDiff.toExponential(3) : "n/a";
  console.log(
    c.name.padEnd(38) +
      " | " +
      tidyStr.padStart(24) +
      " | " +
      c.r.toString().padStart(24) +
      " | " +
      diffStr.padStart(14) +
      " | " +
      (c.pass ? "PASS" : "FAIL"),
  );
}

const failed = checks.filter((c) => !c.pass);
console.log(
  `\nTotals: ${checks.length - failed.length}/${checks.length} pass, ${failed.length} fail`,
);
if (failed.length > 0) {
  console.log("\nFailures:");
  for (const c of failed) {
    console.log(
      `  ${c.name}: tidy=${c.tidy} R=${c.r} absDiff=${c.absDiff}`,
    );
  }
}
