# Str

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [str.detect](#strdetect)
- [str.length](#strlength)
- [str.replace](#strreplace)
- [str.replaceAll](#strreplaceall)
- [str.extract](#strextract)
- [str.extractAll](#strextractall)
- [str.split](#strsplit)
- [str.splitFixed](#strsplitfixed)

---

## str.detect

Detect if strings match a pattern (regex or literal). Automatically detects if pattern contains regex metacharacters and treats it as regex or literal accordingly. Returns boolean for single string, array of booleans for array of strings.

### Signature

```typescript
str.detect(strings: string[], pattern: string): boolean[]
str.detect(string: string, pattern: string): boolean
```

### Import

```typescript
import { str } from "@tidy-ts/dataframe";
```

### Parameters

- `strings: string[] | string` - Array of strings or single string to test
- `pattern: string` - Regex pattern (e.g., `'[\w\.-]+@[\w\.-]+\.\w+'`) or literal string (e.g., `'hello'`) to search for

### Returns

`boolean[]` for array input, `boolean` for single string - indicates if each string matches the pattern

### Examples

```typescript
// Test if strings contain email patterns
const emails = ["user@example.com", "invalid-email", "admin@test.org"];
const hasEmail = str.detect(emails, "[\w\.-]+@[\w\.-]+\.\w+");
// [true, false, true]

// Test single string
const isValid = str.detect("user@example.com", "[\w\.-]+@[\w\.-]+\.\w+");
// true

// Literal string search
str.detect(["hello", "world"], "hello"); // [true, false]
```

### Best Practices

- ✓ GOOD: Use regex patterns for complex matching (emails, phone numbers, etc.)
- ✓ GOOD: Use literal strings for simple substring detection
- ✓ GOOD: Works with both arrays and single strings - no need to wrap single strings

### Anti-patterns

- ❌ BAD: Manually checking with includes() when regex would be clearer
- ❌ BAD: Creating RegExp objects manually when str.detect handles it automatically

### Related

`str.extract`, `str.replace`, `str.split`

---

## str.length

Get the length of strings. Returns number for single string, array of numbers for array of strings.

### Signature

```typescript
str.length(strings: string[]): number[]
str.length(string: string): number
```

### Import

```typescript
import { str } from "@tidy-ts/dataframe";
```

### Parameters

- `strings: string[] | string` - Array of strings or single string to measure

### Returns

`number[]` for array input, `number` for single string - length of each string

### Examples

```typescript
// Get lengths of multiple strings
const texts = ["hello", "world", "test"];
const lengths = str.length(texts);
// [5, 5, 4]

// Get length of single string
const length = str.length("hello");
// 5

// Use with DataFrame columns
df.mutate({ nameLength: row => str.length(row.name) })
```

### Best Practices

- ✓ GOOD: Use str.length() for consistency with other str methods
- ✓ GOOD: Works with both arrays and single strings

### Anti-patterns

- ❌ BAD: Using .length directly when you want consistency with str.* methods

### Related

`str.detect`, `str.split`

---

## str.replace

Replace first occurrence of a pattern in strings. Automatically detects if pattern contains regex metacharacters. Returns string for single input, array of strings for array input.

### Signature

```typescript
str.replace(strings: string[], pattern: string, replacement: string): string[]
str.replace(string: string, pattern: string, replacement: string): string
```

### Import

```typescript
import { str } from "@tidy-ts/dataframe";
```

### Parameters

- `strings: string[] | string` - Array of strings or single string to replace in
- `pattern: string` - Regex pattern or literal string to replace
- `replacement: string` - String to replace the pattern with

### Returns

`string[]` for array input, `string` for single string - strings with first occurrence replaced

### Examples

```typescript
// Replace first occurrence of 'old' with 'new'
const texts = ["old text", "older text", "new text"];
const updated = str.replace(texts, "old", "new");
// ["new text", "newer text", "new text"]

// Replace first occurrence in single string
const updated = str.replace("old text", "old", "new");
// "new text"

// Use regex pattern
str.replace("hello123", "\d+", "X"); // "helloX"
```

### Best Practices

- ✓ GOOD: Use str.replace() for replacing first occurrence only
- ✓ GOOD: Use str.replaceAll() when you need to replace all occurrences
- ✓ GOOD: Supports both regex and literal patterns automatically

### Anti-patterns

- ❌ BAD: Using str.replace() when you need to replace all occurrences (use str.replaceAll())

### Related

`str.replaceAll`, `str.extract`, `str.split`

---

## str.replaceAll

Replace all occurrences of a pattern in strings. Automatically detects if pattern contains regex metacharacters and uses global regex matching. Returns string for single input, array of strings for array input.

### Signature

```typescript
str.replaceAll(strings: string[], pattern: string, replacement: string): string[]
str.replaceAll(string: string, pattern: string, replacement: string): string
```

### Import

```typescript
import { str } from "@tidy-ts/dataframe";
```

### Parameters

- `strings: string[] | string` - Array of strings or single string to replace in
- `pattern: string` - Regex pattern or literal string to replace
- `replacement: string` - String to replace the pattern with

### Returns

`string[]` for array input, `string` for single string - strings with all occurrences replaced

### Examples

```typescript
// Replace all occurrences of 'old' with 'new'
const texts = ["old text", "older text", "new text"];
const updated = str.replaceAll(texts, "old", "new");
// ["new text", "newer text", "new text"]

// Replace all occurrences in single string
const updated = str.replaceAll("old old text", "old", "new");
// "new new text"

// Use regex pattern to replace all digits
str.replaceAll("hello123world456", "\d+", "X"); // "helloXworldX"
```

### Best Practices

- ✓ GOOD: Use str.replaceAll() when you need to replace all occurrences
- ✓ GOOD: Use str.replace() when you only need to replace the first occurrence
- ✓ GOOD: Automatically handles global regex matching

### Anti-patterns

- ❌ BAD: Using str.replace() in a loop to replace all occurrences

### Related

`str.replace`, `str.extract`, `str.split`

---

## str.extract

Extract first match of a pattern from strings. If pattern contains capture groups, returns the first capture group; otherwise returns the full match. Returns null if no match found. Returns string | null for single input, array of (string | null) for array input.

### Signature

```typescript
str.extract(strings: string[], pattern: string): (string | null)[]
str.extract(string: string, pattern: string): string | null
```

### Import

```typescript
import { str } from "@tidy-ts/dataframe";
```

### Parameters

- `strings: string[] | string` - Array of strings or single string to extract from
- `pattern: string` - Regex pattern with optional capture groups (e.g., `'user_id=(\d+)'`) or literal string

### Returns

`(string | null)[]` for array input, `string | null` for single string - extracted match or null if no match

### Examples

```typescript
// Extract user IDs from log entries
const logs = ["user_id=12345", "user_id=67890", "no_id_here"];
const userIds = str.extract(logs, "user_id=(\d+)");
// ["12345", "67890", null]

// Extract from single string
const id = str.extract("user_id=12345", "user_id=(\d+)");
// "12345"

// Extract email addresses
str.extract("Contact: user@example.com", "([\w\.-]+@[\w\.-]+\.\w+)");
// "user@example.com"
```

### Best Practices

- ✓ GOOD: Use capture groups `()` in regex to extract specific parts
- ✓ GOOD: Use str.extractAll() when you need all matches, not just the first
- ✓ GOOD: Handle null values when no match is found

### Anti-patterns

- ❌ BAD: Using str.extract() when you need all matches (use str.extractAll())
- ❌ BAD: Not handling null return values

### Related

`str.extractAll`, `str.detect`, `str.replace`

---

## str.extractAll

Extract all matches of a pattern from strings. Uses global regex matching to find all occurrences. Returns array of strings for single input, array of arrays for array input.

### Signature

```typescript
str.extractAll(strings: string[], pattern: string): string[][]
str.extractAll(string: string, pattern: string): string[]
```

### Import

```typescript
import { str } from "@tidy-ts/dataframe";
```

### Parameters

- `strings: string[] | string` - Array of strings or single string to extract from
- `pattern: string` - Regex pattern to find all matches

### Returns

`string[][]` for array input, `string[]` for single string - all matches for each string (empty array if no matches)

### Examples

```typescript
// Extract all numbers from strings
const texts = ["Score: 85, 92, 78", "No numbers here", "1, 2, 3, 4"];
const allNumbers = str.extractAll(texts, "\d+");
// [["85", "92", "78"], [], ["1", "2", "3", "4"]]

// Extract from single string
const numbers = str.extractAll("Score: 85, 92, 78", "\d+");
// ["85", "92", "78"]

// Extract all email addresses
str.extractAll("emails: a@b.com, c@d.org", "[\w\.-]+@[\w\.-]+\.\w+");
// ["a@b.com", "c@d.org"]
```

### Best Practices

- ✓ GOOD: Use str.extractAll() when you need all matches, not just the first
- ✓ GOOD: Use str.extract() when you only need the first match
- ✓ GOOD: Returns empty array for strings with no matches

### Anti-patterns

- ❌ BAD: Using str.extract() in a loop to get all matches

### Related

`str.extract`, `str.detect`, `str.split`

---

## str.split

Split strings by a delimiter or pattern. Automatically detects if pattern contains regex metacharacters. Returns array of strings for single input, array of arrays for array input.

### Signature

```typescript
str.split(strings: string[], pattern: string): string[][]
str.split(string: string, pattern: string): string[]
```

### Import

```typescript
import { str } from "@tidy-ts/dataframe";
```

### Parameters

- `strings: string[] | string` - Array of strings or single string to split
- `pattern: string` - Regex pattern (e.g., `',\s*'` for comma with optional whitespace) or literal string delimiter

### Returns

`string[][]` for array input, `string[]` for single string - split parts for each string

### Examples

```typescript
// Split by comma and optional whitespace
const texts = ["apple,banana,cherry", "red,green,blue"];
const split = str.split(texts, ",\s*");
// [["apple", "banana", "cherry"], ["red", "green", "blue"]]

// Split single string
const parts = str.split("apple,banana,cherry", ",");
// ["apple", "banana", "cherry"]

// Split by whitespace
str.split("hello world test", "\s+"); // ["hello", "world", "test"]
```

### Best Practices

- ✓ GOOD: Use regex patterns for complex delimiters (e.g., `',\s*'` for comma with optional space)
- ✓ GOOD: Use literal strings for simple delimiters
- ✓ GOOD: Use str.splitFixed() when you need a maximum number of parts

### Anti-patterns

- ❌ BAD: Using str.split() when you need to limit the number of parts (use str.splitFixed())

### Related

`str.splitFixed`, `str.extract`, `str.replace`

---

## str.splitFixed

Split strings by a delimiter or pattern into a fixed maximum number of parts. If splitting produces more than n parts, the first n-1 parts are kept and the remaining parts are combined into the last element. Returns array of strings for single input, array of arrays for array input.

### Signature

```typescript
str.splitFixed(strings: string[], pattern: string, n: number): string[][]
str.splitFixed(string: string, pattern: string, n: number): string[]
```

### Import

```typescript
import { str } from "@tidy-ts/dataframe";
```

### Parameters

- `strings: string[] | string` - Array of strings or single string to split
- `pattern: string` - Regex pattern or literal string delimiter
- `n: number` - Maximum number of parts to split into

### Returns

`string[][]` for array input, `string[]` for single string - split parts limited to n elements

### Examples

```typescript
// Split into maximum 3 parts
const texts = ["a-b-c-d-e", "x-y"];
const split = str.splitFixed(texts, "-", 3);
// [["a", "b", "c-d-e"], ["x", "y"]]

// Split single string into maximum 3 parts
const parts = str.splitFixed("a-b-c-d-e", "-", 3);
// ["a", "b", "c-d-e"]

// Parse 'last, first' names (limit to 2 parts)
str.splitFixed("Smith, John", ", ", 2); // ["Smith", "John"]
str.splitFixed("Smith, John, Jr.", ", ", 2); // ["Smith", "John, Jr."]
```

### Best Practices

- ✓ GOOD: Use str.splitFixed() when you need to limit the number of split parts
- ✓ GOOD: Useful for parsing structured data with known format
- ✓ GOOD: Remaining parts are combined into the last element when limit is exceeded

### Anti-patterns

- ❌ BAD: Using str.split() and manually slicing when you need a fixed number of parts

### Related

`str.split`, `str.extract`, `str.replace`

---
