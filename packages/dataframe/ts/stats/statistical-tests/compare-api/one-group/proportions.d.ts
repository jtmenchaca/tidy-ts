import type { OneSampleProportionTestResult } from "../../types.ts";
import type { PrettifyDeep } from "../../../../dataframe/types/utility-types.ts";
/**
 * Test if a sample proportion differs from a hypothesized population proportion.
 *
 * Compares the proportion of successes in a binary sample against an expected proportion,
 * using the one-sample proportion z-test.
 *
 * Assumptions:
 * - Sample is randomly drawn from the population
 * - Observations are independent
 * - Sample size is large enough (np ≥ 5 and n(1-p) ≥ 5)
 *
 * @param data - Binary data (0/1 or boolean values)
 * @param comparator - Direction of the test ("not equal to", "less than", "greater than")
 * @param popProportion - Hypothesized population proportion (default: 0.5)
 * @param alpha - Significance level (default: 0.05)
 * @returns Test results with z-statistic, p-value, and confidence intervals
 */
export declare function proportionsToValue({ data, comparator, hypothesizedProportion, alpha, }: {
    data: boolean[] | readonly boolean[];
    comparator: "not equal to" | "less than" | "greater than";
    hypothesizedProportion: number;
    alpha?: number;
}): PrettifyDeep<OneSampleProportionTestResult>;
