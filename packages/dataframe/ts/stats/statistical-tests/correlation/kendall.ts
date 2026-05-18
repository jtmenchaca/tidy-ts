import {
  kendall_correlation_test,
} from "../../../wasm/statistical-tests.ts";
import type {
  KendallCorrelationTestResult,
} from "../types.ts";
import type { PrettifyDeep } from "../../../dataframe/types/utility-types.ts";

/**
 * Kendall rank correlation test
 */
export function kendallTest({
  x,
  y,
  alternative = "two-sided",
  alpha = 0.05,
  exact,
}: {
  x: readonly number[];
  y: readonly number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  exact?: boolean;
}): PrettifyDeep<KendallCorrelationTestResult> {
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
    exact,
  );
  return result as KendallCorrelationTestResult;
}
