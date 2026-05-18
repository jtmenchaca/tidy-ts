/**
 * Wilcoxon rank-sum distribution density function
 * @param at - Point where density is evaluated (Wilcoxon rank-sum statistic)
 * @param sizeFirstSample - Size of first sample
 * @param sizeSecondSample - Size of second sample
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export declare function dwilcox({ at, sizeFirstSample, sizeSecondSample, returnLog, }: {
    at: number;
    sizeFirstSample: number;
    sizeSecondSample: number;
    returnLog?: boolean;
}): number;
/**
 * Wilcoxon rank-sum distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param sizeFirstSample - Size of first sample
 * @param sizeSecondSample - Size of second sample
 * @param direction - "below" for P(W ≤ at) or "above" for P(W > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function pwilcox({ at, sizeFirstSample, sizeSecondSample, direction, returnLog, }: {
    at: number;
    sizeFirstSample: number;
    sizeSecondSample: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * Wilcoxon rank-sum distribution quantile function
 * @param probability - Probability value (0..1)
 * @param sizeFirstSample - Size of first sample
 * @param sizeSecondSample - Size of second sample
 * @param direction - "below" for P(W ≤ x) or "above" for P(W > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qwilcox({ probability, sizeFirstSample, sizeSecondSample, direction, probabilityIsLog, }: {
    probability: number;
    sizeFirstSample: number;
    sizeSecondSample: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * Wilcoxon rank-sum distribution random number generation
 * @param sizeFirstSample - Size of first sample
 * @param sizeSecondSample - Size of second sample
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the Wilcoxon rank-sum distribution
 */
export declare function rwilcox({ sizeFirstSample, sizeSecondSample, }: {
    sizeFirstSample: number;
    sizeSecondSample: number;
}): number;
export declare function rwilcox({ sizeFirstSample, sizeSecondSample, sampleSize, }: {
    sizeFirstSample: number;
    sizeSecondSample: number;
    sampleSize: number;
}): number[];
