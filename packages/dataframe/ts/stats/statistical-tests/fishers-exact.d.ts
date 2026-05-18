import type { FishersExactTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";
/**
 * Fisher's exact test for 2x2 contingency tables.
 *
 * Note: Both pValue and exactPValue are provided by WASM and contain identical values
 * since Fisher's exact test always computes exact p-values (no asymptotic approximation).
 */
export declare function fishersExactTest({ contingencyTable, alternative, oddsRatio, alpha, }: {
    contingencyTable: number[][];
    alternative?: "two-sided" | "less" | "greater";
    oddsRatio?: number;
    alpha?: number;
}): PrettifyDeep<FishersExactTestResult>;
