/**
 * Hypergeometric distribution probability mass function
 * @param at - Point where PMF is evaluated (successes in sample)
 * @param populationSuccesses - Number of success items in population (m)
 * @param populationFailures - Number of failure items in population (n)
 * @param drawSize - Sample size (k)
 * @param returnLog - If true, return log probability (default: false)
 * @returns Probability value or log probability
 */
export declare function dhyper({ at, populationSuccesses, populationFailures, drawSize, returnLog, }: {
    at: number;
    populationSuccesses: number;
    populationFailures: number;
    drawSize: number;
    returnLog?: boolean;
}): number;
/**
 * Hypergeometric distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param populationSuccesses - Number of success items in population (m)
 * @param populationFailures - Number of failure items in population (n)
 * @param drawSize - Sample size (k)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function phyper({ at, populationSuccesses, populationFailures, drawSize, direction, returnLog, }: {
    at: number;
    populationSuccesses: number;
    populationFailures: number;
    drawSize: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * Hypergeometric distribution quantile function
 * @param probability - Probability value (0..1)
 * @param populationSuccesses - Number of success items in population (m)
 * @param populationFailures - Number of failure items in population (n)
 * @param drawSize - Sample size (k)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qhyper({ probability, populationSuccesses, populationFailures, drawSize, direction, probabilityIsLog, }: {
    probability: number;
    populationSuccesses: number;
    populationFailures: number;
    drawSize: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * Hypergeometric distribution random number generation
 * @param populationSuccesses - Number of success items in population (m)
 * @param populationFailures - Number of failure items in population (n)
 * @param drawSize - Sample size (k)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the hypergeometric distribution (integers)
 */
export declare function rhyper({ populationSuccesses, populationFailures, drawSize, }: {
    populationSuccesses: number;
    populationFailures: number;
    drawSize: number;
}): number;
export declare function rhyper({ populationSuccesses, populationFailures, drawSize, sampleSize, }: {
    populationSuccesses: number;
    populationFailures: number;
    drawSize: number;
    sampleSize: number;
}): number[];
