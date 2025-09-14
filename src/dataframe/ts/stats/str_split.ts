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
export function strSplit(strings: string[], pattern: string): string[][];

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
export function strSplit(string: string, pattern: string): string[];

export function strSplit(
  strings: string[] | string,
  pattern: string,
): string[][] | string[] {
  const stringArray = Array.isArray(strings) ? strings : [strings];

  // Check if pattern contains regex metacharacters
  const isRegex = /[.*+?^${}()|[\]\\]/.test(pattern);

  if (isRegex) {
    try {
      const regex = new RegExp(pattern);
      const results = stringArray.map((str) => str.split(regex));
      return Array.isArray(strings) ? results : results[0];
    } catch {
      // Invalid regex - return original strings as single-element arrays
      const results = stringArray.map((str) => [str]);
      return Array.isArray(strings) ? results : results[0];
    }
  } else {
    // Literal string split
    const results = stringArray.map((str) => str.split(pattern));
    return Array.isArray(strings) ? results : results[0];
  }
}

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
export function strSplitFixed(
  strings: string[],
  pattern: string,
  n: number,
): string[][];

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
export function strSplitFixed(
  string: string,
  pattern: string,
  n: number,
): string[];

export function strSplitFixed(
  strings: string[] | string,
  pattern: string,
  n: number,
): string[][] | string[] {
  const stringArray = Array.isArray(strings) ? strings : [strings];

  // Check if pattern contains regex metacharacters
  const isRegex = /[.*+?^${}()|[\]\\]/.test(pattern);

  if (isRegex) {
    try {
      const regex = new RegExp(pattern);
      const results = stringArray.map((str) => {
        const parts = str.split(regex);
        if (parts.length <= n) return parts;

        // If we have more parts than n, combine the remaining ones
        const firstParts = parts.slice(0, n - 1);
        const remainingParts = parts.slice(n - 1).join(pattern);
        return [...firstParts, remainingParts];
      });
      return Array.isArray(strings) ? results : results[0];
    } catch {
      // Invalid regex - return original strings as single-element arrays
      const results = stringArray.map((str) => [str]);
      return Array.isArray(strings) ? results : results[0];
    }
  } else {
    // Literal string split with fixed parts
    const results = stringArray.map((str) => {
      const parts = str.split(pattern);
      if (parts.length <= n) return parts;

      // If we have more parts than n, combine the remaining ones
      const firstParts = parts.slice(0, n - 1);
      const remainingParts = parts.slice(n - 1).join(pattern);
      return [...firstParts, remainingParts];
    });
    return Array.isArray(strings) ? results : results[0];
  }
}
