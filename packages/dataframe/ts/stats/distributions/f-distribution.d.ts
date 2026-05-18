/**
 * F distribution density function
 * @param at - Point where density is evaluated
 * @param numeratorDegreesOfFreedom - Numerator degrees of freedom (> 0)
 * @param denominatorDegreesOfFreedom - Denominator degrees of freedom (> 0)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export declare function df({ at, numeratorDegreesOfFreedom, denominatorDegreesOfFreedom, returnLog, }: {
    at: number;
    numeratorDegreesOfFreedom: number;
    denominatorDegreesOfFreedom: number;
    returnLog?: boolean;
}): number;
/**
 * F distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param numeratorDegreesOfFreedom - Numerator degrees of freedom (> 0)
 * @param denominatorDegreesOfFreedom - Denominator degrees of freedom (> 0)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function pf({ at, numeratorDegreesOfFreedom, denominatorDegreesOfFreedom, direction, returnLog, }: {
    at: number;
    numeratorDegreesOfFreedom: number;
    denominatorDegreesOfFreedom: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * F distribution quantile function
 * @param probability - Probability value (0..1)
 * @param numeratorDegreesOfFreedom - Numerator degrees of freedom (> 0)
 * @param denominatorDegreesOfFreedom - Denominator degrees of freedom (> 0)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qf({ probability, numeratorDegreesOfFreedom, denominatorDegreesOfFreedom, direction, probabilityIsLog, }: {
    probability: number;
    numeratorDegreesOfFreedom: number;
    denominatorDegreesOfFreedom: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * F distribution random number generation
 * @param numeratorDegreesOfFreedom - Numerator degrees of freedom (> 0)
 * @param denominatorDegreesOfFreedom - Denominator degrees of freedom (> 0)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the F distribution
 */
export declare function rf({ numeratorDegreesOfFreedom, denominatorDegreesOfFreedom, }: {
    numeratorDegreesOfFreedom: number;
    denominatorDegreesOfFreedom: number;
}): number;
export declare function rf({ numeratorDegreesOfFreedom, denominatorDegreesOfFreedom, sampleSize, }: {
    numeratorDegreesOfFreedom: number;
    denominatorDegreesOfFreedom: number;
    sampleSize: number;
}): number[];
