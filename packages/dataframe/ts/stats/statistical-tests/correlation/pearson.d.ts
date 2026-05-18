import type { PearsonCorrelationTestResult } from "../types.ts";
import type { PrettifyDeep } from "../../../dataframe/types/utility-types.ts";
/**
 * Pearson correlation test
 */
export declare function pearsonTest({ x, y, alternative, alpha, }: {
    x: number[];
    y: number[];
    alternative?: "two-sided" | "less" | "greater";
    alpha?: number;
}): PrettifyDeep<PearsonCorrelationTestResult>;
