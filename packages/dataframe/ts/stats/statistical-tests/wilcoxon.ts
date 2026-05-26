import {
  wilcoxon_w_test,
} from "../../wasm/statistical-tests.ts";
import type { WilcoxonSignedRankTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";
export type { WilcoxonSignedRankTestResult } from "./types.ts";

/**
 * Wilcoxon signed-rank test for paired data
 */
export function wilcoxonSignedRankTest({
  x,
  y,
  alternative = "two-sided",
  alpha = 0.05,
  exact,
  correct = true,
}: {
  x: readonly number[];
  y: readonly number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  /**
   * Force the exact (`true`) or asymptotic (`false`) p-value path. Omit to
   * let the library choose R's default rule: exact when n < 50 AND there are
   * no ties in |differences| AND no zero differences. Matches `wilcox.test`'s
   * `exact` argument.
   */
  exact?: boolean;
  /**
   * Apply the continuity correction on the asymptotic path. Ignored when the
   * exact path is used. Default `true`, matching `wilcox.test`'s `correct`
   * default.
   */
  correct?: boolean;
}): PrettifyDeep<WilcoxonSignedRankTestResult> {
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
    exact,
    correct,
  );
  return result as WilcoxonSignedRankTestResult;
}
