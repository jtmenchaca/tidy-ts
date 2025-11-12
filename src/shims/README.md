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

// Get all variables
const allEnv = env.toObject();
```

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

// Get current file path
const currentFile = importMeta.getFilename();
const currentDir = importMeta.getDirname();
```

## Testing Framework

The testing framework provides a unified API across runtimes:

```typescript
import { test } from "@tidy-ts/shims";

// Simple async test
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

// Test with callback pattern
test("callback test", (context, done) => {
  someAsyncOperation((err, result) => {
    if (err) {
      done(err);
      return;
    }
    done();
  });
}, { waitForCallback: true });
```

### Test Options

- `timeout?: number` - Test timeout in milliseconds
- `skip?: boolean` - Skip this test
- `waitForCallback?: boolean` - Wait for done callback (for callback-style tests)

## Deno Compatibility Shim

For code that needs Deno-specific APIs:

```typescript
import { DenoShim } from "@tidy-ts/shims";

// Read directory synchronously
for (const entry of DenoShim.readDirSync("./dir")) {
  console.log(entry.name, entry.isFile, entry.isDirectory);
}

// Read file synchronously
const data = DenoShim.readFileSync("./file.bin");
const text = DenoShim.readTextFileSync("./file.txt");
```

## License

MIT

## Attribution

This package is inspired by and based on:
- [@cross/test](https://github.com/cross-org/test) - Cross-runtime testing framework
- [@cross/runtime](https://github.com/cross-org/runtime) - Runtime detection utilities

Special thanks to the developers and contributors of these excellent cross-runtime tools.

