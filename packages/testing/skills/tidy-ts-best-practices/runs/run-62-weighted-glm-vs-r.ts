/**
 * Run 62: Weighted Gaussian GLM (y ~ x1 + x2, weights = w) vs R lm().
 *
 * Uses ONLY guidance from rules/stats-glm.md, which shows:
 *   s.glm({ formula, family, link, data, options: { weights } })
 *
 * R reference (full precision via options(digits=17)):
 *   (Intercept)  estimate =  2.67840570157473978  SE = 0.132908621003585720  t =  20.1522345303882098  p = 1.8553171061785879e-07
 *   x1           estimate =  1.50839989989301948  SE = 0.036987569142939672  t =  40.7812661076416987  p = 1.3895527862318441e-09
 *   x2           estimate = -0.11739720617087494  SE = 0.078333288161667028  t = -1.4986886025847199   p = 1.7762993091045198e-01
 *   R-squared    =  0.99951440012319759
 *   sigma (RSE)  =  0.12980993123404308
 *   df.residual  =  7
 */

import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { x1: 1.0, x2: 2.3, y: 4.1, w: 1.0 },
  { x1: 2.0, x2: 1.7, y: 5.5, w: 2.0 },
  { x1: 3.0, x2: 3.1, y: 6.8, w: 1.5 },
  { x1: 4.0, x2: 2.9, y: 8.1, w: 0.5 },
  { x1: 5.0, x2: 4.2, y: 9.7, w: 1.0 },
  { x1: 6.0, x2: 3.8, y: 11.3, w: 2.5 },
  { x1: 7.0, x2: 5.1, y: 12.5, w: 1.0 },
  { x1: 8.0, x2: 4.6, y: 14.1, w: 0.8 },
  { x1: 9.0, x2: 6.0, y: 15.6, w: 1.2 },
  { x1: 10.0, x2: 5.5, y: 17.2, w: 1.8 },
]);

const model = s.glm({
  formula: "y ~ x1 + x2",
  family: "gaussian",
  link: "identity",
  data: df,
  options: { weights: df.w as number[] },
});

const summary = model.summary();
const coefs = summary.coefficients;

// Reference values from R (full precision).
const R = {
  estimate: {
    "(Intercept)": 2.67840570157473978,
    x1: 1.50839989989301948,
    x2: -0.11739720617087494,
  },
  stdError: {
    "(Intercept)": 0.132908621003585720,
    x1: 0.036987569142939672,
    x2: 0.078333288161667028,
  },
  tStat: {
    "(Intercept)": 20.1522345303882098,
    x1: 40.7812661076416987,
    x2: -1.4986886025847199,
  },
  pValue: {
    "(Intercept)": 1.8553171061785879e-07,
    x1: 1.3895527862318441e-09,
    x2: 1.7762993091045198e-01,
  },
  rSquared: 0.99951440012319759,
  rse: 0.12980993123404308,
  dfResidual: 7,
};

const TOL = 1e-6;

type Row = {
  metric: string;
  tidy: number;
  R: number;
  abs_diff: number;
  pass: string;
};

const rows: Row[] = [];

function compare(metric: string, tidy: number, rVal: number) {
  const diff = Math.abs(tidy - rVal);
  rows.push({
    metric,
    tidy,
    R: rVal,
    abs_diff: diff,
    pass: diff < TOL ? "PASS" : "FAIL",
  });
}

// Find each coefficient by name (names are parallel arrays in summary).
const nameIdx: Record<string, number> = {};
for (let i = 0; i < coefs.names.length; i++) {
  nameIdx[coefs.names[i]] = i;
}

console.log("Coefficient names returned by tidy-ts:", coefs.names);

for (const name of ["(Intercept)", "x1", "x2"] as const) {
  const i = nameIdx[name];
  if (i === undefined) {
    console.log(`MISSING coefficient name: ${name}`);
    continue;
  }
  compare(`estimate[${name}]`, coefs.estimate[i], R.estimate[name]);
  compare(`stdError[${name}]`, coefs.std_error[i], R.stdError[name]);
  compare(`tStat[${name}]`, coefs.statistic[i], R.tStat[name]);
  compare(`pValue[${name}]`, coefs.p_value[i], R.pValue[name]);
}

compare("r_squared", summary.r_squared, R.rSquared);
compare("residual_standard_error", summary.residual_standard_error, R.rse);
compare("df_residual", summary.df_residual, R.dfResidual);

console.log("\n=== Pass/Fail table (tolerance 1e-6) ===\n");
const fmt = (n: number) =>
  Number.isFinite(n) ? n.toExponential(10) : String(n);
const table = rows.map((r) => ({
  metric: r.metric,
  tidy: fmt(r.tidy),
  R: fmt(r.R),
  abs_diff: fmt(r.abs_diff),
  pass: r.pass,
}));
console.table(table);

const failed = rows.filter((r) => r.pass === "FAIL");
if (failed.length > 0) {
  console.log("\nFailures detail:");
  for (const f of failed) {
    console.log(
      `  ${f.metric}: tidy=${f.tidy}  R=${f.R}  |diff|=${f.abs_diff}`,
    );
  }
} else {
  console.log("\nAll metrics within tolerance 1e-6.");
}
