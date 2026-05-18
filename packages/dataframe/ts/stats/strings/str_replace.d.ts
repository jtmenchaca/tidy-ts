/**
 * Replace first occurrence of pattern in strings
 *
 * @param strings - Array of strings to replace in
 * @param pattern - Regex pattern or literal string to replace
 * @param replacement - String to replace the pattern with
 * @returns Array of strings with first occurrence replaced
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Replace first occurrence of "old" with "new"
 * const texts = ["old text", "older text", "new text"];
 * const updated = str.replace(texts, "old", "new");
 * // ["new text", "newer text", "new text"]
 * ```
 */
export declare function strReplace(strings: string[], pattern: string, replacement: string): string[];
/**
 * Replace first occurrence of pattern in a single string
 *
 * @param string - Single string to replace in
 * @param pattern - Regex pattern or literal string to replace
 * @param replacement - String to replace the pattern with
 * @returns String with first occurrence replaced
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Replace first occurrence in single string
 * const updated = str.replace("old text", "old", "new");
 * // "new text"
 * ```
 */
export declare function strReplace(string: string, pattern: string, replacement: string): string;
/**
 * Replace all occurrences of pattern in strings
 *
 * @param strings - Array of strings to replace in
 * @param pattern - Regex pattern or literal string to replace
 * @param replacement - String to replace the pattern with
 * @returns Array of strings with all occurrences replaced
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Replace all occurrences of "old" with "new"
 * const texts = ["old text", "older text", "new text"];
 * const updated = str.replaceAll(texts, "old", "new");
 * // ["new text", "newer text", "new text"]
 * ```
 */
export declare function strReplaceAll(strings: string[], pattern: string, replacement: string): string[];
/**
 * Replace all occurrences of pattern in a single string
 *
 * @param string - Single string to replace in
 * @param pattern - Regex pattern or literal string to replace
 * @param replacement - String to replace the pattern with
 * @returns String with all occurrences replaced
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Replace all occurrences in single string
 * const updated = str.replaceAll("old old text", "old", "new");
 * // "new new text"
 * ```
 */
export declare function strReplaceAll(string: string, pattern: string, replacement: string): string;
