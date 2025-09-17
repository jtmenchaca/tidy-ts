import { wilcoxon_w_test, serializeTestResult } from "../../wasm/statistical-tests.ts";
import type { WilcoxonSignedRankTestResult } from "../../../lib/tidy_ts_dataframe.internal.js";
export type { WilcoxonSignedRankTestResult } from "../../../lib/tidy_ts_dataframe.internal.js";

/**
 * Wilcoxon signed-rank test for paired data
 */
export function wilcoxonSignedRankTest({
  x,
  y,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x: number[];
  y: number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): WilcoxonSignedRankTestResult {
  const cleanX = x.filter((x) => isFinite(x));
  const cleanY = y.filter((x) => isFinite(x));

  if (cleanX.length !== cleanY.length) {
    throw new Error("Paired data must have the same length");
  }

  if (cleanX.length < 1) {
    throw new Error("Must have at least 1 observation");
  }

  const result = wilcoxon_w_test(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    alpha,
    alternative,
  );
  return serializeTestResult(result) as WilcoxonSignedRankTestResult;
}
