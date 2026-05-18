import {
  z_test_one_sample,
  z_test_two_sample,
} from "../../wasm/statistical-tests.ts";
import type {
  OneSampleZTestResult,
  TwoSampleZTestResult,
} from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";
export type {
  OneSampleZTestResult,
  TwoSampleZTestResult,
} from "./types.ts";

/** WASM serializes f64::INFINITY as null; restore Infinity for CI bounds */
function fixCiBounds(result: { confidenceInterval: { lower: number | null; upper: number | null } }) {
  if (result.confidenceInterval.lower === null) {
    (result.confidenceInterval as { lower: number }).lower = -Infinity;
  }
  if (result.confidenceInterval.upper === null) {
    (result.confidenceInterval as { upper: number }).upper = Infinity;
  }
}

/**
 * One-sample Z-test for means (WASM implementation)
 */
export function zTestOneSample({
  data,
  popMean,
  popStd,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  data: readonly number[];
  popMean: number;
  popStd: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PrettifyDeep<OneSampleZTestResult> {
  const cleanData = data.filter((x) => isFinite(x));

  if (cleanData.length === 0) {
    throw new Error("One-sample Z-test requires at least 1 observation");
  }

  if (popStd <= 0) {
    throw new Error("Population standard deviation must be positive");
  }

  const result = z_test_one_sample(
    new Float64Array(cleanData),
    popMean,
    popStd,
    alpha,
    alternative,
  ) as OneSampleZTestResult;
  fixCiBounds(result);
  return result;
}

/**
 * Two-sample Z-test for means (WASM implementation)
 */
export function zTestTwoSample({
  data1,
  data2,
  popStd1,
  popStd2,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  data1: readonly number[];
  data2: readonly number[];
  popStd1: number;
  popStd2: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PrettifyDeep<TwoSampleZTestResult> {
  const cleanData1 = data1.filter((x) => isFinite(x));
  const cleanData2 = data2.filter((x) => isFinite(x));

  if (cleanData1.length === 0 || cleanData2.length === 0) {
    throw new Error(
      "Two-sample Z-test requires at least 1 observation in each group",
    );
  }

  if (popStd1 <= 0 || popStd2 <= 0) {
    throw new Error("Population standard deviations must be positive");
  }

  const result = z_test_two_sample(
    new Float64Array(cleanData1),
    new Float64Array(cleanData2),
    popStd1,
    popStd2,
    alpha,
    alternative,
  ) as TwoSampleZTestResult;
  fixCiBounds(result);
  return result;
}
