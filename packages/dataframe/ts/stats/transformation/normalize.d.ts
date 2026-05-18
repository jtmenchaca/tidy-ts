/**
 * Normalize values to 0-1 range using min-max normalization
 *
 * @param values - Array of numbers
 * @param method - Normalization method: "minmax" (default) or "zscore"
 * @returns Array of normalized values (0-1 range for minmax, z-scores for zscore)
 *
 * @example
 * ```ts
 * normalize([10, 20, 30]) // [0, 0.5, 1] (min-max normalization)
 * normalize([10, 20, 30], "zscore") // z-scores with mean=0, std=1
 * ```
 */
/**
 * Find the normalized value of a specific target value within an array
 *
 * @param values - Array of numbers
 * @param target - The value to find the normalized value for
 * @param method - Normalization method: "minmax" (default) or "zscore"
 * @returns Normalized value of the target (0-1 range for minmax, z-score for zscore)
 *
 * @example
 * ```ts
 * normalize([10, 20, 30], 20) // 0.5 (20 is halfway between 10 and 30)
 * normalize([10, 20, 30], 20, "zscore") // z-score of 20
 * ```
 */
export declare function normalize(value: number): number;
export declare function normalize(values: number[]): number[];
export declare function normalize(values: (number | null | undefined)[], method?: "minmax" | "zscore"): (number | null)[];
export declare function normalize(values: Iterable<number>): number[];
export declare function normalize(values: Iterable<number | null | undefined>, method?: "minmax" | "zscore"): (number | null)[];
export declare function normalize(values: number[], target: number): number;
export declare function normalize(values: number[], target: number, method: "minmax" | "zscore"): number;
export declare function normalize(values: (number | null | undefined)[], target: number): number | null;
export declare function normalize(values: (number | null | undefined)[], target: number, method: "minmax" | "zscore"): number | null;
export declare function normalize(values: Iterable<number>, target: number): number;
export declare function normalize(values: Iterable<number>, target: number, method: "minmax" | "zscore"): number;
export declare function normalize(values: Iterable<number | null | undefined>, target: number): number | null;
export declare function normalize(values: Iterable<number | null | undefined>, target: number, method: "minmax" | "zscore"): number | null;
