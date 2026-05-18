/**
 * Get the length of strings
 *
 * @param strings - Array of strings to measure
 * @returns Array of string lengths
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Get lengths of multiple strings
 * const texts = ["hello", "world", "test"];
 * const lengths = str.length(texts);
 * // [5, 5, 4]
 * ```
 */
export declare function strLength(strings: string[]): number[];
/**
 * Get the length of a single string
 *
 * @param string - Single string to measure
 * @returns Length of the string
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Get length of single string
 * const length = str.length("hello");
 * // 5
 * ```
 */
export declare function strLength(string: string): number;
