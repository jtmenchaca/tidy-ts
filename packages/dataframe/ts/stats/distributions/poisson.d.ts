import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Poisson distribution probability mass function
 * @param at - Point where PMF is evaluated (count k)
 * @param rateLambda - Rate parameter (λ > 0)
 * @param returnLog - If true, return log probability (default: false)
 * @returns Probability value or log probability
 */
export declare function dpois({ at, rateLambda, returnLog, }: {
    at: number;
    rateLambda: number;
    returnLog?: boolean;
}): number;
/**
 * Poisson distribution cumulative distribution function
 * @param at - Point where CDF is evaluated (count k)
 * @param rateLambda - Rate parameter (λ > 0)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function ppois({ at, rateLambda, direction, returnLog, }: {
    at: number;
    rateLambda: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * Poisson distribution quantile function
 * @param probability - Probability value (0..1)
 * @param rateLambda - Rate parameter (λ > 0)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qpois({ probability, rateLambda, direction, probabilityIsLog, }: {
    probability: number;
    rateLambda: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * Poisson distribution random number generation
 * @param rateLambda - Rate parameter (λ > 0)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the Poisson distribution (integers)
 */
export declare function rpois({ rateLambda, }: {
    rateLambda: number;
}): number;
export declare function rpois({ rateLambda, sampleSize, }: {
    rateLambda: number;
    sampleSize: number;
}): number[];
/**
 * Generate data for Poisson distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export declare function poissonData({ rateLambda, type, range, points, }: {
    rateLambda: number;
    type: "pdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    density: number;
}>;
export declare function poissonData({ rateLambda, type, range, points, }: {
    rateLambda: number;
    type: "cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    probability: number;
}>;
export declare function poissonData({ rateLambda, type, range, points, }: {
    rateLambda: number;
    type: "inverse_cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    probability: number;
    quantile: number;
}>;
