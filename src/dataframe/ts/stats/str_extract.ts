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
export function strExtract(
  strings: string[],
  pattern: string,
): (string | null)[];

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
export function strExtract(string: string, pattern: string): string | null;

export function strExtract(
  strings: string[] | string,
  pattern: string,
): (string | null)[] | (string | null) {
  const stringArray = Array.isArray(strings) ? strings : [strings];

  // Check if pattern contains regex metacharacters
  const isRegex = /[.*+?^${}()|[\]\\]/.test(pattern);

  if (isRegex) {
    try {
      const regex = new RegExp(pattern);
      const results = stringArray.map((str) => {
        const match = str.match(regex);
        if (!match) return null;

        // If we have capture groups, return the first one (index 1)
        // Index 0 is the full match, index 1+ are the capture groups
        return match.length > 1 ? match[1] : match[0];
      });
      return Array.isArray(strings) ? results : results[0];
    } catch {
      // Invalid regex - return null for all
      const results = new Array(stringArray.length).fill(null);
      return Array.isArray(strings) ? results : results[0];
    }
  } else {
    // Literal string search - return the pattern if found, null otherwise
    const results = stringArray.map((str) =>
      str.includes(pattern) ? pattern : null
    );
    return Array.isArray(strings) ? results : results[0];
  }
}

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
export function strExtractAll(strings: string[], pattern: string): string[][];

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
export function strExtractAll(string: string, pattern: string): string[];

export function strExtractAll(
  strings: string[] | string,
  pattern: string,
): string[][] | string[] {
  const stringArray = Array.isArray(strings) ? strings : [strings];

  // Check if pattern contains regex metacharacters
  const isRegex = /[.*+?^${}()|[\]\\]/.test(pattern);

  if (isRegex) {
    try {
      const regex = new RegExp(pattern, "g"); // Global flag for all matches
      const results = stringArray.map((str) => {
        const matches = str.match(regex);
        return matches || [];
      });
      return Array.isArray(strings) ? results : results[0];
    } catch {
      // Invalid regex - return empty arrays for all
      const results = stringArray.map(() => []);
      return Array.isArray(strings) ? results : results[0];
    }
  } else {
    // Literal string search - count occurrences and return array
    const results = stringArray.map((str) => {
      const count =
        (str.match(new RegExp(escapeRegExp(pattern), "g")) || []).length;
      return count > 0 ? new Array(count).fill(pattern) : [];
    });
    return Array.isArray(strings) ? results : results[0];
  }
}

/**
 * Escape special regex characters for literal string matching
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
