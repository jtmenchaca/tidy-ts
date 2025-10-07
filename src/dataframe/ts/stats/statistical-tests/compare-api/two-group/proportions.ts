import { proportionTestTwoSample } from "../../proportion-tests.ts";
import { chiSquareTest } from "../../chi-square.ts";
import { fishersExactTest } from "../../fishers-exact.ts";
import type {
  ChiSquareIndependenceTestResult,
  FishersExactTestResult,
  TwoSampleProportionTestResult,
} from "../../../../../lib/tidy_ts_dataframe.d.ts";
import { to01 } from "../helpers.ts";

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
 * @param comparator - Direction for tests ("not equal to", "less than", "greater than")
 * @param useChiSquare - Test selection: false (z-test), true (chi-squared), "auto", or "fisher"
 * @param alpha - Significance level (default: 0.05)
 * @returns Test results with statistic, p-value, and effect size measures
 */
export function proportionsToEachOther({
  data1,
  data2,
  comparator,
  useChiSquare,
  alpha,
}: {
  data1: boolean[] | readonly boolean[];
  data2: boolean[] | readonly boolean[];
  comparator?: "not equal to" | "less than" | "greater than";
  useChiSquare: false;
  alpha?: number;
}): TwoSampleProportionTestResult;

export function proportionsToEachOther({
  data1,
  data2,
  comparator,
  useChiSquare,
  alpha,
}: {
  data1: boolean[] | readonly boolean[];
  data2: boolean[] | readonly boolean[];
  comparator?: "not equal to" | "less than" | "greater than";
  useChiSquare: true;
  alpha?: number;
}): ChiSquareIndependenceTestResult;

export function proportionsToEachOther({
  data1,
  data2,
  comparator,
  useChiSquare,
  alpha,
}: {
  data1: boolean[] | readonly boolean[];
  data2: boolean[] | readonly boolean[];
  comparator?: "not equal to" | "less than" | "greater than";
  useChiSquare: "fisher";
  alpha?: number;
}): FishersExactTestResult;

export function proportionsToEachOther({
  data1,
  data2,
  comparator,
  useChiSquare,
  alpha,
}: {
  data1: boolean[] | readonly boolean[];
  data2: boolean[] | readonly boolean[];
  comparator?: "not equal to" | "less than" | "greater than";
  useChiSquare?: boolean | "auto" | "fisher";
  alpha?: number;
}):
  | TwoSampleProportionTestResult
  | ChiSquareIndependenceTestResult
  | FishersExactTestResult;

export function proportionsToEachOther({
  data1,
  data2,
  comparator = "not equal to",
  useChiSquare = "auto",
  alpha = 0.05,
}: {
  data1: boolean[] | readonly boolean[];
  data2: boolean[] | readonly boolean[];
  comparator?: "not equal to" | "less than" | "greater than";
  useChiSquare?: boolean | "auto" | "fisher";
  alpha?: number;
}):
  | TwoSampleProportionTestResult
  | ChiSquareIndependenceTestResult
  | FishersExactTestResult {
  // Map comparator to alternative parameter for underlying functions
  const alternative = comparator === "not equal to"
    ? "two-sided"
    : comparator === "less than"
    ? "less"
    : "greater";

  // Convert boolean arrays to numeric (0/1) for calculations
  const numericData1 = data1.map(to01);
  const numericData2 = data2.map(to01);

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
