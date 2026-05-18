import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Beta distribution density function
 * @param at - Point where density is evaluated
 * @param alpha - First shape parameter (α > 0)
 * @param beta - Second shape parameter (β > 0)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export declare function dbeta({ at, alpha, beta, returnLog, }: {
    at: number;
    alpha: number;
    beta: number;
    returnLog?: boolean;
}): number;
/**
 * Beta distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param alpha - First shape parameter (α > 0)
 * @param beta - Second shape parameter (β > 0)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function pbeta({ at, alpha, beta, direction, returnLog, }: {
    at: number;
    alpha: number;
    beta: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * Beta distribution quantile function
 * @param probability - Probability value (0..1)
 * @param alpha - First shape parameter (α > 0)
 * @param beta - Second shape parameter (β > 0)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qbeta({ probability, alpha, beta, direction, probabilityIsLog, }: {
    probability: number;
    alpha: number;
    beta: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * Beta distribution random number generation
 * @param alpha - First shape parameter (α > 0)
 * @param beta - Second shape parameter (β > 0)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the beta distribution
 */
export declare function rbeta({ alpha, beta, }: {
    alpha: number;
    beta: number;
}): number;
export declare function rbeta({ alpha, beta, sampleSize, }: {
    alpha: number;
    beta: number;
    sampleSize: number;
}): number[];
/**
 * Generate data for Beta distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export declare function betaData({ alpha, beta, type, range, points, }: {
    alpha: number;
    beta: number;
    type: "pdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    density: number;
}>;
export declare function betaData({ alpha, beta, type, range, points, }: {
    alpha: number;
    beta: number;
    type: "cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    probability: number;
}>;
export declare function betaData({ alpha, beta, type, range, points, }: {
    alpha: number;
    beta: number;
    type: "inverse_cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    probability: number;
    quantile: number;
}>;
