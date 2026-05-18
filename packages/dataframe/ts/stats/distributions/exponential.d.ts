import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Exponential distribution density function
 * @param at - Point where density is evaluated
 * @param rate - Rate parameter (λ > 0, default: 1)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export declare function dexp({ at, rate, returnLog, }: {
    at: number;
    rate?: number;
    returnLog?: boolean;
}): number;
/**
 * Exponential distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param rate - Rate parameter (λ > 0, default: 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function pexp({ at, rate, direction, returnLog, }: {
    at: number;
    rate?: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * Exponential distribution quantile function
 * @param probability - Probability value (0..1)
 * @param rate - Rate parameter (λ > 0, default: 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qexp({ probability, rate, direction, probabilityIsLog, }: {
    probability: number;
    rate?: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * Exponential distribution random number generation
 * @param rate - Rate parameter (λ > 0, default: 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the exponential distribution
 */
export declare function rexp(): number;
export declare function rexp({ rate, sampleSize, }: {
    rate?: number;
    sampleSize: number;
}): number[];
/**
 * Generate data for Exponential distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export declare function exponentialData({ rate, type, range, points, }: {
    rate: number;
    type: "pdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    density: number;
}>;
export declare function exponentialData({ rate, type, range, points, }: {
    rate: number;
    type: "cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    probability: number;
}>;
export declare function exponentialData({ rate, type, range, points, }: {
    rate: number;
    type: "inverse_cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    probability: number;
    quantile: number;
}>;
