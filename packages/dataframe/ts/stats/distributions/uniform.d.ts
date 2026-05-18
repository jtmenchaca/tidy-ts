import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Uniform distribution density function
 * @param at - Point where density is evaluated
 * @param minimum - Lower bound (default: 0)
 * @param maximum - Upper bound (default: 1)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export declare function dunif({ at, minimum, maximum, returnLog, }: {
    at: number;
    minimum?: number;
    maximum?: number;
    returnLog?: boolean;
}): number;
/**
 * Uniform distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param minimum - Lower bound (default: 0)
 * @param maximum - Upper bound (default: 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function punif({ at, minimum, maximum, direction, returnLog, }: {
    at: number;
    minimum?: number;
    maximum?: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * Uniform distribution quantile function
 * @param probability - Probability value (0..1)
 * @param minimum - Lower bound (default: 0)
 * @param maximum - Upper bound (default: 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qunif({ probability, minimum, maximum, direction, probabilityIsLog, }: {
    probability: number;
    minimum?: number;
    maximum?: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * Uniform distribution random number generation
 * @param minimum - Lower bound (default: 0)
 * @param maximum - Upper bound (default: 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the uniform distribution
 */
export declare function runif(): number;
export declare function runif({ minimum, maximum, sampleSize, }: {
    minimum?: number;
    maximum?: number;
    sampleSize: number;
}): number[];
/**
 * Generate data for Uniform distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export declare function uniformData({ min, max, type, range, points, }: {
    min: number;
    max: number;
    type: "pdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    density: number;
}>;
export declare function uniformData({ min, max, type, range, points, }: {
    min: number;
    max: number;
    type: "cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    probability: number;
}>;
export declare function uniformData({ min, max, type, range, points, }: {
    min: number;
    max: number;
    type: "inverse_cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    probability: number;
    quantile: number;
}>;
