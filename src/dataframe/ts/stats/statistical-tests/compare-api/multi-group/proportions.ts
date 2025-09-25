import { chiSquareTest } from "../../chi-square.ts";
import type { ChiSquareIndependenceTestResult } from "../../../../../lib/tidy_ts_dataframe.d.ts";

/**
 * Test independence of categorical variables across multiple groups.
 *
 * Uses chi-squared test to determine if there's a significant association
 * between row and column variables in a contingency table.
 *
 * Assumptions:
 * - Observations are independent
 * - Expected frequency in each cell ≥ 5 (for valid chi-squared approximation)
 * - Categories are mutually exclusive and exhaustive
 * - Null hypothesis: Variables are independent (no association)
 *
 * @param contingencyTable - 2D array of observed frequencies
 * @param alpha - Significance level (default: 0.05)
 * @returns Chi-squared statistic, p-value, degrees of freedom, and effect sizes (Cramér's V, phi)
 */
export function proportionsToEachOther({
  contingencyTable,
  alpha = 0.05,
}: {
  contingencyTable: number[][];
  alpha?: number;
}): ChiSquareIndependenceTestResult {
  return chiSquareTest({
    contingencyTable,
    alpha,
  });
}
