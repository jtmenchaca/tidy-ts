import { expect } from "@std/expect";
import { assertClose, getReferenceFromRScript, TOL } from "../helpers.ts";
import {
  kolmogorovSmirnovTest,
  ksTestUniform,
} from "../../../dataframe/ts/stats/statistical-tests/kolmogorov-smirnov.ts";

interface KsRef {
  two_sample_two_sided_D: number;
  two_sample_two_sided_p_value: number;
  two_sample_less_D: number;
  two_sample_less_p_value: number;
  two_sample_greater_D: number;
  two_sample_greater_p_value: number;
  uniform_test_D: number;
  uniform_test_p_value: number;
  non_uniform_D: number;
  non_uniform_p_value: number;
  identical_samples_D: number;
  identical_samples_p_value: number;
  very_different_D: number;
  very_different_p_value: number;
}

const ref = getReferenceFromRScript<KsRef>(
  new URL("./ks-test-ref.R", import.meta.url).pathname,
);

const sample1 = [0.12, 0.34, 0.45, 0.56, 0.67, 0.78, 0.89, 0.91, 0.95, 0.99];
const sample2 = [0.05, 0.15, 0.25, 0.35, 0.55, 0.65, 0.75, 0.85, 0.92, 0.98];
const non_uniform = [0.01, 0.02, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40];

Deno.test("KS Test: two_sample_two_sided", () => {
  const result = kolmogorovSmirnovTest({ x: sample1, y: sample2 });
  assertClose(result.dStatistic, ref.two_sample_two_sided_D, TOL);
  assertClose(result.pValue, ref.two_sample_two_sided_p_value, TOL);
});

Deno.test("KS Test: two_sample_less", () => {
  const result = kolmogorovSmirnovTest({ x: sample1, y: sample2, alternative: "less" });
  assertClose(result.dStatistic, ref.two_sample_less_D, TOL);
  assertClose(result.pValue, ref.two_sample_less_p_value, TOL);
});

Deno.test("KS Test: two_sample_greater", () => {
  const result = kolmogorovSmirnovTest({ x: sample1, y: sample2, alternative: "greater" });
  assertClose(result.dStatistic, ref.two_sample_greater_D, TOL);
  assertClose(result.pValue, ref.two_sample_greater_p_value, TOL);
});

Deno.test("KS Test: uniform_test", () => {
  const result = ksTestUniform({ x: sample1, min: 0, max: 1 });
  assertClose(result.dStatistic, ref.uniform_test_D, TOL);
  assertClose(result.pValue, ref.uniform_test_p_value, TOL);
});

Deno.test("KS Test: non_uniform", () => {
  const result = ksTestUniform({ x: non_uniform, min: 0, max: 1 });
  assertClose(result.dStatistic, ref.non_uniform_D, TOL);
  assertClose(result.pValue, ref.non_uniform_p_value, TOL);
  expect(result.pValue).toBeLessThan(0.05);
});

Deno.test("KS Test: identical_samples", () => {
  const result = kolmogorovSmirnovTest({ x: sample1, y: sample1 });
  assertClose(result.dStatistic, ref.identical_samples_D, TOL);
  assertClose(result.pValue, ref.identical_samples_p_value, TOL);
});

Deno.test("KS Test: very_different", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [10, 11, 12, 13, 14];
  const result = kolmogorovSmirnovTest({ x, y });
  assertClose(result.dStatistic, ref.very_different_D, TOL);
  assertClose(result.pValue, ref.very_different_p_value, TOL);
});
