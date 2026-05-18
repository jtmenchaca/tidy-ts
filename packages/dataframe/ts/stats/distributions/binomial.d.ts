import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Binomial distribution probability mass function
 * @param at - Point where PMF is evaluated (number of successes)
 * @param trials - Number of trials
 * @param probabilityOfSuccess - Probability of success
 * @param returnLog - If true, return log probability (default: false)
 * @returns Probability value or log probability
 */
export declare function dbinom({ at, trials, probabilityOfSuccess, returnLog, }: {
    at: number;
    trials: number;
    probabilityOfSuccess: number;
    returnLog?: boolean;
}): number;
/**
 * Binomial distribution cumulative distribution function
 * @param at - Point where CDF is evaluated (number of successes)
 * @param trials - Number of trials
 * @param probabilityOfSuccess - Probability of success
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function pbinom({ at, trials, probabilityOfSuccess, direction, returnLog, }: {
    at: number;
    trials: number;
    probabilityOfSuccess: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * Binomial distribution quantile function
 * @param probability - Probability value (0..1)
 * @param trials - Number of trials
 * @param probabilityOfSuccess - Probability of success
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qbinom({ probability, trials, probabilityOfSuccess, direction, probabilityIsLog, }: {
    probability: number;
    trials: number;
    probabilityOfSuccess: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * Binomial distribution random number generation
 * @param trials - Number of trials
 * @param probabilityOfSuccess - Probability of success
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the binomial distribution (integers)
 */
export declare function rbinom({ trials, probabilityOfSuccess, }: {
    trials: number;
    probabilityOfSuccess: number;
}): number;
export declare function rbinom({ trials, probabilityOfSuccess, sampleSize, }: {
    trials: number;
    probabilityOfSuccess: number;
    sampleSize: number;
}): number[];
/**
 * Generate data for Binomial distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export declare function binomialData({ trials, probabilityOfSuccess, type, range, points, }: {
    trials: number;
    probabilityOfSuccess: number;
    type: "pdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    density: number;
}>;
export declare function binomialData({ trials, probabilityOfSuccess, type, range, points, }: {
    trials: number;
    probabilityOfSuccess: number;
    type: "cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    probability: number;
}>;
export declare function binomialData({ trials, probabilityOfSuccess, type, range, points, }: {
    trials: number;
    probabilityOfSuccess: number;
    type: "inverse_cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    probability: number;
    quantile: number;
}>;
