import type { OneSampleZTestResult, TwoSampleZTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";
export type { OneSampleZTestResult, TwoSampleZTestResult, } from "./types.ts";
/**
 * One-sample Z-test for means (WASM implementation)
 */
export declare function zTestOneSample({ data, popMean, popStd, alternative, alpha, }: {
    data: number[];
    popMean: number;
    popStd: number;
    alternative?: "two-sided" | "less" | "greater";
    alpha?: number;
}): PrettifyDeep<OneSampleZTestResult>;
/**
 * Two-sample Z-test for means (WASM implementation)
 */
export declare function zTestTwoSample({ data1, data2, popStd1, popStd2, alternative, alpha, }: {
    data1: number[];
    data2: number[];
    popStd1: number;
    popStd2: number;
    alternative?: "two-sided" | "less" | "greater";
    alpha?: number;
}): PrettifyDeep<TwoSampleZTestResult>;
