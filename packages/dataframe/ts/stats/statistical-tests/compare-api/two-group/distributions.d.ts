import type { KolmogorovSmirnovTestResult, MannWhitneyTestResult } from "../../types.ts";
import type { PrettifyDeep } from "../../../../dataframe/types/utility-types.ts";
import type { NumberIterable, NumbersWithNullable, NumbersWithNullableIterable } from "../../../helpers.ts";
/**
 * Compare the distributions of two independent groups.
 *
 * Can test either:
 * - Kolmogorov-Smirnov: Tests if two samples come from the same distribution (any difference)
 * - Mann-Whitney U: Tests if one distribution tends to be larger (stochastic dominance)
 *
 * @param x - First group's values
 * @param y - Second group's values
 * @param comparator - Direction of the test ("not equal to", "less than", "greater than")
 * @param method - Test method: "ks" (distribution equality), "mann-whitney" (stochastic dominance), or "auto" (defaults to KS)
 * @param alpha - Significance level (default: 0.05)
 * @returns Test result with appropriate statistic and properties
 */
export declare function distributionsToEachOther({ x, y, comparator, method, alpha, }: {
    x: readonly number[] | NumberIterable | NumbersWithNullable | NumbersWithNullableIterable;
    y: readonly number[] | NumberIterable | NumbersWithNullable | NumbersWithNullableIterable;
    comparator?: "not equal to" | "less than" | "greater than";
    method?: "auto" | "ks" | "mann-whitney";
    alpha?: number;
}): PrettifyDeep<MannWhitneyTestResult | KolmogorovSmirnovTestResult>;
export declare function distributionsToEachOther({ x, y, comparator, method, alpha, }: {
    x: readonly number[] | NumberIterable | NumbersWithNullable | NumbersWithNullableIterable;
    y: readonly number[] | NumberIterable | NumbersWithNullable | NumbersWithNullableIterable;
    comparator?: "not equal to" | "less than" | "greater than";
    method: "ks";
    alpha?: number;
}): PrettifyDeep<KolmogorovSmirnovTestResult>;
export declare function distributionsToEachOther({ x, y, comparator, method, alpha, }: {
    x: readonly number[] | NumberIterable | NumbersWithNullable | NumbersWithNullableIterable;
    y: readonly number[] | NumberIterable | NumbersWithNullable | NumbersWithNullableIterable;
    comparator?: "not equal to" | "less than" | "greater than";
    method: "mann-whitney";
    alpha?: number;
}): PrettifyDeep<MannWhitneyTestResult>;
