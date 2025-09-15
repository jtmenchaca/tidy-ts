import { anovaOneWay } from "../anova.ts";
import { kruskalWallisTest } from "../kruskal-wallis.ts";
import { chiSquareTest } from "../chi-square.ts";
import type {
  AnovaTestResult,
  ChiSquareTestResult,
  KruskalWallisTestResult,
} from "../types.ts";

/**
 * Compare central tendencies across three or more independent groups.
 * 
 * Tests whether the means (ANOVA) or medians (Kruskal-Wallis) differ
 * significantly among multiple groups.
 * 
 * Assumptions:
 * - Groups are independent
 * - For ANOVA: Data in each group is approximately normally distributed
 * - For ANOVA: Variances are approximately equal across groups
 * - For Kruskal-Wallis: Data is continuous or ordinal
 * - Null hypothesis: All groups have the same central tendency
 * 
 * @param groups - Array of arrays, each containing values for one group
 * @param parametric - Use ANOVA (true) or Kruskal-Wallis (false)
 * @param alpha - Significance level (default: 0.05)
 * @returns Test statistic (F or H), p-value, degrees of freedom, and effect size
 */
export function centralTendencyToEachOther({
  groups,
  parametric,
  alpha,
}: {
  groups: number[][];
  parametric: true;
  alpha?: number;
}): AnovaTestResult;

export function centralTendencyToEachOther({
  groups,
  parametric,
  alpha,
}: {
  groups: number[][];
  parametric: false;
  alpha?: number;
}): KruskalWallisTestResult;

export function centralTendencyToEachOther({
  groups,
  parametric,
  alpha,
}: {
  groups: number[][];
  parametric?: boolean;
  alpha?: number;
}): AnovaTestResult | KruskalWallisTestResult;

export function centralTendencyToEachOther({
  groups,
  parametric = true,
  alpha = 0.05,
}: {
  groups: number[][];
  parametric?: boolean;
  alpha?: number;
}): AnovaTestResult | KruskalWallisTestResult {
  if (parametric) {
    // Use one-way ANOVA for parametric data
    const result = anovaOneWay(groups, alpha);
    return {
      test_statistic: result.test_statistic!,
      p_value: result.p_value!,
      f_statistic: result.f_statistic!,
      degrees_of_freedom: result.degrees_of_freedom!,
      eta_squared: result.eta_squared,
      test_type: result.test_type,
      test_name: result.test_name,
      alpha: alpha,
      error_message: result.error_message,
    };
  } else {
    // Use Kruskal-Wallis test for non-parametric data
    const result = kruskalWallisTest(groups, alpha);
    return {
      test_statistic: result.test_statistic!,
      p_value: result.p_value!,
      degrees_of_freedom: result.degrees_of_freedom!,
      eta_squared: result.eta_squared,
      test_type: result.test_type,
      test_name: result.test_name,
      alpha: alpha,
      error_message: result.error_message,
    };
  }
}

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
}): ChiSquareTestResult {
  const result = chiSquareTest({
    contingencyTable,
    alpha,
  });
  return {
    test_statistic: result.test_statistic!,
    p_value: result.p_value!,
    degrees_of_freedom: result.degrees_of_freedom!,
    cramers_v: result.cramers_v,
    phi_coefficient: result.phi_coefficient,
    test_type: result.test_type,
    test_name: result.test_name,
    alpha: alpha,
    error_message: result.error_message,
  };
}

// Export the multi-groups test functions as a namespace
export const multiGroups = {
  centralTendency: {
    toEachOther: centralTendencyToEachOther,
  },
  proportions: {
    toEachOther: proportionsToEachOther,
  },
};
