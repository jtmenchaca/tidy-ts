import type { KendallCorrelationTestResult } from "../types.ts";
import type { PrettifyDeep } from "../../../dataframe/types/utility-types.ts";
/**
 * Kendall rank correlation test
 */
export declare function kendallTest({ x, y, alternative, alpha, exact, }: {
    x: number[];
    y: number[];
    alternative?: "two-sided" | "less" | "greater";
    alpha?: number;
    exact?: boolean;
}): PrettifyDeep<KendallCorrelationTestResult>;
