import { levene_test_wasm } from "../../wasm/statistical-tests.ts";
import type { OneWayAnovaTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";

/**
 * Levene's test for equality of variances.
 *
 * Tests the null hypothesis that all groups have equal variances. `center`
 * selects the centering strategy:
 *
 * - `"median"` (default) — Brown-Forsythe modification (robust to non-normality
 *   and outliers). Matches R `car::leveneTest(..., center = median)`.
 * - `"mean"` — classical Levene (1960). Matches R `car::leveneTest(..., center = mean)`.
 *
 * Interpretation:
 * - p < alpha: Reject null → variances are significantly different
 * - p ≥ alpha: Fail to reject → no evidence of unequal variances
 *
 * @example
 * ```typescript
 * const result = leveneTest([group1, group2, group3]);                    // default: median
 * const classical = leveneTest([group1, group2, group3], 0.05, "mean");   // classical Levene
 * ```
 */
export function leveneTest(
  groups: readonly (readonly number[])[],
  alpha = 0.05,
  center: "median" | "mean" = "median",
): PrettifyDeep<OneWayAnovaTestResult> {
  if (groups.length < 2) {
    throw new Error("Levene's test requires at least 2 groups");
  }

  const cleanGroups = groups.map((group, i) => {
    const cleaned = group.filter((x) => Number.isFinite(x));
    if (cleaned.length < 2) {
      throw new Error(`Group ${i + 1} must have at least 2 finite values`);
    }
    return cleaned;
  });

  const flatData = cleanGroups.flat();
  const groupSizes = cleanGroups.map((group) => group.length);

  return levene_test_wasm(
    new Float64Array(flatData),
    new Uint32Array(groupSizes),
    alpha,
    center,
  );
}

/**
 * Check if groups have equal variances using Levene's test
 *
 * Convenience function that returns a boolean result.
 *
 * @param groups Array of groups to test
 * @param alpha Significance level (default: 0.05)
 * @returns true if variances appear equal, false if significantly different
 */
function hasEqualVariances(
  groups: readonly (readonly number[])[],
  alpha = 0.05,
): boolean {
  try {
    const result = leveneTest(groups, alpha);
    return result.pValue >= alpha;
  } catch {
    // If test fails, assume unequal variances (conservative approach)
    return false;
  }
}
