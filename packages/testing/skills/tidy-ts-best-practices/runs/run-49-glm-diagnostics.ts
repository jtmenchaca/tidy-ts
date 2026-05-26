// run-49-glm-diagnostics.ts
//
// Diagnostics exercise: fit mpg ~ wt + hp + cyl on mtcars and inspect
// deviance / pearson / response residuals, a hand-rolled standardized
// residual, and 95% vs 99% confidence intervals for the wt coefficient.
//
// API knowledge sourced only from:
//   .claude/skills/tidy-ts-best-practices/SKILL.md
//   .claude/skills/tidy-ts-best-practices/rules/{stats-glm,stats-descriptive,
//     dataframe-pipeline,io}.md

import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  model: z.string(),
  mpg: z.number(),
  cyl: z.number(),
  disp: z.number(),
  hp: z.number(),
  drat: z.number(),
  wt: z.number(),
  qsec: z.number(),
  vs: z.number(),
  am: z.number(),
  gear: z.number(),
  carb: z.number(),
});

const raw = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/mtcars.csv",
  schema,
);

// s.glm requires every formula column to be numeric (per stats-glm.md).
// model is a string label column — keep it out of the data frame passed to glm.
const df = raw.select("mpg", "wt", "hp", "cyl");

const model = s.glm({
  formula: "mpg ~ wt + hp + cyl",
  family: "gaussian",
  link: "identity",
  data: df,
});

const summary = model.summary();
console.log("=== model summary (key fields) ===");
console.log("n_observations         :", summary.n_observations);
console.log("residual_standard_error:", summary.residual_standard_error);
console.log("r_squared              :", summary.r_squared);
console.log("coefficients.names     :", summary.coefficients.names);
console.log("coefficients.estimate  :", summary.coefficients.estimate);

// ---------- 1. Deviance residuals ----------
const devRes = model.residuals({ type: "deviance" });
const devMin = s.min(devRes);
const devMax = s.max(devRes);
const devMed = s.median(devRes);
console.log("\n=== 1. deviance residuals ===");
console.log("min   :", devMin);
console.log("max   :", devMax);
console.log("median:", devMed);

// ---------- 2. Pearson residuals ----------
const pearRes = model.residuals({ type: "pearson" });
const pearMin = s.min(pearRes);
const pearMax = s.max(pearRes);
const pearMed = s.median(pearRes);
console.log("\n=== 2. pearson residuals ===");
console.log("min   :", pearMin);
console.log("max   :", pearMax);
console.log("median:", pearMed);

// ---------- 3. Response residuals — sum ~ 0 ----------
const respRes = model.residuals({ type: "response" });
const respSum = s.sum(respRes);
console.log("\n=== 3. response residuals ===");
console.log("sum (should be ~0):", respSum);

// ---------- 4. Studentized / standardized residual ----------
// The skill (stats-glm.md) documents residual types
// "deviance" | "pearson" | "working" | "response". It does NOT document a
// direct studentized residual API and does not describe how to obtain
// per-observation residual standard errors from vcov(). Per the task, this
// is a documentation finding — fall back to the simple standardized residual
// (response residual / residual_standard_error from summary()).
const rse = summary.residual_standard_error;
const stdRes = respRes.map((r) => r / rse);

// Find observation with the largest |standardized residual|.
const absStdRes = stdRes.map((r) => Math.abs(r));
let maxIdx = 0;
let maxAbs = absStdRes[0];
for (let i = 1; i < absStdRes.length; i++) {
  if (absStdRes[i] > maxAbs) {
    maxAbs = absStdRes[i];
    maxIdx = i;
  }
}
const carNames = raw.model; // column access per SKILL rule 6
console.log("\n=== 4. standardized residual (response / RSE) ===");
console.log("note: no direct studentized API documented in skill — using ",
  "response_residual / residual_standard_error");
console.log("largest |std resid| :", absStdRes[maxIdx]);
console.log("std resid (signed)  :", stdRes[maxIdx]);
console.log("car                 :", carNames[maxIdx]);

// ---------- 5. confint at 95% vs 99% ----------
const ci95 = model.confint({ level: 0.95 });
const ci99 = model.confint({ level: 0.99 });

const wt95Idx = ci95.names.indexOf("wt");
const wt99Idx = ci99.names.indexOf("wt");

const lo95 = ci95.lower[wt95Idx];
const hi95 = ci95.upper[wt95Idx];
const lo99 = ci99.lower[wt99Idx];
const hi99 = ci99.upper[wt99Idx];

console.log("\n=== 5. wt coefficient CIs ===");
console.log(`95% CI: [${lo95}, ${hi95}]`);
console.log(`99% CI: [${lo99}, ${hi99}]`);
console.log("99% strictly wider?", lo99 < lo95 && hi99 > hi95);
