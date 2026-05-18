/**
 * Detect if strings match a pattern
 *
 * @param strings - Array of strings to test
 * @param pattern - Regex pattern or literal string to search for
 * @returns Array of booleans indicating if each string matches the pattern
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Test if strings contain email patterns
 * const emails = ["user@example.com", "invalid-email", "admin@test.org"];
 * const hasEmail = str.detect(emails, "[\\w\\.-]+@[\\w\\.-]+\\.\\w+");
 * // [true, false, true]
 * ```
 */
export declare function strDetect(strings: string[], pattern: string): boolean[];
/**
 * Detect if a single string matches a pattern
 *
 * @param string - Single string to test
 * @param pattern - Regex pattern or literal string to search for
 * @returns Boolean indicating if the string matches the pattern
 *
 * @example
 * ```typescript
 * import { str } from "@tidy-ts/dataframe";
 *
 * // Test single string
 * const isValid = str.detect("user@example.com", "[\\w\\.-]+@[\\w\\.-]+\\.\\w+");
 * // true
 * ```
 */
export declare function strDetect(string: string, pattern: string): boolean;
