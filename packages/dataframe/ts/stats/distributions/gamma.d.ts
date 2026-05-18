import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Gamma distribution density function
 * @param at - Point where density is evaluated
 * @param shape - Shape parameter (α > 0)
 * @param rate - Rate parameter (β > 0, default: 1)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export declare function dgamma({ at, shape, rate, returnLog, }: {
    at: number;
    shape: number;
    rate?: number;
    returnLog?: boolean;
}): number;
/**
 * Gamma distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param shape - Shape parameter (α > 0)
 * @param rate - Rate parameter (β > 0, default: 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function pgamma({ at, shape, rate, direction, returnLog, }: {
    at: number;
    shape: number;
    rate?: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * Gamma distribution quantile function
 * @param probability - Probability value (0..1)
 * @param shape - Shape parameter (α > 0)
 * @param rate - Rate parameter (β > 0, default: 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qgamma({ probability, shape, rate, direction, probabilityIsLog, }: {
    probability: number;
    shape: number;
    rate?: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * Gamma distribution random number generation
 * @param shape - Shape parameter (α > 0)
 * @param rate - Rate parameter (β > 0, default: 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the gamma distribution
 */
export declare function rgamma({ shape, rate, }: {
    shape: number;
    rate?: number;
}): number;
export declare function rgamma({ shape, rate, sampleSize, }: {
    shape: number;
    rate?: number;
    sampleSize: number;
}): number[];
/**
 * Generate data for Gamma distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export declare function gammaData({ shape, rate, type, range, points, }: {
    shape: number;
    rate: number;
    type: "pdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    density: number;
}>;
export declare function gammaData({ shape, rate, type, range, points, }: {
    shape: number;
    rate: number;
    type: "cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    probability: number;
}>;
export declare function gammaData({ shape, rate, type, range, points, }: {
    shape: number;
    rate: number;
    type: "inverse_cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    probability: number;
    quantile: number;
}>;
