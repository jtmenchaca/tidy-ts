import type { ShapiroWilkTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";
export type { ShapiroWilkTestResult } from "./types.ts";
/**
 * Test for normality using Shapiro-Wilk test
 */
export declare function shapiroWilkTest({ data, alpha, }: {
    data: number[];
    alpha?: number;
}): PrettifyDeep<ShapiroWilkTestResult>;
