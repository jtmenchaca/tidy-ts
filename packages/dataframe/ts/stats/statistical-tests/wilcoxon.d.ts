import type { WilcoxonSignedRankTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";
export type { WilcoxonSignedRankTestResult } from "./types.ts";
/**
 * Wilcoxon signed-rank test for paired data
 */
export declare function wilcoxonSignedRankTest({ x, y, alternative, alpha, }: {
    x: number[];
    y: number[];
    alternative?: "two-sided" | "less" | "greater";
    alpha?: number;
}): PrettifyDeep<WilcoxonSignedRankTestResult>;
