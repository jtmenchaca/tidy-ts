# @tidy-ts/shims

Cross-runtime compatibility shims for Deno, Bun, and Node.js.

## Overview

This package provides runtime-agnostic APIs that work seamlessly across Deno, Bun, and Node.js. It includes:

- **Runtime Detection**: Detect which JavaScript runtime is executing
- **File System APIs**: Read/write files, create directories, etc.
- **Process APIs**: Environment variables, command-line arguments, process exit
- **Testing Framework**: Cross-runtime test API compatible with Deno, Bun, and Node.js

## Installation

### Deno

```typescript
import { readTextFile, test, Runtime } from "jsr:@tidy-ts/shims";
```

### npm

```bash
npm install @tidy-ts/shims
```

```typescript
import { readTextFile, test, Runtime } from "@tidy-ts/shims";
```

## Runtime Detection

```typescript
import { Runtime, getCurrentRuntime, currentRuntime } from "@tidy-ts/shims";

// Detect runtime
const runtime = getCurrentRuntime();
if (runtime === Runtime.Deno) {
  console.log("Running in Deno");
}

// Or use the cached value
console.log(`Current runtime: ${currentRuntime}`);
```

### Supported Runtimes

- `Runtime.Deno` - Deno runtime
- `Runtime.Bun` - Bun runtime
- `Runtime.Node` - Node.js runtime
- `Runtime.Browser` - Web browser environment
- `Runtime.Tauri` - Tauri desktop app framework
- `Runtime.Workerd` - Cloudflare Workers
- `Runtime.Netlify` - Netlify Edge Functions
- `Runtime.EdgeLight` - Edge runtime (Vercel, etc.)
- `Runtime.Fastly` - Fastly Compute@Edge

## File System APIs

### Reading Files

```typescript
import { readTextFile } from "@tidy-ts/shims";

const content = await readTextFile("./file.txt");
console.log(content);
```

### Writing Files

```typescript
import { writeTextFile } from "@tidy-ts/shims";

await writeTextFile("./output.txt", "Hello, World!");
```

### Directories

```typescript
import { mkdir, remove } from "@tidy-ts/shims";

// Create directory
await mkdir("./my-dir", { recursive: true });

// Remove file or directory
await remove("./my-dir", { recursive: true });
```

## Process APIs

### Environment Variables

```typescript
import { env } from "@tidy-ts/shims";

// Get a specific variable
const apiKey = env.get("API_KEY");

// Set a variable
env.set("DEBUG", "true");

// Delete a variable
env.delete("TEMP_VAR");

// Get all variables
const allEnv = env.toObject();
```

### Loading .env Files

The `env` object provides methods to load environment variables from `.env` files:

```typescript
import { env } from "@tidy-ts/shims";

// Load from a single .env file (exports to environment by default)
await env.loadFromFile(".env");

// Load from multiple files (later files take precedence in returned object)
const config = await env.loadFromFile([".env", ".env.local", ".env.production"]);

// Load without exporting to process environment
const config = await env.loadFromFile(".env", { export: false });

// Synchronous loading
const configSync = env.loadFromFileSync(".env");

// Load from URL
const config = await env.loadFromFile(new URL("file:///path/to/.env"));
```

**Key behaviors:**
- Files are loaded in order; later files override earlier ones in the returned object
- When `export: true` (default), variables are set in the process environment
- Existing environment variables are never overridden (environment takes precedence)
- If a file doesn't exist, it's silently skipped
- Supports variable expansion: `${VAR}` or `$VAR` with optional defaults `${VAR:-default}`
- Handles quoted values, comments, and multiline strings

### Command Line Arguments

```typescript
import { args, getArgs } from "@tidy-ts/shims";

// Get arguments (frozen array)
console.log(args);

// Or get fresh copy
const freshArgs = getArgs();
```

### Process Exit

```typescript
import { exit } from "@tidy-ts/shims";

exit(0); // Exit with success code
```

### Import Meta Utilities

```typescript
import { importMeta } from "@tidy-ts/shims";

// Check if this is the main module
if (importMeta.main) {
  console.log("Running as main script");
}

// Get current module URL
const moduleUrl = importMeta.url;

// Get current file path
const currentFile = importMeta.getFilename();
const currentDir = importMeta.getDirname();

// Convert URL to file path
const path = importMeta.urlToPath("file:///path/to/file.ts");
```

## Testing Framework

The testing framework provides a unified API across runtimes. The `test` function accepts either a simple async function or a test subject with context and done callback.

```typescript
import { test } from "@tidy-ts/shims";

// Simple async test (recommended)
test("my test", async () => {
  const result = await someAsyncOperation();
  if (result !== expected) {
    throw new Error("Test failed");
  }
});

// Test with options
test(
  "timeout test",
  async () => {
    await longRunningOperation();
  },
  { timeout: 5000, skip: false }
);

// Test with callback pattern (for callback-style async operations)
test("callback test", (context, done) => {
  someAsyncOperation((err, result) => {
    if (err) {
      done(err);
      return;
    }
    done();
  });
}, { waitForCallback: true });

// Test with runtime-specific context
test("test with context", (context, done) => {
  // context varies by runtime (Deno.TestContext, Node.js TestContext, etc.)
  // Use done() to signal completion for callback-style tests
  done();
}, { waitForCallback: true });
```

### Test Options

- `timeout?: number` - Test timeout in milliseconds
- `skip?: boolean` - Skip this test
- `waitForCallback?: boolean` - Wait for done callback (for callback-style tests)

### Test Function Signatures

The `test` function accepts two forms:

1. **Simple async function**: `test(name: string, fn: () => void | Promise<void>, options?)`
   - Use this for most tests - just throw an error to fail
   
2. **Test subject with context**: `test(name: string, fn: (context, done) => void | Promise<void>, options?)`
   - Use this when you need runtime-specific test context or callback pattern
   - Set `waitForCallback: true` in options to wait for `done()` callback

## Error Types

The package exports error types for better error handling:

```typescript
import { UnavailableAPIError, UnsupportedRuntimeError } from "@tidy-ts/shims";

try {
  // Some operation that might fail
} catch (error) {
  if (error instanceof UnavailableAPIError) {
    console.error(`API not available: ${error.message}`);
  } else if (error instanceof UnsupportedRuntimeError) {
    console.error(`Unsupported runtime: ${error.message}`);
  }
}
```

- `UnavailableAPIError` - Thrown when a required API is not available in the current runtime
- `UnsupportedRuntimeError` - Thrown when the runtime is not supported

## Compression Stream Polyfill

The package automatically initializes polyfills for `CompressionStream` and `DecompressionStream` when imported. This ensures these Web Streams Compression APIs are available in Node.js and Bun environments that don't natively support them.

```typescript
import "@tidy-ts/shims"; // Automatically initializes compression polyfills

// Now CompressionStream and DecompressionStream are available
const stream = new CompressionStream("deflate");
```

## License

MIT

## Attribution

This package is inspired by and based on:
- [@cross/test](https://github.com/cross-org/test) - Cross-runtime testing framework
- [@cross/runtime](https://github.com/cross-org/runtime) - Runtime detection utilities

Special thanks to the developers and contributors of these excellent cross-runtime tools.

