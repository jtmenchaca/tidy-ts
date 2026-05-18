import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Normal distribution density function
 * @param at - Point where density is evaluated
 * @param mean - Mean of the distribution (default: 0)
 * @param standardDeviation - Standard deviation (default: 1)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export declare function dnorm({ at, mean, standardDeviation, returnLog, }: {
    at: number;
    mean?: number;
    standardDeviation?: number;
    returnLog?: boolean;
}): number;
/**
 * Normal distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param mean - Mean of the distribution (default: 0)
 * @param standardDeviation - Standard deviation (default: 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function pnorm({ at, mean, standardDeviation, direction, returnLog, }: {
    at: number;
    mean?: number;
    standardDeviation?: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * Normal distribution quantile function
 * @param probability - Probability value (0..1)
 * @param mean - Mean of the distribution (default: 0)
 * @param standardDeviation - Standard deviation (default: 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qnorm({ probability, mean, standardDeviation, direction, probabilityIsLog, }: {
    probability: number;
    mean?: number;
    standardDeviation?: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * Normal distribution random number generation
 * @param mean - Mean of the distribution (default: 0)
 * @param standardDeviation - Standard deviation (default: 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the normal distribution
 */
export declare function rnorm(): number;
export declare function rnorm({ mean, standardDeviation, sampleSize, }: {
    mean?: number;
    standardDeviation?: number;
    sampleSize?: number;
}): number;
export declare function rnorm({ mean, standardDeviation, sampleSize, }: {
    mean?: number;
    standardDeviation?: number;
    sampleSize: number;
}): number[];
/**
 * Generate data for normal distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export declare function normalData({ mean, standardDeviation, type, range, points, }: {
    mean: number;
    standardDeviation: number;
    type: "pdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    density: number;
}>;
export declare function normalData({ mean, standardDeviation, type, range, points, }: {
    mean: number;
    standardDeviation: number;
    type: "cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    probability: number;
}>;
export declare function normalData({ mean, standardDeviation, type, range, points, }: {
    mean: number;
    standardDeviation: number;
    type: "inverse_cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    probability: number;
    quantile: number;
}>;
