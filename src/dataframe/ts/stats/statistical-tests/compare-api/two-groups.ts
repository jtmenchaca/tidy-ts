import { tTestIndependent } from "../t-tests.ts";
import { mannWhitneyTest } from "../mann-whitney.ts";
import { proportionTestTwoSample } from "../proportion-tests.ts";
import { chiSquareTest } from "../chi-square.ts";
import { fishersExactTest } from "../fishers-exact.ts";
import {
  kendallTest,
  pearsonTest,
  spearmanTest,
} from "../correlation-tests.ts";
import type {
  ParametricChoice,
} from "../types.ts";
import type {
  ChiSquareIndependenceTestResult,
  PearsonCorrelationTestResult,
  SpearmanCorrelationTestResult,
  KendallCorrelationTestResult,
  FishersExactTestResult,
  MannWhitneyTestResult,
  TwoSampleProportionTestResult,
  TwoSampleTTestResult,
} from "../../../../lib/tidy_ts_dataframe.internal.js";
import type {
  NumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../helpers.ts";
import {
  cleanNumeric,
  hasManyTies,
  isNonNormal,
  smallSample2,
  to01,
} from "./helpers.ts";

// Legacy helper functions - use helpers.ts versions for new code
const toBinary = to01;

/**
 * Compare the central tendencies of two independent groups.
 *
 * Tests whether two groups differ in their central tendency using either
 * parametric (t-test) or non-parametric (Mann-Whitney U) methods.
 *
 * Assumptions:
 * - Samples are independent and randomly drawn
 * - For parametric: Data in each group is approximately normally distributed
 * - For parametric: Uses Welch's t-test by default (set `equalVar: true` for Student's t-test)
 * - For non-parametric: Tests stochastic dominance (whether one distribution tends to have larger values)
 *   Note: Only tests medians specifically when distributions have the same shape
 * - Auto mode: Defaults to t-test; switches to Mann-Whitney only if both groups show clear non-normality (p < 0.01)
 *
 * @param x - First group's values
 * @param y - Second group's values
 * @param parametric - Use t-test (true), Mann-Whitney U test (false), or "auto" (default: "auto")
 * @param equalVar - Assume equal variances for t-test (default: false for Welch's test)
 * @param alternative - Direction of the test ("two-sided", "less", "greater"), where "greater" means x > y
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
  parametric: "parametric";
  equalVar?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): TwoSampleTTestResult;

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
  parametric: "nonparametric";
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
  parametric?: ParametricChoice;
  equalVar?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): TwoSampleTTestResult | MannWhitneyTestResult;

export function centralTendencyToEachOther({
  x,
  y,
  parametric = "auto",
  equalVar = false,
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
  parametric?: ParametricChoice;
  equalVar?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): TwoSampleTTestResult | MannWhitneyTestResult {
  // Convert data to regular arrays and filter out null/undefined/infinite values
  const cleanX = cleanNumeric(x);
  const cleanY = cleanNumeric(y);

  // ============================================================================
  // DECISION TREE: Two Groups Central Tendency to Each Other
  // ============================================================================
  // Decision logic from pseudocode:
  // 1. If parametric = "auto" (default):
  //    a. Can we test normality for both groups? (n >= 3 && n <= 5000)
  //       - YES: Run Shapiro-Wilk on both groups
  //         - Both groups normal (p > 0.05) → Use t-test (Welch by default)
  //         - Both groups non-normal (p ≤ 0.05) → Use Mann-Whitney U
  //         - Mixed results → Use t-test (robust to mild non-normality)
  //       - NO: Default to t-test (t-tests are robust to mild non-normality)
  // 2. If parametric = "parametric": Use t-test (Welch by default)
  // 3. If parametric = "nonparametric": Use Mann-Whitney U
  // 4. For Mann-Whitney: Use exact test if small samples (n ≤ 8) and no ties
  // ============================================================================

  // Determine whether to use parametric test
  let useParametric: boolean;
  if (parametric === "auto") {
    // Default to t-test; switch to Mann-Whitney only if both groups show non-normality
    // T-tests are robust to mild non-normality
    const normalityThreshold = 0.05; // Standard threshold for normality testing
    const xNonNormal = isNonNormal(cleanX, normalityThreshold);
    const yNonNormal = isNonNormal(cleanY, normalityThreshold);

    useParametric = !(xNonNormal && yNonNormal);
  } else {
    useParametric = parametric === "parametric";
  }

  if (useParametric) {
    // Use independent samples t-test for parametric data
    return tTestIndependent({
      x: cleanX,
      y: cleanY,
      equalVar,
      alternative,
      alpha,
    });
  } else {
    // Use Mann-Whitney U test for non-parametric data
    // Use exact test for small samples without ties
    const useExact = smallSample2(cleanX, cleanY) &&
      !hasManyTies(cleanX, cleanY);

    return mannWhitneyTest({
      x: cleanX,
      y: cleanY,
      exact: useExact,
      continuityCorrection: true,
      alternative,
      alpha,
    });
  }
}

/**
 * Compare proportions between two independent groups.
 *
 * Tests whether the proportion of successes differs between two groups using
 * z-test, chi-squared test, or Fisher's exact test.
 *
 * Assumptions:
 * - Samples are independent between and within groups
 * - For z-test: Large samples (np ≥ 5 and n(1-p) ≥ 5)
 * - For chi-squared: Expected frequency ≥ 5 in all cells
 * - For Fisher's exact: No assumptions (works for any 2x2 table)
 * - Auto mode: Uses Fisher's exact if any expected < 5, else chi-squared
 *
 * @param data1 - First group's binary data (0/1 or boolean)
 * @param data2 - Second group's binary data (0/1 or boolean)
 * @param useChiSquare - Test selection: false (z-test), true (chi-squared), "auto", or "fisher"
 * @param alternative - Direction for tests ("two-sided", "less", "greater")
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
  data1: boolean[] | readonly boolean[];
  data2: boolean[] | readonly boolean[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  useChiSquare: false;
}): TwoSampleProportionTestResult;

export function proportionsToEachOther({
  data1,
  data2,
  alternative,
  alpha,
  useChiSquare,
}: {
  data1: boolean[] | readonly boolean[];
  data2: boolean[] | readonly boolean[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  useChiSquare: true;
}): ChiSquareIndependenceTestResult;

export function proportionsToEachOther({
  data1,
  data2,
  alternative,
  alpha,
  useChiSquare,
}: {
  data1: boolean[] | readonly boolean[];
  data2: boolean[] | readonly boolean[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  useChiSquare: "fisher";
}): FishersExactTestResult;

export function proportionsToEachOther({
  data1,
  data2,
  alternative,
  alpha,
  useChiSquare,
}: {
  data1: boolean[] | readonly boolean[];
  data2: boolean[] | readonly boolean[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  useChiSquare?: boolean | "auto" | "fisher";
}): TwoSampleProportionTestResult | ChiSquareIndependenceTestResult | FishersExactTestResult;

export function proportionsToEachOther({
  data1,
  data2,
  alternative = "two-sided",
  alpha = 0.05,
  useChiSquare = "auto",
}: {
  data1: boolean[] | readonly boolean[];
  data2: boolean[] | readonly boolean[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  useChiSquare?: boolean | "auto" | "fisher";
}): TwoSampleProportionTestResult | ChiSquareIndependenceTestResult | FishersExactTestResult {
  // Convert boolean arrays to numeric (0/1) for calculations
  const numericData1 = data1.map(toBinary);
  const numericData2 = data2.map(toBinary);

  // Calculate successes and sample sizes
  const successes1 = numericData1.reduce((sum, x) => sum + x, 0 as number);
  const successes2 = numericData2.reduce((sum, x) => sum + x, 0 as number);
  const n1 = numericData1.length;
  const n2 = numericData2.length;
  const contingencyTable = [
    [successes1, n1 - successes1],
    [successes2, n2 - successes2],
  ];

  // ============================================================================
  // DECISION TREE: Two Groups Proportions to Each Other
  // ============================================================================
  // Decision logic from pseudocode:
  // 1. If useChiSquare = "fisher": Use Fisher's exact test
  // 2. If useChiSquare = "chi-squared": Use chi-squared test
  // 3. If useChiSquare = "z-test": Use two-proportion z-test
  // 4. If useChiSquare = "auto" (default):
  //    a. Calculate expected frequencies for 2x2 table
  //    b. Apply Cochran's rule:
  //       - If min expected < 1 OR >20% of cells < 5 → Fisher's exact
  //       - Otherwise → chi-squared test
  // 5. For z-test: Validate np ≥ 5 and n(1-p) ≥ 5 in each group
  // ============================================================================

  // Determine which test to use
  let testMethod: "z-test" | "chi-squared" | "fisher";
  if (useChiSquare === "fisher") {
    testMethod = "fisher";
  } else if (useChiSquare === "auto") {
    // Calculate expected frequencies for chi-squared test
    const total = n1 + n2;
    const totalSuccesses = successes1 + successes2;
    const totalFailures = total - totalSuccesses;

    const expected = [
      [(totalSuccesses * n1) / total, (totalFailures * n1) / total],
      [(totalSuccesses * n2) / total, (totalFailures * n2) / total],
    ];

    // Use Cochran's rule: Fisher's exact if min expected < 1 or >20% of cells < 5
    const exps = expected.flat();
    const pctLt5 = exps.filter((e) => e < 5).length / exps.length;
    const minExp = Math.min(...exps);
    testMethod = (minExp < 1 || pctLt5 > 0.20) ? "fisher" : "chi-squared";
  } else if (useChiSquare === true) {
    testMethod = "chi-squared";
  } else {
    testMethod = "z-test";
  }

  if (testMethod === "fisher") {
    // Use Fisher's exact test for small samples
    return fishersExactTest({
      contingencyTable,
      alternative,
      alpha,
    });
  } else if (testMethod === "chi-squared") {
    // Use chi-squared test for larger samples
    return chiSquareTest({
      contingencyTable,
      alpha,
    });
  } else {
    // Use two-proportion z-test - validate sample sizes
    const np1 = successes1, nq1 = n1 - successes1;
    const np2 = successes2, nq2 = n2 - successes2;
    const minCount = Math.min(np1, nq1, np2, nq2);
    if (minCount < 5) {
      throw new Error(
        "Two-proportion z-test requires np and n(1-p) ≥ 5 in each group. Set useChiSquare: true to use chi-square test, or omit it to auto-select based on sample size",
      );
    }

    return proportionTestTwoSample({
      data1: numericData1.map((x) => Boolean(x)),
      data2: numericData2.map((x) => Boolean(x)),
      pooled: true,
      alternative,
      alpha,
    });
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
 * @param method - Correlation method ("pearson", "spearman", "kendall", or "auto")
 * @param alternative - Test direction ("two-sided", "less", "greater")
 * @param alpha - Significance level (default: 0.05)
 * @returns Correlation coefficient, test statistic, p-value, and confidence intervals
 */
// Overloads for point-biserial (one boolean, one numeric)
export function associationToEachOther({
  x,
  y,
  method,
  alternative,
  alpha,
}: {
  x: readonly boolean[];
  y:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  method?: "pearson" | "auto";
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PearsonCorrelationTestResult;

export function associationToEachOther({
  x,
  y,
  method,
  alternative,
  alpha,
}: {
  x:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  y: readonly boolean[];
  method?: "pearson" | "auto";
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PearsonCorrelationTestResult;

// Standard numeric correlation
export function associationToEachOther({
  x,
  y,
  method,
  alternative,
  alpha,
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
  method?: "pearson" | "spearman" | "kendall" | "auto";
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PearsonCorrelationTestResult | SpearmanCorrelationTestResult | KendallCorrelationTestResult;

export function associationToEachOther({
  x,
  y,
  method = "auto",
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x:
    | readonly number[]
    | readonly boolean[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  y:
    | readonly number[]
    | readonly boolean[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  method?: "pearson" | "spearman" | "kendall" | "auto";
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PearsonCorrelationTestResult | SpearmanCorrelationTestResult | KendallCorrelationTestResult {
  // Type-safe data handling
  const xIsBinary = Array.isArray(x) && x.length > 0 &&
    typeof x[0] === "boolean";
  const yIsBinary = Array.isArray(y) && y.length > 0 &&
    typeof y[0] === "boolean";

  let selectedMethod = method;

  if (method === "auto") {
    // Point-biserial: One binary + one numeric
    if (xIsBinary !== yIsBinary) {
      selectedMethod = "pearson";
    } else if (!xIsBinary && !yIsBinary) {
      // Both numeric - clean and test for normality/ties
      const cleanX = cleanNumeric(x as readonly number[]);
      const cleanY = cleanNumeric(y as readonly number[]);

      const smallSample = Math.min(cleanX.length, cleanY.length) < 25;
      
      if (hasManyTies(cleanX, cleanY) || smallSample) {
        selectedMethod = "kendall";
      } else {
        const xNonNormal = isNonNormal(cleanX);
        const yNonNormal = isNonNormal(cleanY);

        if (xNonNormal || yNonNormal) {
          selectedMethod = "spearman";
        } else {
          selectedMethod = "pearson";
        }
      }
    } else {
      // Both binary - use Pearson (phi coefficient)
      selectedMethod = "pearson";
    }
  }

  // Prepare clean data based on types
  let cleanX: number[], cleanY: number[];

  if (xIsBinary && !yIsBinary) {
    // x is boolean, y is numeric
    cleanX = (x as unknown as readonly boolean[]).map((v) => v ? 1 : 0);
    cleanY = cleanNumeric(y as unknown as readonly number[]);
  } else if (!xIsBinary && yIsBinary) {
    // x is numeric, y is boolean
    cleanX = cleanNumeric(x as unknown as readonly number[]);
    cleanY = (y as unknown as readonly boolean[]).map((v) => v ? 1 : 0);
  } else if (xIsBinary && yIsBinary) {
    // Both boolean
    cleanX = (x as unknown as readonly boolean[]).map((v) => v ? 1 : 0);
    cleanY = (y as unknown as readonly boolean[]).map((v) => v ? 1 : 0);
  } else {
    // Both numeric
    cleanX = cleanNumeric(x as unknown as readonly number[]);
    cleanY = cleanNumeric(y as unknown as readonly number[]);
  }

  // Call the appropriate test
  let rawResult: PearsonCorrelationTestResult | SpearmanCorrelationTestResult | KendallCorrelationTestResult;
  switch (selectedMethod) {
    case "pearson":
      rawResult = pearsonTest({ x: cleanX, y: cleanY, alternative, alpha });
      break;
    case "spearman":
      rawResult = spearmanTest({ x: cleanX, y: cleanY, alternative, alpha });
      break;
    case "kendall":
      rawResult = kendallTest({ x: cleanX, y: cleanY, alternative, alpha });
      break;
    default:
      throw new Error(`Unknown correlation method: ${selectedMethod}`);
  }

  return rawResult;
}

/**
 * Compare the distributions of two independent groups.
 *
 * Tests for stochastic dominance between two samples using the Mann-Whitney U test.
 * This tests whether values from one group tend to be larger than values from the other.
 *
 * Assumptions:
 * - Samples are independent
 * - Data is continuous or ordinal
 * - Null hypothesis: P(X > Y) = 0.5 (no stochastic dominance)
 * - Alternative: One distribution stochastically dominates the other
 *
 * Note: This tests the broader hypothesis of stochastic dominance, not just median differences.
 * Only when distributions have identical shapes does it specifically test median differences.
 *
 * @param x - First group's values
 * @param y - Second group's values
 * @param alternative - Direction of the test ("two-sided", "less", "greater"), where "greater" means x > y
 * @param alpha - Significance level (default: 0.05)
 * @returns Mann-Whitney U statistic, p-value, and effect size (rank-biserial correlation)
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
  // Convert data to regular arrays and filter out null/undefined/infinite values
  const cleanX = cleanNumeric(x);
  const cleanY = cleanNumeric(y);

  // ============================================================================
  // DECISION TREE: Two Groups Distributions to Each Other
  // ============================================================================
  // Decision logic from pseudocode:
  // 1. Use Mann-Whitney U test for distribution comparison (stochastic dominance)
  // 2. Test hypothesis: P(X > Y) = 0.5 (no stochastic dominance)
  // 3. Use exact test if:
  //    - Small samples (min(n1, n2) ≤ 8) AND
  //    - No ties in the data
  // 4. Otherwise use normal approximation with continuity correction
  // 5. Note: Tests broader hypothesis than just median differences
  // ============================================================================

  // Using Mann-Whitney as a distribution comparison test
  // This tests if the distributions are different
  const useExact = smallSample2(cleanX, cleanY) && !hasManyTies(cleanX, cleanY);

  return mannWhitneyTest({
    x: cleanX,
    y: cleanY,
    exact: useExact,
    continuityCorrection: true,
    alternative,
    alpha,
  });
}

// ============================================================================
// TODO: MISSING FEATURES FROM PSEUDOCODE
// ============================================================================
// 1. ADVANCED ASSOCIATION LOGIC
//    - Add automatic method selection to associationToEachOther
//    - Detect binary vs numeric data automatically
//    - Point-biserial correlation for binary + numeric data
//    - Kendall's tau for small samples (n < 25) or many ties
//    - Spearman for non-normal data (based on Shapiro-Wilk)
//    - Pearson for normal data
//    - Add method: "auto" option alongside "pearson" | "spearman"
//
// 2. UTILITY HELPER FUNCTIONS
//    - Add cleanNumeric() function
//    - Add isBinaryArray() function
//    - Add hasManyTies() function
//    - Add smallSample2() function
//    - Add expectedCounts2x2() function
//    - Add chooseAlt() and chooseAlpha() functions
// ============================================================================

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
