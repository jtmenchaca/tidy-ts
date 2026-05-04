#!/usr/bin/env -S deno test --allow-all

// Modular GLM regression tests with fixed datasets and R reference values.
// Each family uses a well-known dataset with deterministic results — no randomness.
// Reference values generated from R 4.x using confint.default (Wald CIs).

import { createDataFrame } from "../../dataframe/ts/dataframe/index.ts";
import { glm } from "../../dataframe/ts/wasm/glm-functions.ts";
import { TOL, assertClose, assertArrayClose } from "./glm-test-helpers.ts";

// ════════════════════════════════════════════════════════════════════════════
// DATASETS
// ════════════════════════════════════════════════════════════════════════════

const mtcars = {
  mpg: [21.0, 21.0, 22.8, 21.4, 18.7, 18.1, 14.3, 24.4, 22.8, 19.2, 17.8, 16.4, 17.3, 15.2, 10.4, 10.4, 14.7, 32.4, 30.4, 33.9, 21.5, 15.5, 15.2, 13.3, 19.2, 27.3, 26.0, 30.4, 15.8, 19.7, 15.0, 21.4],
  wt: [2.620, 2.875, 2.320, 3.215, 3.440, 3.460, 3.570, 3.190, 3.150, 3.440, 3.440, 4.070, 3.730, 3.780, 5.250, 5.424, 5.345, 2.200, 1.615, 1.835, 2.465, 3.520, 3.435, 3.840, 3.845, 1.935, 2.140, 1.513, 3.170, 2.770, 3.570, 2.780],
  hp: [110, 110, 93, 110, 175, 105, 245, 62, 95, 123, 123, 180, 180, 180, 205, 215, 230, 66, 52, 65, 97, 150, 150, 245, 175, 66, 91, 113, 264, 175, 335, 109],
  vs: [0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
  carb: [4, 4, 1, 1, 2, 1, 4, 2, 2, 4, 4, 3, 3, 3, 4, 4, 4, 1, 2, 1, 1, 2, 2, 4, 2, 1, 2, 2, 4, 6, 8, 2],
};

const clotting = {
  u: [5, 10, 15, 20, 30, 40, 60, 80, 100],
  lot1: [118, 58, 42, 35, 27, 25, 21, 19, 18],
};

const whitmore = {
  x: [5959, 3534, 2641, 1965, 1738, 1182, 667, 613, 610, 549, 527, 353, 331, 290, 253, 193, 156, 133, 122, 114],
  y: [5673, 3659, 2565, 2182, 1839, 1236, 918, 902, 756, 500, 487, 463, 225, 257, 311, 212, 166, 123, 198, 99],
};

// ════════════════════════════════════════════════════════════════════════════
// GAUSSIAN FAMILY
// ════════════════════════════════════════════════════════════════════════════

Deno.test("gaussian: mpg ~ wt + hp (identity link) — coef and SE", () => {
  const df = createDataFrame({ columns: { mpg: mtcars.mpg, wt: mtcars.wt, hp: mtcars.hp } });
  const fit = glm({ formula: "mpg ~ wt + hp", family: "gaussian", link: "identity", data: df });

  assertArrayClose(fit.coefficients, [37.22727012, -3.87783074, -0.03177295], TOL, "coef");
  assertArrayClose(fit.std_errors, [1.59878754, 0.63273349, 0.00902971], TOL, "SE");
});

Deno.test("gaussian: mpg ~ wt + hp — deviance, null deviance, AIC", () => {
  const df = createDataFrame({ columns: { mpg: mtcars.mpg, wt: mtcars.wt, hp: mtcars.hp } });
  const fit = glm({ formula: "mpg ~ wt + hp", family: "gaussian", link: "identity", data: df });

  assertClose(fit.deviance, 195.04775474, TOL, "deviance");
  assertClose(fit.null_deviance, 1126.04718750, TOL, "null deviance");
  assertClose(fit.aic, 156.65233883, TOL, "AIC");
});

Deno.test("gaussian: mpg ~ wt + hp — dispersion", () => {
  const df = createDataFrame({ columns: { mpg: mtcars.mpg, wt: mtcars.wt, hp: mtcars.hp } });
  const fit = glm({ formula: "mpg ~ wt + hp", family: "gaussian", link: "identity", data: df });

  assertClose(fit.dispersion_parameter, 6.72578465, TOL, "dispersion");
});

Deno.test("gaussian: mpg ~ wt + hp — confidence intervals", () => {
  const df = createDataFrame({ columns: { mpg: mtcars.mpg, wt: mtcars.wt, hp: mtcars.hp } });
  const fit = glm({ formula: "mpg ~ wt + hp", family: "gaussian", link: "identity", data: df });
  const ci = fit.confint({ level: 0.95 });

  assertArrayClose(ci.lower, [34.09370412, -5.11796560, -0.04947085], TOL, "CI lower");
  assertArrayClose(ci.upper, [40.36083611, -2.63769588, -0.01407504], TOL, "CI upper");
});

// ════════════════════════════════════════════════════════════════════════════
// BINOMIAL FAMILY
// ════════════════════════════════════════════════════════════════════════════

Deno.test("binomial: vs ~ mpg + wt (logit link) — coef and SE", () => {
  const df = createDataFrame({ columns: { vs: mtcars.vs, mpg: mtcars.mpg, wt: mtcars.wt } });
  const fit = glm({ formula: "vs ~ mpg + wt", family: "binomial", link: "logit", data: df });

  assertArrayClose(fit.coefficients, [-12.54122184, 0.52406399, 0.58285979], TOL, "coef");
  assertArrayClose(fit.std_errors, [8.46603290, 0.26041878, 1.18446499], TOL, "SE");
});

Deno.test("binomial: vs ~ mpg + wt — deviance and AIC", () => {
  const df = createDataFrame({ columns: { vs: mtcars.vs, mpg: mtcars.mpg, wt: mtcars.wt } });
  const fit = glm({ formula: "vs ~ mpg + wt", family: "binomial", link: "logit", data: df });

  assertClose(fit.deviance, 25.29787554, TOL, "deviance");
  assertClose(fit.null_deviance, 43.86010927, TOL, "null deviance");
  assertClose(fit.aic, 31.29787554, TOL, "AIC");
});

Deno.test("binomial: vs ~ mpg + wt — Wald confidence intervals", () => {
  const df = createDataFrame({ columns: { vs: mtcars.vs, mpg: mtcars.mpg, wt: mtcars.wt } });
  const fit = glm({ formula: "vs ~ mpg + wt", family: "binomial", link: "logit", data: df });

  // R: confint.default(m) — Wald CIs, not profile
  const R_lower = [-29.13434142, 0.01365257, -1.73864894];
  const R_upper = [4.05189774, 1.03447541, 2.90436852];

  // Wald CI = coef +/- z * SE, should match closely
  const z = 1.959963984540054; // qnorm(0.975)
  for (let i = 0; i < 3; i++) {
    const waldLower = fit.coefficients[i] - z * fit.std_errors[i];
    const waldUpper = fit.coefficients[i] + z * fit.std_errors[i];
    assertClose(waldLower, R_lower[i], TOL, `Wald CI lower[${i}]`);
    assertClose(waldUpper, R_upper[i], TOL, `Wald CI upper[${i}]`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// POISSON FAMILY
// ════════════════════════════════════════════════════════════════════════════

Deno.test("poisson: carb ~ wt + hp (log link) — coef and SE", () => {
  const df = createDataFrame({ columns: { carb: mtcars.carb, wt: mtcars.wt, hp: mtcars.hp } });
  const fit = glm({ formula: "carb ~ wt + hp", family: "poisson", link: "log", data: df });

  assertArrayClose(fit.coefficients, [0.13878829, 0.00448194, 0.00548724], TOL, "coef");
  assertArrayClose(fit.std_errors, [0.39866591, 0.13097187, 0.00164415], TOL, "SE");
});

Deno.test("poisson: carb ~ wt + hp — deviance and AIC", () => {
  const df = createDataFrame({ columns: { carb: mtcars.carb, wt: mtcars.wt, hp: mtcars.hp } });
  const fit = glm({ formula: "carb ~ wt + hp", family: "poisson", link: "log", data: df });

  assertClose(fit.deviance, 12.27803884, TOL, "deviance");
  assertClose(fit.null_deviance, 27.04335745, TOL, "null deviance");
  assertClose(fit.aic, 107.64368849, TOL, "AIC");
});

Deno.test("poisson: carb ~ wt + hp — Wald confidence intervals", () => {
  const df = createDataFrame({ columns: { carb: mtcars.carb, wt: mtcars.wt, hp: mtcars.hp } });
  const fit = glm({ formula: "carb ~ wt + hp", family: "poisson", link: "log", data: df });

  const R_lower = [-0.642582532548310, -0.252218203732839, 0.002264773541931];
  const R_upper = [0.920159114961649, 0.261182075253633, 0.008709706955451];

  const z = 1.959963984540054;
  for (let i = 0; i < 3; i++) {
    const waldLower = fit.coefficients[i] - z * fit.std_errors[i];
    const waldUpper = fit.coefficients[i] + z * fit.std_errors[i];
    assertClose(waldLower, R_lower[i], TOL, `Wald CI lower[${i}]`);
    assertClose(waldUpper, R_upper[i], TOL, `Wald CI upper[${i}]`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// GAMMA FAMILY
// ════════════════════════════════════════════════════════════════════════════

Deno.test("gamma: lot1 ~ log(u) (inverse link) — coef and SE", () => {
  const df = createDataFrame({
    columns: { lot1: clotting.lot1, log_u: clotting.u.map(Math.log) },
  });
  const fit = glm({ formula: "lot1 ~ log_u", family: "gamma", link: "inverse", data: df });

  assertArrayClose(fit.coefficients, [-0.01655438, 0.01534311], TOL, "coef");
  assertArrayClose(fit.std_errors, [0.00092755, 0.00041496], TOL, "SE");
});

Deno.test("gamma: lot1 ~ log(u) — deviance, null deviance, AIC", () => {
  const df = createDataFrame({
    columns: { lot1: clotting.lot1, log_u: clotting.u.map(Math.log) },
  });
  const fit = glm({ formula: "lot1 ~ log_u", family: "gamma", link: "inverse", data: df });

  assertClose(fit.deviance, 0.01672972, TOL, "deviance");
  assertClose(fit.null_deviance, 3.51282626, TOL, "null deviance");
  assertClose(fit.aic, 37.98992395, TOL, "AIC");
});

Deno.test("gamma: lot1 ~ log(u) — dispersion (Pearson)", () => {
  const df = createDataFrame({
    columns: { lot1: clotting.lot1, log_u: clotting.u.map(Math.log) },
  });
  const fit = glm({ formula: "lot1 ~ log_u", family: "gamma", link: "inverse", data: df });

  assertClose(fit.dispersion_parameter, 0.00244606, TOL, "dispersion");
});

Deno.test("gamma: lot1 ~ log(u) — Wald confidence intervals", () => {
  const df = createDataFrame({
    columns: { lot1: clotting.lot1, log_u: clotting.u.map(Math.log) },
  });
  const fit = glm({ formula: "lot1 ~ log_u", family: "gamma", link: "inverse", data: df });

  const R_lower = [-0.01837234, 0.01452981];
  const R_upper = [-0.01473642, 0.01615642];

  const z = 1.959963984540054;
  for (let i = 0; i < 2; i++) {
    const waldLower = fit.coefficients[i] - z * fit.std_errors[i];
    const waldUpper = fit.coefficients[i] + z * fit.std_errors[i];
    assertClose(waldLower, R_lower[i], TOL, `Wald CI lower[${i}]`);
    assertClose(waldUpper, R_upper[i], TOL, `Wald CI upper[${i}]`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// INVERSE GAUSSIAN FAMILY
// ════════════════════════════════════════════════════════════════════════════

Deno.test("inverse_gaussian: y ~ x (1/mu^2 link) — coef and SE", () => {
  const df = createDataFrame({ columns: { y: whitmore.y, x: whitmore.x } });
  const fit = glm({
    formula: "y ~ x",
    family: "inverse_gaussian",
    link: "inverse_squared",
    data: df,
  });

  assertArrayClose(fit.coefficients, [2.185951377e-06, -3.645970891e-10], TOL, "coef");
  assertArrayClose(fit.std_errors, [9.512917376e-07, 1.605526260e-10], TOL, "SE");
});

Deno.test("inverse_gaussian: y ~ x — deviance and AIC", () => {
  const df = createDataFrame({ columns: { y: whitmore.y, x: whitmore.x } });
  const fit = glm({
    formula: "y ~ x",
    family: "inverse_gaussian",
    link: "inverse_squared",
    data: df,
  });

  assertClose(fit.deviance, 0.03192529, TOL, "deviance");
  assertClose(fit.null_deviance, 0.04039191, TOL, "null deviance");
  assertClose(fit.aic, 317.01768967, TOL, "AIC");
});

Deno.test("inverse_gaussian: y ~ x — dispersion (Pearson)", () => {
  const df = createDataFrame({ columns: { y: whitmore.y, x: whitmore.x } });
  const fit = glm({
    formula: "y ~ x",
    family: "inverse_gaussian",
    link: "inverse_squared",
    data: df,
  });

  assertClose(fit.dispersion_parameter, 0.00122388, TOL, "dispersion");
});

Deno.test("inverse_gaussian: y ~ x — Wald confidence intervals", () => {
  const df = createDataFrame({ columns: { y: whitmore.y, x: whitmore.x } });
  const fit = glm({
    formula: "y ~ x",
    family: "inverse_gaussian",
    link: "inverse_squared",
    data: df,
  });

  const R_lower = [3.214538327e-07, -6.792744538e-10];
  const R_upper = [4.050448922e-06, -4.991972453e-11];

  const z = 1.959963984540054;
  for (let i = 0; i < 2; i++) {
    const waldLower = fit.coefficients[i] - z * fit.std_errors[i];
    const waldUpper = fit.coefficients[i] + z * fit.std_errors[i];
    assertClose(waldLower, R_lower[i], TOL, `Wald CI lower[${i}]`);
    assertClose(waldUpper, R_upper[i], TOL, `Wald CI upper[${i}]`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// QUASIBINOMIAL FAMILY
// ════════════════════════════════════════════════════════════════════════════

Deno.test("quasibinomial: vs ~ mpg + wt (logit link) — coef and SE", () => {
  const df = createDataFrame({ columns: { vs: mtcars.vs, mpg: mtcars.mpg, wt: mtcars.wt } });
  const fit = glm({ formula: "vs ~ mpg + wt", family: "quasibinomial", link: "logit", data: df });

  // Coefficients are identical to binomial
  assertArrayClose(fit.coefficients, [-12.54122184, 0.52406399, 0.58285979], TOL, "coef");
  // SE differs due to estimated dispersion
  assertArrayClose(fit.std_errors, [8.07451902, 0.24837564, 1.12968910], TOL, "SE");
});

Deno.test("quasibinomial: vs ~ mpg + wt — deviance and dispersion", () => {
  const df = createDataFrame({ columns: { vs: mtcars.vs, mpg: mtcars.mpg, wt: mtcars.wt } });
  const fit = glm({ formula: "vs ~ mpg + wt", family: "quasibinomial", link: "logit", data: df });

  assertClose(fit.deviance, 25.29787554, TOL, "deviance");
  assertClose(fit.null_deviance, 43.86010927, TOL, "null deviance");
  assertClose(fit.dispersion_parameter, 0.90964811, TOL, "dispersion");
});

Deno.test("quasibinomial: vs ~ mpg + wt — Wald confidence intervals", () => {
  const df = createDataFrame({ columns: { vs: mtcars.vs, mpg: mtcars.mpg, wt: mtcars.wt } });
  const fit = glm({ formula: "vs ~ mpg + wt", family: "quasibinomial", link: "logit", data: df });

  const R_lower = [-28.366988308351949, 0.037256674138801, -1.631290163785222];
  const R_upper = [3.284544622636441, 1.010871301722072, 2.797009748656858];

  const z = 1.959963984540054;
  for (let i = 0; i < 3; i++) {
    const waldLower = fit.coefficients[i] - z * fit.std_errors[i];
    const waldUpper = fit.coefficients[i] + z * fit.std_errors[i];
    assertClose(waldLower, R_lower[i], TOL, `Wald CI lower[${i}]`);
    assertClose(waldUpper, R_upper[i], TOL, `Wald CI upper[${i}]`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// CROSS-FAMILY: fitted values spot-checks
// ════════════════════════════════════════════════════════════════════════════

Deno.test("gaussian: fitted values match R (first 5)", () => {
  const df = createDataFrame({ columns: { mpg: mtcars.mpg, wt: mtcars.wt, hp: mtcars.hp } });
  const fit = glm({ formula: "mpg ~ wt + hp", family: "gaussian", link: "identity", data: df });

  const R_fitted = [23.57232940, 22.58348256, 25.27581872, 21.26502011, 18.32726664];
  assertArrayClose(fit.fitted_values.slice(0, 5), R_fitted, TOL, "fitted");
});

Deno.test("binomial: fitted values match R (first 5)", () => {
  const df = createDataFrame({ columns: { vs: mtcars.vs, mpg: mtcars.mpg, wt: mtcars.wt } });
  const fit = glm({ formula: "vs ~ mpg + wt", family: "binomial", link: "logit", data: df });

  const R_fitted = [0.49780365, 0.53490409, 0.68128247, 0.63358828, 0.32383838];
  assertArrayClose(fit.fitted_values.slice(0, 5), R_fitted, TOL, "fitted");
});

Deno.test("poisson: fitted values match R (first 5)", () => {
  const df = createDataFrame({ columns: { carb: mtcars.carb, wt: mtcars.wt, hp: mtcars.hp } });
  const fit = glm({ formula: "carb ~ wt + hp", family: "poisson", link: "log", data: df });

  const R_fitted = [2.12575576, 2.12818666, 1.93382465, 2.13143219, 3.04796207];
  assertArrayClose(fit.fitted_values.slice(0, 5), R_fitted, TOL, "fitted");
});

Deno.test("gamma: fitted values match R", () => {
  const df = createDataFrame({
    columns: { lot1: clotting.lot1, log_u: clotting.u.map(Math.log) },
  });
  const fit = glm({ formula: "lot1 ~ log_u", family: "gamma", link: "inverse", data: df });

  const R_fitted = [122.85904139, 53.26388874, 40.00713136, 34.00263810, 28.06577903, 24.97220617, 21.61432305, 19.73182225, 18.48316993];
  assertArrayClose(fit.fitted_values, R_fitted, TOL, "fitted");
});
