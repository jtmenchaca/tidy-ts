import { expect } from "@std/expect";
import {
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "../helpers.ts";
import {
  proportionTestOneSample,
  proportionTestTwoSample,
} from "../../../dataframe/ts/stats/statistical-tests/proportion-tests.ts";

// NOTE: R's prop.test uses Yates' continuity correction by default.
// Our implementation may not apply continuity correction, so we use TOL
// for comparisons. If test statistics differ significantly, it is likely due
// to this correction difference.

const ref = getReferenceFromRScript<Record<string, number>>(
  new URL("./proportion-ref.R", import.meta.url).pathname,
);

// Helper to create boolean arrays: first `successes` entries are true, rest false
function makeBoolArray(successes: number, n: number): boolean[] {
  return Array.from({ length: n }, (_, i) => i < successes);
}

Deno.test("Proportion: one_sample_two_sided", () => {
  const data = makeBoolArray(45, 100);
  const result = proportionTestOneSample({
    data,
    hypothesizedProportion: 0.5,
    alternative: "two-sided",
  });

  assertClose(
    result.testStatistic.value,
    ref.one_sample_two_sided_statistic,
    TOL,
    "statistic",
  );
  assertClose(result.pValue, ref.one_sample_two_sided_p_value, TOL, "p-value");
  assertClose(
    result.confidenceInterval.lower,
    ref.one_sample_two_sided_conf_int_lower,
    TOL,
    "CI lower",
  );
  assertClose(
    result.confidenceInterval.upper,
    ref.one_sample_two_sided_conf_int_upper,
    TOL,
    "CI upper",
  );
  assertClose(result.sampleProportion, ref.one_sample_two_sided_estimate, TOL, "estimate");
});

Deno.test("Proportion: one_sample_less", () => {
  const data = makeBoolArray(45, 100);
  const result = proportionTestOneSample({
    data,
    hypothesizedProportion: 0.5,
    alternative: "less",
  });

  assertClose(
    result.testStatistic.value,
    ref.one_sample_less_statistic,
    TOL,
    "statistic",
  );
  assertClose(result.pValue, ref.one_sample_less_p_value, TOL, "p-value");
  assertClose(
    result.confidenceInterval.lower,
    ref.one_sample_less_conf_int_lower,
    TOL,
    "CI lower",
  );
  assertClose(
    result.confidenceInterval.upper,
    ref.one_sample_less_conf_int_upper,
    TOL,
    "CI upper",
  );
  assertClose(result.sampleProportion, ref.one_sample_less_estimate, TOL, "estimate");
});

Deno.test("Proportion: one_sample_greater", () => {
  const data = makeBoolArray(60, 100);
  const result = proportionTestOneSample({
    data,
    hypothesizedProportion: 0.5,
    alternative: "greater",
  });

  assertClose(
    result.testStatistic.value,
    ref.one_sample_greater_statistic,
    TOL,
    "statistic",
  );
  assertClose(result.pValue, ref.one_sample_greater_p_value, TOL, "p-value");
  assertClose(
    result.confidenceInterval.lower,
    ref.one_sample_greater_conf_int_lower,
    TOL,
    "CI lower",
  );
  assertClose(
    result.confidenceInterval.upper,
    ref.one_sample_greater_conf_int_upper,
    TOL,
    "CI upper",
  );
  assertClose(result.sampleProportion, ref.one_sample_greater_estimate, TOL, "estimate");
});

Deno.test("Proportion: one_sample_custom_p", () => {
  const data = makeBoolArray(30, 100);
  const result = proportionTestOneSample({
    data,
    hypothesizedProportion: 0.4,
    alternative: "two-sided",
  });

  assertClose(
    result.testStatistic.value,
    ref.one_sample_custom_p_statistic,
    TOL,
    "statistic",
  );
  assertClose(result.pValue, ref.one_sample_custom_p_p_value, TOL, "p-value");
  assertClose(
    result.confidenceInterval.lower,
    ref.one_sample_custom_p_conf_int_lower,
    TOL,
    "CI lower",
  );
  assertClose(
    result.confidenceInterval.upper,
    ref.one_sample_custom_p_conf_int_upper,
    TOL,
    "CI upper",
  );
  assertClose(result.sampleProportion, ref.one_sample_custom_p_estimate, TOL, "estimate");
});

Deno.test("Proportion: two_sample_two_sided", () => {
  const data1 = makeBoolArray(45, 100);
  const data2 = makeBoolArray(55, 100);
  const result = proportionTestTwoSample({
    data1,
    data2,
    alternative: "two-sided",
  });

  assertClose(
    result.testStatistic.value,
    ref.two_sample_two_sided_statistic,
    TOL,
    "statistic",
  );
  assertClose(result.pValue, ref.two_sample_two_sided_p_value, TOL, "p-value");
  assertClose(
    result.confidenceInterval.lower,
    ref.two_sample_two_sided_conf_int_lower,
    TOL,
    "CI lower",
  );
  assertClose(
    result.confidenceInterval.upper,
    ref.two_sample_two_sided_conf_int_upper,
    TOL,
    "CI upper",
  );
  // Verify proportion difference matches difference of R estimates
  const expectedDiff = ref.two_sample_two_sided_estimate_1 - ref.two_sample_two_sided_estimate_2;
  assertClose(result.proportionDifference, expectedDiff, TOL, "proportion difference");
});

Deno.test("Proportion: two_sample_greater", () => {
  const data1 = makeBoolArray(60, 100);
  const data2 = makeBoolArray(40, 100);
  const result = proportionTestTwoSample({
    data1,
    data2,
    alternative: "greater",
  });

  assertClose(
    result.testStatistic.value,
    ref.two_sample_greater_statistic,
    TOL,
    "statistic",
  );
  assertClose(result.pValue, ref.two_sample_greater_p_value, TOL, "p-value");
  assertClose(
    result.confidenceInterval.lower,
    ref.two_sample_greater_conf_int_lower,
    TOL,
    "CI lower",
  );
  assertClose(
    result.confidenceInterval.upper,
    ref.two_sample_greater_conf_int_upper,
    TOL,
    "CI upper",
  );
  const expectedDiff = ref.two_sample_greater_estimate_1 - ref.two_sample_greater_estimate_2;
  assertClose(result.proportionDifference, expectedDiff, TOL, "proportion difference");
});

Deno.test("Proportion: two_sample_equal", () => {
  const data1 = makeBoolArray(50, 100);
  const data2 = makeBoolArray(50, 100);
  const result = proportionTestTwoSample({
    data1,
    data2,
    alternative: "two-sided",
  });

  assertClose(
    result.testStatistic.value,
    ref.two_sample_equal_statistic,
    TOL,
    "statistic",
  );
  assertClose(result.pValue, ref.two_sample_equal_p_value, TOL, "p-value");
  assertClose(
    result.confidenceInterval.lower,
    ref.two_sample_equal_conf_int_lower,
    TOL,
    "CI lower",
  );
  assertClose(
    result.confidenceInterval.upper,
    ref.two_sample_equal_conf_int_upper,
    TOL,
    "CI upper",
  );
  const expectedDiff = ref.two_sample_equal_estimate_1 - ref.two_sample_equal_estimate_2;
  assertClose(result.proportionDifference, expectedDiff, TOL, "proportion difference");
});

Deno.test("Proportion: two_sample_less", () => {
  const data1 = makeBoolArray(40, 100);
  const data2 = makeBoolArray(60, 100);
  const result = proportionTestTwoSample({
    data1,
    data2,
    alternative: "less",
  });

  assertClose(
    result.testStatistic.value,
    ref.two_sample_less_statistic,
    TOL,
    "statistic",
  );
  assertClose(result.pValue, ref.two_sample_less_p_value, TOL, "p-value");
  assertClose(
    result.confidenceInterval.lower,
    ref.two_sample_less_conf_int_lower,
    TOL,
    "CI lower",
  );
  assertClose(
    result.confidenceInterval.upper,
    ref.two_sample_less_conf_int_upper,
    TOL,
    "CI upper",
  );
  const expectedDiff = ref.two_sample_less_estimate_1 - ref.two_sample_less_estimate_2;
  assertClose(result.proportionDifference, expectedDiff, TOL, "proportion difference");
});
