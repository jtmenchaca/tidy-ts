import {
  pearson_correlation_test,
  serializeTestResult,
} from "../../../wasm/statistical-tests.ts";
import type {
  PearsonCorrelationTestResult,
} from "../../../../lib/tidy_ts_dataframe.internal.js";

/**
 * Pearson correlation test
 */
export function pearsonTest({
  x,
  y,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x: number[];
  y: number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PearsonCorrelationTestResult {
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
  return serializeTestResult(result) as PearsonCorrelationTestResult;
}
