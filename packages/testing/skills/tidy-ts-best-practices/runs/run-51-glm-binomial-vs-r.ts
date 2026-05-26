// Run 51 — Logistic regression on Owls.csv: high_begging ~ FoodTreatment + SexParent + ArrivalTime
// Validates tidy-ts output against canonical R glm() values.

import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  Nest: z.string(),
  FoodTreatment: z.string(),
  SexParent: z.string(),
  ArrivalTime: z.number(),
  SiblingNegotiation: z.number(),
  BroodSize: z.number(),
  NegPerChick: z.number(),
  logBroodSize: z.number(),
});

const raw = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/Owls.csv",
  schema,
);

// GLM requires numeric columns only. Encode categoricals to match R's default
// reference levels (alphabetical first = reference):
//   FoodTreatment: Deprived (ref) / Satiated -> FoodTreatmentSatiated = 1 if Satiated
//   SexParent: Female (ref) / Male -> SexParentMale = 1 if Male
// Outcome: high_begging = 1 if SiblingNegotiation >= 5
const df = raw
  .mutate({
    high_begging: (r) => (r.SiblingNegotiation >= 5 ? 1 : 0),
    FoodTreatmentSatiated: (r) => (r.FoodTreatment === "Satiated" ? 1 : 0),
    SexParentMale: (r) => (r.SexParent === "Male" ? 1 : 0),
  })
  .select(
    "high_begging",
    "FoodTreatmentSatiated",
    "SexParentMale",
    "ArrivalTime",
  );

console.log(`Rows: ${df.nrows()}`);
console.log("First 3 rows:");
df.sliceHead(3).print();

const model = s.glm({
  formula: "high_begging ~ FoodTreatmentSatiated + SexParentMale + ArrivalTime",
  family: "binomial",
  link: "logit",
  data: df,
});

const summary = model.summary();

// R reference values (from Rscript run on same CSV)
const R = {
  coef: {
    "(Intercept)": 5.058271640929024,
    "FoodTreatmentSatiated": -1.022055371344316,
    "SexParentMale": 0.336434979505770,
    "ArrivalTime": -0.186831265855497,
  } as Record<string, number>,
  se: {
    "(Intercept)": 1.143484468173451,
    "FoodTreatmentSatiated": 0.173122449782415,
    "SexParentMale": 0.174614519906149,
    "ArrivalTime": 0.045517144091972,
  } as Record<string, number>,
  z: {
    "(Intercept)": 4.42355955128002,
    "FoodTreatmentSatiated": -5.90365589574815,
    "SexParentMale": 1.92672968826760,
    "ArrivalTime": -4.10463506844774,
  } as Record<string, number>,
  p: {
    "(Intercept)": 9.70878539659903e-06,
    "FoodTreatmentSatiated": 3.55533339261935e-09,
    "SexParentMale": 5.40133259796598e-02,
    "ArrivalTime": 4.04953619025284e-05,
  } as Record<string, number>,
  nullDeviance: 827.300854280848739,
  residualDeviance: 772.457385990114517,
  aic: 780.457385990114517,
  dfNull: 598,
  dfResidual: 595,
  ftCI: { lower: -1.36136913783319269, upper: -0.682741604855439 },
  pearson3: [-1.856801674085881, -1.100411014568285, -1.808864138243278],
  fitted3: [0.775165321568549, 0.547696408964904, 0.765917026042140],
};

const COEF_TOL = 1e-6;
const DEV_TOL = 1e-4;

type Row = { name: string; tidyts: number; r: number; diff: number; pass: boolean };
const rows: Row[] = [];

function check(name: string, tidyts: number, r: number, tol: number) {
  const diff = Math.abs(tidyts - r);
  rows.push({ name, tidyts, r, diff, pass: diff <= tol });
}

// summary.coefficients is an object with parallel arrays
const coefs = summary.coefficients;
console.log("\n=== tidy-ts coefficient names ===");
console.log(coefs.names);

for (let i = 0; i < coefs.names.length; i++) {
  const name = coefs.names[i];
  check(`coef[${name}]`, coefs.estimate[i], R.coef[name], COEF_TOL);
  check(`se[${name}]`, coefs.std_error[i], R.se[name], COEF_TOL);
  check(`z[${name}]`, coefs.statistic[i], R.z[name], COEF_TOL);
  // p-values can be small; use absolute tolerance same as coef
  check(`p[${name}]`, coefs.p_value[i], R.p[name], COEF_TOL);
}

check("null_deviance", summary.null_deviance, R.nullDeviance, DEV_TOL);
check("residual_deviance", summary.residual_deviance, R.residualDeviance, DEV_TOL);
check("aic", summary.aic, R.aic, DEV_TOL);
check("df_null", summary.df_null, R.dfNull, 0);
check("df_residual", summary.df_residual, R.dfResidual, 0);

// 95% Wald CI for FoodTreatmentSatiated
const ci = model.confint({ level: 0.95 });
const ftIdx = ci.names.indexOf("FoodTreatmentSatiated");
check("FT_CI_lower", ci.lower[ftIdx], R.ftCI.lower, COEF_TOL);
check("FT_CI_upper", ci.upper[ftIdx], R.ftCI.upper, COEF_TOL);

// First 3 Pearson residuals
const pres = model.residuals({ type: "pearson" });
for (let i = 0; i < 3; i++) {
  check(`pearson[${i}]`, pres[i], R.pearson3[i], COEF_TOL);
}

// First 3 fitted probabilities
const fitted = model.predict(undefined, { type: "response" });
for (let i = 0; i < 3; i++) {
  check(`fitted[${i}]`, fitted[i], R.fitted3[i], COEF_TOL);
}

// Print the pass/fail table
console.log("\n=== PASS/FAIL TABLE ===");
console.log(
  "name".padEnd(36) +
    "tidy-ts".padStart(24) +
    "R".padStart(24) +
    "diff".padStart(14) +
    "  result",
);
console.log("-".repeat(36 + 24 + 24 + 14 + 10));
for (const r of rows) {
  console.log(
    r.name.padEnd(36) +
      r.tidyts.toFixed(12).padStart(24) +
      r.r.toFixed(12).padStart(24) +
      r.diff.toExponential(3).padStart(14) +
      "  " +
      (r.pass ? "PASS" : "FAIL"),
  );
}

const failed = rows.filter((r) => !r.pass);
console.log(`\nTotal: ${rows.length}  Passed: ${rows.length - failed.length}  Failed: ${failed.length}`);
if (failed.length > 0) {
  console.log("\nFAILURES:");
  for (const f of failed) {
    console.log(
      `  ${f.name}: tidy-ts=${f.tidyts}  R=${f.r}  diff=${f.diff}`,
    );
  }
}
