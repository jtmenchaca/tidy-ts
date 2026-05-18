import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Student's t distribution density function
 * @param at - Point where density is evaluated
 * @param degreesOfFreedom - Degrees of freedom (> 0)
 * @param returnLog - If true, return log density (default: false)
 * @returns Density value or log density
 */
export declare function dt({ at, degreesOfFreedom, returnLog, }: {
    at: number;
    degreesOfFreedom: number;
    returnLog?: boolean;
}): number;
/**
 * Student's t distribution cumulative distribution function
 * @param at - Point where CDF is evaluated
 * @param degreesOfFreedom - Degrees of freedom (> 0)
 * @param direction - "below" for P(X ≤ at) or "above" for P(X > at) (default: "below")
 * @param returnLog - If true, return log probability (default: false)
 * @returns Cumulative probability or log cumulative probability
 */
export declare function pt({ at, degreesOfFreedom, direction, returnLog, }: {
    at: number;
    degreesOfFreedom: number;
    direction?: "below" | "above";
    returnLog?: boolean;
}): number;
/**
 * Student's t distribution quantile function
 * @param probability - Probability value (0..1)
 * @param degreesOfFreedom - Degrees of freedom (> 0)
 * @param direction - "below" for P(X ≤ x) or "above" for P(X > x) (default: "below")
 * @param probabilityIsLog - If true, probability is given as log-probability (default: false)
 * @returns Quantile value
 */
export declare function qt({ probability, degreesOfFreedom, direction, probabilityIsLog, }: {
    probability: number;
    degreesOfFreedom: number;
    direction?: "below" | "above";
    probabilityIsLog?: boolean;
}): number;
/**
 * Student's t distribution random number generation
 * @param degreesOfFreedom - Degrees of freedom (> 0)
 * @param sampleSize - Number of random draws (default: 1)
 * @returns Random sample(s) from the t distribution
 */
export declare function rt({ degreesOfFreedom, }: {
    degreesOfFreedom: number;
}): number;
export declare function rt({ degreesOfFreedom, sampleSize, }: {
    degreesOfFreedom: number;
    sampleSize: number;
}): number[];
/**
 * Generate data for t-distribution visualization
 * @param params - Distribution parameters
 * @param type - Type of data to generate
 * @param config - Configuration for data generation
 * @returns DataFrame with distribution data
 */
export declare function tData({ degreesOfFreedom, type, range, points, }: {
    degreesOfFreedom: number;
    type: "pdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    density: number;
}>;
export declare function tData({ degreesOfFreedom, type, range, points, }: {
    degreesOfFreedom: number;
    type: "cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    x: number;
    probability: number;
}>;
export declare function tData({ degreesOfFreedom, type, range, points, }: {
    degreesOfFreedom: number;
    type: "inverse_cdf";
    range?: [number, number];
    points?: number;
}): DataFrame<{
    probability: number;
    quantile: number;
}>;
