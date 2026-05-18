/**
 * Extract first match from strings
 *
 * @param strings - Array of strings to extract from
 * @param pattern - Regex pattern with optional capture groups
 * @returns Array of extracted strings or null if no match
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Extract user IDs from log entries
 * const logs = ["user_id=12345", "user_id=67890", "no_id_here"];
 * const userIds = str.extract(logs, "user_id=(\\d+)");
 * // ["12345", "67890", null]
 * ```
 */
export declare function strExtract(strings: string[], pattern: string): (string | null)[];
/**
 * Extract first match from a single string
 *
 * @param string - Single string to extract from
 * @param pattern - Regex pattern with optional capture groups
 * @returns Extracted string or null if no match
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Extract from single string
 * const id = str.extract("user_id=12345", "user_id=(\\d+)");
 * // "12345"
 * ```
 */
export declare function strExtract(string: string, pattern: string): string | null;
/**
 * Extract all matches from strings
 *
 * @param strings - Array of strings to extract from
 * @param pattern - Regex pattern to find all matches
 * @returns Array of arrays containing all matches for each string
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Extract all numbers from strings
 * const texts = ["Score: 85, 92, 78", "No numbers here", "1, 2, 3, 4"];
 * const allNumbers = str.extractAll(texts, "\\d+");
 * // [["85", "92", "78"], [], ["1", "2", "3", "4"]]
 * ```
 */
export declare function strExtractAll(strings: string[], pattern: string): string[][];
/**
 * Extract all matches from a single string
 *
 * @param string - Single string to extract from
 * @param pattern - Regex pattern to find all matches
 * @returns Array containing all matches
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Extract from single string
 * const numbers = str.extractAll("Score: 85, 92, 78", "\\d+");
 * // ["85", "92", "78"]
 * ```
 */
export declare function strExtractAll(string: string, pattern: string): string[];
