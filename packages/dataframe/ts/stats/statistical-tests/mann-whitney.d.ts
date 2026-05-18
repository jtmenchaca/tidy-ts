import type { MannWhitneyTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";
/**
 * Mann-Whitney U test (Wilcoxon rank-sum) for non-parametric comparison
 */
export declare function mannWhitneyTest({ x, y, exact, continuityCorrection, alternative, alpha, }: {
    x: number[];
    y: number[];
    exact?: boolean;
    continuityCorrection?: boolean;
    alternative?: "two-sided" | "less" | "greater";
    alpha?: number;
}): PrettifyDeep<MannWhitneyTestResult>;
