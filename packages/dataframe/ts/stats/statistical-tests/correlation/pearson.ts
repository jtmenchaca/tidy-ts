import {
  pearson_correlation_test,
} from "../../../wasm/statistical-tests.ts";
import type {
  PearsonCorrelationTestResult,
} from "../types.ts";
import type { PrettifyDeep } from "../../../dataframe/types/utility-types.ts";

/**
 * Pearson correlation test
 */
export function pearsonTest({
  x,
  y,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x: readonly number[];
  y: readonly number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PrettifyDeep<PearsonCorrelationTestResult> {
  if (x.length !== y.length) {
    throw new Error("x and y must have the same length");
  }

  const cleanX = x.filter((val) => isFinite(val));
  const cleanY = y.filter((val) => isFinite(val));

  if (cleanX.length < 3) {
    throw new Error(
      "Pearson correlation test requires at least 3 observations",
    );
  }

  // Pass alternative directly to WASM
  const wasmAlternative = alternative;

  const result = pearson_correlation_test(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    wasmAlternative,
    alpha,
  );
  return result as PearsonCorrelationTestResult;
}
