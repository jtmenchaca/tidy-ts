import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Chi-squared distribution density function
 * @param at - Point where density is evaluated
 * @param degreesOfFreedom - Degrees of freedom (> 0)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export declare function dchisq({ at, degreesOfFreedom, returnLog, }: {
    at: number;
    degreesOfFreedom: number;
    returnLog?: boolean;
}): number;
/**
 * Chi-squared distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param degreesOfFreedom - Degrees of freedom (> 0)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function pchisq({ at, degreesOfFreedom, direction, returnLog, }: {
    at: number;
    degreesOfFreedom: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * Chi-squared distribution quantile function
 * @param probability - Probability value (0..1)
 * @param degreesOfFreedom - Degrees of freedom (> 0)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qchisq({ probability, degreesOfFreedom, direction, probabilityIsLog, }: {
    probability: number;
    degreesOfFreedom: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * Chi-squared distribution random number generation
 * @param degreesOfFreedom - Degrees of freedom (> 0)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the chi-squared distribution
 */
export declare function rchisq({ degreesOfFreedom, }: {
    degreesOfFreedom: number;
}): number;
export declare function rchisq({ degreesOfFreedom, sampleSize, }: {
    degreesOfFreedom: number;
    sampleSize: number;
}): number[];
/**
 * Generate data for Chi-square distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export declare function chiSquareData({ degreesOfFreedom, type, range, points, }: {
    degreesOfFreedom: number;
    type: "pdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    density: number;
}>;
export declare function chiSquareData({ degreesOfFreedom, type, range, points, }: {
    degreesOfFreedom: number;
    type: "cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    probability: number;
}>;
export declare function chiSquareData({ degreesOfFreedom, type, range, points, }: {
    degreesOfFreedom: number;
    type: "inverse_cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    probability: number;
    quantile: number;
}>;
