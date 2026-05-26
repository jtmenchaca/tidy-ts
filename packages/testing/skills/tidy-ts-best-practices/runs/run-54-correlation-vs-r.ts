// run-54-correlation-vs-r.ts
// Validate tidy-ts correlation tests against canonical R output (cor.test).
// Dataset: mtcars; relationship: mpg ~ wt; tests: Pearson, Spearman, Kendall.

import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  model: z.string(),
  mpg: z.number(),
  wt: z.number(),
});

const df = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/mtcars.csv",
  schema,
);

const clean = df.removeNull("mpg", "wt");

const pearson = s.test.correlation.pearson({ x: clean.mpg, y: clean.wt });
const spearman = s.test.correlation.spearman({ x: clean.mpg, y: clean.wt });
const kendall = s.test.correlation.kendall({ x: clean.mpg, y: clean.wt });

// R reference values (from cor.test with exact=FALSE for ties)
const R = {
  pearson_r: -0.86765937651722791,
  pearson_t: -9.5590441469721181,
  pearson_p: 1.293958701350493e-10,
  pearson_ci_lo: -0.93382641328499416,
  pearson_ci_hi: -0.7440871964601129,
  spearman_rho: -0.88642203327029778,
  spearman_S: 10292.318613522744,
  spearman_p: 1.4875948581275344e-11,
  kendall_tau: -0.727832149528431,
  kendall_z: -5.7981318949817302,
  kendall_p: 6.705770405595863e-09,
};

const TOL = 1e-6;

type Row = {
  test: string;
  output: string;
  tidyTs: number;
  R: number;
  absDiff: number;
  pass: string;
};

function check(test: string, output: string, tidyTs: number, rVal: number): Row {
  const diff = Math.abs(tidyTs - rVal);
  return {
    test,
    output,
    tidyTs,
    R: rVal,
    absDiff: diff,
    pass: diff <= TOL ? "PASS" : "FAIL",
  };
}

// Pearson — confidenceInterval available
// deno-lint-ignore no-explicit-any
const pCI = (pearson as any).confidenceInterval as
  | { lower: number; upper: number }
  | undefined;

const rows: Row[] = [
  check("Pearson", "coef (r)", pearson.effectSize.value, R.pearson_r),
  check("Pearson", "stat (t)", pearson.testStatistic.value, R.pearson_t),
  check("Pearson", "p-value", pearson.pValue, R.pearson_p),
  check(
    "Pearson",
    "CI lower",
    pCI?.lower ?? Number.NaN,
    R.pearson_ci_lo,
  ),
  check(
    "Pearson",
    "CI upper",
    pCI?.upper ?? Number.NaN,
    R.pearson_ci_hi,
  ),
  check("Spearman", "coef (rho)", spearman.effectSize.value, R.spearman_rho),
  check("Spearman", "stat (S)", spearman.testStatistic.value, R.spearman_S),
  check("Spearman", "p-value", spearman.pValue, R.spearman_p),
  check("Kendall", "coef (tau)", kendall.effectSize.value, R.kendall_tau),
  check("Kendall", "stat (z/T)", kendall.testStatistic.value, R.kendall_z),
  check("Kendall", "p-value", kendall.pValue, R.kendall_p),
];

console.log("\n=== Pearson result (tidy-ts) ===");
console.log(pearson);
console.log("\n=== Spearman result (tidy-ts) ===");
console.log(spearman);
console.log("\n=== Kendall result (tidy-ts) ===");
console.log(kendall);

console.log("\n=== Validation table (tolerance 1e-6) ===");
for (const r of rows) {
  console.log(
    `${r.pass}  ${r.test.padEnd(9)}  ${r.output.padEnd(12)}  tidy-ts=${
      r.tidyTs.toExponential(10)
    }  R=${r.R.toExponential(10)}  |diff|=${r.absDiff.toExponential(3)}`,
  );
}

const failures = rows.filter((r) => r.pass === "FAIL");
console.log(`\nTotal: ${rows.length}, Pass: ${rows.length - failures.length}, Fail: ${failures.length}`);
if (failures.length > 0) {
  console.log("\nFailing outputs:");
  for (const f of failures) {
    console.log(
      `  ${f.test} ${f.output}: tidy-ts=${f.tidyTs}, R=${f.R}, absDiff=${f.absDiff}`,
    );
  }
}
