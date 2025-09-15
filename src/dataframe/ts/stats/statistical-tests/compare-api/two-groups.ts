import { tTestIndependent } from "../t-tests.ts";
import { mannWhitneyTest } from "../mann-whitney.ts";
import { proportionTestTwoSample } from "../proportion-tests.ts";
import { chiSquareTest } from "../chi-square.ts";
import { pearsonTest, spearmanTest } from "../correlation-tests.ts";
import type {
  ChiSquareTestResult,
  CorrelationTestResult,
  MannWhitneyTestResult,
  ProportionTestResult,
  TTestResult,
} from "../types.ts";
import type {
  NumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../helpers.ts";

/**
 * Compare the central tendencies of two independent groups.
 * 
 * Tests whether the mean (parametric) or median (non-parametric) values of two
 * unrelated groups are statistically different.
 * 
 * Assumptions:
 * - Samples are independent and randomly drawn
 * - For parametric: Data in each group is approximately normally distributed
 * - For parametric: Optionally assumes equal variance (use `equalVar: false` for Welch's test)
 * - For non-parametric: Data is continuous (Mann-Whitney U test)
 * 
 * @param x - First group's values
 * @param y - Second group's values
 * @param parametric - Use t-test (true) or Mann-Whitney U test (false)
 * @param equalVar - Assume equal variances for t-test (default: true)
 * @param alternative - Direction of the test ("two-sided", "less", "greater")
 * @param alpha - Significance level (default: 0.05)
 * @returns Test results with statistic, p-value, and effect size
 */
export function centralTendencyToEachOther({
  x,
  y,
  parametric,
  equalVar,
  alternative,
  alpha,
}: {
  x: readonly number[];
  y: readonly number[];
  parametric: true;
  equalVar?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): TTestResult;

export function centralTendencyToEachOther({
  x,
  y,
  parametric,
  equalVar,
  alternative,
  alpha,
}: {
  x: readonly number[];
  y: readonly number[];
  parametric: false;
  equalVar?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): MannWhitneyTestResult;

export function centralTendencyToEachOther({
  x,
  y,
  parametric,
  equalVar,
  alternative,
  alpha,
}: {
  x: readonly number[];
  y: readonly number[];
  parametric?: boolean;
  equalVar?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): TTestResult | MannWhitneyTestResult;

export function centralTendencyToEachOther({
  x,
  y,
  parametric = true,
  equalVar = true,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  y:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  parametric?: boolean;
  equalVar?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): TTestResult | MannWhitneyTestResult {
  // Convert data to regular arrays and filter out null/undefined values
  const xArray = Array.isArray(x) ? x : Array.from(x);
  const yArray = Array.isArray(y) ? y : Array.from(y);
  const cleanX = xArray.filter((val): val is number =>
    typeof val === "number" && !isNaN(val)
  );
  const cleanY = yArray.filter((val): val is number =>
    typeof val === "number" && !isNaN(val)
  );

  if (parametric) {
    // Use independent samples t-test for parametric data
    const result = tTestIndependent({
      x: cleanX,
      y: cleanY,
      equalVar,
      alternative,
      alpha,
    });
    return {
      test_statistic: result.test_statistic!,
      p_value: result.p_value!,
      confidence_interval_lower: result.confidence_interval_lower!,
      confidence_interval_upper: result.confidence_interval_upper!,
      confidence_level: result.confidence_level!,
      degrees_of_freedom: result.degrees_of_freedom!,
      mean_difference: result.mean_difference,
      standard_error: result.standard_error,
      effect_size: result.effect_size,
      cohens_d: result.cohens_d,
      test_type: result.test_type,
      test_name: result.test_name,
      alpha: alpha,
      error_message: result.error_message,
    };
  } else {
    // Use Mann-Whitney U test for non-parametric data
    const result = mannWhitneyTest({
      x: cleanX,
      y: cleanY,
      exact: false,
      continuityCorrection: true,
      alternative,
      alpha,
    });
    return {
      test_statistic: result.test_statistic!,
      p_value: result.p_value!,
      u_statistic: result.u_statistic!,
      effect_size: result.effect_size ?? 0, // Ensure effect_size is always present
      test_type: result.test_type,
      test_name: result.test_name,
      alpha: alpha,
      error_message: result.error_message,
    };
  }
}

/**
 * Compare proportions between two independent groups.
 * 
 * Tests whether the proportion of successes differs between two groups using
 * either a two-proportion z-test or chi-squared test of independence.
 * 
 * Assumptions:
 * - Samples are independent between and within groups
 * - Sample sizes are large enough (at least 5 expected in each cell)
 * - For z-test: Can test directional hypotheses
 * - For chi-squared: Tests association only (always two-sided)
 * 
 * @param data1 - First group's binary data (0/1 or boolean)
 * @param data2 - Second group's binary data (0/1 or boolean)
 * @param useChiSquare - Use chi-squared test (true) or z-test (false)
 * @param alternative - Direction for z-test ("two-sided", "less", "greater")
 * @param alpha - Significance level (default: 0.05)
 * @returns Test results with statistic, p-value, and effect size measures
 */
export function proportionsToEachOther({
  data1,
  data2,
  alternative,
  alpha,
  useChiSquare,
}: {
  data1: boolean[] | number[] | readonly boolean[] | readonly number[];
  data2: boolean[] | number[] | readonly boolean[] | readonly number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  useChiSquare: false;
}): ProportionTestResult;

export function proportionsToEachOther({
  data1,
  data2,
  alternative,
  alpha,
  useChiSquare,
}: {
  data1: boolean[] | number[] | readonly boolean[] | readonly number[];
  data2: boolean[] | number[] | readonly boolean[] | readonly number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  useChiSquare: true;
}): ChiSquareTestResult;

export function proportionsToEachOther({
  data1,
  data2,
  alternative,
  alpha,
  useChiSquare,
}: {
  data1: boolean[] | number[] | readonly boolean[] | readonly number[];
  data2: boolean[] | number[] | readonly boolean[] | readonly number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  useChiSquare?: boolean;
}): ProportionTestResult | ChiSquareTestResult;

export function proportionsToEachOther({
  data1,
  data2,
  alternative = "two-sided",
  alpha = 0.05,
  useChiSquare = false,
}: {
  data1: boolean[] | number[] | readonly boolean[] | readonly number[];
  data2: boolean[] | number[] | readonly boolean[] | readonly number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  useChiSquare?: boolean;
}): ProportionTestResult | ChiSquareTestResult {
  // Convert data to regular arrays and boolean/number arrays to 0/1 arrays
  const data1Array = Array.isArray(data1)
    ? data1
    : Array.from(data1 as Iterable<boolean | number>);
  const data2Array = Array.isArray(data2)
    ? data2
    : Array.from(data2 as Iterable<boolean | number>);
  const numericData1 = data1Array.map((x) =>
    typeof x === "boolean" ? (x ? 1 : 0) : (typeof x === "number" ? x : 0)
  );
  const numericData2 = data2Array.map((x) =>
    typeof x === "boolean" ? (x ? 1 : 0) : (typeof x === "number" ? x : 0)
  );

  if (useChiSquare) {
    // Use chi-squared test for proportions
    const successes1 = numericData1.reduce((sum, x) => sum + x, 0);
    const successes2 = numericData2.reduce((sum, x) => sum + x, 0);
    const n1 = numericData1.length;
    const n2 = numericData2.length;
    const contingencyTable = [
      [successes1, n1 - successes1],
      [successes2, n2 - successes2],
    ];
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
  } else {
    // Use two-proportion z-test
    const result = proportionTestTwoSample({
      data1: numericData1,
      data2: numericData2,
      pooled: true,
      alternative,
      alpha,
    });
    return {
      test_statistic: result.test_statistic!,
      p_value: result.p_value!,
      confidence_interval_lower: result.confidence_interval_lower!,
      confidence_interval_upper: result.confidence_interval_upper!,
      confidence_level: result.confidence_level!,
      effect_size: result.effect_size,
      test_type: result.test_type,
      test_name: result.test_name,
      alpha: alpha,
      error_message: result.error_message,
    };
  }
}

/**
 * Test association between two continuous variables.
 * 
 * Measures and tests the strength of linear (Pearson) or monotonic (Spearman)
 * relationship between two continuous variables.
 * 
 * Assumptions:
 * - For Pearson: Variables are continuous and approximately bivariate normal
 * - For Pearson: Relationship is linear
 * - For Spearman: Variables are at least ordinal
 * - For Spearman: Relationship is monotonic
 * - Observations are independent
 * 
 * @param x - First variable's values
 * @param y - Second variable's values  
 * @param method - Correlation method ("pearson" or "spearman")
 * @param alternative - Test direction ("two.sided", "less", "greater")
 * @param alpha - Significance level (default: 0.05)
 * @returns Correlation coefficient, test statistic, p-value, and confidence intervals
 */
export function associationToEachOther({
  x,
  y,
  method = "pearson",
  alternative = "two.sided",
  alpha = 0.05,
}: {
  x:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  y:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  method?: "pearson" | "spearman";
  alternative?: "two.sided" | "less" | "greater";
  alpha?: number;
}): CorrelationTestResult {
  // Convert data to regular arrays and filter out null/undefined values
  const xArray = Array.isArray(x) ? x : Array.from(x);
  const yArray = Array.isArray(y) ? y : Array.from(y);
  const cleanX = xArray.filter((val): val is number =>
    typeof val === "number" && !isNaN(val)
  );
  const cleanY = yArray.filter((val): val is number =>
    typeof val === "number" && !isNaN(val)
  );

  const result = method === "pearson"
    ? pearsonTest({ x: cleanX, y: cleanY, alternative, alpha })
    : spearmanTest({ x: cleanX, y: cleanY, alternative, alpha });

  return {
    test_statistic: result.test_statistic!,
    p_value: result.p_value!,
    correlation: result.correlation!,
    confidence_interval_lower: result.confidence_interval_lower!,
    confidence_interval_upper: result.confidence_interval_upper!,
    confidence_level: result.confidence_level!,
    test_type: result.test_type,
    test_name: result.test_name,
    alpha: alpha,
    error_message: result.error_message,
  };
}

/**
 * Compare the distributions of two independent groups.
 * 
 * Tests whether two samples come from the same distribution using the
 * Mann-Whitney U test (equivalent to testing for stochastic dominance).
 * 
 * Assumptions:
 * - Samples are independent
 * - Data is continuous or ordinal
 * - Under null hypothesis: distributions are identical
 * - Alternative: one distribution is stochastically larger/smaller
 * 
 * @param x - First group's values
 * @param y - Second group's values
 * @param alternative - Direction of the test ("two-sided", "less", "greater")
 * @param alpha - Significance level (default: 0.05)
 * @returns Mann-Whitney U statistic, p-value, and effect size
 */
export function distributionsToEachOther({
  x,
  y,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  y:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): MannWhitneyTestResult {
  // Convert data to regular arrays and filter out null/undefined values
  const xArray = Array.isArray(x) ? x : Array.from(x);
  const yArray = Array.isArray(y) ? y : Array.from(y);
  const cleanX = xArray.filter((val): val is number =>
    typeof val === "number" && !isNaN(val)
  );
  const cleanY = yArray.filter((val): val is number =>
    typeof val === "number" && !isNaN(val)
  );

  // Using Mann-Whitney as a distribution comparison test
  // This tests if the distributions are different
  const result = mannWhitneyTest({
    x: cleanX,
    y: cleanY,
    exact: false,
    continuityCorrection: true,
    alternative,
    alpha,
  });
  return {
    test_statistic: result.test_statistic!,
    p_value: result.p_value!,
    u_statistic: result.u_statistic!,
    effect_size: result.effect_size ?? 0, // Ensure effect_size is always present
    test_type: result.test_type,
    test_name: result.test_name,
    alpha: alpha,
    error_message: result.error_message,
  };
}

// Export the two-groups test functions as a namespace
export const twoGroups = {
  centralTendency: {
    toEachOther: centralTendencyToEachOther,
  },
  proportions: {
    toEachOther: proportionsToEachOther,
  },
  association: {
    toEachOther: associationToEachOther,
  },
  distributions: {
    toEachOther: distributionsToEachOther,
  },
};
