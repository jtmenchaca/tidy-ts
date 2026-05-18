/**
 * Negative binomial distribution probability mass function
 * @param at - Point where PMF is evaluated
 * @param numberOfSuccesses - Number of successes (r, must be positive)
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob < 1)
 * @param returnLog - If true, return log probability (default: false)
 * @returns Probability value or log probability
 */
export declare function dnbinom({ at, numberOfSuccesses, probabilityOfSuccess, returnLog, }: {
    at: number;
    numberOfSuccesses: number;
    probabilityOfSuccess: number;
    returnLog?: boolean;
}): number;
/**
 * Negative binomial distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param numberOfSuccesses - Number of successes (r, must be positive)
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob < 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function pnbinom({ at, numberOfSuccesses, probabilityOfSuccess, direction, returnLog, }: {
    at: number;
    numberOfSuccesses: number;
    probabilityOfSuccess: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * Negative binomial distribution quantile function
 * @param probability - Probability value (0..1)
 * @param numberOfSuccesses - Number of successes (r, must be positive)
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob < 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qnbinom({ probability, numberOfSuccesses, probabilityOfSuccess, direction, probabilityIsLog, }: {
    probability: number;
    numberOfSuccesses: number;
    probabilityOfSuccess: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * Negative binomial distribution random number generation
 * @param numberOfSuccesses - Number of successes (r, must be positive)
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob < 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the negative binomial distribution (integers)
 */
export declare function rnbinom({ numberOfSuccesses, probabilityOfSuccess, }: {
    numberOfSuccesses: number;
    probabilityOfSuccess: number;
}): number;
export declare function rnbinom({ numberOfSuccesses, probabilityOfSuccess, sampleSize, }: {
    numberOfSuccesses: number;
    probabilityOfSuccess: number;
    sampleSize: number;
}): number[];
