import { anovaOneWay } from "../anova.ts";
import { kruskalWallisTest } from "../kruskal-wallis.ts";
import { chiSquareTest } from "../chi-square.ts";
import type {
  AnovaTestResult,
  ChiSquareTestResult,
  KruskalWallisTestResult,
} from "../types.ts";

/**
 * Compares central tendencies across multiple groups.
 * Automatically selects between parametric (ANOVA) and non-parametric (Kruskal-Wallis) tests.
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
 * Compares proportions across multiple groups using chi-squared test.
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
