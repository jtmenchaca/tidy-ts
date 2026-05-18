import type { SpearmanCorrelationTestResult } from "../types.ts";
import type { PrettifyDeep } from "../../../dataframe/types/utility-types.ts";
/**
 * Spearman rank correlation test
 */
export declare function spearmanTest({ x, y, alternative, alpha, }: {
    x: number[];
    y: number[];
    alternative?: "two-sided" | "less" | "greater";
    alpha?: number;
}): PrettifyDeep<SpearmanCorrelationTestResult>;
