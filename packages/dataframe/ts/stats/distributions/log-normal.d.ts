/**
 * Log-normal distribution density function
 * @param at - Point where density is evaluated
 * @param meanLog - Mean of the underlying normal distribution (default: 0)
 * @param standardDeviationLog - Standard deviation of the underlying normal distribution (default: 1)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export declare function dlnorm({ at, meanLog, standardDeviationLog, returnLog, }: {
    at: number;
    meanLog?: number;
    standardDeviationLog?: number;
    returnLog?: boolean;
}): number;
/**
 * Log-normal distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param meanLog - Mean of the underlying normal distribution (default: 0)
 * @param standardDeviationLog - Standard deviation of the underlying normal distribution (default: 1)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function plnorm({ at, meanLog, standardDeviationLog, direction, returnLog, }: {
    at: number;
    meanLog?: number;
    standardDeviationLog?: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * Log-normal distribution quantile function
 * @param probability - Probability value (0..1)
 * @param meanLog - Mean of the underlying normal distribution (default: 0)
 * @param standardDeviationLog - Standard deviation of the underlying normal distribution (default: 1)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qlnorm({ probability, meanLog, standardDeviationLog, direction, probabilityIsLog, }: {
    probability: number;
    meanLog?: number;
    standardDeviationLog?: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * Log-normal distribution random number generation
 * @param meanLog - Mean of the underlying normal distribution (default: 0)
 * @param standardDeviationLog - Standard deviation of the underlying normal distribution (default: 1)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the log-normal distribution
 */
export declare function rlnorm(): number;
export declare function rlnorm({ meanLog, standardDeviationLog, sampleSize, }: {
    meanLog?: number;
    standardDeviationLog?: number;
    sampleSize: number;
}): number[];
