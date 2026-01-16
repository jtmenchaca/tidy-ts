# @tidy-ts/shims

Cross-runtime compatibility shims for Deno, Bun, and Node.js.

## Overview

This package provides runtime-agnostic APIs that work seamlessly across Deno, Bun, and Node.js:

- **Runtime Detection** - Detect which JavaScript runtime is executing
- **File System APIs** - Read/write files, create directories, copy, rename, etc.
- **Path Utilities** - Resolve paths, convert URLs to paths
- **Process APIs** - Environment variables, command-line arguments, process exit
- **Testing Framework** - Cross-runtime test API
- **Result Type System** - Type-safe error handling without exceptions
- **Enhanced Fetch API** - `tidyfetch` with Result-based error handling, retries, timeouts, and more

## Installation

### Deno

```typescript
import { readTextFile, tidyfetch, ok, err } from "jsr:@tidy-ts/shims";
```

### npm

```bash
npm install @tidy-ts/shims
```

```typescript
import { readTextFile, tidyfetch, ok, err } from "@tidy-ts/shims";
```

## Result Type System

The Result type provides explicit error handling without exceptions. Functions return `Result<T, E>` instead of throwing.

```typescript
import { ok, err, type Result } from "@tidy-ts/shims";

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err("Division by zero");
  return ok(a / b);
}

const result = divide(10, 2);
if (result.ok) {
  console.log(result.value); // 5
} else {
  console.error(result.error);
}
```

### Custom Error Types

Use `defineError` to create typed error classes:

```typescript
import { defineError, type AppError } from "@tidy-ts/shims";

const ValidationError = defineError(
  "ValidationError",
  ({ field, message }: { field: string; message: string }) =>
    `Validation failed for ${field}: ${message}`
);

type ValidationError = AppError<"ValidationError", { field: string; message: string }>;

const error = new ValidationError({ field: "email", message: "Invalid format" });
console.log(error.name);  // "ValidationError"
console.log(error.field); // "email"
```

## Enhanced Fetch API (tidyfetch)

`tidyfetch` provides a Result-based fetch with automatic JSON parsing, retries, timeouts, and typed errors.

### Basic Usage

```typescript
import { tidyfetch } from "@tidy-ts/shims";

interface User {
  id: number;
  name: string;
}

const result = await tidyfetch<User>("/api/users/1");

if (result.ok) {
  console.log(result.value.name); // Type-safe access
} else {
  console.error(result.error.message);
}
```

### POST with Auto JSON

```typescript
const result = await tidyfetch<User>("/api/users", {
  method: "POST",
  body: { name: "Alice", email: "alice@example.com" }, // Auto-stringified
});
```

### Error Handling

```typescript
import { tidyfetch, HTTPError, TimeoutError, NetworkError } from "@tidy-ts/shims";

const result = await tidyfetch("/api/data", { timeout: 5000 });

if (!result.ok) {
  if (result.error instanceof HTTPError) {
    console.log(`HTTP ${result.error.statusCode}: ${result.error.statusText}`);
    console.log("Body:", result.error.body);
  } else if (result.error instanceof TimeoutError) {
    console.log(`Timed out after ${result.error.timeout}ms`);
  } else if (result.error instanceof NetworkError) {
    console.log("Network error:", result.error.cause);
  }
}
```

### Retries

```typescript
const result = await tidyfetch("/api/data", {
  retry: 3,
  retryDelay: 1000,
  retryStatusCodes: [500, 502, 503, 504],
});
```

### Factory Pattern

Create preconfigured instances for API clients:

```typescript
const api = tidyfetch.create({
  baseURL: "https://api.example.com",
  headers: { Authorization: `Bearer ${token}` },
  timeout: 10000,
});

const result = await api<User[]>("/users");
```

### HTTP Method Shortcuts

```typescript
await tidyfetch.get<User[]>("/users");
await tidyfetch.post<User>("/users", { body: { name: "Alice" } });
await tidyfetch.put<User>("/users/1", { body: { name: "Bob" } });
await tidyfetch.patch<User>("/users/1", { body: { name: "Charlie" } });
await tidyfetch.delete("/users/1");
```

### Raw Response Access

Access response headers and status alongside parsed data:

```typescript
const result = await tidyfetch.raw<User>("/api/users/1");

if (result.ok) {
  console.log(result.value.status);                      // 200
  console.log(result.value.headers.get("x-rate-limit")); // "100"
  console.log(result.value._data.name);                  // Parsed data
}
```

### Query Parameters

```typescript
const result = await tidyfetch("/api/search", {
  query: { q: "typescript", page: 1, limit: 20 },
});
// Fetches: /api/search?q=typescript&page=1&limit=20
```

### Interceptors

```typescript
const result = await tidyfetch("/api/data", {
  onRequest({ options }) {
    options.headers?.set("X-Request-ID", crypto.randomUUID());
  },
  onResponse({ response }) {
    console.log(`Response: ${response.status}`);
  },
  onResponseError({ error }) {
    console.error("Request failed:", error);
  },
});
```

### Error Types

- `HTTPError` - Non-2xx status (has `statusCode`, `statusText`, `body`, `response`)
- `TimeoutError` - Request timed out (has `timeout`)
- `NetworkError` - Network failure (has `cause`)
- `ParseError` - JSON parse failed (has `body`, `cause`)
- `AbortError` - Request aborted

## Runtime Detection

```typescript
import { Runtime, getCurrentRuntime, currentRuntime } from "@tidy-ts/shims";

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
import { readTextFile, readFile } from "@tidy-ts/shims";

// Text file
const content = await readTextFile("./file.txt");

// Binary file
const data = await readFile("./image.png");
```

### Writing Files

```typescript
import { writeTextFile, writeFile } from "@tidy-ts/shims";

await writeTextFile("./output.txt", "Hello, World!");
await writeFile("./output.bin", new Uint8Array([1, 2, 3]));
```

### Directories

```typescript
import { mkdir, remove, listDir, exists } from "@tidy-ts/shims";

await mkdir("./my-dir", { recursive: true });
await remove("./my-dir", { recursive: true });

const entries = await listDir("./src");
for (const entry of entries) {
  console.log(entry.name, entry.isDirectory ? "dir" : "file");
}

if (await exists("./config.json")) {
  // File exists
}
```

### File Operations

```typescript
import { copyFile, rename, stat } from "@tidy-ts/shims";

await copyFile("./source.txt", "./dest.txt");
await rename("./old.txt", "./new.txt");

const info = await stat("./file.txt");
console.log(`Size: ${info.size}, Modified: ${info.mtime}`);
```

## Path Utilities

```typescript
import { resolve, dirname, fileURLToPath, pathToFileURL } from "@tidy-ts/shims";

const absPath = resolve("./data", "file.txt");
const dir = dirname("/path/to/file.txt"); // "/path/to"

const filePath = fileURLToPath(import.meta.url);
const url = pathToFileURL("/path/to/file.txt");
```

## Process APIs

### Environment Variables

```typescript
import { env } from "@tidy-ts/shims";

const apiKey = env.get("API_KEY");
env.set("DEBUG", "true");
env.delete("TEMP_VAR");
const allEnv = env.toObject();
```

### Loading .env Files

```typescript
import { env } from "@tidy-ts/shims";

// Load from .env file
await env.loadFromFile(".env");

// Load multiple files (later files take precedence)
await env.loadFromFile([".env", ".env.local", ".env.production"]);

// Load without exporting to process environment
const config = await env.loadFromFile(".env", { export: false });
```

### Command Line Arguments

```typescript
import { args, getArgs } from "@tidy-ts/shims";

console.log(args); // Frozen array
const freshArgs = getArgs(); // Fresh copy
```

### Process Exit

```typescript
import { exit } from "@tidy-ts/shims";

exit(0); // Success
exit(1); // Error
```

### Import Meta Utilities

```typescript
import { importMeta } from "@tidy-ts/shims";

if (importMeta.main) {
  console.log("Running as main script");
}

const currentFile = importMeta.getFilename();
const currentDir = importMeta.getDirname();
```

## Testing Framework

Unified test API across runtimes:

```typescript
import { test } from "@tidy-ts/shims";

test("my test", async () => {
  const result = await someAsyncOperation();
  if (result !== expected) {
    throw new Error("Test failed");
  }
});

test("with timeout", async () => {
  await longRunningOperation();
}, { timeout: 5000 });

test("skip this", () => {
  // Skipped
}, { skip: true });
```

## Error Types

```typescript
import { UnavailableAPIError, UnsupportedRuntimeError } from "@tidy-ts/shims";

try {
  // Some operation
} catch (error) {
  if (error instanceof UnavailableAPIError) {
    console.error(`API not available: ${error.message}`);
  } else if (error instanceof UnsupportedRuntimeError) {
    console.error(`Unsupported runtime: ${error.message}`);
  }
}
```

## Compression Stream Polyfill

Automatically initializes `CompressionStream` and `DecompressionStream` polyfills when imported:

```typescript
import "@tidy-ts/shims";

const stream = new CompressionStream("deflate");
```

## License

MIT

## Attribution

This package is inspired by and based on:
- [@cross/test](https://github.com/cross-org/test) - Cross-runtime testing framework
- [@cross/runtime](https://github.com/cross-org/runtime) - Runtime detection utilities
