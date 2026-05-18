/**
 * Split strings by pattern
 *
 * @param strings - Array of strings to split
 * @param pattern - Regex pattern or literal string to split on
 * @returns Array of arrays containing split parts
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Split by comma and space
 * const texts = ["apple,banana,cherry", "red,green,blue"];
 * const split = str.split(texts, ",\\s*");
 * // [["apple", "banana", "cherry"], ["red", "green", "blue"]]
 * ```
 */
export declare function strSplit(strings: string[], pattern: string): string[][];
/**
 * Split a single string by pattern
 *
 * @param string - Single string to split
 * @param pattern - Regex pattern or literal string to split on
 * @returns Array containing split parts
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Split single string
 * const parts = str.split("apple,banana,cherry", ",");
 * // ["apple", "banana", "cherry"]
 * ```
 */
export declare function strSplit(string: string, pattern: string): string[];
/**
 * Split strings by pattern into fixed number of parts
 *
 * @param strings - Array of strings to split
 * @param pattern - Regex pattern or literal string to split on
 * @param n - Maximum number of parts to split into
 * @returns Array of arrays containing split parts (limited to n parts)
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Split into maximum 3 parts
 * const texts = ["a-b-c-d-e", "x-y"];
 * const split = str.splitFixed(texts, "-", 3);
 * // [["a", "b", "c-d-e"], ["x", "y"]]
 * ```
 */
export declare function strSplitFixed(strings: string[], pattern: string, n: number): string[][];
/**
 * Split a single string by pattern into fixed number of parts
 *
 * @param string - Single string to split
 * @param pattern - Regex pattern or literal string to split on
 * @param n - Maximum number of parts to split into
 * @returns Array containing split parts (limited to n parts)
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Split into maximum 3 parts
 * const parts = str.splitFixed("a-b-c-d-e", "-", 3);
 * // ["a", "b", "c-d-e"]
 * ```
 */
export declare function strSplitFixed(string: string, pattern: string, n: number): string[];
