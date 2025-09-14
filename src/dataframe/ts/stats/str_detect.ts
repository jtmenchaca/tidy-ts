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
export function strDetect(strings: string[], pattern: string): boolean[];

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
export function strDetect(string: string, pattern: string): boolean;

export function strDetect(
  strings: string[] | string,
  pattern: string,
): boolean[] | boolean {
  const stringArray = Array.isArray(strings) ? strings : [strings];

  // Check if pattern contains regex metacharacters
  const isRegex = /[.*+?^${}()|[\]\\]/.test(pattern);

  if (isRegex) {
    try {
      const regex = new RegExp(pattern);
      const results = stringArray.map((str) => regex.test(str));
      return Array.isArray(strings) ? results : results[0];
    } catch {
      // Invalid regex - return false for all
      const results = new Array(stringArray.length).fill(false);
      return Array.isArray(strings) ? results : results[0];
    }
  } else {
    // Literal string search
    const results = stringArray.map((str) => str.includes(pattern));
    return Array.isArray(strings) ? results : results[0];
  }
}
