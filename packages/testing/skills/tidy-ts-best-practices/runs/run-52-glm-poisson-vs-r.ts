// Run 52 — Poisson GLM on Salamanders dataset, validated against R.
// Skill-only access: tidy-ts-best-practices SKILL.md + rules/.
//
// Research question: model `count` (salamander captures) as a function of
// `mined` (categorical yes/no), `cover` (continuous), `Wtemp` (continuous)
// using Poisson regression with log link. Compare every coefficient,
// standard error, z-statistic, p-value, fit statistic, and a few
// residuals / fitted values to R's glm() output.

import { readCSV, createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

const CSV_PATH =
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/Salamanders.csv";

// Schema — every formula column must be numeric per stats-glm.md, so we read
// `mined` as a string and dummy-encode it below.
const schema = z.object({
  site: z.string(),
  mined: z.string(),
  cover: z.number(),
  sample: z.number(),
  DOP: z.number(),
  Wtemp: z.number(),
  DOY: z.number(),
  spp: z.string(),
  count: z.number(),
});

const raw = await readCSV(CSV_PATH, schema);

// Build a numeric-only DataFrame for s.glm
const minedYes: number[] = raw.mined.map((m) => (m === "yes" ? 1 : 0));
const df = createDataFrame({
  columns: {
    count: raw.count as number[],
    mined_yes: minedYes,
    cover: raw.cover as number[],
    Wtemp: raw.Wtemp as number[],
  },
});

const model = s.glm({
  formula: "count ~ mined_yes + cover + Wtemp",
  family: "poisson",
  link: "log",
  data: df,
});

const fit = model.summary();

// ---- Reference values from R (canonical glm output) ----
const R = {
  // names in fit are likely "(Intercept)", "mined_yes", "cover", "Wtemp"
  estimates: {
    "(Intercept)": 0.9266503746593622859,
    "mined_yes": -2.2993262100107680901,
    "cover": -0.2308720212053097243,
    "Wtemp": 0.0010652947075688081,
  } as Record<string, number>,
  stdErrors: {
    "(Intercept)": 0.039918656036606277,
    "mined_yes": 0.120541033505241341,
    "cover": 0.041359904580544560,
    "Wtemp": 0.037654288620540863,
  } as Record<string, number>,
  zStats: {
    "(Intercept)": 23.213466250206511887,
    "mined_yes": -19.075049741553687710,
    "cover": -5.582024996109649528,
    "Wtemp": 0.028291457536331655,
  } as Record<string, number>,
  pValues: {
    "(Intercept)": 3.3292507086052517e-119,
    "mined_yes": 4.0703499448941087e-81,
    "cover": 2.3773419973163209e-08,
    "Wtemp": 9.7742969377287192e-01,
  } as Record<string, number>,
  nullDeviance: 2120.6611917066753,
  residualDeviance: 1543.7496297603157,
  aic: 2275.0225010554018,
  dfNull: 643,
  dfResidual: 640,
  // 95% Wald CI for mined_yes (confint.default)
  minedCI: { lower: -2.535582294340276821, upper: -2.063070125681259359 },
  // First three deviance residuals
  devianceResiduals3: [
    -0.84036092086956615,
    -0.68786238059709803,
    -0.68034593762930518,
  ],
  // First three fitted means (response scale)
  fitted3: [
    0.35310323866237259,
    0.23657732732035350,
    0.23143529742434921,
  ],
};

// ---- Helpers ----
type Row = {
  category: string;
  metric: string;
  tidyts: number;
  r: number;
  absDiff: number;
  tolerance: number;
  pass: boolean;
};

function diff(a: number, b: number): number {
  return Math.abs(a - b);
}

const rows: Row[] = [];

function check(
  category: string,
  metric: string,
  tidyts: number,
  rVal: number,
  tolerance: number,
): void {
  const d = diff(tidyts, rVal);
  rows.push({
    category,
    metric,
    tidyts,
    r: rVal,
    absDiff: d,
    tolerance,
    pass: d <= tolerance,
  });
}

const COEF_TOL = 1e-6;
const FIT_TOL = 1e-4;

// ---- Map summary coefficients by name ----
const coefNames = fit.coefficients.names;
const idx: Record<string, number> = {};
for (let i = 0; i < coefNames.length; i++) idx[coefNames[i]] = i;

const expectedNames = ["(Intercept)", "mined_yes", "cover", "Wtemp"];
for (const n of expectedNames) {
  if (idx[n] === undefined) {
    console.error(
      `FATAL: coefficient "${n}" not found. Got: ${
        JSON.stringify(coefNames)
      }`,
    );
    Deno.exit(1);
  }
}

// 1. Coefficients
for (const n of expectedNames) {
  check(
    "1. Coefficient",
    n,
    fit.coefficients.estimate[idx[n]],
    R.estimates[n],
    COEF_TOL,
  );
}

// 2. Standard errors
for (const n of expectedNames) {
  check(
    "2. Std error",
    n,
    fit.coefficients.std_error[idx[n]],
    R.stdErrors[n],
    COEF_TOL,
  );
}

// 3. z-statistics
for (const n of expectedNames) {
  check(
    "3. z-stat",
    n,
    fit.coefficients.statistic[idx[n]],
    R.zStats[n],
    COEF_TOL,
  );
}

// 4. p-values — compare relative differences too since values span 1e-119 to 1
for (const n of expectedNames) {
  check(
    "4. p-value",
    n,
    fit.coefficients.p_value[idx[n]],
    R.pValues[n],
    COEF_TOL,
  );
}

// 5. Deviance / AIC / df
check("5. Fit", "null_deviance", fit.null_deviance, R.nullDeviance, FIT_TOL);
check(
  "5. Fit",
  "residual_deviance",
  fit.residual_deviance,
  R.residualDeviance,
  FIT_TOL,
);
check("5. Fit", "aic", fit.aic, R.aic, FIT_TOL);
check("5. Fit", "df_null", fit.df_null, R.dfNull, 0);
check("5. Fit", "df_residual", fit.df_residual, R.dfResidual, 0);

// 6. 95% Wald CI for mined_yes
// Task requires R's `confint.default` (Wald). tidy-ts `model.confint()` returns
// PROFILE-LIKELIHOOD CIs (matching R's `confint.glm`), not Wald, so we compute
// Wald manually: estimate ± qnorm(0.975) * SE. See findings.
const ciProfile = model.confint({ level: 0.95 });
const iMined = ciProfile.names.indexOf("mined_yes");
if (iMined < 0) {
  console.error(
    `FATAL: "mined_yes" not in confint names: ${
      JSON.stringify(ciProfile.names)
    }`,
  );
  Deno.exit(1);
}
const z975 = s.dist.normal.quantile({ probability: 0.975 });
const estMined = fit.coefficients.estimate[idx["mined_yes"]];
const seMined = fit.coefficients.std_error[idx["mined_yes"]];
const waldLo = estMined - z975 * seMined;
const waldHi = estMined + z975 * seMined;
check("6. CI mined_yes (Wald)", "lower", waldLo, R.minedCI.lower, COEF_TOL);
check("6. CI mined_yes (Wald)", "upper", waldHi, R.minedCI.upper, COEF_TOL);

// Diagnostic note: also report what model.confint() returns so the reader sees
// it matches R's profile-likelihood CI, not Wald.
console.log("\n=== confint() diagnostic (informational only) ===");
console.log(
  `model.confint() lower for mined_yes = ${ciProfile.lower[iMined]}`,
);
console.log(
  `model.confint() upper for mined_yes = ${ciProfile.upper[iMined]}`,
);
console.log(
  `R confint.glm (profile) lower = -2.54107059376603539, upper = -2.068060413702908829`,
);
console.log(
  `R confint.default (Wald) lower = -2.535582294340276821, upper = -2.063070125681259359`,
);

// 7. First three deviance residuals
const devRes = model.residuals({ type: "deviance" });
for (let i = 0; i < 3; i++) {
  check(
    "7. Deviance residual",
    `i=${i}`,
    devRes[i],
    R.devianceResiduals3[i],
    COEF_TOL,
  );
}

// 8. First three fitted means (response scale)
const yhat = model.predict(undefined, { type: "response" });
for (let i = 0; i < 3; i++) {
  check("8. Fitted mean", `i=${i}`, yhat[i], R.fitted3[i], COEF_TOL);
}

// ---- Print table ----
console.log("\n=== PASS/FAIL TABLE ===\n");
const w = {
  cat: 24,
  met: 18,
  ts: 26,
  r: 26,
  d: 14,
  tol: 10,
  res: 4,
};
function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}
function fmt(x: number): string {
  if (!isFinite(x)) return String(x);
  if (x === 0) return "0";
  return x.toExponential(12);
}

console.log(
  pad("Category", w.cat) +
    pad("Metric", w.met) +
    pad("tidy-ts", w.ts) +
    pad("R", w.r) +
    pad("|diff|", w.d) +
    pad("tol", w.tol) +
    "pass",
);
console.log("-".repeat(w.cat + w.met + w.ts + w.r + w.d + w.tol + w.res));

let failed = 0;
for (const r of rows) {
  if (!r.pass) failed++;
  console.log(
    pad(r.category, w.cat) +
      pad(r.metric, w.met) +
      pad(fmt(r.tidyts), w.ts) +
      pad(fmt(r.r), w.r) +
      pad(fmt(r.absDiff), w.d) +
      pad(fmt(r.tolerance), w.tol) +
      (r.pass ? "PASS" : "FAIL"),
  );
}

console.log(
  `\nTotal: ${rows.length} checks, ${
    rows.length - failed
  } passed, ${failed} failed`,
);

// Interpretation (research question): mined and cover materially change
// expected counts; Wtemp does not (|z| ~ 0.03, p ~ 0.98).
console.log("\n=== INTERPRETATION ===");
for (const n of expectedNames) {
  const est = fit.coefficients.estimate[idx[n]];
  const p = fit.coefficients.p_value[idx[n]];
  console.log(
    `${pad(n, 14)} estimate=${est.toFixed(6)}  p=${
      p.toExponential(3)
    }  ${p < 0.05 ? "significant" : "NOT significant"} at alpha=0.05`,
  );
}
