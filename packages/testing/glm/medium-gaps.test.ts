#!/usr/bin/env -S deno test --allow-all
/**
 * Medium-priority GLM coverage gaps:
 * 1. Gamma residuals, vcov, influence (log link)
 * 2. Gamma predictions on new data (log link)
 * 3. Inverse Gaussian predictions on new data (canonical link)
 * 4. Binomial cauchit link
 *
 * Reference values from R 4.x (generate-medium-gap-refs.R).
 */

import { expect } from "@std/expect";
import { createDataFrame } from "../../dataframe/ts/dataframe/index.ts";
import { glm } from "../../dataframe/ts/wasm/glm-functions.ts";
import { TOL, assertClose, assertArrayClose } from "./glm-test-helpers.ts";

import ref from "./medium-gap-refs.json" with { type: "json" };

// ════════════════════════════════════════════════════════════════════════════
// GAMMA: RESIDUALS (log link)
// ════════════════════════════════════════════════════════════════════════════

Deno.test("gamma log link: deviance residuals match R", () => {
  const { x, y, residuals_deviance } = ref.gamma_diagnostics;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "gamma", link: "log", data: df });

  const resid = fit.residuals({ type: "deviance" });
  assertArrayClose(resid, residuals_deviance, TOL, "deviance residuals");
});

Deno.test("gamma log link: pearson residuals match R", () => {
  const { x, y, residuals_pearson } = ref.gamma_diagnostics;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "gamma", link: "log", data: df });

  const resid = fit.residuals({ type: "pearson" });
  assertArrayClose(resid, residuals_pearson, TOL, "pearson residuals");
});

Deno.test("gamma log link: working residuals match R", () => {
  const { x, y, residuals_working } = ref.gamma_diagnostics;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "gamma", link: "log", data: df });

  const resid = fit.residuals({ type: "working" });
  assertArrayClose(resid, residuals_working, TOL, "working residuals");
});

Deno.test("gamma log link: response residuals match R", () => {
  const { x, y, residuals_response } = ref.gamma_diagnostics;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "gamma", link: "log", data: df });

  const resid = fit.residuals({ type: "response" });
  assertArrayClose(resid, residuals_response, TOL, "response residuals");
});

// ════════════════════════════════════════════════════════════════════════════
// GAMMA: VCOV MATRIX (log link)
// ════════════════════════════════════════════════════════════════════════════

Deno.test("gamma log link: vcov matrix matches R", () => {
  const { x, y, vcov } = ref.gamma_diagnostics;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "gamma", link: "log", data: df });

  const v = fit.vcov();
  expect(v.length).toBe(vcov.length);
  for (let i = 0; i < v.length; i++) {
    expect(v[i].length).toBe(vcov[i].length);
    for (let j = 0; j < v[i].length; j++) {
      const relErr = Math.abs(v[i][j] - vcov[i][j]) / Math.max(Math.abs(vcov[i][j]), 1e-10);
      if (relErr > TOL) {
        throw new Error(
          `vcov[${i}][${j}]: got ${v[i][j]}, expected ${vcov[i][j]}, relErr=${relErr}`,
        );
      }
    }
  }
});

// ════════════════════════════════════════════════════════════════════════════
// GAMMA: INFLUENCE / DIAGNOSTICS (log link)
// ════════════════════════════════════════════════════════════════════════════

Deno.test("gamma log link: leverage (hat values) match R", () => {
  const { x, y, leverage } = ref.gamma_diagnostics;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "gamma", link: "log", data: df });

  assertArrayClose(fit.leverage, leverage, TOL, "leverage");
});

Deno.test("gamma log link: Cook's distance matches R", () => {
  const { x, y, cooks_distance } = ref.gamma_diagnostics;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "gamma", link: "log", data: df });

  assertArrayClose(fit.cooks_distance, cooks_distance, TOL, "Cook's distance");
});

Deno.test("gamma log link: rstandard deviance matches R", () => {
  const { x, y, rstandard_deviance } = ref.gamma_diagnostics;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "gamma", link: "log", data: df });

  const rs = fit.rstandard({ type: "deviance" });
  assertArrayClose(rs, rstandard_deviance, TOL, "rstandard deviance");
});

Deno.test("gamma log link: rstandard pearson matches R", () => {
  const { x, y, rstandard_pearson } = ref.gamma_diagnostics;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "gamma", link: "log", data: df });

  const rs = fit.rstandard({ type: "pearson" });
  assertArrayClose(rs, rstandard_pearson, TOL, "rstandard pearson");
});

// ════════════════════════════════════════════════════════════════════════════
// GAMMA: PREDICTIONS ON NEW DATA (log link)
// ════════════════════════════════════════════════════════════════════════════

Deno.test("gamma log link: predict response on new data matches R", () => {
  const { x, y } = ref.gamma_diagnostics;
  const { newx, pred_response } = ref.gamma_predict;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "gamma", link: "log", data: df });

  const newdata = createDataFrame({ columns: { x: newx } });
  const preds = fit.predict(newdata, { type: "response" });
  assertArrayClose(preds, pred_response, TOL, "gamma predict response");
});

Deno.test("gamma log link: predict link on new data matches R", () => {
  const { x, y } = ref.gamma_diagnostics;
  const { newx, pred_link } = ref.gamma_predict;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "gamma", link: "log", data: df });

  const newdata = createDataFrame({ columns: { x: newx } });
  const preds = fit.predict(newdata, { type: "link" });
  assertArrayClose(preds, pred_link, TOL, "gamma predict link");
});

// ════════════════════════════════════════════════════════════════════════════
// INVERSE GAUSSIAN: PREDICTIONS ON NEW DATA (canonical link)
// ════════════════════════════════════════════════════════════════════════════

Deno.test("inverse_gaussian: predict response on new data matches R", () => {
  const { x, y, newx, pred_response } = ref.invgauss_predict;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "inverse_gaussian", link: "inverse_squared", data: df });

  const newdata = createDataFrame({ columns: { x: newx } });
  const preds = fit.predict(newdata, { type: "response" });
  assertArrayClose(preds, pred_response, TOL, "invgauss predict response");
});

Deno.test("inverse_gaussian: predict link on new data matches R", () => {
  const { x, y, newx, pred_link } = ref.invgauss_predict;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "inverse_gaussian", link: "inverse_squared", data: df });

  const newdata = createDataFrame({ columns: { x: newx } });
  const preds = fit.predict(newdata, { type: "link" });
  assertArrayClose(preds, pred_link, TOL, "invgauss predict link");
});

Deno.test("inverse_gaussian: fitted values match R", () => {
  const { x, y, fitted5 } = ref.invgauss_predict;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "inverse_gaussian", link: "inverse_squared", data: df });

  assertArrayClose(fit.fitted_values.slice(0, 5), fitted5, TOL, "fitted[0:5]");
});

// ════════════════════════════════════════════════════════════════════════════
// BINOMIAL CAUCHIT LINK
// ════════════════════════════════════════════════════════════════════════════

Deno.test("binomial cauchit: coef and SE match R", () => {
  const { x, y, coef, se } = ref.binomial_cauchit;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "binomial", link: "cauchit", data: df });

  assertArrayClose(fit.coefficients, coef, TOL, "coef");
  assertArrayClose(fit.std_errors, se, TOL, "SE");
});

Deno.test("binomial cauchit: deviance and AIC match R", () => {
  const { x, y, deviance, null_deviance, aic } = ref.binomial_cauchit;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "binomial", link: "cauchit", data: df });

  assertClose(fit.deviance, deviance, TOL, "deviance");
  assertClose(fit.null_deviance, null_deviance, TOL, "null deviance");
  assertClose(fit.aic, aic, TOL, "AIC");
});

Deno.test("binomial cauchit: fitted values match R", () => {
  const { x, y, fitted5 } = ref.binomial_cauchit;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "binomial", link: "cauchit", data: df });

  assertArrayClose(fit.fitted_values.slice(0, 5), fitted5, TOL, "fitted[0:5]");
});

Deno.test("binomial cauchit: Wald confidence intervals match R", () => {
  const { x, y, confint_lower, confint_upper } = ref.binomial_cauchit;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "binomial", link: "cauchit", data: df });

  const z = 1.959963984540054;
  for (let i = 0; i < fit.coefficients.length; i++) {
    const waldLower = fit.coefficients[i] - z * fit.std_errors[i];
    const waldUpper = fit.coefficients[i] + z * fit.std_errors[i];
    assertClose(waldLower, confint_lower[i], TOL, `Wald CI lower[${i}]`);
    assertClose(waldUpper, confint_upper[i], TOL, `Wald CI upper[${i}]`);
  }
});
