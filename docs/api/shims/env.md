# Env

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [env](#env)
- [args](#args)
- [getArgs](#getargs)
- [exit](#exit)
- [test](#test)

---

## env

Access and modify environment variables in a runtime-agnostic way. Provides get() to retrieve individual variables, set() to modify them, delete() to remove them, toObject() to get all environment variables as an object, and loadFromFile() to load variables from .env files.

### Signature

```typescript
env.get(key: string): string | undefined
env.set(key: string, value: string): void
env.delete(key: string): void
env.toObject(): Record<string, string>
env.loadFromFile(path: string | string[] | URL, options?: { export?: boolean }): Promise<Record<string, string>>
env.loadFromFileSync(path: string | string[] | URL, options?: { export?: boolean }): Record<string, string>
```

### Import

```typescript
import { env } from "@tidy-ts/shims";
```

### Parameters

- key: Environment variable name
- value: Value to set (for set() method)
- path: File path(s) or URL to .env file(s) (for loadFromFile)
- options.export: Whether to export loaded vars to process environment (default: true)

### Returns

string | undefined (for get), void (for set/delete), Record<string, string> (for toObject/loadFromFile)

### Examples

```typescript
// Get environment variable
import { env } from "@tidy-ts/shims";

const apiKey = env.get("API_KEY");
if (!apiKey) {
  throw new Error("API_KEY not set");
}
// Set environment variable
env.set("DEBUG", "true");
env.set("LOG_LEVEL", "verbose");
// Delete environment variable
env.delete("TEMP_VAR");
// Get all environment variables
const allEnv = env.toObject();
console.log(allEnv);
// With default value
const port = env.get('PORT') || '3000';
// Load from .env file (exports to environment by default)
await env.loadFromFile(".env");
// Load from multiple files (later files override earlier ones)
const config = await env.loadFromFile([".env", ".env.local", ".env.production"]);
// Load without exporting to process environment
const config = await env.loadFromFile(".env", { export: false });
// Synchronous loading
const configSync = env.loadFromFileSync(".env");
// Load from URL
const config = await env.loadFromFile(new URL("file:///path/to/.env"));
```

### Best Practices

- ✓ GOOD: Use get() for reading variables
- ✓ GOOD: Use set() for temporarily modifying variables (e.g., in tests)
- ✓ GOOD: Always check for undefined when variable might not be set
- ✓ GOOD: Provide sensible defaults for optional config
- ✓ GOOD: Restore original values after temporary modifications
- ✓ GOOD: Use loadFromFile() at app startup to load .env configuration
- ✓ GOOD: Load multiple .env files in order of precedence (e.g., .env, .env.local)
- ✓ GOOD: Existing environment variables are never overridden by .env files

### Related

`args`, `exit`

---

## args

Command line arguments passed to the script. Frozen for immutability. Excludes runtime executable and script path (just the arguments).

### Signature

```typescript
const args: readonly string[]
```

### Import

```typescript
import { args } from "@tidy-ts/shims";
```

### Returns

readonly string[] - Array of command line arguments

### Examples

```typescript
// Access command line arguments
import { args } from "@tidy-ts/shims";

console.log("Arguments:", args);
if (args.length > 0) {
  console.log("First arg:", args[0]);
}
// Process flags
const verbose = args.includes('--verbose');
const debug = args.includes('--debug');
```

### Best Practices

- ✓ GOOD: Immutable array (readonly)
- ✓ GOOD: Excludes runtime name and script path

### Related

`getArgs`, `env`

---

## getArgs

Get command line arguments as a function call. Returns the same data as the args constant but as a function.

### Signature

```typescript
getArgs(): readonly string[]
```

### Import

```typescript
import { getArgs } from "@tidy-ts/shims";
```

### Returns

readonly string[] - Array of command line arguments

### Examples

```typescript
// Get arguments
import { getArgs } from "@tidy-ts/shims";

const arguments = getArgs();
console.log(arguments);
```

### Best Practices

- ✓ GOOD: Use args constant for simpler access

### Related

`args`

---

## exit

Exit the process with the given exit code. 0 indicates success, non-zero indicates failure. Never returns.

### Signature

```typescript
exit(code: number): never
```

### Import

```typescript
import { exit } from "@tidy-ts/shims";
```

### Parameters

- code: Exit code (0 = success, non-zero = failure)

### Returns

never - Function never returns

### Examples

```typescript
// Exit successfully
import { exit } from "@tidy-ts/shims";

exit(0);
// Exit with error
if (!config.isValid) {
  console.error('Invalid configuration');
  exit(1);
}
```

### Best Practices

- ✓ GOOD: Use 0 for success
- ✓ GOOD: Use non-zero (typically 1) for errors
- ✓ GOOD: Log error messages before exiting

### Related

`args`, `env`

---

## test

Cross-runtime testing framework that works identically in Deno, Bun, and Node.js. Define and execute tests with a unified API. Supports async tests, timeouts, and skip functionality.

### Signature

```typescript
test(name: string, testFn: (() => void | Promise<void>) | TestSubject, options?: WrappedTestOptions): Promise<void>
```

### Import

```typescript
import { test } from "@tidy-ts/shims";
```

### Parameters

- name: Test name/description
- testFn: Test function (async or sync)
- options.timeout: Timeout duration in milliseconds (optional)
- options.skip: Whether to skip the test (optional)
- options.waitForCallback: Wait for done callback in async tests (optional)

### Returns

Promise<void>

### Examples

```typescript
// Simple test
import { test } from "@tidy-ts/shims";

test("addition works", () => {
  const result = 1 + 1;
  if (result !== 2) throw new Error("Math is broken!");
});
// Async test
test("async operation", async () => {
  const data = await fetchData();
  if (!data) throw new Error("No data received");
});
// Test with timeout
test('slow operation', async () => {
  await slowOperation();
}, { timeout: 5000 });
// Skip test
test('not ready yet', () => {
  // Test code
}, { skip: true });
```

### Best Practices

- ✓ GOOD: Use async/await for async tests
- ✓ GOOD: Set reasonable timeouts for slow operations
- ✓ GOOD: Use skip: true for tests that aren't ready
- ✓ GOOD: Throw errors for test failures

### Anti-patterns

- ❌ BAD: Not setting timeouts on potentially slow tests
- ❌ BAD: Leaving skipped tests in codebase long-term

---
