import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Weibull distribution density function
 * @param at - Point where density is evaluated
 * @param shape - Shape parameter (k > 0)
 * @param scale - Scale parameter (λ > 0, default: 1)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export declare function dweibull({ at, shape, scale, returnLog, }: {
    at: number;
    shape: number;
    scale?: number;
    returnLog?: boolean;
}): number;
/**
 * Weibull distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param shape - Shape parameter (k > 0)
 * @param scale - Scale parameter (λ > 0, default: 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function pweibull({ at, shape, scale, direction, returnLog, }: {
    at: number;
    shape: number;
    scale?: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * Weibull distribution quantile function
 * @param probability - Probability value (0..1)
 * @param shape - Shape parameter (k > 0)
 * @param scale - Scale parameter (λ > 0, default: 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qweibull({ probability, shape, scale, direction, probabilityIsLog, }: {
    probability: number;
    shape: number;
    scale?: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * Weibull distribution random number generation
 * @param shape - Shape parameter (k > 0)
 * @param scale - Scale parameter (λ > 0, default: 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the Weibull distribution
 */
export declare function rweibull({ shape, scale, }: {
    shape: number;
    scale?: number;
}): number;
export declare function rweibull({ shape, scale, sampleSize, }: {
    shape: number;
    scale?: number;
    sampleSize: number;
}): number[];
/**
 * Generate data for Weibull distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export declare function weibullData({ shape, scale, type, range, points, }: {
    shape: number;
    scale: number;
    type: "pdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    density: number;
}>;
export declare function weibullData({ shape, scale, type, range, points, }: {
    shape: number;
    scale: number;
    type: "cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    probability: number;
}>;
export declare function weibullData({ shape, scale, type, range, points, }: {
    shape: number;
    scale: number;
    type: "inverse_cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    probability: number;
    quantile: number;
}>;
