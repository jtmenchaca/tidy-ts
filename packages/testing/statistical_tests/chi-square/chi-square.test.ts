import { expect } from "@std/expect";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../helpers.ts";
import { chiSquareTest, chiSquareGoodnessOfFitTest } from "../../../dataframe/ts/stats/statistical-tests/chi-square.ts";
import { fishersExactTest } from "../../../dataframe/ts/stats/statistical-tests/fishers-exact.ts";

interface ChiSquareRef {
  independence_2x2_statistic: number;
  independence_2x2_p_value: number;
  independence_2x2_df: number;
  independence_2x2_expected: number[];
  independence_2x2_residuals: number[];

  independence_3x2_statistic: number;
  independence_3x2_p_value: number;
  independence_3x2_df: number;
  independence_3x2_expected: number[];
  independence_3x2_residuals: number[];

  goodness_of_fit_statistic: number;
  goodness_of_fit_p_value: number;
  goodness_of_fit_df: number;
  goodness_of_fit_expected: number[];
  goodness_of_fit_residuals: number[];

  goodness_unequal_statistic: number;
  goodness_unequal_p_value: number;
  goodness_unequal_df: number;
  goodness_unequal_expected: number[];
  goodness_unequal_residuals: number[];

  fisher_2x2_p_value: number;
  fisher_2x2_odds_ratio: number;
  fisher_2x2_conf_int_lower: number;
  fisher_2x2_conf_int_upper: number;

  fisher_one_sided_p_value: number;
  fisher_one_sided_odds_ratio: number;
  fisher_one_sided_conf_int_lower: number;
  fisher_one_sided_conf_int_upper: number;

  fisher_large_or_p_value: number;
  fisher_large_or_odds_ratio: number;
  fisher_large_or_conf_int_lower: number;
  fisher_large_or_conf_int_upper: number;

  fisher_less_p_value: number;
  fisher_less_odds_ratio: number;
  fisher_less_conf_int_lower: number;
  fisher_less_conf_int_upper: number;
}

const ref = getReferenceFromRScript<ChiSquareRef>(
  new URL("./chi-square-ref.R", import.meta.url).pathname,
);

// --- Chi-Square Independence Tests ---

Deno.test("Chi-Square: independence 2x2", () => {
  // R: matrix(c(20, 30, 10, 40), nrow=2) → [[20, 10], [30, 40]]
  const result = chiSquareTest({
    contingencyTable: [[20, 10], [30, 40]],
  });

  assertClose(result.testStatistic.value, ref.independence_2x2_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.independence_2x2_p_value, TOL, "p-value");
  expect(result.degreesOfFreedom).toBe(ref.independence_2x2_df);
  assertArrayClose(result.chiSquareExpected, ref.independence_2x2_expected, TOL, "expected");
  assertArrayClose(result.residuals, ref.independence_2x2_residuals, TOL, "residuals");
});

Deno.test("Chi-Square: independence 3x2", () => {
  // R: matrix(c(10, 20, 30, 25, 25, 20), nrow=3) → [[10, 25], [20, 25], [30, 20]]
  const result = chiSquareTest({
    contingencyTable: [[10, 25], [20, 25], [30, 20]],
  });

  assertClose(result.testStatistic.value, ref.independence_3x2_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.independence_3x2_p_value, TOL, "p-value");
  expect(result.degreesOfFreedom).toBe(ref.independence_3x2_df);
  assertArrayClose(result.chiSquareExpected, ref.independence_3x2_expected, TOL, "expected");
  assertArrayClose(result.residuals, ref.independence_3x2_residuals, TOL, "residuals");
});

// --- Fisher's Exact Tests ---

Deno.test("Chi-Square: Fisher's exact 2x2 two-sided", () => {
  // R: matrix(c(3, 1, 1, 3), nrow=2) → [[3, 1], [1, 3]]
  const result = fishersExactTest({
    contingencyTable: [[3, 1], [1, 3]],
  });

  assertClose(result.pValue, ref.fisher_2x2_p_value, TOL, "p-value");
  assertClose(result.effectSize.value, ref.fisher_2x2_odds_ratio, TOL, "odds ratio");
  assertClose(result.confidenceInterval.lower, ref.fisher_2x2_conf_int_lower, TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.fisher_2x2_conf_int_upper, TOL, "CI upper");
});

Deno.test("Chi-Square: Fisher's exact one-sided greater", () => {
  // Same matrix as fisher_2x2, alternative="greater"
  const result = fishersExactTest({
    contingencyTable: [[3, 1], [1, 3]],
    alternative: "greater",
  });

  assertClose(result.pValue, ref.fisher_one_sided_p_value, TOL, "p-value");
  assertClose(result.effectSize.value, ref.fisher_one_sided_odds_ratio, TOL, "odds ratio");
  assertClose(result.confidenceInterval.lower, ref.fisher_one_sided_conf_int_lower, TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.fisher_one_sided_conf_int_upper, TOL, "CI upper");
});

Deno.test("Chi-Square: Fisher's exact large odds ratio", () => {
  // R: matrix(c(10, 2, 1, 8), nrow=2) → [[10, 1], [2, 8]]
  const result = fishersExactTest({
    contingencyTable: [[10, 1], [2, 8]],
  });

  assertClose(result.pValue, ref.fisher_large_or_p_value, TOL, "p-value");
  assertClose(result.effectSize.value, ref.fisher_large_or_odds_ratio, TOL, "odds ratio");
  assertClose(result.confidenceInterval.lower, ref.fisher_large_or_conf_int_lower, TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.fisher_large_or_conf_int_upper, TOL, "CI upper");
});

// --- Chi-Square Goodness-of-Fit Tests ---

Deno.test("Chi-Square: goodness-of-fit equal probabilities", () => {
  // R: chisq.test(c(25, 30, 20, 25), p = c(0.25, 0.25, 0.25, 0.25))
  const result = chiSquareGoodnessOfFitTest({
    observed: [25, 30, 20, 25],
    expected: [25, 25, 25, 25],
  });

  assertClose(result.testStatistic.value, ref.goodness_of_fit_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.goodness_of_fit_p_value, TOL, "p-value");
  expect(result.degreesOfFreedom).toBe(ref.goodness_of_fit_df);
  assertArrayClose(result.chiSquareExpected, ref.goodness_of_fit_expected, TOL, "expected");
});

Deno.test("Chi-Square: goodness-of-fit unequal probabilities", () => {
  // R: chisq.test(c(40, 30, 20, 10), p = c(0.4, 0.3, 0.2, 0.1))
  const result = chiSquareGoodnessOfFitTest({
    observed: [40, 30, 20, 10],
    expected: [40, 30, 20, 10],
  });

  assertClose(result.testStatistic.value, ref.goodness_unequal_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.goodness_unequal_p_value, TOL, "p-value");
  expect(result.degreesOfFreedom).toBe(ref.goodness_unequal_df);
  assertArrayClose(result.chiSquareExpected, ref.goodness_unequal_expected, TOL, "expected");
});

// --- Fisher's Exact: "less" alternative ---

Deno.test("Chi-Square: Fisher's exact one-sided less", () => {
  const result = fishersExactTest({
    contingencyTable: [[3, 1], [1, 3]],
    alternative: "less",
  });

  assertClose(result.pValue, ref.fisher_less_p_value, TOL, "p-value");
  assertClose(result.effectSize.value, ref.fisher_less_odds_ratio, TOL, "odds ratio");
  assertClose(result.confidenceInterval.lower, ref.fisher_less_conf_int_lower, TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.fisher_less_conf_int_upper, TOL, "CI upper");
});
