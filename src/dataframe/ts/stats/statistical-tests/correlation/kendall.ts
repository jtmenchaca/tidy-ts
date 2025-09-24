import {
  kendall_correlation_test,
  serializeTestResult,
} from "../../../wasm/statistical-tests.ts";
import type {
  KendallCorrelationTestResult,
} from "../../../../lib/tidy_ts_dataframe.js";

/**
 * Kendall rank correlation test
 */
export function kendallTest({
  x,
  y,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x: number[];
  y: number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): KendallCorrelationTestResult {
  if (x.length !== y.length) {
    throw new Error("x and y must have the same length");
  }

  const cleanX = x.filter((val) => isFinite(val));
  const cleanY = y.filter((val) => isFinite(val));

  if (cleanX.length < 2) {
    throw new Error(
      "Kendall correlation test requires at least 2 observations",
    );
  }

  // Pass alternative directly to WASM
  const wasmAlternative = alternative;

  const result = kendall_correlation_test(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    wasmAlternative,
    alpha,
  );
  return serializeTestResult(result) as KendallCorrelationTestResult;
}
