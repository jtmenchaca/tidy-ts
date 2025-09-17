import { shapiroWilkTest } from "../../shapiro-wilk.ts";
import type { ShapiroWilkTestResult } from "../../../../../lib/tidy_ts_dataframe.internal.js";
import type {
  NumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../../helpers.ts";
import { cleanNumeric } from "../helpers.ts";

/**
 * Test if data follows a normal distribution (Shapiro-Wilk test).
 *
 * Assesses whether a sample comes from a normally distributed population.
 * Most reliable for small to medium sample sizes (n < 5000).
 *
 * Assumptions:
 * - Data is continuous
 * - Observations are independent and identically distributed
 * - Null hypothesis: Data is normally distributed
 *
 * @param data - Sample values to test for normality
 * @param alpha - Significance level (default: 0.05)
 * @returns Test results with W statistic and p-value (reject null if p < alpha)
 */
export function distributionToNormal({
  data,
  alpha = 0.05,
}: {
  data:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  alpha?: number;
}): ShapiroWilkTestResult {
  // ============================================================================
  // DECISION TREE: One Group Distribution to Normal
  // ============================================================================
  // Decision logic from pseudocode:
  // 1. Clean data (remove null/undefined/infinite values)
  // 2. Use Shapiro-Wilk test (no decision needed - single method)
  // 3. Most reliable for small to medium samples (n < 5000)
  // 4. Null hypothesis: Data is normally distributed
  // 5. Reject null if p < alpha (data is non-normal)
  // ============================================================================

  // Convert data to a regular array for processing and filter out null/undefined values
  const cleanData = cleanNumeric(data);
  return shapiroWilkTest({
    data: cleanData,
    alpha,
  });
}
