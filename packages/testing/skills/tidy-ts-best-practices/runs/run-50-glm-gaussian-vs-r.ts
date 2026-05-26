// Validate tidy-ts s.glm gaussian/identity against canonical R
// lm(mpg ~ wt + hp + cyl, data = mtcars) outputs.

import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  mpg: z.number(),
  cyl: z.number(),
  hp: z.number(),
  wt: z.number(),
});

const df = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/fixtures/mtcars.csv",
  schema,
);

const model = s.glm({
  formula: "mpg ~ wt + hp + cyl",
  family: "gaussian",
  link: "identity",
  data: df,
});

const summary = model.summary();
const coefs = summary.coefficients;

// --- Canonical R reference values (from Rscript -e 'lm(mpg ~ wt + hp + cyl, data=mtcars)') ---
const R = {
  // names order from R: (Intercept), wt, hp, cyl
  estimate: {
    "(Intercept)": 38.7517873728655360,
    wt: -3.1669731107485819,
    hp: -0.0180381021431068,
    cyl: -0.9416168119907373,
  },
  stdError: {
    "(Intercept)": 1.7868640294275271,
    wt: 0.7405758792678173,
    hp: 0.0118762499454497,
    cyl: 0.5509163814507633,
  },
  tStat: {
    "(Intercept)": 21.68703758913362,
    wt: -4.27636546018709,
    hp: -1.51883820448036,
    cyl: -1.70918281556834,
  },
  pValue: {
    "(Intercept)": 4.79939880128456e-19,
    wt: 1.99476497472231e-04,
    hp: 1.40015155016129e-01,
    cyl: 9.84800974797220e-02,
  },
  rSquared: 0.843149983269399,
  adjRSquared: 0.826344624333977,
  fStatistic: 50.1714950873346,
  fPValue: 2.18417806065869e-11,
  residualSE: 2.51154847084154,
  dfResidual: 28,
  // confint(fit, "wt", level=0.95)
  wtCI: { lower: -4.68397403088207, upper: -1.64997219061509 },
  // residuals(fit)[1:3]  (Mazda RX4, Mazda RX4 Wag, Datsun 710)
  residuals: [-1.82042571501815, -1.01284757177718, -3.16039900865695],
  // fitted(fit)[1:3]
  fitted: [22.8204257150181, 22.0128475717772, 25.9603990086569],
};

// --- Helpers ---
type Check = {
  category: string;
  label: string;
  tidy: number;
  r: number;
  absDiff: number;
  tol: number;
  pass: boolean;
};

const results: Check[] = [];

function check(
  category: string,
  label: string,
  tidy: number,
  r: number,
  tol: number,
) {
  const absDiff = Math.abs(tidy - r);
  results.push({
    category,
    label,
    tidy,
    r,
    absDiff,
    tol,
    pass: absDiff <= tol,
  });
}

// Build a name -> index lookup over the coefficient table.
const coefNames = coefs.names;
function idx(name: string): number {
  const i = coefNames.indexOf(name);
  if (i < 0) throw new Error(`coefficient ${name} not found in ${coefNames.join(",")}`);
  return i;
}

// --- (1) Coefficient estimates ---
const tolCoef = 1e-6;
for (const name of ["(Intercept)", "wt", "hp", "cyl"] as const) {
  check(
    "1. estimate",
    name,
    coefs.estimate[idx(name)],
    R.estimate[name],
    tolCoef,
  );
}

// --- (2) Standard errors ---
for (const name of ["(Intercept)", "wt", "hp", "cyl"] as const) {
  check(
    "2. std_error",
    name,
    coefs.std_error[idx(name)],
    R.stdError[name],
    tolCoef,
  );
}

// --- (3) t-statistics ---
for (const name of ["(Intercept)", "wt", "hp", "cyl"] as const) {
  check(
    "3. t-stat",
    name,
    coefs.statistic[idx(name)],
    R.tStat[name],
    1e-6,
  );
}

// --- (4) p-values ---
for (const name of ["(Intercept)", "wt", "hp", "cyl"] as const) {
  // p-values for the intercept are tiny — use a relative-ish check
  // by comparing to R's value with an absolute tolerance of 1e-6.
  check(
    "4. p-value",
    name,
    coefs.p_value[idx(name)],
    R.pValue[name],
    1e-6,
  );
}

// --- (5) Model-level statistics ---
check("5. R^2", "r_squared", summary.r_squared, R.rSquared, 1e-6);
check(
  "5. adj R^2",
  "adjusted_r_squared",
  summary.adjusted_r_squared,
  R.adjRSquared,
  1e-6,
);
check("5. F-stat", "f_statistic", summary.f_statistic, R.fStatistic, 1e-4);
check("5. F p-value", "f_p_value", summary.f_p_value, R.fPValue, 1e-6);
check(
  "5. resid SE",
  "residual_standard_error",
  summary.residual_standard_error,
  R.residualSE,
  1e-6,
);
check("5. df_resid", "df_residual", summary.df_residual, R.dfResidual, 1e-6);

// --- (6) 95% CI for wt ---
const ci = model.confint({ level: 0.95 });
const wtI = ci.names.indexOf("wt");
check("6. wt CI lo", "lower", ci.lower[wtI], R.wtCI.lower, 1e-6);
check("6. wt CI hi", "upper", ci.upper[wtI], R.wtCI.upper, 1e-6);

// --- (7) First three residuals (response residuals == R residuals() for gaussian/identity) ---
const respResid = model.residuals({ type: "response" });
for (let i = 0; i < 3; i++) {
  check(`7. resid[${i}]`, `row ${i}`, respResid[i], R.residuals[i], 1e-4);
}

// Also probe the default ("deviance") since the skill says default is "deviance".
const devResid = model.residuals({ type: "deviance" });

// --- (8) First three fitted values ---
const fitted = model.predict(undefined, { type: "response" });
for (let i = 0; i < 3; i++) {
  check(`8. fit[${i}]`, `row ${i}`, fitted[i], R.fitted[i], 1e-4);
}

// --- Print the table ---
console.log("\n===== tidy-ts vs R: lm(mpg ~ wt + hp + cyl, data=mtcars) =====\n");
console.log(
  "category".padEnd(16) +
    "label".padEnd(18) +
    "tidy-ts".padEnd(26) +
    "R".padEnd(26) +
    "abs diff".padEnd(14) +
    "tol".padEnd(10) +
    "pass",
);
console.log("-".repeat(110));
for (const r of results) {
  console.log(
    r.category.padEnd(16) +
      r.label.padEnd(18) +
      r.tidy.toExponential(12).padEnd(26) +
      r.r.toExponential(12).padEnd(26) +
      r.absDiff.toExponential(4).padEnd(14) +
      r.tol.toExponential(1).padEnd(10) +
      (r.pass ? "PASS" : "FAIL"),
  );
}

const failed = results.filter((r) => !r.pass);
console.log("\n--- summary ---");
console.log(`total: ${results.length}, passed: ${results.length - failed.length}, failed: ${failed.length}`);
if (failed.length > 0) {
  console.log("\nFAILURES:");
  for (const f of failed) {
    console.log(
      `  ${f.category} ${f.label}: tidy=${f.tidy} R=${f.r} absDiff=${f.absDiff} (tol ${f.tol})`,
    );
  }
}

// Sanity probe: also report the first 3 deviance residuals
console.log("\n--- probe: first 3 deviance residuals (should equal response residuals for gaussian/identity) ---");
console.log("response:", respResid.slice(0, 3));
console.log("deviance:", devResid.slice(0, 3));
