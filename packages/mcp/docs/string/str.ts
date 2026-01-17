import type { DocEntry } from "../mcp-types.ts";

export const strDocs: Record<string, DocEntry> = {
  "str.detect": {
    name: "str.detect",
    category: "string",
    signature:
      "str.detect(strings: string[], pattern: string): boolean[]\nstr.detect(string: string, pattern: string): boolean",
    description:
      "Detect if strings match a pattern (regex or literal). Automatically detects if pattern contains regex metacharacters and treats it as regex or literal accordingly. Returns boolean for single string, array of booleans for array of strings.",
    imports: ['import { str } from "@tidy-ts/dataframe";'],
    parameters: [
      "`strings: string[] | string` - Array of strings or single string to test",
      "`pattern: string` - Regex pattern (e.g., `'[\\w\\.-]+@[\\w\\.-]+\\.\\w+'`) or literal string (e.g., `'hello'`) to search for",
    ],
    returns:
      "`boolean[]` for array input, `boolean` for single string - indicates if each string matches the pattern",
    examples: [
      "// Test if strings contain email patterns",
      'const emails = ["user@example.com", "invalid-email", "admin@test.org"];',
      'const hasEmail = str.detect(emails, "[\\w\\.-]+@[\\w\\.-]+\\.\\w+");',
      "// [true, false, true]",
      "",
      "// Test single string",
      'const isValid = str.detect("user@example.com", "[\\w\\.-]+@[\\w\\.-]+\\.\\w+");',
      "// true",
      "",
      "// Literal string search",
      'str.detect(["hello", "world"], "hello"); // [true, false]',
    ],
    bestPractices: [
      "✓ GOOD: Use regex patterns for complex matching (emails, phone numbers, etc.)",
      "✓ GOOD: Use literal strings for simple substring detection",
      "✓ GOOD: Works with both arrays and single strings - no need to wrap single strings",
    ],
    antiPatterns: [
      "❌ BAD: Manually checking with includes() when regex would be clearer",
      "❌ BAD: Creating RegExp objects manually when str.detect handles it automatically",
    ],
    related: ["str.extract", "str.replace", "str.split"],
  },

  "str.length": {
    name: "str.length",
    category: "string",
    signature:
      "str.length(strings: string[]): number[]\nstr.length(string: string): number",
    description:
      "Get the length of strings. Returns number for single string, array of numbers for array of strings.",
    imports: ['import { str } from "@tidy-ts/dataframe";'],
    parameters: [
      "`strings: string[] | string` - Array of strings or single string to measure",
    ],
    returns:
      "`number[]` for array input, `number` for single string - length of each string",
    examples: [
      "// Get lengths of multiple strings",
      'const texts = ["hello", "world", "test"];',
      "const lengths = str.length(texts);",
      "// [5, 5, 4]",
      "",
      "// Get length of single string",
      'const length = str.length("hello");',
      "// 5",
      "",
      "// Use with DataFrame columns",
      "df.mutate({ nameLength: row => str.length(row.name) })",
    ],
    bestPractices: [
      "✓ GOOD: Use str.length() for consistency with other str methods",
      "✓ GOOD: Works with both arrays and single strings",
    ],
    antiPatterns: [
      "❌ BAD: Using .length directly when you want consistency with str.* methods",
    ],
    related: ["str.detect", "str.split"],
  },

  "str.replace": {
    name: "str.replace",
    category: "string",
    signature:
      "str.replace(strings: string[], pattern: string, replacement: string): string[]\nstr.replace(string: string, pattern: string, replacement: string): string",
    description:
      "Replace first occurrence of a pattern in strings. Automatically detects if pattern contains regex metacharacters. Returns string for single input, array of strings for array input.",
    imports: ['import { str } from "@tidy-ts/dataframe";'],
    parameters: [
      "`strings: string[] | string` - Array of strings or single string to replace in",
      "`pattern: string` - Regex pattern or literal string to replace",
      "`replacement: string` - String to replace the pattern with",
    ],
    returns:
      "`string[]` for array input, `string` for single string - strings with first occurrence replaced",
    examples: [
      "// Replace first occurrence of 'old' with 'new'",
      'const texts = ["old text", "older text", "new text"];',
      'const updated = str.replace(texts, "old", "new");',
      '// ["new text", "newer text", "new text"]',
      "",
      "// Replace first occurrence in single string",
      'const updated = str.replace("old text", "old", "new");',
      '// "new text"',
      "",
      "// Use regex pattern",
      'str.replace("hello123", "\\d+", "X"); // "helloX"',
    ],
    bestPractices: [
      "✓ GOOD: Use str.replace() for replacing first occurrence only",
      "✓ GOOD: Use str.replaceAll() when you need to replace all occurrences",
      "✓ GOOD: Supports both regex and literal patterns automatically",
    ],
    antiPatterns: [
      "❌ BAD: Using str.replace() when you need to replace all occurrences (use str.replaceAll())",
    ],
    related: ["str.replaceAll", "str.extract", "str.split"],
  },

  "str.replaceAll": {
    name: "str.replaceAll",
    category: "string",
    signature:
      "str.replaceAll(strings: string[], pattern: string, replacement: string): string[]\nstr.replaceAll(string: string, pattern: string, replacement: string): string",
    description:
      "Replace all occurrences of a pattern in strings. Automatically detects if pattern contains regex metacharacters and uses global regex matching. Returns string for single input, array of strings for array input.",
    imports: ['import { str } from "@tidy-ts/dataframe";'],
    parameters: [
      "`strings: string[] | string` - Array of strings or single string to replace in",
      "`pattern: string` - Regex pattern or literal string to replace",
      "`replacement: string` - String to replace the pattern with",
    ],
    returns:
      "`string[]` for array input, `string` for single string - strings with all occurrences replaced",
    examples: [
      "// Replace all occurrences of 'old' with 'new'",
      'const texts = ["old text", "older text", "new text"];',
      'const updated = str.replaceAll(texts, "old", "new");',
      '// ["new text", "newer text", "new text"]',
      "",
      "// Replace all occurrences in single string",
      'const updated = str.replaceAll("old old text", "old", "new");',
      '// "new new text"',
      "",
      "// Use regex pattern to replace all digits",
      'str.replaceAll("hello123world456", "\\d+", "X"); // "helloXworldX"',
    ],
    bestPractices: [
      "✓ GOOD: Use str.replaceAll() when you need to replace all occurrences",
      "✓ GOOD: Use str.replace() when you only need to replace the first occurrence",
      "✓ GOOD: Automatically handles global regex matching",
    ],
    antiPatterns: [
      "❌ BAD: Using str.replace() in a loop to replace all occurrences",
    ],
    related: ["str.replace", "str.extract", "str.split"],
  },

  "str.extract": {
    name: "str.extract",
    category: "string",
    signature:
      "str.extract(strings: string[], pattern: string): (string | null)[]\nstr.extract(string: string, pattern: string): string | null",
    description:
      "Extract first match of a pattern from strings. If pattern contains capture groups, returns the first capture group; otherwise returns the full match. Returns null if no match found. Returns string | null for single input, array of (string | null) for array input.",
    imports: ['import { str } from "@tidy-ts/dataframe";'],
    parameters: [
      "`strings: string[] | string` - Array of strings or single string to extract from",
      "`pattern: string` - Regex pattern with optional capture groups (e.g., `'user_id=(\\d+)'`) or literal string",
    ],
    returns:
      "`(string | null)[]` for array input, `string | null` for single string - extracted match or null if no match",
    examples: [
      "// Extract user IDs from log entries",
      'const logs = ["user_id=12345", "user_id=67890", "no_id_here"];',
      'const userIds = str.extract(logs, "user_id=(\\d+)");',
      '// ["12345", "67890", null]',
      "",
      "// Extract from single string",
      'const id = str.extract("user_id=12345", "user_id=(\\d+)");',
      '// "12345"',
      "",
      "// Extract email addresses",
      'str.extract("Contact: user@example.com", "([\\w\\.-]+@[\\w\\.-]+\\.\\w+)");',
      '// "user@example.com"',
    ],
    bestPractices: [
      "✓ GOOD: Use capture groups `()` in regex to extract specific parts",
      "✓ GOOD: Use str.extractAll() when you need all matches, not just the first",
      "✓ GOOD: Handle null values when no match is found",
    ],
    antiPatterns: [
      "❌ BAD: Using str.extract() when you need all matches (use str.extractAll())",
      "❌ BAD: Not handling null return values",
    ],
    related: ["str.extractAll", "str.detect", "str.replace"],
  },

  "str.extractAll": {
    name: "str.extractAll",
    category: "string",
    signature:
      "str.extractAll(strings: string[], pattern: string): string[][]\nstr.extractAll(string: string, pattern: string): string[]",
    description:
      "Extract all matches of a pattern from strings. Uses global regex matching to find all occurrences. Returns array of strings for single input, array of arrays for array input.",
    imports: ['import { str } from "@tidy-ts/dataframe";'],
    parameters: [
      "`strings: string[] | string` - Array of strings or single string to extract from",
      "`pattern: string` - Regex pattern to find all matches",
    ],
    returns:
      "`string[][]` for array input, `string[]` for single string - all matches for each string (empty array if no matches)",
    examples: [
      "// Extract all numbers from strings",
      'const texts = ["Score: 85, 92, 78", "No numbers here", "1, 2, 3, 4"];',
      'const allNumbers = str.extractAll(texts, "\\d+");',
      '// [["85", "92", "78"], [], ["1", "2", "3", "4"]]',
      "",
      "// Extract from single string",
      'const numbers = str.extractAll("Score: 85, 92, 78", "\\d+");',
      '// ["85", "92", "78"]',
      "",
      "// Extract all email addresses",
      'str.extractAll("emails: a@b.com, c@d.org", "[\\w\\.-]+@[\\w\\.-]+\\.\\w+");',
      '// ["a@b.com", "c@d.org"]',
    ],
    bestPractices: [
      "✓ GOOD: Use str.extractAll() when you need all matches, not just the first",
      "✓ GOOD: Use str.extract() when you only need the first match",
      "✓ GOOD: Returns empty array for strings with no matches",
    ],
    antiPatterns: [
      "❌ BAD: Using str.extract() in a loop to get all matches",
    ],
    related: ["str.extract", "str.detect", "str.split"],
  },

  "str.split": {
    name: "str.split",
    category: "string",
    signature:
      "str.split(strings: string[], pattern: string): string[][]\nstr.split(string: string, pattern: string): string[]",
    description:
      "Split strings by a delimiter or pattern. Automatically detects if pattern contains regex metacharacters. Returns array of strings for single input, array of arrays for array input.",
    imports: ['import { str } from "@tidy-ts/dataframe";'],
    parameters: [
      "`strings: string[] | string` - Array of strings or single string to split",
      "`pattern: string` - Regex pattern (e.g., `',\\s*'` for comma with optional whitespace) or literal string delimiter",
    ],
    returns:
      "`string[][]` for array input, `string[]` for single string - split parts for each string",
    examples: [
      "// Split by comma and optional whitespace",
      'const texts = ["apple,banana,cherry", "red,green,blue"];',
      'const split = str.split(texts, ",\\s*");',
      '// [["apple", "banana", "cherry"], ["red", "green", "blue"]]',
      "",
      "// Split single string",
      'const parts = str.split("apple,banana,cherry", ",");',
      '// ["apple", "banana", "cherry"]',
      "",
      "// Split by whitespace",
      'str.split("hello world test", "\\s+"); // ["hello", "world", "test"]',
    ],
    bestPractices: [
      "✓ GOOD: Use regex patterns for complex delimiters (e.g., `',\\s*'` for comma with optional space)",
      "✓ GOOD: Use literal strings for simple delimiters",
      "✓ GOOD: Use str.splitFixed() when you need a maximum number of parts",
    ],
    antiPatterns: [
      "❌ BAD: Using str.split() when you need to limit the number of parts (use str.splitFixed())",
    ],
    related: ["str.splitFixed", "str.extract", "str.replace"],
  },

  "str.splitFixed": {
    name: "str.splitFixed",
    category: "string",
    signature:
      "str.splitFixed(strings: string[], pattern: string, n: number): string[][]\nstr.splitFixed(string: string, pattern: string, n: number): string[]",
    description:
      "Split strings by a delimiter or pattern into a fixed maximum number of parts. If splitting produces more than n parts, the first n-1 parts are kept and the remaining parts are combined into the last element. Returns array of strings for single input, array of arrays for array input.",
    imports: ['import { str } from "@tidy-ts/dataframe";'],
    parameters: [
      "`strings: string[] | string` - Array of strings or single string to split",
      "`pattern: string` - Regex pattern or literal string delimiter",
      "`n: number` - Maximum number of parts to split into",
    ],
    returns:
      "`string[][]` for array input, `string[]` for single string - split parts limited to n elements",
    examples: [
      "// Split into maximum 3 parts",
      'const texts = ["a-b-c-d-e", "x-y"];',
      'const split = str.splitFixed(texts, "-", 3);',
      '// [["a", "b", "c-d-e"], ["x", "y"]]',
      "",
      "// Split single string into maximum 3 parts",
      'const parts = str.splitFixed("a-b-c-d-e", "-", 3);',
      '// ["a", "b", "c-d-e"]',
      "",
      "// Parse 'last, first' names (limit to 2 parts)",
      'str.splitFixed("Smith, John", ", ", 2); // ["Smith", "John"]',
      'str.splitFixed("Smith, John, Jr.", ", ", 2); // ["Smith", "John, Jr."]',
    ],
    bestPractices: [
      "✓ GOOD: Use str.splitFixed() when you need to limit the number of split parts",
      "✓ GOOD: Useful for parsing structured data with known format",
      "✓ GOOD: Remaining parts are combined into the last element when limit is exceeded",
    ],
    antiPatterns: [
      "❌ BAD: Using str.split() and manually slicing when you need a fixed number of parts",
    ],
    related: ["str.split", "str.extract", "str.replace"],
  },
};

