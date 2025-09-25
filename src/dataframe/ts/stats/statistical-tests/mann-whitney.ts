import {
  mann_whitney_test_with_config,
  serializeTestResult,
} from "../../wasm/statistical-tests.ts";
import type { MannWhitneyTestResult } from "../../../lib/tidy_ts_dataframe.d.ts";

// Re-export canonical type to avoid duplication
export type { MannWhitneyTestResult } from "../../../lib/tidy_ts_dataframe.d.ts";

/**
 * Mann-Whitney U test (Wilcoxon rank-sum) for non-parametric comparison
 */
export function mannWhitneyTest({
  x,
  y,
  exact = true,
  continuityCorrection = true,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x: number[];
  y: number[];
  exact?: boolean;
  continuityCorrection?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): MannWhitneyTestResult {
  const cleanX = x.filter((x) => isFinite(x));
  const cleanY = y.filter((x) => isFinite(x));

  if (cleanX.length < 1 || cleanY.length < 1) {
    throw new Error("Each group must have at least 1 observation");
  }

  const result = mann_whitney_test_with_config(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    exact,
    continuityCorrection,
    alpha,
    alternative,
  );
  return serializeTestResult(result) as MannWhitneyTestResult;
}
