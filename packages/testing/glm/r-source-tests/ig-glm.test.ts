// Translation of R stats package test: ig_glm.R
// R reference JSON: ig-glm-source-test.R (sibling file)
// Tests inverse Gaussian GLM (Whitmore 1986 sales data)
//
// Coverage of ig_glm.R:
// [x] L14-17: Whitmore data (20 products, projected vs actual sales)
// [x] L21-29: identity link model — coef matches exact MLE (beta = sum(y)/sum(x))
// [ ] L31-34: profile-likelihood CI via MASS::confint — needs confint infrastructure
// [x] L35-37: asymptotic CI via normality — just coef +/- 1.96*SE
// [x] L41-44: inverse link model — coef, SE, t-value
// [ ] L46-54: CI equivalence between identity and inverse link — needs confint
// [ ] L64-68: simulate from inverse Gaussian — needs SuppDists + simulate
//
// NOTE: inverse.gaussian family is not currently supported. Tests validate
// R reference extraction and document expected values for future implementation.

import { expect } from "@std/expect";
import {
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../glm-test-helpers.ts";

const R_SOURCE_TEST = new URL("./ig-glm-source-test.R", import.meta.url)
  .pathname;

interface IgGlmRef {
  fit1_coef: number;
  fit1_se: number;
  fit1_tvalue: number;
  fit1_deviance: number;
  fit1_aic: number;
  fit1_fitted: number[];
  fit1_residuals_deviance: number[];
  fit1_residuals_pearson: number[];
  beta_exact: number;
  ci_asymp: number[];
  ci_profile: number[];

  fit2_coef: number;
  fit2_se: number;
  fit2_tvalue: number;
  fit2_deviance: number;
  fit2_aic: number;
  fit2_fitted: number[];
  ci_profile2: number[];
}

const ref = getReferenceFromRScript<IgGlmRef>(R_SOURCE_TEST);

// Whitmore (1986) data
const _x = [
  5959, 3534, 2641, 1965, 1738, 1182, 667, 613, 610, 549, 527, 353, 331, 290,
  253, 193, 156, 133, 122, 114,
];
const _y = [
  5673, 3659, 2565, 2182, 1839, 1236, 918, 902, 756, 500, 487, 463, 225, 257,
  311, 212, 166, 123, 198, 99,
];

Deno.test("ig_glm: identity link — coef matches exact MLE", () => {
  // For y ~ x - 1 with weights=x^2 and inverse.gaussian(identity),
  // the MLE is exactly sum(y)/sum(x)
  const betaExact = _y.reduce((a, b) => a + b, 0) / _x.reduce((a, b) => a + b, 0);
  assertClose(betaExact, ref.beta_exact, 1e-12, "beta_exact TS vs R");
  assertClose(ref.fit1_coef, ref.beta_exact, 1e-10, "fit1 coef vs exact");
});

Deno.test("ig_glm: identity link — asymptotic CI", () => {
  // CI = coef +/- 1.96 * SE
  const lower = ref.fit1_coef - 1.96 * ref.fit1_se;
  const upper = ref.fit1_coef + 1.96 * ref.fit1_se;
  assertClose(lower, ref.ci_asymp[0], TOL, "CI lower");
  assertClose(upper, ref.ci_asymp[1], TOL, "CI upper");
});

Deno.test("ig_glm: identity link — deviance and fitted values", () => {
  expect(ref.fit1_fitted).toHaveLength(20);
  expect(ref.fit1_residuals_deviance).toHaveLength(20);
  expect(ref.fit1_residuals_pearson).toHaveLength(20);
  expect(typeof ref.fit1_deviance).toBe("number");
  expect(typeof ref.fit1_aic).toBe("number");
});

Deno.test("ig_glm: inverse link — coef and SE", () => {
  expect(typeof ref.fit2_coef).toBe("number");
  expect(typeof ref.fit2_se).toBe("number");
  // t-values should match between the two link parameterizations
  assertClose(ref.fit2_tvalue, ref.fit1_tvalue, TOL, "t-value identity vs inverse");
});

Deno.test("ig_glm: inverse link — fitted values match identity link", () => {
  // Both models fit the same data — fitted values should be identical
  expect(ref.fit2_fitted).toHaveLength(20);
  for (let i = 0; i < 20; i++) {
    assertClose(
      ref.fit2_fitted[i],
      ref.fit1_fitted[i],
      TOL,
      `fitted[${i}]`,
    );
  }
});

Deno.test("ig_glm: profile CIs approximately agree across links", () => {
  // profile CI from identity link vs transformed profile CI from inverse link
  // R test L52 uses tolerance = 1e-5, L53 uses tolerance = 1e-3
  if (ref.ci_profile[0] !== null && ref.ci_profile2[0] !== null) {
    assertClose(ref.ci_profile[0], ref.ci_profile2[0], 1e-5, "CI lower");
    assertClose(ref.ci_profile[1], ref.ci_profile2[1], 1e-5, "CI upper");
  }
});
