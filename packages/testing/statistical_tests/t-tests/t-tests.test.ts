import { expect } from "@std/expect";
import { assertClose, getReferenceFromRScript, TOL } from "../helpers.ts";
import {
  tTestIndependent,
  tTestOneSample,
  tTestPaired,
} from "../../../dataframe/ts/stats/statistical-tests/t-tests.ts";

const ref = getReferenceFromRScript<Record<string, number | string>>(
  new URL("./t-tests-ref.R", import.meta.url).pathname,
);

Deno.test("T-test: one_sample", () => {
  const result = tTestOneSample({
    data: [2.3, 1.9, 2.5, 2.1, 2.8, 2.0, 2.4],
    mu: 2.0,
    alternative: "two-sided",
  });

  assertClose(result.testStatistic.value, ref.one_sample_statistic as number, TOL, "statistic");
  assertClose(result.pValue, ref.one_sample_p_value as number, TOL, "p-value");
  assertClose(result.confidenceInterval.lower, ref.one_sample_conf_int_lower as number, TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.one_sample_conf_int_upper as number, TOL, "CI upper");
  assertClose(result.degreesOfFreedom, ref.one_sample_parameter as number, TOL, "df");
  expect(typeof result.effectSize.value).toBe("number");
});

Deno.test("T-test: one_sample_less", () => {
  const result = tTestOneSample({
    data: [2.3, 1.9, 2.5, 2.1, 2.8, 2.0, 2.4],
    mu: 2.0,
    alternative: "less",
  });

  assertClose(result.testStatistic.value, ref.one_sample_less_statistic as number, TOL, "statistic");
  assertClose(result.pValue, ref.one_sample_less_p_value as number, TOL, "p-value");
  expect(result.confidenceInterval.lower).toBe(-Infinity);
  assertClose(result.confidenceInterval.upper, ref.one_sample_less_conf_int_upper as number, TOL, "CI upper");
  assertClose(result.degreesOfFreedom, ref.one_sample_less_parameter as number, TOL, "df");
  expect(typeof result.effectSize.value).toBe("number");
});

Deno.test("T-test: independent_equal_var", () => {
  const result = tTestIndependent({
    x: [5.1, 4.9, 5.3, 5.0, 5.2],
    y: [4.5, 4.3, 4.7, 4.4, 4.6],
    equalVar: true,
    alternative: "two-sided",
  });

  assertClose(result.testStatistic.value, ref.independent_equal_var_statistic as number, TOL, "statistic");
  assertClose(result.pValue, ref.independent_equal_var_p_value as number, TOL, "p-value");
  assertClose(result.confidenceInterval.lower, ref.independent_equal_var_conf_int_lower as number, TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.independent_equal_var_conf_int_upper as number, TOL, "CI upper");
  assertClose(result.degreesOfFreedom, ref.independent_equal_var_parameter as number, TOL, "df");
  expect(typeof result.effectSize.value).toBe("number");
});

Deno.test("T-test: independent_welch", () => {
  const result = tTestIndependent({
    x: [5.1, 4.9, 5.3, 5.0, 5.2],
    y: [4.5, 4.3, 4.7, 4.4, 4.6],
    equalVar: false,
    alternative: "two-sided",
  });

  assertClose(result.testStatistic.value, ref.independent_welch_statistic as number, TOL, "statistic");
  assertClose(result.pValue, ref.independent_welch_p_value as number, TOL, "p-value");
  assertClose(result.confidenceInterval.lower, ref.independent_welch_conf_int_lower as number, TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.independent_welch_conf_int_upper as number, TOL, "CI upper");
  assertClose(result.degreesOfFreedom, ref.independent_welch_parameter as number, TOL, "df");
  expect(typeof result.effectSize.value).toBe("number");
});

Deno.test("T-test: independent_greater", () => {
  const result = tTestIndependent({
    x: [5.1, 4.9, 5.3, 5.0, 5.2],
    y: [4.5, 4.3, 4.7, 4.4, 4.6],
    equalVar: true,
    alternative: "greater",
  });

  assertClose(result.testStatistic.value, ref.independent_greater_statistic as number, TOL, "statistic");
  assertClose(result.pValue, ref.independent_greater_p_value as number, TOL, "p-value");
  assertClose(result.confidenceInterval.lower, ref.independent_greater_conf_int_lower as number, TOL, "CI lower");
  expect(result.confidenceInterval.upper).toBe(Infinity);
  assertClose(result.degreesOfFreedom, ref.independent_greater_parameter as number, TOL, "df");
  expect(typeof result.effectSize.value).toBe("number");
});

Deno.test("T-test: paired", () => {
  const result = tTestPaired({
    x: [85, 90, 78, 92, 88],
    y: [80, 85, 75, 89, 84],
    alternative: "two-sided",
  });

  assertClose(result.testStatistic.value, ref.paired_statistic as number, TOL, "statistic");
  assertClose(result.pValue, ref.paired_p_value as number, TOL, "p-value");
  assertClose(result.confidenceInterval.lower, ref.paired_conf_int_lower as number, TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.paired_conf_int_upper as number, TOL, "CI upper");
  assertClose(result.degreesOfFreedom, ref.paired_parameter as number, TOL, "df");
  expect(typeof result.effectSize.value).toBe("number");
});

Deno.test("T-test: paired_less", () => {
  const result = tTestPaired({
    x: [85, 90, 78, 92, 88],
    y: [80, 85, 75, 89, 84],
    alternative: "less",
  });

  assertClose(result.testStatistic.value, ref.paired_less_statistic as number, TOL, "statistic");
  assertClose(result.pValue, ref.paired_less_p_value as number, TOL, "p-value");
  expect(result.confidenceInterval.lower).toBe(-Infinity);
  assertClose(result.confidenceInterval.upper, ref.paired_less_conf_int_upper as number, TOL, "CI upper");
  assertClose(result.degreesOfFreedom, ref.paired_less_parameter as number, TOL, "df");
  expect(typeof result.effectSize.value).toBe("number");
});

Deno.test("T-test: large_effect", () => {
  const result = tTestIndependent({
    x: [10, 11, 12, 13, 14],
    y: [1, 2, 3, 4, 5],
    equalVar: true,
    alternative: "two-sided",
  });

  assertClose(result.testStatistic.value, ref.large_effect_statistic as number, TOL, "statistic");
  assertClose(result.pValue, ref.large_effect_p_value as number, TOL, "p-value");
  assertClose(result.confidenceInterval.lower, ref.large_effect_conf_int_lower as number, TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.large_effect_conf_int_upper as number, TOL, "CI upper");
  assertClose(result.degreesOfFreedom, ref.large_effect_parameter as number, TOL, "df");
  expect(typeof result.effectSize.value).toBe("number");
});
