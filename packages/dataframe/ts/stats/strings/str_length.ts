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
export function strLength(strings: string[]): number[];

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
export function strLength(string: string): number;

export function strLength(strings: string[] | string): number[] | number {
  const stringArray = Array.isArray(strings) ? strings : [strings];

  const results = stringArray.map((str) => str.length);
  return Array.isArray(strings) ? results : results[0];
}
