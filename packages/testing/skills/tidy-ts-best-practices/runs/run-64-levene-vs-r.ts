// Levene's test (variance homogeneity) on penguin body mass by species,
// validated against R's car::leveneTest with center = median (default)
// and center = mean (classical Levene).
//
// Reference values were captured from R with options(digits = 17):
//   center = median:  F = 5.120250997519471,   df1 = 2, df2 = 339,
//                     p = 0.0064450828053239512
//   center = mean:    F = 5.3354950603149973,  df1 = 2, df2 = 339,
//                     p = 0.0052305347317909935

import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const TOL = 1e-6;

const schema = z.object({
  species: z.string(),
  bodyMassG: z.number().nullable(),
});

const path =
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/penguins.csv";

const raw = await readCSV(path, schema, { naValues: ["NA", ""] });
const clean = raw.removeNull("bodyMassG");

console.log("Total rows (after dropping null bodyMassG):", clean.nrows());

// Split body mass into one array per species.
// The skill describes `groupBy` as a marker (not iterable). Build the groups
// by extracting unique species and filtering per species.
const speciesList = [...new Set(clean.species)].sort();
console.log("Species:", speciesList);

const groups: number[][] = speciesList.map((sp) =>
  [...clean.filter((r) => r.species === sp).bodyMassG],
);

for (let i = 0; i < speciesList.length; i++) {
  console.log(`  ${speciesList[i]}: n = ${groups[i].length}`);
}

// Reference values from R (full precision).
const R_MEDIAN = {
  F: 5.120250997519471,
  df1: 2,
  df2: 339,
  p: 0.0064450828053239512,
};

const R_MEAN = {
  F: 5.3354950603149973,
  df1: 2,
  df2: 339,
  p: 0.0052305347317909935,
};

// --- tidy-ts Levene's test ---
// The skill (stats-tests.md) documents:
//   s.test.variance.levene([group1, group2, group3])
//   "Levene's test for equal variances (Brown-Forsythe modification)"
// No `center` parameter is documented. We pass groups positionally and see
// what variant the function runs against R.
const result = s.test.variance.levene(groups);

console.log("\n--- tidy-ts result ---");
console.log("testStatistic:", result.testStatistic);
console.log("pValue:", result.pValue);
console.log("Full result keys:", Object.keys(result));
console.log("Full result:", JSON.stringify(result, null, 2));

const tsF = result.testStatistic.value;
const tsP = result.pValue;
// dfBetween / dfWithin are the conventional names from anova.oneWay in the
// skill — check what Levene returns.
const resultAny = result as unknown as Record<string, unknown>;
const tsDf1 = resultAny.dfBetween as number | undefined;
const tsDf2 = resultAny.dfWithin as number | undefined;

console.log("dfBetween:", tsDf1);
console.log("dfWithin:", tsDf2);

// --- Comparison helper ---
type Row = {
  variant: string;
  metric: string;
  tidyts: number | undefined;
  R: number;
  absDiff: number;
  pass: boolean;
};

function row(
  variant: string,
  metric: string,
  tidyts: number | undefined,
  rVal: number,
): Row {
  if (tidyts === undefined) {
    return { variant, metric, tidyts, R: rVal, absDiff: NaN, pass: false };
  }
  const diff = Math.abs(tidyts - rVal);
  return { variant, metric, tidyts, R: rVal, absDiff: diff, pass: diff < TOL };
}

const rows: Row[] = [];

// Median-centered comparison
rows.push(row("median (Brown-Forsythe)", "F",   tsF,   R_MEDIAN.F));
rows.push(row("median (Brown-Forsythe)", "df1", tsDf1, R_MEDIAN.df1));
rows.push(row("median (Brown-Forsythe)", "df2", tsDf2, R_MEDIAN.df2));
rows.push(row("median (Brown-Forsythe)", "p",   tsP,   R_MEDIAN.p));

// Mean-centered comparison
rows.push(row("mean (classical)", "F",   tsF,   R_MEAN.F));
rows.push(row("mean (classical)", "df1", tsDf1, R_MEAN.df1));
rows.push(row("mean (classical)", "df2", tsDf2, R_MEAN.df2));
rows.push(row("mean (classical)", "p",   tsP,   R_MEAN.p));

console.log("\n=== PASS/FAIL TABLE (tolerance 1e-6) ===\n");
for (const r of rows) {
  const tsStr = r.tidyts === undefined ? "undefined" : r.tidyts.toString();
  console.log(
    `[${r.pass ? "PASS" : "FAIL"}] ${r.variant.padEnd(24)} ${r.metric.padEnd(4)} ` +
      `tidy-ts=${tsStr.padEnd(22)} R=${r.R.toString().padEnd(22)} ` +
      `|diff|=${r.absDiff}`,
  );
}

// Note on the API surface:
// The skill at rules/stats-tests.md documents only `s.test.variance.levene(groups)`
// (with no center option), and labels it "Brown-Forsythe modification" — which
// is the median-centered variant. If the tidy-ts API does NOT expose a
// `center` parameter, the mean-centered (classical) variant cannot be requested
// from tidy-ts. We confirm by checking whether passing `{ center: "mean" }` is
// even a valid input via runtime probing (TypeScript will tell us via the
// type-check whether the parameter exists).

console.log("\n--- API probing: does s.test.variance.levene accept a center option? ---");
// Attempt to pass an options-style call — if the function only accepts a
// positional array, this branch will not even compile. We use a structural
// any-cast to avoid breaking the file; the type-check on the canonical call
// above is what matters.
try {
  // deno-lint-ignore no-explicit-any
  const probe = (s.test.variance.levene as any)(groups, { center: "mean" });
  console.log("Probe call with { center: 'mean' } returned:", {
    F: probe?.testStatistic?.value,
    p: probe?.pValue,
  });
} catch (e) {
  console.log("Probe call threw:", (e as Error).message);
}
