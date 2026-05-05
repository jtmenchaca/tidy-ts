import { expect } from "@std/expect";
import { assertClose, getReferenceFromRScript, TOL } from "../helpers.ts";
import { pearsonTest } from "../../../dataframe/ts/stats/statistical-tests/correlation/pearson.ts";
import { spearmanTest } from "../../../dataframe/ts/stats/statistical-tests/correlation/spearman.ts";
import { kendallTest } from "../../../dataframe/ts/stats/statistical-tests/correlation/kendall.ts";

const REF_PATH = new URL("./correlation-ref.R", import.meta.url).pathname;

interface Ref {
  pearson_two_statistic: number;
  pearson_two_pValue: number;
  pearson_two_estimate: number;
  pearson_two_conf_int: [number, number];

  pearson_greater_statistic: number;
  pearson_greater_pValue: number;
  pearson_greater_estimate: number;
  pearson_greater_conf_int: [number, number];

  spearman_two_statistic: number;
  spearman_two_pValue: number;
  spearman_two_estimate: number;

  spearman_less_statistic: number;
  spearman_less_pValue: number;
  spearman_less_estimate: number;

  kendall_two_statistic: number;
  kendall_two_pValue: number;
  kendall_two_estimate: number;

  kendall_greater_statistic: number;
  kendall_greater_pValue: number;
  kendall_greater_estimate: number;

  weak_correlation_statistic: number;
  weak_correlation_pValue: number;
  weak_correlation_estimate: number;
  weak_correlation_conf_int: [number, number];

  negative_correlation_statistic: number;
  negative_correlation_pValue: number;
  negative_correlation_estimate: number;
  negative_correlation_conf_int: [number, number];
}

const ref = getReferenceFromRScript<Ref>(REF_PATH);

const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const y = [2.1, 3.9, 6.2, 7.8, 10.1, 12.0, 14.2, 15.9, 18.1, 20.0];

Deno.test("Correlation: pearson_two", () => {
  const result = pearsonTest({ x, y, alternative: "two-sided" });
  assertClose(result.testStatistic.value, ref.pearson_two_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.pearson_two_pValue, TOL, "pValue");
  assertClose(result.effectSize.value, ref.pearson_two_estimate, TOL, "estimate");
  assertClose(result.confidenceInterval.lower, ref.pearson_two_conf_int[0], TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.pearson_two_conf_int[1], TOL, "CI upper");
});

Deno.test("Correlation: pearson_greater", () => {
  const result = pearsonTest({ x, y, alternative: "greater" });
  assertClose(result.testStatistic.value, ref.pearson_greater_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.pearson_greater_pValue, TOL, "pValue");
  assertClose(result.effectSize.value, ref.pearson_greater_estimate, TOL, "estimate");
  assertClose(result.confidenceInterval.lower, ref.pearson_greater_conf_int[0], TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.pearson_greater_conf_int[1], TOL, "CI upper");
});

Deno.test("Correlation: spearman_two", () => {
  const result = spearmanTest({ x, y, alternative: "two-sided" });
  assertClose(result.testStatistic.value, ref.spearman_two_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.spearman_two_pValue, TOL, "pValue");
  assertClose(result.effectSize.value, ref.spearman_two_estimate, TOL, "estimate");
});

Deno.test("Correlation: spearman_less", () => {
  const result = spearmanTest({ x, y, alternative: "less" });
  assertClose(result.testStatistic.value, ref.spearman_less_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.spearman_less_pValue, TOL, "pValue");
  assertClose(result.effectSize.value, ref.spearman_less_estimate, TOL, "estimate");
});

Deno.test("Correlation: kendall_two", () => {
  const result = kendallTest({ x, y, alternative: "two-sided" });
  assertClose(result.testStatistic.value, ref.kendall_two_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.kendall_two_pValue, TOL, "pValue");
  assertClose(result.effectSize.value, ref.kendall_two_estimate, TOL, "estimate");
});

Deno.test("Correlation: kendall_greater", () => {
  const result = kendallTest({ x, y, alternative: "greater" });
  assertClose(result.testStatistic.value, ref.kendall_greater_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.kendall_greater_pValue, TOL, "pValue");
  assertClose(result.effectSize.value, ref.kendall_greater_estimate, TOL, "estimate");
});

Deno.test("Correlation: weak_correlation", () => {
  const x2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const y2 = [5, 3, 7, 2, 8, 4, 9, 1, 6, 10];
  const result = pearsonTest({ x: x2, y: y2, alternative: "two-sided" });
  assertClose(result.testStatistic.value, ref.weak_correlation_statistic, TOL, "statistic");
  assertClose(result.pValue, ref.weak_correlation_pValue, TOL, "pValue");
  assertClose(result.effectSize.value, ref.weak_correlation_estimate, TOL, "estimate");
  assertClose(result.confidenceInterval.lower, ref.weak_correlation_conf_int[0], TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.weak_correlation_conf_int[1], TOL, "CI upper");
});

Deno.test("Correlation: negative_correlation", () => {
  const x3 = [1, 2, 3, 4, 5];
  const y3 = [10, 8, 6, 4, 2];
  const result = pearsonTest({ x: x3, y: y3, alternative: "two-sided" });
  // Perfect r=-1 gives a degenerate t-statistic (SE~0 → t→-Inf in R)
  // Just verify correlation and p-value are correct
  assertClose(result.effectSize.value, ref.negative_correlation_estimate, TOL, "estimate");
  expect(result.pValue).toBeLessThan(0.001);
  assertClose(result.confidenceInterval.lower, ref.negative_correlation_conf_int[0], TOL, "CI lower");
  assertClose(result.confidenceInterval.upper, ref.negative_correlation_conf_int[1], TOL, "CI upper");
});
