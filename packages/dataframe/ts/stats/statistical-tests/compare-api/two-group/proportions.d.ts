import type { ChiSquareIndependenceTestResult, FishersExactTestResult, TwoSampleProportionTestResult } from "../../types.ts";
import type { PrettifyDeep } from "../../../../dataframe/types/utility-types.ts";
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
export declare function proportionsToEachOther({ data1, data2, comparator, useChiSquare, alpha, }: {
    data1: boolean[] | readonly boolean[];
    data2: boolean[] | readonly boolean[];
    comparator?: "not equal to" | "less than" | "greater than";
    useChiSquare: false;
    alpha?: number;
}): PrettifyDeep<TwoSampleProportionTestResult>;
export declare function proportionsToEachOther({ data1, data2, comparator, useChiSquare, alpha, }: {
    data1: boolean[] | readonly boolean[];
    data2: boolean[] | readonly boolean[];
    comparator?: "not equal to" | "less than" | "greater than";
    useChiSquare: true;
    alpha?: number;
}): PrettifyDeep<ChiSquareIndependenceTestResult>;
export declare function proportionsToEachOther({ data1, data2, comparator, useChiSquare, alpha, }: {
    data1: boolean[] | readonly boolean[];
    data2: boolean[] | readonly boolean[];
    comparator?: "not equal to" | "less than" | "greater than";
    useChiSquare: "fisher";
    alpha?: number;
}): PrettifyDeep<FishersExactTestResult>;
export declare function proportionsToEachOther({ data1, data2, comparator, useChiSquare, alpha, }: {
    data1: boolean[] | readonly boolean[];
    data2: boolean[] | readonly boolean[];
    comparator?: "not equal to" | "less than" | "greater than";
    useChiSquare?: boolean | "auto" | "fisher";
    alpha?: number;
}): PrettifyDeep<TwoSampleProportionTestResult | ChiSquareIndependenceTestResult | FishersExactTestResult>;
