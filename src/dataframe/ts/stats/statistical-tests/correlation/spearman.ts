import {
  serializeTestResult,
  spearman_correlation_test,
} from "../../../wasm/statistical-tests.ts";
import type {
  SpearmanCorrelationTestResult,
} from "../../../../lib/tidy_ts_dataframe.d.ts";

/**
 * Spearman rank correlation test
 */
export function spearmanTest({
  x,
  y,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x: number[];
  y: number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): SpearmanCorrelationTestResult {
  if (x.length !== y.length) {
    throw new Error("x and y must have the same length");
  }

  // Filter paired data to remove any rows where either x or y is not finite
  const pairedData = x.map((xi, i) => ({ x: xi, y: y[i] }))
    .filter((pair) => isFinite(pair.x) && isFinite(pair.y));

  if (pairedData.length < 2) {
    throw new Error(
      "Spearman correlation test requires at least 2 observations",
    );
  }

  const cleanX = pairedData.map((pair) => pair.x);
  const cleanY = pairedData.map((pair) => pair.y);

  // Pass alternative directly to WASM
  const wasmAlternative = alternative;

  const result = spearman_correlation_test(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    wasmAlternative,
    alpha,
  );
  return serializeTestResult(result) as SpearmanCorrelationTestResult;
}
