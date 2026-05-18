import type { ChiSquareIndependenceTestResult, ChiSquareGoodnessOfFitTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";
/**
 * Chi-square test of independence for categorical data
 */
export declare function chiSquareTest({ contingencyTable, alpha, }: {
    contingencyTable: number[][];
    alpha?: number;
}): PrettifyDeep<ChiSquareIndependenceTestResult>;
/**
 * Chi-square goodness-of-fit test
 */
export declare function chiSquareGoodnessOfFitTest({ observed, expected, alpha, }: {
    observed: number[];
    expected: number[];
    alpha?: number;
}): PrettifyDeep<ChiSquareGoodnessOfFitTestResult>;
