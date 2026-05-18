/**
 * Geometric distribution probability mass function
 * @param at - Point where PMF is evaluated
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob ≤ 1)
 * @param returnLog - If true, return log probability (default: false)
 * @returns Probability value or log probability
 */
export declare function dgeom({ at, probabilityOfSuccess, returnLog, }: {
    at: number;
    probabilityOfSuccess: number;
    returnLog?: boolean;
}): number;
/**
 * Geometric distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob ≤ 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function pgeom({ at, probabilityOfSuccess, direction, returnLog, }: {
    at: number;
    probabilityOfSuccess: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * Geometric distribution quantile function
 * @param probability - Probability value (0..1)
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob ≤ 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qgeom({ probability, probabilityOfSuccess, direction, probabilityIsLog, }: {
    probability: number;
    probabilityOfSuccess: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * Geometric distribution random number generation
 * @param probabilityOfSuccess - Probability of success on each trial (0 < prob ≤ 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the geometric distribution (integers)
 */
export declare function rgeom({ probabilityOfSuccess, }: {
    probabilityOfSuccess: number;
}): number;
export declare function rgeom({ probabilityOfSuccess, sampleSize, }: {
    probabilityOfSuccess: number;
    sampleSize: number;
}): number[];
