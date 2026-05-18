/**
 * Proportion Tests
 *
 * This module provides functions for performing proportion tests using WASM implementations.
 */
import type { OneSampleProportionTestResult, TwoSampleProportionTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";
export type { OneSampleProportionTestResult, TwoSampleProportionTestResult, } from "./types.ts";
/**
 * One-sample proportion test (WASM implementation)
 */
export declare function proportionTestOneSample({ data, hypothesizedProportion, alternative, alpha, }: {
    data: boolean[];
    hypothesizedProportion: number;
    alternative?: "two-sided" | "less" | "greater";
    alpha?: number;
}): PrettifyDeep<OneSampleProportionTestResult>;
/**
 * Two-sample proportion test (WASM implementation)
 */
export declare function proportionTestTwoSample({ data1, data2, pooled, alternative, alpha, }: {
    data1: boolean[];
    data2: boolean[];
    pooled?: boolean;
    alternative?: "two-sided" | "less" | "greater";
    alpha?: number;
}): PrettifyDeep<TwoSampleProportionTestResult>;
