import type { KendallCorrelationTestResult, PearsonCorrelationTestResult, SpearmanCorrelationTestResult } from "../../types.ts";
import type { PrettifyDeep } from "../../../../dataframe/types/utility-types.ts";
import type { NumberIterable, NumbersWithNullable, NumbersWithNullableIterable } from "../../../helpers.ts";
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
 * @param comparator - Test direction ("not equal to", "less than", "greater than")
 * @param method - Correlation method ("pearson", "spearman", "kendall", or "auto")
 * @param alpha - Significance level (default: 0.05)
 * @returns Correlation coefficient, test statistic, p-value, and confidence intervals
 */
export declare function associationToEachOther({ x, y, comparator, method, alpha, }: {
    x: readonly boolean[];
    y: readonly number[] | NumberIterable | NumbersWithNullable | NumbersWithNullableIterable;
    comparator?: "not equal to" | "less than" | "greater than";
    method?: "pearson" | "auto";
    alpha?: number;
}): PrettifyDeep<PearsonCorrelationTestResult>;
export declare function associationToEachOther({ x, y, comparator, method, alpha, }: {
    x: readonly number[] | NumberIterable | NumbersWithNullable | NumbersWithNullableIterable;
    y: readonly boolean[];
    comparator?: "not equal to" | "less than" | "greater than";
    method?: "pearson" | "auto";
    alpha?: number;
}): PrettifyDeep<PearsonCorrelationTestResult>;
export declare function associationToEachOther({ x, y, comparator, method, alpha, }: {
    x: readonly number[] | NumberIterable | NumbersWithNullable | NumbersWithNullableIterable;
    y: readonly number[] | NumberIterable | NumbersWithNullable | NumbersWithNullableIterable;
    comparator?: "not equal to" | "less than" | "greater than";
    method?: "pearson" | "spearman" | "kendall" | "auto";
    alpha?: number;
}): PrettifyDeep<PearsonCorrelationTestResult | SpearmanCorrelationTestResult | KendallCorrelationTestResult>;
