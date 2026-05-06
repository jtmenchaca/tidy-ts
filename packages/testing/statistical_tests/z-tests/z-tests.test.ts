import { expect } from "@std/expect";
import { assertClose, getReferenceFromRScript, TOL } from "../helpers.ts";
import {
  zTestOneSample,
  zTestTwoSample,
} from "../../../dataframe/ts/stats/statistical-tests/z-tests.ts";

const ref = getReferenceFromRScript<Record<string, number>>(
  new URL("./z-tests-ref.R", import.meta.url).pathname,
);

// --- One-sample Z-tests ---

Deno.test("Z-test: one_sample_two_sided", () => {
  const data = [12.5, 13.1, 11.8, 12.9, 13.3, 12.2, 12.7, 13.0];
  const result = zTestOneSample({
    data,
    popMean: 12.0,
    popStd: 0.8,
    alternative: "two-sided",
  });

  assertClose(result.testStatistic.value, ref.one_two_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.one_two_p_value, TOL, "p-value");
  assertClose(result.confidenceInterval.lower, ref.one_two_ci_lower, TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.one_two_ci_upper, TOL, "CI upper");
});

Deno.test("Z-test: one_sample_less", () => {
  const data = [12.5, 13.1, 11.8, 12.9, 13.3, 12.2, 12.7, 13.0];
  const result = zTestOneSample({
    data,
    popMean: 13.0,
    popStd: 0.8,
    alternative: "less",
  });

  assertClose(result.testStatistic.value, ref.one_less_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.one_less_p_value, TOL, "p-value");
  expect(result.confidenceInterval.lower).toBe(-Infinity);
  assertClose(result.confidenceInterval.upper, ref.one_less_ci_upper, TOL, "CI upper");
});

Deno.test("Z-test: one_sample_greater", () => {
  const data = [12.5, 13.1, 11.8, 12.9, 13.3, 12.2, 12.7, 13.0];
  const result = zTestOneSample({
    data,
    popMean: 12.0,
    popStd: 0.8,
    alternative: "greater",
  });

  assertClose(result.testStatistic.value, ref.one_greater_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.one_greater_p_value, TOL, "p-value");
  assertClose(result.confidenceInterval.lower, ref.one_greater_ci_lower, TOL, "CI lower");
  expect(result.confidenceInterval.upper).toBe(Infinity);
});

// --- Two-sample Z-tests ---

Deno.test("Z-test: two_sample_two_sided", () => {
  const group1 = [23.5, 24.1, 22.8, 23.9, 24.3];
  const group2 = [21.2, 20.7, 21.8, 20.9, 21.5];
  const result = zTestTwoSample({
    data1: group1,
    data2: group2,
    popStd1: 1.2,
    popStd2: 1.0,
    alternative: "two-sided",
  });

  assertClose(result.testStatistic.value, ref.two_two_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.two_two_p_value, TOL, "p-value");
  assertClose(result.confidenceInterval.lower, ref.two_two_ci_lower, TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.two_two_ci_upper, TOL, "CI upper");
});

Deno.test("Z-test: two_sample_greater", () => {
  const group1 = [23.5, 24.1, 22.8, 23.9, 24.3];
  const group2 = [21.2, 20.7, 21.8, 20.9, 21.5];
  const result = zTestTwoSample({
    data1: group1,
    data2: group2,
    popStd1: 1.2,
    popStd2: 1.0,
    alternative: "greater",
  });

  assertClose(result.testStatistic.value, ref.two_greater_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.two_greater_p_value, TOL, "p-value");
  assertClose(result.confidenceInterval.lower, ref.two_greater_ci_lower, TOL, "CI lower");
  expect(result.confidenceInterval.upper).toBe(Infinity);
});

Deno.test("Z-test: two_sample_less", () => {
  const group1 = [23.5, 24.1, 22.8, 23.9, 24.3];
  const group2 = [21.2, 20.7, 21.8, 20.9, 21.5];
  const result = zTestTwoSample({
    data1: group1,
    data2: group2,
    popStd1: 1.2,
    popStd2: 1.0,
    alternative: "less",
  });

  assertClose(result.testStatistic.value, ref.two_less_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.two_less_p_value, TOL, "p-value");
  expect(result.confidenceInterval.lower).toBe(-Infinity);
  assertClose(result.confidenceInterval.upper, ref.two_less_ci_upper, TOL, "CI upper");
});

Deno.test("Z-test: one_sample_alpha_0.01", () => {
  const data = [12.5, 13.1, 11.8, 12.9, 13.3, 12.2, 12.7, 13.0];
  const result = zTestOneSample({
    data,
    popMean: 12.0,
    popStd: 0.8,
    alternative: "two-sided",
    alpha: 0.01,
  });

  assertClose(result.testStatistic.value, ref.one_alpha01_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.one_alpha01_p_value, TOL, "p-value");
  assertClose(result.confidenceInterval.lower, ref.one_alpha01_ci_lower, TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.one_alpha01_ci_upper, TOL, "CI upper");
});
