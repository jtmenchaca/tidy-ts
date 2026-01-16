# Cross-Runtime Compatibility (Shims)

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [rename](#rename)
- [chunk](#chunk)
- [batch](#batch)
- [parallel](#parallel)
- [getCurrentRuntime](#getcurrentruntime)
- [currentRuntime](#currentruntime)
- [readFile](#readfile)
- [readTextFile](#readtextfile)
- [writeFile](#writefile)
- [writeTextFile](#writetextfile)
- [mkdir](#mkdir)
- [stat](#stat)
- [remove](#remove)
- [listDir](#listdir)
- [copyFile](#copyfile)
- [exists](#exists)
- [open](#open)
- [readFileSync](#readfilesync)
- [writeFileSync](#writefilesync)
- [writeTextFileSync](#writetextfilesync)
- [resolve](#resolve)
- [dirname](#dirname)
- [fileURLToPath](#fileurltopath)
- [pathToFileURL](#pathtofileurl)
- [env](#env)
- [args](#args)
- [getArgs](#getargs)
- [exit](#exit)
- [test](#test)
- [UnavailableAPIError](#unavailableapierror)
- [UnsupportedRuntimeError](#unsupportedruntimeerror)
- [tidyfetch](#tidyfetch)
- [tidyfetch.create](#tidyfetchcreate)
- [tidyfetch.get](#tidyfetchget)
- [tidyfetch.post](#tidyfetchpost)
- [tidyfetch.put](#tidyfetchput)
- [tidyfetch.patch](#tidyfetchpatch)
- [tidyfetch.delete](#tidyfetchdelete)
- [tidyfetch.raw](#tidyfetchraw)
- [tidyfetch.native](#tidyfetchnative)
- [Result](#result)
- [ok](#ok)
- [err](#err)
- [tryAsync](#tryasync)
- [TidyFetchError](#tidyfetcherror)
- [HTTPError](#httperror)
- [NetworkError](#networkerror)
- [TimeoutError](#timeouterror)
- [ParseError](#parseerror)
- [AbortError](#aborterror)
- [defineError](#defineerror)
- [FetchOptions](#fetchoptions)
- [RawResponse](#rawresponse)
- [encrypt](#encrypt)
- [decrypt](#decrypt)
- [encryptFields](#encryptfields)
- [decryptFields](#decryptfields)
- [rotateMasterKey](#rotatemasterkey)
- [CryptoError](#cryptoerror)
- [InvalidKeyError](#invalidkeyerror)
- [EncryptionError](#encryptionerror)
- [DecryptionError](#decryptionerror)
- [EnvelopeEncryptionError](#envelopeencryptionerror)
- [EnvelopeDecryptionError](#envelopedecryptionerror)
- [EnvelopeError](#envelopeerror)
- [InvalidKeyIdError](#invalidkeyiderror)
- [KeyNotFoundError](#keynotfounderror)
- [generateKey](#generatekey)
- [toBase64URL](#tobase64url)
- [fromBase64URL](#frombase64url)
- [RetryConfig](#retryconfig)
- [SettledResult](#settledresult)

---

## rename

Rename or move a file or directory. Can move across directories. Works consistently across Deno, Bun, and Node.js.

### Signature

```typescript
rename(oldPath: string, newPath: string): Promise<void>
```

### Import

```typescript
import { rename } from "@tidy-ts/shims";
```

### Parameters

- oldPath: Current file or directory path
- newPath: New file or directory path

### Returns

Promise<void>

### Examples

```typescript
// Rename file
import { rename } from "@tidy-ts/shims";

await rename("./old-name.txt", "./new-name.txt");
// Move file to different directory
await rename('./file.txt', './archive/file.txt');
// Rename directory
await rename('./old-folder', './new-folder');
// Move and rename
await rename('./data/temp.json', './output/results.json');
```

### Best Practices

- ✓ GOOD: Atomic operation (faster than copy + delete)
- ✓ GOOD: Works for both files and directories
- ✓ GOOD: Can move across directories

### Anti-patterns

- ❌ BAD: Using copyFile + remove when rename is faster

### Related

`copyFile`, `remove`, `exists`

---

## chunk

Split an array into chunks of a specified size. Synchronous utility function useful for batching operations, rate-limited APIs, or processing data in groups. The last chunk may have fewer elements than size.

### Signature

```typescript
chunk<T>(arr: T[], size: number): T[][]
```

### Import

```typescript
import { chunk } from "@tidy-ts/shims";
```

### Parameters

- arr: T[] - Array to split into chunks
- size: number - Size of each chunk (must be positive integer)

### Returns

T[][] - Array of chunks

### Examples

```typescript
// Basic chunking
import { chunk } from "@tidy-ts/shims";

const numbers = [1, 2, 3, 4, 5, 6, 7];
const chunks = chunk(numbers, 3);
// Returns: [[1, 2, 3], [4, 5, 6], [7]]
// Batch processing with chunk + batch
import { chunk, batch } from "@tidy-ts/shims";

const encounterIds = [1, 2, 3, ..., 100000];
const chunks = chunk(encounterIds, 25000); // Oracle limit

const results = await batch(
  chunks,
  (ids) => queryDatabase({ encounterIds: ids }),
  { concurrency: 1 }
);
const allResults = results.flat();
// Rate-limited API with waves
const items = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const waves = chunk(items, 3); // 3 per wave

for (const wave of waves) {
  await Promise.all(wave.map(processItem));
  await delay(1000); // Rate limit window
}
```

### Best Practices

- ✓ GOOD: Use with batch() for processing large datasets
- ✓ GOOD: Use for rate-limited APIs that allow N requests per window
- ✓ GOOD: Use for database queries with bind variable limits
- ❌ BAD: Using chunk size of 0 or negative (throws error)
- ❌ BAD: Using non-integer chunk size (throws error)

### Related

`parallel`, `batch`

---

## batch

Process an array of items with an async function and concurrency control. Each item is processed by the provided function with optional retry logic. More ergonomic than parallel() when you have items to transform rather than existing promises.

### Signature

```typescript
batch<T, R>(items: T[], fn: (item: T, index: number) => Promise<R>, options: { concurrency: number; retry?: RetryConfig; signal?: AbortSignal; settled?: boolean }): Promise<R[]>
```

### Import

```typescript
import { batch } from "@tidy-ts/shims";
import { batch, type RetryConfig } from "@tidy-ts/shims";
```

### Parameters

- items: T[] - Array of items to process
- fn: (item: T, index: number) => Promise<R> - Async function to apply to each item
- options.concurrency: number (required) - Maximum concurrent operations
- options.retry?: RetryConfig - Retry configuration with backoff strategy
- options.signal?: AbortSignal - Signal for cancellation
- options.settled?: boolean - If true, return all results like Promise.allSettled

### Returns

Promise<R[]> - Array of results in same order as input (or SettledResult<R>[] if settled: true)

### Examples

```typescript
// Process items with concurrency limit
import { batch } from "@tidy-ts/shims";

const users = await batch(
  userIds,
  async (id) => fetchUser(id),
  { concurrency: 5 }
);
// With retry on failures
const results = await batch(
  apiCalls,
  async (call) => makeRequest(call),
  {
    concurrency: 10,
    retry: {
      backoff: "exponential",
      maxRetries: 3,
    }
  }
);
// Sequential processing (concurrency: 1)
const results = await batch(
  items,
  async (item, index) => {
    console.log(`Processing item ${index}`);
    return processItem(item);
  },
  { concurrency: 1 }
);
// Collect all results even on failure
const results = await batch(items, fn, { concurrency: 5, settled: true });
const failures = results.filter(r => r.status === 'rejected');
```

### Best Practices

- ✓ GOOD: Use when transforming items with an async function
- ✓ GOOD: Combine with chunk() for rate-limited APIs
- ✓ GOOD: Use concurrency: 1 for sequential processing
- ✓ GOOD: Use settled: true to continue on errors and collect all results
- ❌ BAD: Using Infinity concurrency for rate-limited APIs

### Related

`parallel`, `chunk`, `RetryConfig`

---

## parallel

Process promises or promise-returning functions with concurrency control and optional retry logic. Like Promise.all but with a required concurrency limit. Supports retry with exponential/linear/custom backoff, AbortSignal for cancellation, and settled mode for collecting all results even on failures.

### Signature

```typescript
parallel<T>(promises: T[], options: { concurrency: number; retry?: RetryConfig; signal?: AbortSignal; settled?: boolean }): Promise<Results>
```

### Import

```typescript
import { parallel } from "@tidy-ts/shims";
import { parallel, type RetryConfig } from "@tidy-ts/shims";
```

### Parameters

- promises: Array of promises or functions returning promises
- options.concurrency: number (required) - Maximum concurrent operations
- options.retry?: RetryConfig - Retry configuration with backoff strategy
- options.signal?: AbortSignal - Signal for cancellation
- options.settled?: boolean - If true, return all results like Promise.allSettled

### Returns

Promise<T[]> - Array of results in same order as input (or SettledResult[] if settled: true)

### Examples

```typescript
// Basic concurrency control
import { parallel } from "@tidy-ts/shims";

const results = await parallel(
  [fetchUser(1), fetchUser(2), fetchUser(3)],
  { concurrency: 2 }
);
// With retry (pass functions for retry support)
const results = await parallel(
  [
    () => fetchUser(1),
    () => fetchUser(2),
    () => fetchUser(3),
  ],
  {
    concurrency: 5,
    retry: {
      backoff: "exponential",
      maxRetries: 3,
      baseDelay: 100,
    }
  }
);
// With timeout
const results = await parallel(tasks, {
  concurrency: 10,
  signal: AbortSignal.timeout(5000)
});
// Settled mode - collect all results even if some fail
const results = await parallel(tasks, { concurrency: 5, settled: true });
const successes = results.filter(r => r.status === 'fulfilled');
```

### Best Practices

- ✓ GOOD: Use when you have an array of promises to process with limits
- ✓ GOOD: Pass functions (not promises) when using retry - allows re-execution
- ✓ GOOD: Use settled: true when you need partial results on failure
- ✓ GOOD: Use AbortSignal.timeout() for request timeouts
- ❌ BAD: Passing already-created promises when using retry (can't re-execute)

### Related

`batch`, `chunk`, `RetryConfig`

---

## getCurrentRuntime

Detects the current JavaScript runtime environment. Returns an enum value identifying whether code is running in Deno, Bun, Node.js, Browser, or other environments. Useful for conditional logic based on runtime capabilities.

### Signature

```typescript
getCurrentRuntime(): Runtime
```

### Import

```typescript
import { getCurrentRuntime, Runtime } from "@tidy-ts/shims";
```

### Returns

Runtime enum value (Deno, Bun, Node, Browser, Tauri, Workerd, Netlify, EdgeLight, Fastly, or Unsupported)

### Examples

```typescript
// Detect current runtime
import { getCurrentRuntime, Runtime } from "@tidy-ts/shims";

const runtime = getCurrentRuntime();
if (runtime === Runtime.Deno) {
  console.log("Running in Deno");
} else if (runtime === Runtime.Node) {
  console.log("Running in Node.js");
}
// Use for conditional imports or logic
if (getCurrentRuntime() === Runtime.Browser) {
  // Browser-specific code
} else {
  // Server-side code
}
```

### Best Practices

- ✓ GOOD: Use for conditional logic based on runtime capabilities
- ✓ GOOD: Check runtime before using platform-specific APIs
- ✓ GOOD: Prefer runtime-agnostic shims over direct runtime checks when possible

### Related

`currentRuntime`

---

## currentRuntime

Cached runtime detection result. Determined once when module loads, providing fast access to runtime information without repeated detection.

### Signature

```typescript
const currentRuntime: Runtime
```

### Import

```typescript
import { currentRuntime, Runtime } from "@tidy-ts/shims";
```

### Returns

Runtime enum value (Deno, Bun, Node, Browser, Tauri, Workerd, Netlify, EdgeLight, Fastly, or Unsupported)

### Examples

```typescript
// Quick runtime check
import { currentRuntime, Runtime } from "@tidy-ts/shims";

if (currentRuntime === Runtime.Deno) {
  console.log("Running in Deno");
}
// Conditional configuration
const config = {
  timeout: currentRuntime === Runtime.Browser ? 5000 : 30000,
};
```

### Best Practices

- ✓ GOOD: Use this constant for performance (cached value)
- ✓ GOOD: Prefer over repeated getCurrentRuntime() calls

### Related

`getCurrentRuntime`

---

## readFile

Read a file asynchronously as binary data. Works identically across Deno, Bun, and Node.js runtimes, providing a unified API for file reading.

### Signature

```typescript
readFile(filePath: string): Promise<Uint8Array>
```

### Import

```typescript
import { readFile } from "@tidy-ts/shims";
```

### Parameters

- filePath: Path to the file to read

### Returns

Promise<Uint8Array> - The file contents as binary data

### Examples

```typescript
// Read binary file
import { readFile } from "@tidy-ts/shims";

const data = await readFile("./file.bin");
console.log(`Read ${data.length} bytes`);
// Convert to text if needed
const data = await readFile('./file.txt');
const text = new TextDecoder().decode(data);
```

### Best Practices

- ✓ GOOD: Use for binary files or when you need raw bytes
- ✓ GOOD: Use readTextFile() instead if reading text files

### Related

`readTextFile`, `readFileSync`, `writeFile`

---

## readTextFile

Read a text file asynchronously as a UTF-8 string. Automatically handles text encoding across all supported runtimes.

### Signature

```typescript
readTextFile(filePath: string): Promise<string>
```

### Import

```typescript
import { readTextFile } from "@tidy-ts/shims";
```

### Parameters

- filePath: Path to the text file to read

### Returns

Promise<string> - The file contents as a string

### Examples

```typescript
// Read text file
import { readTextFile } from "@tidy-ts/shims";

const content = await readTextFile("./config.json");
const config = JSON.parse(content);
// Read and process text
const markdown = await readTextFile('./README.md');
const lines = markdown.split('\n');
```

### Best Practices

- ✓ GOOD: Use for text files (UTF-8 encoding assumed)
- ✓ GOOD: Preferred over readFile() for text content

### Related

`readFile`, `writeTextFile`, `readFileSync`

---

## writeFile

Write a file asynchronously with binary data. Automatically creates parent directories if they don't exist. Works consistently across Deno, Bun, and Node.js.

### Signature

```typescript
writeFile(filePath: string, data: Uint8Array, options?: { create?: boolean; mode?: number }): Promise<void>
```

### Import

```typescript
import { writeFile } from "@tidy-ts/shims";
```

### Parameters

- filePath: Path to the file to write
- data: The binary data to write (Uint8Array)
- options.create: Whether to create the file if it doesn't exist (default: true)
- options.mode: File permissions mode (Unix-style, optional)

### Returns

Promise<void>

### Examples

```typescript
// Write binary data
import { writeFile } from "@tidy-ts/shims";

const data = new Uint8Array([1, 2, 3, 4, 5]);
await writeFile("./output.bin", data);
// Parent directories are created automatically
await writeFile("./deeply/nested/path/file.bin", data);
// Convert text to bytes
const text = 'Hello, World!';
const bytes = new TextEncoder().encode(text);
await writeFile('./message.txt', bytes);
```

### Best Practices

- ✓ GOOD: Use for binary files or when you have Uint8Array data
- ✓ GOOD: Use writeTextFile() instead for text content
- ✓ GOOD: Parent directories are automatically created

### Related

`writeTextFile`, `readFile`, `writeFileSync`

---

## writeTextFile

Write a text file asynchronously. Automatically creates parent directories if they don't exist. Handles UTF-8 encoding automatically.

### Signature

```typescript
writeTextFile(filePath: string, data: string, options?: { create?: boolean; mode?: number }): Promise<void>
```

### Import

```typescript
import { writeTextFile } from "@tidy-ts/shims";
```

### Parameters

- filePath: Path to the file to write
- data: The text content to write
- options.create: Whether to create the file if it doesn't exist (default: true)
- options.mode: File permissions mode (Unix-style, optional)

### Returns

Promise<void>

### Examples

```typescript
// Write text file
import { writeTextFile } from "@tidy-ts/shims";

await writeTextFile("./output.txt", "Hello, World!");
// Write JSON
const data = { name: "Alice", age: 30 };
await writeTextFile("./data.json", JSON.stringify(data, null, 2));
// Parent directories are created automatically
await writeTextFile("./logs/2024/app.log", "Application started");
```

### Best Practices

- ✓ GOOD: Preferred method for writing text files
- ✓ GOOD: UTF-8 encoding is automatic
- ✓ GOOD: Parent directories are automatically created

### Related

`writeFile`, `readTextFile`, `writeTextFileSync`

---

## mkdir

Create a directory. Supports recursive directory creation to make nested paths in one call.

### Signature

```typescript
mkdir(dirPath: string, options?: { recursive?: boolean; mode?: number }): Promise<void>
```

### Import

```typescript
import { mkdir } from "@tidy-ts/shims";
```

### Parameters

- dirPath: Path to the directory to create
- options.recursive: Create parent directories if needed (default: false)
- options.mode: Directory permissions mode (Unix-style, optional)

### Returns

Promise<void>

### Examples

```typescript
// Create single directory
import { mkdir } from "@tidy-ts/shims";

await mkdir("./my-dir");
// Create nested directories
await mkdir("./path/to/nested/dir", { recursive: true });
```

### Best Practices

- ✓ GOOD: Use recursive: true for nested paths
- ✓ GOOD: writeFile/writeTextFile auto-create parent dirs, so mkdir often unnecessary

### Related

`writeFile`, `writeTextFile`, `remove`

---

## stat

Get file or directory statistics including size, type, and timestamps. Works consistently across all supported runtimes.

### Signature

```typescript
stat(filePath: string): Promise<{ size: number; isFile: boolean; isDirectory: boolean; mtime: Date | null; atime: Date | null; birthtime: Date | null }>
```

### Import

```typescript
import { stat } from "@tidy-ts/shims";
```

### Parameters

- filePath: Path to the file or directory

### Returns

Promise with size (bytes), isFile, isDirectory, mtime (modification time), atime (access time), birthtime (creation time)

### Examples

```typescript
// Get file info
import { stat } from "@tidy-ts/shims";

const info = await stat("./file.txt");
console.log(`File size: ${info.size} bytes`);
console.log(`Is file: ${info.isFile}`);
console.log(`Modified: ${info.mtime}`);
// Check if path is directory
const info = await stat('./my-dir');
if (info.isDirectory) {
  console.log('This is a directory');
}
```

### Best Practices

- ✓ GOOD: Use to check file size before reading
- ✓ GOOD: Use to differentiate files from directories

### Related

`readFile`, `writeFile`

---

## remove

Remove a file or directory. Supports recursive deletion of directories and their contents. Does not throw if file doesn't exist.

### Signature

```typescript
remove(filePath: string, options?: { recursive?: boolean }): Promise<void>
```

### Import

```typescript
import { remove } from "@tidy-ts/shims";
```

### Parameters

- filePath: Path to the file or directory to remove
- options.recursive: Remove directory and all contents (required for non-empty directories)

### Returns

Promise<void>

### Examples

```typescript
// Remove file
import { remove } from "@tidy-ts/shims";

await remove("./file.txt");
// Remove directory and contents
await remove("./my-dir", { recursive: true });
// Safe to call on non-existent files (no error thrown)
await remove('./maybe-exists.txt');
```

### Best Practices

- ✓ GOOD: Use recursive: true for directories with contents
- ✓ GOOD: Safe to call on non-existent paths

### Anti-patterns

- ❌ BAD: Forgetting recursive: true when removing non-empty directories

### Related

`writeFile`, `mkdir`, `exists`

---

## listDir

List files and directories in a directory. Returns an array of directory entries with name and type information. Works consistently across Deno, Bun, and Node.js.

### Signature

```typescript
listDir(dirPath: string): Promise<DirEntry[]>
```

### Import

```typescript
import { listDir } from "@tidy-ts/shims";
```

### Parameters

- dirPath: Path to the directory to list

### Returns

Promise<DirEntry[]> - Array of entries with name, isFile, isDirectory, isSymbolicLink

### Examples

```typescript
// List directory contents
import { listDir } from "@tidy-ts/shims";

const entries = await listDir("./my-dir");
for (const entry of entries) {
  if (entry.isDirectory) {
    console.log(`📁 ${entry.name}`);
  } else {
    console.log(`📄 ${entry.name}`);
  }
}
// Filter files only
const files = entries.filter(e => e.isFile);
console.log(`Found ${files.length} files`);
// Find subdirectories
const dirs = entries.filter(e => e.isDirectory);
dirs.forEach(dir => console.log(dir.name));
```

### Best Practices

- ✓ GOOD: Use to enumerate directory contents
- ✓ GOOD: Check isFile and isDirectory to determine entry type
- ✓ GOOD: Combine with stat() for detailed file information

### Related

`mkdir`, `stat`, `exists`

---

## copyFile

Copy a file from source to destination. By default overwrites if destination exists. Works consistently across Deno, Bun, and Node.js.

### Signature

```typescript
copyFile(src: string, dest: string, options?: { overwrite?: boolean }): Promise<void>
```

### Import

```typescript
import { copyFile } from "@tidy-ts/shims";
```

### Parameters

- src: Source file path
- dest: Destination file path
- options.overwrite: Whether to overwrite existing file (default: true)

### Returns

Promise<void>

### Examples

```typescript
// Copy file (overwrites by default)
import { copyFile } from "@tidy-ts/shims";

await copyFile("./source.txt", "./destination.txt");
// Copy without overwriting
await copyFile('./source.txt', './dest.txt', { overwrite: false });
// Throws error if destination exists
// Backup file
const timestamp = new Date().toISOString().replace(/:/g, '-');
await copyFile('./data.json', `./backups/data-${timestamp}.json`);
```

### Best Practices

- ✓ GOOD: Default behavior overwrites existing files
- ✓ GOOD: Use overwrite: false to prevent accidental overwrites
- ✓ GOOD: Great for creating backups or duplicating files

### Anti-patterns

- ❌ BAD: Using readFile + writeFile when copyFile is simpler

### Related

`rename`, `readFile`, `writeFile`

---

## exists

Check if a file or directory exists. Returns true if path exists, false otherwise. Does not throw errors. Works consistently across Deno, Bun, and Node.js.

### Signature

```typescript
exists(filePath: string): Promise<boolean>
```

### Import

```typescript
import { exists } from "@tidy-ts/shims";
```

### Parameters

- filePath: Path to check for existence

### Returns

Promise<boolean> - true if exists, false otherwise

### Examples

```typescript
// Check if file exists
import { exists } from "@tidy-ts/shims";

if (await exists("./config.json")) {
  console.log("Config file found");
} else {
  console.log("Config file missing");
}
// Conditional file creation
if (!await exists('./data.json')) {
  await writeTextFile('./data.json', '[]');
}
// Check directory
if (await exists('./logs')) {
  console.log('Logs directory exists');
}
```

### Best Practices

- ✓ GOOD: Convenient boolean check for existence
- ✓ GOOD: Never throws errors (returns false for non-existent paths)
- ✓ GOOD: Use before reading files to avoid errors

### Anti-patterns

- ❌ BAD: Race conditions (file may be deleted between exists() and readFile())

### Related

`stat`, `readFile`, `writeFile`

---

## open

Open a file for reading or writing with fine-grained control. Returns a file handle with read() and close() methods. Useful for reading large files in chunks.

### Signature

```typescript
open(filePath: string, mode?: "r" | "w" | "a" | "r+" | "w+" | "a+"): Promise<FileHandle>
```

### Import

```typescript
import { open } from "@tidy-ts/shims";
```

### Parameters

- filePath: Path to the file to open
- mode: File mode - "r" (read), "w" (write), "a" (append), "r+" (read/write), etc.

### Returns

Promise<FileHandle> with read(buffer, offset, length, position) and close() methods

### Examples

```typescript
// Read file in chunks
import { open } from "@tidy-ts/shims";

const file = await open("./large-file.bin", "r");
const buffer = new Uint8Array(1024);
const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
console.log(`Read ${bytesRead} bytes`);
await file.close();
```

### Best Practices

- ✓ GOOD: Use for reading large files in chunks
- ✓ GOOD: Always call close() when done
- ✓ GOOD: Use readFile() for small files instead

### Related

`readFile`, `writeFile`

---

## readFileSync

Read a file synchronously as binary data. Blocks execution until file is read. Use async readFile() when possible for better performance.

### Signature

```typescript
readFileSync(filePath: string): Uint8Array
```

### Import

```typescript
import { readFileSync } from "@tidy-ts/shims";
```

### Parameters

- filePath: Path to the file to read

### Returns

Uint8Array - The file contents as binary data

### Examples

```typescript
// Read file synchronously
import { readFileSync } from "@tidy-ts/shims";

const data = readFileSync("./config.bin");
```

### Best Practices

- ✓ GOOD: Only use when async I/O is not possible
- ✓ GOOD: Prefer async readFile() for better performance

### Anti-patterns

- ❌ BAD: Using sync I/O in async contexts (blocks event loop)

### Related

`readFile`, `writeFileSync`

---

## writeFileSync

Write a file synchronously with binary or text data. Blocks execution until write completes. Automatically creates parent directories.

### Signature

```typescript
writeFileSync(filePath: string, data: Uint8Array | string): void
```

### Import

```typescript
import { writeFileSync } from "@tidy-ts/shims";
```

### Parameters

- filePath: Path to the file to write
- data: Binary data (Uint8Array) or text (string) to write

### Returns

void

### Examples

```typescript
// Write file synchronously
import { writeFileSync } from "@tidy-ts/shims";

writeFileSync("./output.txt", "Hello, World!");
// Write binary data
writeFileSync('./output.bin', new Uint8Array([1, 2, 3]));
```

### Best Practices

- ✓ GOOD: Only use when async I/O is not possible
- ✓ GOOD: Prefer async writeFile() for better performance
- ✓ GOOD: Parent directories are automatically created

### Anti-patterns

- ❌ BAD: Using sync I/O in async contexts (blocks event loop)

### Related

`writeFile`, `readFileSync`, `writeTextFileSync`

---

## writeTextFileSync

Write a text file synchronously. Blocks execution until write completes. Automatically creates parent directories.

### Signature

```typescript
writeTextFileSync(filePath: string, data: string): void
```

### Import

```typescript
import { writeTextFileSync } from "@tidy-ts/shims";
```

### Parameters

- filePath: Path to the file to write
- data: Text content to write

### Returns

void

### Examples

```typescript
// Write text file synchronously
import { writeTextFileSync } from "@tidy-ts/shims";

writeTextFileSync("./output.txt", "Hello, World!");
```

### Best Practices

- ✓ GOOD: Only use when async I/O is not possible
- ✓ GOOD: Prefer async writeTextFile() for better performance

### Related

`writeTextFile`, `writeFileSync`

---

## resolve

Resolve a sequence of paths into an absolute path. Handles both forward and backward slashes correctly on all platforms.

### Signature

```typescript
resolve(...paths: string[]): string
```

### Import

```typescript
import { resolve } from "@tidy-ts/shims";
```

### Parameters

- ...paths: Path segments to resolve

### Returns

string - The absolute path

### Examples

```typescript
// Resolve to absolute path
import { resolve } from "@tidy-ts/shims";

const absPath = resolve("./data", "file.txt");
console.log(absPath); // /current/working/dir/data/file.txt
// Resolve multiple segments
const path = resolve("/root", "nested", "dir", "file.txt");
```

### Best Practices

- ✓ GOOD: Use to convert relative paths to absolute paths
- ✓ GOOD: Works consistently across all platforms

### Related

`dirname`, `fileURLToPath`

---

## dirname

Get the directory name from a file path. Returns the parent directory path.

### Signature

```typescript
dirname(path: string): string
```

### Import

```typescript
import { dirname } from "@tidy-ts/shims";
```

### Parameters

- path: File or directory path

### Returns

string - The parent directory path

### Examples

```typescript
// Get directory from path
import { dirname } from "@tidy-ts/shims";

const dir = dirname("/path/to/file.txt");
console.log(dir); // /path/to
```

### Best Practices

- ✓ GOOD: Use to extract directory from file paths

### Related

`resolve`, `fileURLToPath`

---

## fileURLToPath

Convert a file:// URL to a file system path. Useful when working with import.meta.url.

### Signature

```typescript
fileURLToPath(url: string | URL): string
```

### Import

```typescript
import { fileURLToPath } from "@tidy-ts/shims";
```

### Parameters

- url: File URL to convert (string or URL object)

### Returns

string - The file system path

### Examples

```typescript
// Convert import.meta.url to path
import { fileURLToPath } from "@tidy-ts/shims";

const currentFile = fileURLToPath(import.meta.url);
console.log(currentFile);
```

### Best Practices

- ✓ GOOD: Use with import.meta.url to get current file path

### Related

`pathToFileURL`, `dirname`

---

## pathToFileURL

Convert a file system path to a file:// URL object.

### Signature

```typescript
pathToFileURL(path: string): URL
```

### Import

```typescript
import { pathToFileURL } from "@tidy-ts/shims";
```

### Parameters

- path: File system path to convert

### Returns

URL - The file:// URL object

### Examples

```typescript
// Convert path to URL
import { pathToFileURL } from "@tidy-ts/shims";

const url = pathToFileURL("/path/to/file.txt");
console.log(url.href); // file:///path/to/file.txt
```

### Best Practices

- ✓ GOOD: Use when you need URL format from file paths

### Related

`fileURLToPath`

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
// Test setup/teardown
const original = env.get("API_URL");
env.set("API_URL", "http://test.example.com");
// ... run tests ...
if (original) {
  env.set("API_URL", original);
} else {
  env.delete("API_URL");
}
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
// Test with done callback
test('callback test', (context, done) => {
  setTimeout(() => {
    done();
  }, 100);
}, { waitForCallback: true });
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

## UnavailableAPIError

Error thrown when an API is not available in the current runtime. Contains information about which API was called and which runtime it was called in.

### Signature

```typescript
class UnavailableAPIError extends Error
```

### Import

```typescript
import { UnavailableAPIError } from "@tidy-ts/shims";
```

### Returns

Error instance

### Examples

```typescript
// Catch unavailable API
import { readFile, UnavailableAPIError } from "@tidy-ts/shims";

try {
  await readFile("./file.txt");
} catch (error) {
  if (error instanceof UnavailableAPIError) {
    console.error("File system not available in this runtime");
  }
}
```

### Best Practices

- ✓ GOOD: Check for this error when using file system APIs in browsers

### Related

`UnsupportedRuntimeError`

---

## UnsupportedRuntimeError

Error thrown when code is running in an unsupported runtime. Contains information about detected runtime and list of supported runtimes.

### Signature

```typescript
class UnsupportedRuntimeError extends Error
```

### Import

```typescript
import { UnsupportedRuntimeError } from "@tidy-ts/shims";
```

### Returns

Error instance

### Examples

```typescript
// Catch unsupported runtime
import { getCurrentRuntime, UnsupportedRuntimeError } from "@tidy-ts/shims";

try {
  const runtime = getCurrentRuntime();
  // Some runtime-specific logic
} catch (error) {
  if (error instanceof UnsupportedRuntimeError) {
    console.error("This runtime is not supported");
  }
}
```

### Best Practices

- ✓ GOOD: Use to gracefully handle unsupported environments

### Related

`UnavailableAPIError`, `getCurrentRuntime`

---

## tidyfetch

Enhanced fetch API with Result-based error handling, automatic JSON parsing, retries, timeouts, caching, and interceptors. Returns Result<T, TidyFetchError> for type-safe error handling without exceptions. Works identically across Deno, Bun, and Node.js. All options are passed as named properties in a single object.

### Signature

```typescript
tidyfetch<T>({ url, ...options }): Promise<Result<T, TidyFetchError>>
```

### Import

```typescript
import { tidyfetch } from "@tidy-ts/shims";
import { tidyfetch, type Result, type TidyFetchError } from "@tidy-ts/shims";
import { tidyfetch, HTTPError, NetworkError, TimeoutError } from "@tidy-ts/shims";
```

### Parameters

- url: The URL to fetch (required, absolute or relative if baseURL is provided)
- baseURL: Base URL to prepend to the request URL
- query: Query parameters as an object (auto-appended to URL, undefined values filtered out)
- body: Request body (plain objects auto-stringified to JSON)
- method: HTTP method (GET, POST, PUT, PATCH, DELETE, etc.)
- headers: Request headers (HeadersInit)
- timeout: Request timeout in milliseconds (default: 0 = no timeout)
- retry: Number of retry attempts on failure (default: 0)
- retryDelay: Delay between retry attempts in milliseconds (default: 0)
- retryStatusCodes: HTTP status codes that should trigger a retry (default: [408, 429, 500, 502, 503, 504])
- cacheTTL: Response cache TTL in milliseconds (default: 0 = no caching)
- responseType: Response type for parsing - 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream' (default: 'json')
- onRequest: Interceptor called before request is sent (context: { request: Request; url: string })
- onResponse: Interceptor called after successful response (context: { request: Request; response: Response; url: string })
- onResponseError: Interceptor called on error responses (context: { request: Request; response: Response; url: string; error: TidyFetchError })
- parseResponse: Custom function to parse response body (text: string) => unknown
- signal: AbortSignal to cancel request
- mode: Request mode (cors, no-cors, same-origin, navigate)
- credentials: Credentials mode (omit, same-origin, include)
- cache: Cache mode (default, no-store, reload, no-cache, force-cache, only-if-cached)
- redirect: Redirect mode (follow, error, manual)
- referrer: Referrer URL or empty string
- referrerPolicy: Referrer policy
- integrity: Subresource integrity hash
- keepalive: Keep connection alive after page unloads
- priority: Request priority hint

### Returns

Promise<Result<T, TidyFetchError>> - Result type with ok/error discriminant

### Examples

```typescript
// Basic GET with Result handling
import { tidyfetch } from "@tidy-ts/shims";

interface User { id: number; name: string; }

const result = await tidyfetch<User>({ url: "/api/users/1" });
if (result.ok) {
  console.log(result.value.name); // Type-safe access
} else {
  console.error(result.error.message);
}
// POST with auto JSON body
const result = await tidyfetch<User>({
  url: "/api/users",
  method: "POST",
  body: { name: "Alice", email: "alice@example.com" }
});
if (result.ok) {
  console.log("Created:", result.value);
}
// Handle specific error types
import { tidyfetch, HTTPError, TimeoutError } from "@tidy-ts/shims";

const result = await tidyfetch({ url: "/api/data" });
if (!result.ok) {
  if (result.error instanceof HTTPError) {
    console.log(`HTTP ${result.error.statusCode}: ${result.error.statusText}`);
  } else if (result.error instanceof TimeoutError) {
    console.log("Request timed out");
  }
}
```

### Best Practices

- ✓ GOOD: Check result.ok before accessing result.value
- ✓ GOOD: Use instanceof to check specific error types
- ✓ GOOD: Set timeouts on all production requests
- ✓ GOOD: Use retry for idempotent requests

### Anti-patterns

- ❌ BAD: Accessing result.value without checking result.ok
- ❌ BAD: Retrying non-idempotent requests
- ❌ BAD: Ignoring the error type when handling failures

### Related

`tidyfetch.create`, `tidyfetch.raw`, `Result`, `HTTPError`, `TidyFetchError`

---

## tidyfetch.create

Factory function to create a preconfigured tidyfetch instance with default options. Returns a TidyFetchInstance that returns Result for type-safe error handling. Perfect for creating API clients with shared configuration. The returned instance accepts the same object-based options as tidyfetch.

### Signature

```typescript
tidyfetch.create({ ...defaults }): TidyFetchInstance
```

### Import

```typescript
import { tidyfetch, type TidyFetchInstance } from "@tidy-ts/shims";
```

### Parameters

- defaults: Default FetchOptions (as named properties) applied to all requests from this instance

### Returns

TidyFetchInstance - Function that accepts { url, ...options } and returns Result<T, TidyFetchError>

### Examples

```typescript
// Create an API client (returns Result)
import { tidyfetch } from "@tidy-ts/shims";

const api = tidyfetch.create({
  baseURL: "https://api.example.com",
  headers: { "Authorization": `Bearer ${token}` },
  timeout: 10000
});

// Returns Result - note the object syntax
const result = await api<User[]>({ url: "/users" });
if (result.ok) {
  console.log(result.value);
}
// Multiple API clients
const publicApi = tidyfetch.create({
  baseURL: "https://api.example.com/public"
});

const adminApi = tidyfetch.create({
  baseURL: "https://api.example.com/admin",
  headers: { "X-Admin-Token": adminToken }
});

// Use the instances
const publicResult = await publicApi({ url: "/data" });
const adminResult = await adminApi({ url: "/users" });
```

### Best Practices

- ✓ GOOD: Create separate instances for different API services
- ✓ GOOD: Set common headers and timeout in defaults

### Related

`tidyfetch`, `TidyFetchInstance`

---

## tidyfetch.get

Shorthand for GET requests. Returns Result for type-safe error handling. GET requests are typically used to retrieve resources. Method is automatically set to GET. All options are passed as named properties in a single object.

### Signature

```typescript
tidyfetch.get<T>({ url, ...options }): Promise<Result<T, TidyFetchError>>
```

### Import

```typescript
import { tidyfetch } from "@tidy-ts/shims";
```

### Parameters

- url: The URL to fetch (required)
- All other FetchOptions as named properties (method is set automatically to GET)

### Returns

Promise<Result<T, TidyFetchError>> - Result with value or error

### Examples

```typescript
// Basic GET
const result = await tidyfetch.get<User[]>({ url: "/api/users" });
if (result.ok) {
  console.log(result.value);
}
// GET with query parameters
const result = await tidyfetch.get<User>({
  url: "/api/users/1",
  query: { include: "posts,comments" }
});
```

### Best Practices

- ✓ GOOD: Use for retrieving resources
- ✓ GOOD: Check result.ok before accessing result.value

### Related

`tidyfetch`, `tidyfetch.post`, `tidyfetch.put`

---

## tidyfetch.post

Shorthand for POST requests. Returns Result for type-safe error handling. POST requests are typically used to create new resources. Body objects are auto-stringified to JSON. Method is automatically set to POST. All options are passed as named properties in a single object.

### Signature

```typescript
tidyfetch.post<T>({ url, ...options }): Promise<Result<T, TidyFetchError>>
```

### Import

```typescript
import { tidyfetch } from "@tidy-ts/shims";
```

### Parameters

- url: The URL to post to (required)
- body: Request body data (plain objects auto-stringified to JSON)
- All other FetchOptions as named properties (method is set automatically to POST)

### Returns

Promise<Result<T, TidyFetchError>> - Result with value or error

### Examples

```typescript
// Create a resource
const result = await tidyfetch.post<User>({
  url: "/api/users",
  body: { name: "Alice", email: "alice@example.com" }
});
if (result.ok) {
  console.log("Created:", result.value);
}
```

### Best Practices

- ✓ GOOD: Use for creating new resources
- ✓ GOOD: Body objects are automatically JSON stringified

### Related

`tidyfetch`, `tidyfetch.get`, `tidyfetch.put`, `tidyfetch.patch`

---

## tidyfetch.put

Shorthand for PUT requests. Returns Result for type-safe error handling. PUT requests are typically used to replace entire resources. Method is automatically set to PUT. All options are passed as named properties in a single object.

### Signature

```typescript
tidyfetch.put<T>({ url, ...options }): Promise<Result<T, TidyFetchError>>
```

### Import

```typescript
import { tidyfetch } from "@tidy-ts/shims";
```

### Parameters

- url: The URL of the resource to replace (required)
- body: Request body with the new resource data
- All other FetchOptions as named properties (method is set automatically to PUT)

### Returns

Promise<Result<T, TidyFetchError>> - Result with value or error

### Examples

```typescript
// Replace a resource
const result = await tidyfetch.put<User>({
  url: "/api/users/1",
  body: { name: "Alice Smith", email: "alice@example.com", role: "admin" }
});
if (result.ok) {
  console.log("Updated:", result.value);
}
```

### Best Practices

- ✓ GOOD: Use for full resource replacement
- ✓ GOOD: Include all required fields in body

### Related

`tidyfetch`, `tidyfetch.patch`, `tidyfetch.post`

---

## tidyfetch.patch

Shorthand for PATCH requests. Returns Result for type-safe error handling. PATCH requests are typically used for partial updates to resources. Method is automatically set to PATCH. All options are passed as named properties in a single object.

### Signature

```typescript
tidyfetch.patch<T>({ url, ...options }): Promise<Result<T, TidyFetchError>>
```

### Import

```typescript
import { tidyfetch } from "@tidy-ts/shims";
```

### Parameters

- url: The URL of the resource to update (required)
- body: Request body with the partial update data
- All other FetchOptions as named properties (method is set automatically to PATCH)

### Returns

Promise<Result<T, TidyFetchError>> - Result with value or error

### Examples

```typescript
// Partial update
const result = await tidyfetch.patch<User>({
  url: "/api/users/1",
  body: { email: "newemail@example.com" }
});
if (result.ok) {
  console.log("Patched:", result.value);
}
```

### Best Practices

- ✓ GOOD: Use for partial resource updates
- ✓ GOOD: Only include fields that need to change

### Related

`tidyfetch`, `tidyfetch.put`, `tidyfetch.post`

---

## tidyfetch.delete

Shorthand for DELETE requests. Returns Result for type-safe error handling. DELETE requests are used to remove resources. Method is automatically set to DELETE. All options are passed as named properties in a single object.

### Signature

```typescript
tidyfetch.delete<T>({ url, ...options }): Promise<Result<T, TidyFetchError>>
```

### Import

```typescript
import { tidyfetch } from "@tidy-ts/shims";
```

### Parameters

- url: The URL of the resource to delete (required)
- All other FetchOptions as named properties (method is set automatically to DELETE)

### Returns

Promise<Result<T, TidyFetchError>> - Result with value or error

### Examples

```typescript
// Delete a resource
const result = await tidyfetch.delete({ url: "/api/users/1" });
if (result.ok) {
  console.log("Deleted successfully");
}
// Delete with confirmation response
const result = await tidyfetch.delete<{ success: boolean }>({ url: "/api/users/1" });
if (result.ok && result.value.success) {
  console.log("Confirmed deleted");
}
```

### Best Practices

- ✓ GOOD: Use for removing resources
- ✓ GOOD: Handle 204 No Content responses gracefully

### Related

`tidyfetch`, `tidyfetch.post`

---

## tidyfetch.raw

Fetch with access to the full Response object plus parsed data. Returns Result containing the complete Response with a `_data` property containing parsed data. Use when you need access to response headers, status codes, or other Response properties. All options are passed as named properties in a single object.

### Signature

```typescript
tidyfetch.raw<T>({ url, ...options }): Promise<Result<RawResponse<T>, TidyFetchError>>
```

### Import

```typescript
import { tidyfetch, type RawResponse } from "@tidy-ts/shims";
```

### Parameters

- url: The URL to fetch (required)
- All FetchOptions as named properties (same as tidyfetch)

### Returns

Promise<Result<RawResponse<T>, TidyFetchError>> - Result with Response object containing _data property

### Examples

```typescript
// Access response headers and status
const result = await tidyfetch.raw<User>({ url: "/api/users/1" });
if (result.ok) {
  console.log(result.value.status);                     // 200
  console.log(result.value.headers.get("x-rate-limit")); // "100"
  console.log(result.value._data.name);                 // "Alice"
}
// Check for specific headers
const result = await tidyfetch.raw({ url: "/api/data" });
if (result.ok) {
  const etag = result.value.headers.get("etag");
  const cacheControl = result.value.headers.get("cache-control");
}
```

### Best Practices

- ✓ GOOD: Use when you need response headers (rate limits, ETags, etc.)
- ✓ GOOD: Check result.ok before accessing result.value
- ✓ GOOD: Access _data for parsed content

### Related

`tidyfetch`, `RawResponse`

---

## tidyfetch.native

Direct access to the native fetch API. Bypasses all tidyfetch enhancements (auto JSON, retries, etc.) and calls globalThis.fetch directly. Use when you need full control over the Response object.

### Signature

```typescript
tidyfetch.native(input: RequestInfo, init?: RequestInit): Promise<Response>
```

### Import

```typescript
import { tidyfetch } from "@tidy-ts/shims";
```

### Parameters

- input: URL or Request object
- init: Standard RequestInit options

### Returns

Promise<Response> - Standard Response object

### Examples

```typescript
// Direct fetch access
const response = await tidyfetch.native("/api/data");
const text = await response.text();
// Stream handling
const response = await tidyfetch.native("/api/stream");
const reader = response.body?.getReader();
// Process stream manually
```

### Best Practices

- ✓ GOOD: Use for streaming responses
- ✓ GOOD: Use when you need full Response control
- ✓ GOOD: Use when tidyfetch processing is unnecessary

### Related

`tidyfetch`, `tidyfetch.raw`

---

## Result

Type-safe Result type for error handling without exceptions. Used by tidyfetch to return either a successful value or a typed error. Check the `ok` discriminant to determine which variant you have.

### Signature

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
```

### Import

```typescript
import { type Result } from "@tidy-ts/shims";
```

### Parameters

- T: The success value type
- E: The error type

### Returns

Discriminated union with ok boolean, value (if ok), error (if not ok)

### Examples

```typescript
// Pattern matching on Result
import { tidyfetch, type Result, type TidyFetchError } from "@tidy-ts/shims";

const result: Result<User, TidyFetchError> = await tidyfetch<User>("/api/user");

if (result.ok) {
  // TypeScript knows result.value exists
  console.log(result.value.name);
} else {
  // TypeScript knows result.error exists
  console.error(result.error.message);
}
```

### Best Practices

- ✓ GOOD: Always check result.ok before accessing value or error
- ✓ GOOD: Use with type guards for full type safety
- ✓ GOOD: Prefer over try/catch for expected errors

### Related

`ok`, `err`, `TidyFetchError`

---

## ok

Constructor function to create a successful Result. Returns a Result with ok: true and the given value.

### Signature

```typescript
ok<T>(value: T): Result<T, never>
```

### Import

```typescript
import { ok } from "@tidy-ts/shims";
```

### Parameters

- value: The success value to wrap

### Returns

Result<T, never> with ok: true and value property

### Examples

```typescript
// Create a success Result
import { ok, type Result } from "@tidy-ts/shims";

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err("Division by zero");
  return ok(a / b);
}
```

### Best Practices

- ✓ GOOD: Use to wrap successful values in Result

### Related

`err`, `Result`

---

## err

Constructor function to create a failed Result. Returns a Result with ok: false and the given error.

### Signature

```typescript
err<E>(error: E): Result<never, E>
```

### Import

```typescript
import { err } from "@tidy-ts/shims";
```

### Parameters

- error: The error value to wrap

### Returns

Result<never, E> with ok: false and error property

### Examples

```typescript
// Create an error Result
import { err, ok, type Result } from "@tidy-ts/shims";

function parseJSON(str: string): Result<unknown, Error> {
  try {
    return ok(JSON.parse(str));
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}
```

### Best Practices

- ✓ GOOD: Use to wrap error values in Result

### Related

`ok`, `Result`

---

## tryAsync

Wrap an async operation in a Result, catching any thrown errors. Requires an error mapper to transform caught exceptions into typed errors. Use this to wrap external library calls (database queries, file operations, third-party APIs) that throw exceptions rather than returning Results.

### Signature

```typescript
tryAsync<T, E>({ fn, mapError }): Promise<Result<T, E>>
```

### Import

```typescript
import { tryAsync } from "@tidy-ts/shims";
import { tryAsync, defineError, type AppError } from "@tidy-ts/shims";
```

### Parameters

- fn: () => Promise<T> - Async function to execute
- mapError: (error: unknown) => E - Function to transform caught errors into typed errors

### Returns

Promise<Result<T, E>> - Result with the value or mapped error

### Examples

```typescript
// Wrap a database query
import { tryAsync, defineError, type AppError } from "@tidy-ts/shims";

const DatabaseError = defineError(
  "DatabaseError",
  ({ query, cause }: { query: string; cause: string }) =>
    `Query failed: ${cause} [${query}]`
);
type DatabaseError = AppError<"DatabaseError", { query: string; cause: string }>;

const query = "SELECT * FROM users";
const result = await tryAsync({
  fn: () => db.query(query),
  mapError: (e) => new DatabaseError({
    query,
    cause: e instanceof Error ? e.message : String(e)
  })
});

if (!result.ok) {
  console.error(result.error.query); // typed access to query
}
// Wrap file operations
const FileError = defineError(
  "FileError",
  ({ path, operation }: { path: string; operation: string }) =>
    `File ${operation} failed: ${path}`
);
type FileError = AppError<"FileError", { path: string; operation: string }>;

const path = "config.json";
const result = await tryAsync({
  fn: () => Deno.readTextFile(path),
  mapError: () => new FileError({ path, operation: "read" })
});
// Create a reusable wrapper
const makeQuery = (sql: string) =>
  tryAsync({
    fn: () => db.query(sql),
    mapError: (e) =>
      new DatabaseError({
        query: sql,
        cause: e instanceof Error ? e.message : String(e),
      }),
  });

const result = await makeQuery("SELECT * FROM users");
```

### Best Practices

- ✓ GOOD: Use to wrap external library calls that throw
- ✓ GOOD: Define typed errors with context (query, path, etc.)
- ✓ GOOD: Create reusable wrappers for common operations
- ✗ BAD: Using try/catch directly instead of tryAsync for Result-based code

### Related

`Result`, `ok`, `err`, `defineError`, `AppError`

---

## TidyFetchError

Union type of all possible tidyfetch error types. Use with instanceof to narrow to specific error types for detailed error handling.

### Signature

```typescript
type TidyFetchError = NetworkError | TimeoutError | HTTPError | ParseError | AbortError
```

### Import

```typescript
import { type TidyFetchError } from "@tidy-ts/shims";
import { HTTPError, NetworkError, TimeoutError, ParseError, AbortError } from "@tidy-ts/shims";
```

### Returns

Type alias (not a value)

### Examples

```typescript
// Handle different error types
import { tidyfetch, HTTPError, TimeoutError, NetworkError } from "@tidy-ts/shims";

const result = await tidyfetch("/api/data");
if (!result.ok) {
  const error = result.error;
  if (error instanceof HTTPError) {
    console.log(`HTTP ${error.statusCode}: ${error.statusText}`);
  } else if (error instanceof TimeoutError) {
    console.log("Request timed out");
  } else if (error instanceof NetworkError) {
    console.log("Network error:", error.cause);
  }
}
```

### Best Practices

- ✓ GOOD: Use instanceof to narrow to specific error types
- ✓ GOOD: Handle each error type appropriately

### Related

`HTTPError`, `NetworkError`, `TimeoutError`, `ParseError`, `AbortError`

---

## HTTPError

Error returned when server responds with non-2xx status code. Contains status code, status text, URL, response body, and full Response object.

### Signature

```typescript
class HTTPError extends Error { statusCode: number; statusText: string; url: string; body?: unknown; response: Response }
```

### Import

```typescript
import { HTTPError } from "@tidy-ts/shims";
```

### Returns

Error with statusCode, statusText, url, body, response properties

### Examples

```typescript
// Handle HTTP errors
import { tidyfetch, HTTPError } from "@tidy-ts/shims";

const result = await tidyfetch("/api/protected");
if (!result.ok && result.error instanceof HTTPError) {
  if (result.error.statusCode === 401) {
    console.log("Unauthorized - please login");
  } else if (result.error.statusCode === 404) {
    console.log("Resource not found");
  }
  console.log("Response body:", result.error.body);
}
```

### Best Practices

- ✓ GOOD: Check statusCode for specific error handling
- ✓ GOOD: Access body for API error details
- ✓ GOOD: Access response.headers for rate limit info

### Related

`TidyFetchError`, `NetworkError`, `TimeoutError`

---

## NetworkError

Error returned when a network-level failure occurs (DNS resolution, connection refused, etc.). Contains the original error as cause.

### Signature

```typescript
class NetworkError extends Error { cause: unknown }
```

### Import

```typescript
import { NetworkError } from "@tidy-ts/shims";
```

### Returns

Error with cause property containing original error

### Examples

```typescript
// Handle network errors
import { tidyfetch, NetworkError } from "@tidy-ts/shims";

const result = await tidyfetch("/api/data");
if (!result.ok && result.error instanceof NetworkError) {
  console.log("Network failed:", result.error.cause);
  // Show offline message, retry later, etc.
}
```

### Best Practices

- ✓ GOOD: Show user-friendly offline message
- ✓ GOOD: Implement retry logic for transient failures

### Related

`TidyFetchError`, `HTTPError`, `TimeoutError`

---

## TimeoutError

Error returned when a request exceeds the configured timeout. Contains the timeout duration that was exceeded.

### Signature

```typescript
class TimeoutError extends Error { timeout: number }
```

### Import

```typescript
import { TimeoutError } from "@tidy-ts/shims";
```

### Returns

Error with timeout property (milliseconds)

### Examples

```typescript
// Handle timeout errors
import { tidyfetch, TimeoutError } from "@tidy-ts/shims";

const result = await tidyfetch("/api/slow", { timeout: 5000 });
if (!result.ok && result.error instanceof TimeoutError) {
  console.log(`Request timed out after ${result.error.timeout}ms`);
}
```

### Best Practices

- ✓ GOOD: Set appropriate timeouts for different operations
- ✓ GOOD: Show user feedback for slow operations

### Related

`TidyFetchError`, `HTTPError`, `AbortError`

---

## ParseError

Error returned when response body cannot be parsed (e.g., invalid JSON). Contains the raw body text and the original parse error.

### Signature

```typescript
class ParseError extends Error { body: string; cause: unknown }
```

### Import

```typescript
import { ParseError } from "@tidy-ts/shims";
```

### Returns

Error with body (raw text) and cause (original error) properties

### Examples

```typescript
// Handle parse errors
import { tidyfetch, ParseError } from "@tidy-ts/shims";

const result = await tidyfetch("/api/data");
if (!result.ok && result.error instanceof ParseError) {
  console.log("Failed to parse response:", result.error.body);
  console.log("Parse error:", result.error.cause);
}
```

### Best Practices

- ✓ GOOD: Log raw body for debugging
- ✓ GOOD: Consider using responseType: 'text' if JSON not expected

### Related

`TidyFetchError`, `HTTPError`

---

## AbortError

Error returned when a request is cancelled via AbortController. Contains the abort reason if provided.

### Signature

```typescript
class AbortError extends Error { reason?: unknown }
```

### Import

```typescript
import { AbortError } from "@tidy-ts/shims";
```

### Returns

Error with optional reason property

### Examples

```typescript
// Handle aborted requests
import { tidyfetch, AbortError } from "@tidy-ts/shims";

const controller = new AbortController();
setTimeout(() => controller.abort("User cancelled"), 5000);

const result = await tidyfetch("/api/data", { signal: controller.signal });
if (!result.ok && result.error instanceof AbortError) {
  console.log("Request aborted:", result.error.reason);
}
```

### Best Practices

- ✓ GOOD: Use AbortController for user-initiated cancellation
- ✓ GOOD: Clean up pending requests on component unmount

### Related

`TidyFetchError`, `TimeoutError`

---

## defineError

Factory function to create custom typed error classes. Used internally to create HTTPError, NetworkError, etc. Can be used to define your own application-specific errors.

### Signature

```typescript
defineError<Name extends string, Extra extends object>(name: Name, messageTemplate: (extra: Extra) => string): ErrorConstructor
```

### Import

```typescript
import { defineError, type AppError } from "@tidy-ts/shims";
```

### Parameters

- name: The error name (becomes error.name)
- messageTemplate: Function that generates error message from extra properties

### Returns

Error class constructor that accepts extra properties

### Examples

```typescript
// Define a custom error
import { defineError, type AppError } from "@tidy-ts/shims";

const ValidationError = defineError(
  "ValidationError",
  (extra: { field: string; value: unknown }) =>
    `Invalid value for ${extra.field}: ${extra.value}`
);

type ValidationError = AppError<"ValidationError", { field: string; value: unknown }>;

// Usage
const error = new ValidationError({ field: "email", value: "invalid" });
console.log(error.name);    // "ValidationError"
console.log(error.field);   // "email"
console.log(error.message); // "Invalid value for email: invalid"
```

### Best Practices

- ✓ GOOD: Use for domain-specific error types
- ✓ GOOD: Include relevant context in extra properties
- ✓ GOOD: Define corresponding type alias with AppError

### Related

`AppError`, `HTTPError`, `NetworkError`

---

## FetchOptions

Configuration options for tidyfetch requests. Extends standard RequestInit with additional features: query parameters, auto JSON body, retries, timeouts, caching, and interceptors.

### Signature

```typescript
interface FetchOptions extends Omit<RequestInit, 'body'>
```

### Import

```typescript
import { type FetchOptions } from "@tidy-ts/shims";
```

### Parameters

- baseURL?: string - Base URL prepended to all requests
- query?: Record<string, string | number | boolean | undefined> - Query params (undefined filtered out)
- body?: BodyInit | Record<string, unknown> - Body (plain objects auto-stringified)
- timeout?: number - Request timeout in ms (default: 0 = no timeout)
- retry?: number - Number of retry attempts (default: 0)
- retryDelay?: number - Delay between retries in ms (default: 0)
- retryStatusCodes?: number[] - Status codes triggering retry (default: [408, 429, 500, 502, 503, 504])
- cacheTTL?: number - Response cache TTL in ms (default: 0 = no cache)
- responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream' - How to parse response (default: 'json')
- onRequest?: (context) => void | Promise<void> - Pre-request interceptor
- onResponse?: (context) => void | Promise<void> - Post-response interceptor
- onResponseError?: (context) => void | Promise<void> - Error response interceptor
- parseResponse?: (text: string) => unknown - Custom response parser

### Returns

N/A (interface)

### Examples

```typescript
// Full configuration example
const options: FetchOptions = {
  baseURL: "https://api.example.com",
  query: { page: 1, limit: 10 },
  body: { name: "Alice" },
  timeout: 5000,
  retry: 3,
  retryDelay: 1000,
  cacheTTL: 60000,
  onRequest: ({ request }) => console.log("Fetching:", request.url),
  onResponse: ({ response }) => console.log("Status:", response.status),
};
```

### Best Practices

- ✓ GOOD: Set timeout for all production requests
- ✓ GOOD: Use interceptors for logging and auth
- ✓ GOOD: Use cacheTTL for stable, frequently-accessed data

### Related

`tidyfetch`, `tidyfetch.create`

---

## RawResponse

Response type returned by tidyfetch.raw(). Extends standard Response with a `_data` property containing the parsed response body. Original Response body is still accessible via clone().

### Signature

```typescript
interface RawResponse<T> extends Response { _data: T }
```

### Import

```typescript
import { type RawResponse } from "@tidy-ts/shims";
```

### Parameters

- _data: T - The parsed response body

### Returns

N/A (interface)

### Examples

```typescript
// Using RawResponse
const response: RawResponse<User> = await tidyfetch.raw<User>("/api/users/1");

// Access parsed data
console.log(response._data.name);

// Access Response properties
console.log(response.status);
console.log(response.headers.get("content-type"));

// Clone and read body again
const text = await response.clone().text();
```

### Best Practices

- ✓ GOOD: Use _data for type-safe parsed content
- ✓ GOOD: Use clone() if you need raw body after parsing

### Related

`tidyfetch.raw`, `tidyfetch`

---

## encrypt

Encrypts data using AES-256-GCM authenticated encryption. Uses Web Crypto API with a fresh random 12-byte IV for each encryption (semantic security). The output format is: IV (12 bytes) + Ciphertext + Auth Tag (16 bytes), all bundled in the specified encoding. AES-GCM provides both encryption and authentication (integrity checking). Returns a Result type for type-safe error handling.

### Signature

```typescript
encrypt({ key, data, inputEncoding?, outputEncoding?, urlSafe? }): Promise<Result<string, CryptoError>>
```

### Import

```typescript
import { encrypt } from "@tidy-ts/shims";
import { encrypt, type CryptoError, InvalidKeyError } from "@tidy-ts/shims";
```

### Parameters

- key: string - Hex-encoded 32-byte key (64 hex characters) (required)
- data: string - The data to encrypt (required)
- inputEncoding: 'utf8' | 'base64' | 'hex' | 'binary' - Encoding of input data (default: 'utf8')
- outputEncoding: 'base64' | 'hex' | 'binary' - Encoding for encrypted output (default: 'base64')
- urlSafe: boolean - Whether to return Base64URL format (default: true, only applies when outputEncoding is 'base64')

### Returns

Promise<Result<string, CryptoError>> - Result with encrypted data or error

### Examples

```typescript
// Basic encryption (UTF-8 → Base64URL)
import { encrypt, generateKey } from "@tidy-ts/shims";

const key = generateKey(); // Or load from secure storage
const result = await encrypt({ key, data: "sensitive password" });
if (result.ok) {
  console.log(result.value); // Base64URL-encoded ciphertext
} else {
  console.error(result.error.message);
}
// Encrypt JSON data
const key = env.get("SECRET_KEY")!;
const userData = JSON.stringify({ email: "user@example.com", apiKey: "secret123" });
const result = await encrypt({ key, data: userData });
if (result.ok) {
  // Store result.value in database
}
// Encrypt with hex output encoding
const result = await encrypt({
  key,
  data: "API key",
  outputEncoding: "hex"
});
if (result.ok) {
  console.log(result.value); // Hexadecimal string
}
// Handle invalid key error
import { encrypt, InvalidKeyError } from "@tidy-ts/shims";

const result = await encrypt({ key: "invalid", data: "test" });
if (!result.ok) {
  if (result.error instanceof InvalidKeyError) {
    console.error("Invalid key:", result.error.reason);
  }
}
```

### Best Practices

- ✓ GOOD: Use generateKey() to create secure keys
- ✓ GOOD: Store keys securely (env vars, secret manager) - never in source code
- ✓ GOOD: Check result.ok before accessing result.value
- ✓ GOOD: Use default Base64URL encoding for safe storage in .env files and URLs
- ✓ GOOD: Each encryption generates a fresh random IV (semantic security)
- ✓ GOOD: Use consistent encoding options for encrypt/decrypt pairs

### Anti-patterns

- ❌ BAD: Hardcoding keys in source code
- ❌ BAD: Using different urlSafe settings for encrypt and decrypt
- ❌ BAD: Accessing result.value without checking result.ok

### Related

`decrypt`, `generateKey`, `encryptFields`, `CryptoError`, `InvalidKeyError`

---

## decrypt

Decrypts data that was encrypted using AES-256-GCM. Expects input format: IV (12 bytes) + Ciphertext + Auth Tag (16 bytes). Automatically verifies the authentication tag during decryption, rejecting tampered ciphertext. Returns a Result type for type-safe error handling.

### Signature

```typescript
decrypt({ key, data, inputEncoding?, outputEncoding?, urlSafe? }): Promise<Result<string, CryptoError>>
```

### Import

```typescript
import { decrypt } from "@tidy-ts/shims";
import { decrypt, type CryptoError, DecryptionError } from "@tidy-ts/shims";
```

### Parameters

- key: string - Hex-encoded 32-byte key (64 hex characters) (required)
- data: string - The encrypted data to decrypt (required)
- inputEncoding: 'base64' | 'hex' | 'binary' - Encoding of encrypted input (default: 'base64')
- outputEncoding: 'utf8' | 'base64' | 'hex' | 'binary' - Encoding for decrypted output (default: 'utf8')
- urlSafe: boolean - Whether the input is in Base64URL format (default: true, only applies when inputEncoding is 'base64')

### Returns

Promise<Result<string, CryptoError>> - Result with decrypted data or error (fails if tampered or wrong key)

### Examples

```typescript
// Basic decryption (Base64URL → UTF-8)
import { decrypt } from "@tidy-ts/shims";

const key = env.get("SECRET_KEY")!;
const result = await decrypt({ key, data: encrypted });
if (result.ok) {
  console.log(result.value); // Original plaintext
} else {
  console.error("Decryption failed:", result.error.message);
}
// Decrypt JSON data
const result = await decrypt({ key, data: encryptedJson });
if (result.ok) {
  const obj = JSON.parse(result.value);
}
// Decrypt from hex encoding
const result = await decrypt({
  key,
  data: encryptedHex,
  inputEncoding: "hex"
});
// Handle tampered ciphertext
import { decrypt, DecryptionError } from "@tidy-ts/shims";

const result = await decrypt({ key, data: possiblyTampered });
if (!result.ok && result.error instanceof DecryptionError) {
  console.error("Data may have been tampered with");
}
```

### Best Practices

- ✓ GOOD: Use matching encoding options as encrypt() call
- ✓ GOOD: Check result.ok - errors indicate tampering or wrong key
- ✓ GOOD: AES-GCM automatically verifies authentication tag (tamper detection)
- ✓ GOOD: Ensure key matches the one used for encryption

### Anti-patterns

- ❌ BAD: Using different encoding options than encrypt() used
- ❌ BAD: Ignoring result.error (indicates tampering or wrong key)
- ❌ BAD: Using different urlSafe setting than encrypt() used

### Related

`encrypt`, `generateKey`, `decryptFields`, `CryptoError`, `DecryptionError`

---

## encryptFields

Encrypts multiple fields using envelope encryption pattern. Generates a fresh Data Encryption Key (DEK) for each call, encrypts all non-null fields with the DEK, then encrypts the DEK with the master key. The DEK is prefixed with the masterKeyId (format: 'masterKeyId:encryptedDek') making decryption self-describing. Null values pass through unchanged. Returns both the encrypted fields and the self-describing encrypted DEK for storage. Provides forward secrecy - each record has its own DEK.

### Signature

```typescript
encryptFields({ fields, masterKey, masterKeyId }): Promise<Result<{ encrypted, dek }, EnvelopeEncryptionError | InvalidKeyIdError>>
```

### Import

```typescript
import { encryptFields } from "@tidy-ts/shims";
import { encryptFields, type EnvelopeEncryptionError, type InvalidKeyIdError } from "@tidy-ts/shims";
```

### Parameters

- fields: Record<string, string | null> - Object with string or null values to encrypt
- masterKey: string - Hex-encoded 32-byte master key (64 hex characters)
- masterKeyId: string - Identifier for the master key (cannot contain colons). Used to make DEK self-describing.

### Returns

Promise<Result<{ encrypted: Record<string, string | null>, dek: string }, EnvelopeEncryptionError | InvalidKeyIdError>>

### Examples

```typescript
// Encrypt sensitive fields for database storage
import { encryptFields } from "@tidy-ts/shims";

const masterKey = env.get("MASTER_KEY_V1")!;
const result = await encryptFields({
  fields: {
    title: "Doctor appointment",
    description: "Annual checkup with Dr. Smith",
    notes: null, // null values pass through
  },
  masterKey,
  masterKeyId: "v1", // Key version identifier
});

if (result.ok) {
  // Store in database
  await db.events.create({
    title: result.value.encrypted.title,
    description: result.value.encrypted.description,
    notes: result.value.encrypted.notes, // still null
    dek: result.value.dek, // Self-describing: "v1:encryptedDek..."
  });
}
// Each call generates a fresh DEK (forward secrecy)
const result1 = await encryptFields({ fields: { secret: "data" }, masterKey, masterKeyId: "v1" });
const result2 = await encryptFields({ fields: { secret: "data" }, masterKey, masterKeyId: "v1" });
// result1.value.dek !== result2.value.dek (different DEKs)
// DEK format is self-describing
const result = await encryptFields({ fields, masterKey, masterKeyId: "prod-2024" });
// result.value.dek = "prod-2024:<encrypted-dek>"
// During decryption, getMasterKey("prod-2024") is called automatically
```

### Best Practices

- ✓ GOOD: Store the encrypted DEK alongside the encrypted fields
- ✓ GOOD: Use different master keys for different environments
- ✓ GOOD: Fresh DEK per record provides forward secrecy
- ✓ GOOD: Null values pass through unchanged
- ✓ GOOD: Use meaningful masterKeyId (e.g., 'v1', 'prod-2024')
- ✓ GOOD: Self-describing DEK enables seamless key rotation

### Anti-patterns

- ❌ BAD: Reusing the same DEK across multiple records
- ❌ BAD: Storing master key in database alongside encrypted data
- ❌ BAD: Using colons in masterKeyId (will fail validation)

### Related

`decryptFields`, `rotateMasterKey`, `encrypt`, `generateKey`, `InvalidKeyIdError`

---

## decryptFields

Decrypts fields that were encrypted with encryptFields(). The DEK is self-describing (format: 'masterKeyId:encryptedDek'), so getMasterKey is called with the extracted masterKeyId to retrieve the correct master key. First decrypts the DEK using the master key, then decrypts each non-null field with the DEK. Null values pass through unchanged. Supports selective decryption - only decrypt the fields you need.

### Signature

```typescript
decryptFields({ fields, dek, getMasterKey }): Promise<Result<Record<string, string | null>, EnvelopeDecryptionError | KeyNotFoundError>>
```

### Import

```typescript
import { decryptFields } from "@tidy-ts/shims";
import { decryptFields, type EnvelopeDecryptionError, type KeyNotFoundError } from "@tidy-ts/shims";
```

### Parameters

- fields: Record<string, string | null> - Object with encrypted string or null values
- dek: string - Self-describing encrypted DEK (format: 'masterKeyId:encryptedDek')
- getMasterKey: (masterKeyId: string) => string - Callback to retrieve master key by its ID. Called synchronously with the masterKeyId extracted from the DEK.

### Returns

Promise<Result<Record<string, string | null>, EnvelopeDecryptionError | KeyNotFoundError>>

### Examples

```typescript
// Decrypt fields from database with key store
import { decryptFields } from "@tidy-ts/shims";

// Set up key store (load keys at startup)
const keys: Record<string, string> = {
  v1: env.get("MASTER_KEY_V1")!,
  v2: env.get("MASTER_KEY_V2")!,
};
const getMasterKey = (keyId: string) => {
  const key = keys[keyId];
  if (!key) throw new Error(`Unknown key: ${keyId}`);
  return key;
};

const event = await db.events.findUnique({ where: { id } });
const result = await decryptFields({
  fields: {
    title: event.title,
    description: event.description,
  },
  dek: event.dek, // Self-describing: "v1:encryptedDek..."
  getMasterKey, // Called with "v1" automatically
});

if (result.ok) {
  console.log(result.value.title); // "Doctor appointment"
}
// Selective decryption - only decrypt what you need
const result = await decryptFields({
  fields: { title: event.title }, // Only decrypt title
  dek: event.dek,
  getMasterKey,
});
// result.value only has title
// Handle decryption errors
import { decryptFields, EnvelopeDecryptionError, KeyNotFoundError } from "@tidy-ts/shims";

const result = await decryptFields({ fields, dek, getMasterKey });
if (!result.ok) {
  if (result.error instanceof KeyNotFoundError) {
    console.error(`Unknown key ID: ${result.error.keyId}`);
  } else if (result.error instanceof EnvelopeDecryptionError) {
    if (result.error.field) {
      console.error(`Failed to decrypt field: ${result.error.field}`);
    } else {
      console.error("Failed to decrypt DEK - wrong master key?");
    }
  }
}
```

### Best Practices

- ✓ GOOD: Use selective decryption to minimize decrypted data exposure
- ✓ GOOD: Check result.error.field to identify which field failed
- ✓ GOOD: Null values in input pass through as null in output
- ✓ GOOD: Load all keys at startup for synchronous getMasterKey
- ✓ GOOD: Self-describing DEK means no external version tracking needed

### Anti-patterns

- ❌ BAD: Decrypting more fields than needed
- ❌ BAD: Ignoring decryption errors
- ❌ BAD: Throwing from getMasterKey without try-catch (wrapped automatically)

### Related

`encryptFields`, `rotateMasterKey`, `decrypt`, `KeyNotFoundError`

---

## rotateMasterKey

Re-encrypts a DEK from an old master key to a new master key. The DEK is self-describing (format: 'masterKeyId:encryptedDek'), so getMasterKey is called with the extracted masterKeyId to retrieve the old master key. The underlying encrypted data remains unchanged - only the DEK wrapper is updated. Returns a new self-describing DEK with the new masterKeyId. Use this for master key rotation without re-encrypting all data.

### Signature

```typescript
rotateMasterKey({ dek, newMasterKey, newMasterKeyId, getMasterKey }): Promise<Result<string, EnvelopeDecryptionError | EnvelopeEncryptionError | KeyNotFoundError | InvalidKeyIdError>>
```

### Import

```typescript
import { rotateMasterKey } from "@tidy-ts/shims";
import { rotateMasterKey, type EnvelopeDecryptionError, type EnvelopeEncryptionError, type KeyNotFoundError, type InvalidKeyIdError } from "@tidy-ts/shims";
```

### Parameters

- dek: string - Self-describing encrypted DEK (format: 'masterKeyId:encryptedDek')
- newMasterKey: string - Hex-encoded 32-byte new master key
- newMasterKeyId: string - Identifier for the new master key (cannot contain colons)
- getMasterKey: (masterKeyId: string) => string - Callback to retrieve old master key by its ID

### Returns

Promise<Result<string, EnvelopeDecryptionError | EnvelopeEncryptionError | KeyNotFoundError | InvalidKeyIdError>> - New self-describing DEK (format: 'newMasterKeyId:encryptedDek')

### Examples

```typescript
// Rotate master key for all records
import { rotateMasterKey } from "@tidy-ts/shims";

// Key store with both old and new keys
const keys: Record<string, string> = {
  v1: env.get("MASTER_KEY_V1")!,
  v2: env.get("MASTER_KEY_V2")!,
};
const getMasterKey = (keyId: string) => {
  const key = keys[keyId];
  if (!key) throw new Error(`Unknown key: ${keyId}`);
  return key;
};

const events = await db.events.findMany({ select: { id: true, dek: true } });

for (const event of events) {
  const result = await rotateMasterKey({
    dek: event.dek, // "v1:oldEncryptedDek..."
    newMasterKey: keys.v2,
    newMasterKeyId: "v2",
    getMasterKey, // Called with "v1" from dek prefix
  });

  if (result.ok) {
    await db.events.update({
      where: { id: event.id },
      data: { dek: result.value }, // "v2:newEncryptedDek..."
    });
  } else {
    console.error(`Failed to rotate DEK for event ${event.id}`);
  }
}
// Key rotation is efficient - no data re-encryption needed
// Old: [encrypted fields] + [v1:DEK encrypted with old key]
// New: [encrypted fields] + [v2:DEK encrypted with new key]
// The encrypted fields are unchanged!
```

### Best Practices

- ✓ GOOD: Rotate master keys periodically for security
- ✓ GOOD: Test key rotation on a backup before production
- ✓ GOOD: Keep old master key available until all DEKs are rotated
- ✓ GOOD: Data remains unchanged - only DEK wrapper is updated
- ✓ GOOD: Self-describing DEKs make rotation seamless

### Anti-patterns

- ❌ BAD: Deleting old master key before all DEKs are rotated
- ❌ BAD: Rotating keys without a backup plan
- ❌ BAD: Using colons in newMasterKeyId

### Related

`encryptFields`, `decryptFields`, `generateKey`, `KeyNotFoundError`, `InvalidKeyIdError`

---

## CryptoError

Union type of all encryption/decryption error types. Use with instanceof to narrow to specific error types for detailed error handling. Returned by encrypt() and decrypt() functions.

### Signature

```typescript
type CryptoError = InvalidKeyError | EncryptionError | DecryptionError
```

### Import

```typescript
import { type CryptoError } from "@tidy-ts/shims";
import { InvalidKeyError, EncryptionError, DecryptionError } from "@tidy-ts/shims";
```

### Returns

Type alias (not a value)

### Examples

```typescript
// Handle different error types
import { encrypt, InvalidKeyError, EncryptionError } from "@tidy-ts/shims";

const result = await encrypt({ key, data: "secret" });
if (!result.ok) {
  if (result.error instanceof InvalidKeyError) {
    console.error("Bad key:", result.error.reason);
  } else if (result.error instanceof EncryptionError) {
    console.error("Encryption failed:", result.error.message);
  }
}
```

### Best Practices

- ✓ GOOD: Use instanceof to narrow to specific error types
- ✓ GOOD: Handle each error type appropriately

### Related

`InvalidKeyError`, `EncryptionError`, `DecryptionError`, `encrypt`, `decrypt`

---

## InvalidKeyError

Error returned when the encryption key is invalid. Contains a reason explaining why the key is invalid (wrong length, invalid hex, etc.). Keys must be 32 bytes (64 hex characters) for AES-256-GCM.

### Signature

```typescript
class InvalidKeyError extends Error { reason: string }
```

### Import

```typescript
import { InvalidKeyError } from "@tidy-ts/shims";
```

### Returns

Error with reason property

### Examples

```typescript
// Handle invalid key
import { encrypt, InvalidKeyError } from "@tidy-ts/shims";

const result = await encrypt({ key: "too-short", data: "test" });
if (!result.ok && result.error instanceof InvalidKeyError) {
  console.error("Invalid key:", result.error.reason);
  // "Expected 32 bytes (64 hex chars), got 4 bytes"
}
```

### Best Practices

- ✓ GOOD: Use generateKey() to create valid keys
- ✓ GOOD: Check key length before encryption (64 hex chars)

### Related

`CryptoError`, `EncryptionError`, `DecryptionError`, `generateKey`

---

## EncryptionError

Error returned when encryption fails due to a crypto operation error. Contains the error message and optionally the underlying cause.

### Signature

```typescript
class EncryptionError extends Error { message: string; cause?: Error }
```

### Import

```typescript
import { EncryptionError } from "@tidy-ts/shims";
```

### Returns

Error with message and optional cause properties

### Examples

```typescript
// Handle encryption errors
import { encrypt, EncryptionError } from "@tidy-ts/shims";

const result = await encrypt({ key, data });
if (!result.ok && result.error instanceof EncryptionError) {
  console.error("Encryption failed:", result.error.message);
  if (result.error.cause) {
    console.error("Caused by:", result.error.cause);
  }
}
```

### Best Practices

- ✓ GOOD: Log the cause for debugging

### Related

`CryptoError`, `InvalidKeyError`, `DecryptionError`

---

## DecryptionError

Error returned when decryption fails. This typically indicates either the wrong key was used, or the ciphertext was tampered with (AES-GCM authentication failed). Contains the error message and optionally the underlying cause.

### Signature

```typescript
class DecryptionError extends Error { message: string; cause?: Error }
```

### Import

```typescript
import { DecryptionError } from "@tidy-ts/shims";
```

### Returns

Error with message and optional cause properties

### Examples

```typescript
// Handle decryption errors
import { decrypt, DecryptionError } from "@tidy-ts/shims";

const result = await decrypt({ key, data: ciphertext });
if (!result.ok && result.error instanceof DecryptionError) {
  console.error("Decryption failed:", result.error.message);
  // Could be wrong key or tampered ciphertext
}
```

### Best Practices

- ✓ GOOD: Treat decryption errors as potential tampering
- ✓ GOOD: Verify the correct key is being used

### Related

`CryptoError`, `InvalidKeyError`, `EncryptionError`

---

## EnvelopeEncryptionError

Error returned when envelope encryption fails. If the field property is set, it indicates which specific field failed to encrypt. Otherwise, the DEK encryption failed.

### Signature

```typescript
class EnvelopeEncryptionError extends Error { message: string; field?: string }
```

### Import

```typescript
import { EnvelopeEncryptionError } from "@tidy-ts/shims";
```

### Returns

Error with message and optional field properties

### Examples

```typescript
// Handle envelope encryption errors
import { encryptFields, EnvelopeEncryptionError } from "@tidy-ts/shims";

const result = await encryptFields({ fields, masterKey });
if (!result.ok && result.error instanceof EnvelopeEncryptionError) {
  if (result.error.field) {
    console.error(`Failed to encrypt field: ${result.error.field}`);
  } else {
    console.error("Failed to encrypt DEK");
  }
}
```

### Best Practices

- ✓ GOOD: Check field property to identify problematic field

### Related

`encryptFields`, `EnvelopeDecryptionError`, `EnvelopeError`

---

## EnvelopeDecryptionError

Error returned when envelope decryption fails. If the field property is set, it indicates which specific field failed to decrypt (possibly tampered). If not set, the DEK decryption failed (wrong master key or invalid DEK format).

### Signature

```typescript
class EnvelopeDecryptionError extends Error { message: string; field?: string }
```

### Import

```typescript
import { EnvelopeDecryptionError } from "@tidy-ts/shims";
```

### Returns

Error with message and optional field properties

### Examples

```typescript
// Handle envelope decryption errors
import { decryptFields, EnvelopeDecryptionError } from "@tidy-ts/shims";

const result = await decryptFields({ fields, dek, getMasterKey });
if (!result.ok && result.error instanceof EnvelopeDecryptionError) {
  if (result.error.field) {
    console.error(`Field "${result.error.field}" may be corrupted or tampered`);
  } else {
    console.error("Wrong master key or corrupted DEK");
  }
}
```

### Best Practices

- ✓ GOOD: Check field property to identify corrupted field
- ✓ GOOD: No field property usually means wrong master key

### Related

`decryptFields`, `EnvelopeEncryptionError`, `EnvelopeError`, `KeyNotFoundError`

---

## EnvelopeError

Union type of envelope encryption error types. Note: rotateMasterKey() can also return KeyNotFoundError and InvalidKeyIdError in addition to these types.

### Signature

```typescript
type EnvelopeError = EnvelopeEncryptionError | EnvelopeDecryptionError
```

### Import

```typescript
import { type EnvelopeError } from "@tidy-ts/shims";
```

### Returns

Type alias (not a value)

### Examples

```typescript
// Handle rotation errors with all possible error types
import { rotateMasterKey, EnvelopeDecryptionError, EnvelopeEncryptionError, KeyNotFoundError, InvalidKeyIdError } from "@tidy-ts/shims";

const result = await rotateMasterKey({ dek, newMasterKey, newMasterKeyId, getMasterKey });
if (!result.ok) {
  if (result.error instanceof KeyNotFoundError) {
    console.error(`Unknown key: ${result.error.keyId}`);
  } else if (result.error instanceof InvalidKeyIdError) {
    console.error(`Invalid key ID: ${result.error.reason}`);
  } else if (result.error instanceof EnvelopeDecryptionError) {
    console.error("Wrong old master key");
  } else if (result.error instanceof EnvelopeEncryptionError) {
    console.error("Invalid new master key");
  }
}
```

### Best Practices

- ✓ GOOD: Use instanceof to determine which operation failed

### Related

`rotateMasterKey`, `EnvelopeEncryptionError`, `EnvelopeDecryptionError`, `KeyNotFoundError`, `InvalidKeyIdError`

---

## InvalidKeyIdError

Error returned when a masterKeyId is invalid. The keyId cannot be empty and cannot contain colons (which are used as the delimiter in the self-describing DEK format).

### Signature

```typescript
class InvalidKeyIdError extends Error { keyId: string; reason: string }
```

### Import

```typescript
import { InvalidKeyIdError } from "@tidy-ts/shims";
```

### Returns

Error with keyId and reason properties

### Examples

```typescript
// Handle invalid key ID errors
import { encryptFields, InvalidKeyIdError } from "@tidy-ts/shims";

const result = await encryptFields({
  fields: { secret: "data" },
  masterKey,
  masterKeyId: "v1:invalid", // Contains colon - invalid!
});

if (!result.ok && result.error instanceof InvalidKeyIdError) {
  console.error(`Invalid key ID "${result.error.keyId}": ${result.error.reason}`);
  // Output: Invalid key ID "v1:invalid": Key ID cannot contain ':'
}
```

### Best Practices

- ✓ GOOD: Use simple key IDs like 'v1', 'prod-2024'
- ✓ GOOD: Avoid special characters in key IDs

### Related

`encryptFields`, `rotateMasterKey`, `KeyNotFoundError`

---

## KeyNotFoundError

Error returned when getMasterKey callback fails to return a key for the given masterKeyId. This can happen if the callback throws an error or returns an empty/null value. The cause property contains the original error if one was thrown.

### Signature

```typescript
class KeyNotFoundError extends Error { keyId: string; cause?: Error }
```

### Import

```typescript
import { KeyNotFoundError } from "@tidy-ts/shims";
```

### Returns

Error with keyId and optional cause properties

### Examples

```typescript
// Handle key not found errors
import { decryptFields, KeyNotFoundError } from "@tidy-ts/shims";

const getMasterKey = (keyId: string) => {
  const keys: Record<string, string> = { v2: env.get("MASTER_KEY_V2")! };
  const key = keys[keyId];
  if (!key) throw new Error(`Key not found: ${keyId}`);
  return key;
};

// Trying to decrypt data encrypted with v1 key (which we no longer have)
const result = await decryptFields({
  fields: event.encrypted,
  dek: event.dek, // "v1:encryptedDek..." - v1 not in our key store!
  getMasterKey,
});

if (!result.ok && result.error instanceof KeyNotFoundError) {
  console.error(`Key "${result.error.keyId}" not found in key store`);
  if (result.error.cause) {
    console.error("Original error:", result.error.cause.message);
  }
}
```

### Best Practices

- ✓ GOOD: Ensure all historical key IDs are in your key store
- ✓ GOOD: Check cause property for debugging
- ✓ GOOD: Keep old keys until all data is migrated

### Related

`decryptFields`, `rotateMasterKey`, `InvalidKeyIdError`

---

## generateKey

Generates a cryptographically secure random key for AES-256-GCM encryption using Web Crypto API (crypto.getRandomValues). Returns a hexadecimal string suitable for use as SECRET_KEY environment variable. Default 32-byte (256-bit) key is designed for AES-256-GCM.

### Signature

```typescript
generateKey(length?): string
```

### Import

```typescript
import { generateKey } from "@tidy-ts/shims";
```

### Parameters

- length: number - Number of bytes to generate (default: 32 for AES-256-GCM)

### Returns

string - Hexadecimal string representation of the key (2 hex chars per byte, e.g., 64 chars for 32 bytes)

### Examples

```typescript
// Generate default 32-byte key for AES-256-GCM
import { generateKey } from "@tidy-ts/shims";

const key = generateKey();
console.log(`SECRET_KEY=${key}`);
// Output: SECRET_KEY=abc123def456... (64 hex characters)
// Generate 16-byte key for AES-128-GCM
const key128 = generateKey(16);
console.log(`SECRET_KEY=${key128}`);
// Output: SECRET_KEY=abc123... (32 hex characters)
// Generate and set in environment
import { generateKey } from "@tidy-ts/shims";
import { env } from "@tidy-ts/shims";

const key = generateKey();
env.set("SECRET_KEY", key);
// Now encrypt/decrypt will work
// Generate key for production
// Run: deno run -A generateKey.ts
// Or: generate-key (if installed globally)
// Copy output to .env file: SECRET_KEY=<generated-key>
```

### Best Practices

- ✓ GOOD: Generate a new key for each application/environment
- ✓ GOOD: Store generated key securely (environment variables, secret manager)
- ✓ GOOD: Use 32-byte (256-bit) keys for AES-256-GCM (default)
- ✓ GOOD: Never commit SECRET_KEY to version control
- ✓ GOOD: Use different keys for development, staging, and production

### Anti-patterns

- ❌ BAD: Sharing the same SECRET_KEY across multiple applications
- ❌ BAD: Using predictable or weak keys
- ❌ BAD: Committing SECRET_KEY to git repositories
- ❌ BAD: Using keys shorter than 32 bytes for AES-256-GCM

### Related

`encrypt`, `decrypt`, `env`

---

## toBase64URL

Converts standard Base64 encoding to Base64URL format (RFC 4648 §5). Replaces '+' with '-', '/' with '_', and removes padding '=' characters. Base64URL is URL-safe and can be used in URLs, filenames, and environment variables without encoding. Used automatically by encrypt() when outputEncoding is 'base64' and urlSafe is true.

### Signature

```typescript
toBase64URL(base64: string): string
```

### Import

```typescript
import { toBase64URL } from "@tidy-ts/shims";
```

### Parameters

- base64: string - Standard Base64-encoded string

### Returns

string - Base64URL-encoded string (URL-safe)

### Examples

```typescript
// Convert Base64 to Base64URL
import { toBase64URL } from "@tidy-ts/shims";

const base64 = "SGVsbG8gV29ybGQh==";
const urlSafe = toBase64URL(base64);
console.log(urlSafe); // "SGVsbG8gV29ybGQh"
// Use in URL
const token = toBase64URL(encryptedData);
const url = `https://api.example.com/verify?token=${token}`;
// Use in environment variable
const safeValue = toBase64URL(base64Data);
// Can be used directly in .env file without quotes
```

### Best Practices

- ✓ GOOD: Use for values that will be in URLs or environment variables
- ✓ GOOD: Reversible with fromBase64URL()
- ✓ GOOD: Automatically handled by encrypt() with default settings

### Related

`fromBase64URL`, `encrypt`, `decrypt`

---

## fromBase64URL

Converts Base64URL format back to standard Base64 (RFC 4648 §4). Replaces '-' with '+', '_' with '/', and adds padding '=' characters as needed. Used automatically by decrypt() when inputEncoding is 'base64' and urlSafe is true.

### Signature

```typescript
fromBase64URL(base64url: string): string
```

### Import

```typescript
import { fromBase64URL } from "@tidy-ts/shims";
```

### Parameters

- base64url: string - Base64URL-encoded string

### Returns

string - Standard Base64-encoded string with padding

### Examples

```typescript
// Convert Base64URL back to Base64
import { fromBase64URL } from "@tidy-ts/shims";

const urlSafe = "SGVsbG8gV29ybGQh";
const base64 = fromBase64URL(urlSafe);
console.log(base64); // "SGVsbG8gV29ybGQh=="
// Round-trip conversion
const original = "SGVsbG8gV29ybGQh==";
const urlSafe = toBase64URL(original);
const restored = fromBase64URL(urlSafe);
console.log(restored === original); // true
```

### Best Practices

- ✓ GOOD: Use to convert Base64URL back to standard Base64
- ✓ GOOD: Automatically handled by decrypt() with default settings
- ✓ GOOD: Reversible with toBase64URL()

### Related

`toBase64URL`, `encrypt`, `decrypt`

---

## RetryConfig

Configuration for retry behavior in parallel() and batch(). Supports three backoff strategies: exponential (delay doubles), linear (delay increases by fixed amount), or custom (user-defined function). All strategies support maxRetries, shouldRetry filter, and onRetry callback.

### Signature

```typescript
type RetryConfig = ExponentialBackoff | LinearBackoff | CustomBackoff
```

### Import

```typescript
import { type RetryConfig, type ExponentialBackoff, type LinearBackoff, type CustomBackoff } from "@tidy-ts/shims";
```

### Parameters

- backoff: 'exponential' | 'linear' | 'custom' - Backoff strategy
- maxRetries?: number - Maximum retry attempts (default: 3)
- baseDelay?: number - Initial delay in ms (default: 100)
- backoffMultiplier?: number - Multiplier for exponential backoff (default: 2)
- maxDelay?: number - Maximum delay cap in ms (default: 5000)
- backoffFn?: (error, attempt, taskIndex) => number - Custom delay function (required for 'custom')
- shouldRetry?: (error, attempt) => boolean - Filter which errors to retry
- onRetry?: (error, attempt, taskIndex) => void - Callback before each retry

### Returns

Used as options.retry in parallel() and batch()

### Examples

```typescript
// Exponential backoff: 100ms, 200ms, 400ms, 800ms...
const retry: RetryConfig = {
  backoff: "exponential",
  maxRetries: 3,
  baseDelay: 100,
  backoffMultiplier: 2,
  maxDelay: 5000,
};
// Linear backoff: 100ms, 200ms, 300ms, 400ms...
const retry: RetryConfig = {
  backoff: "linear",
  maxRetries: 5,
  baseDelay: 100,
  maxDelay: 1000,
};
// Custom backoff with jitter
const retry: RetryConfig = {
  backoff: "custom",
  maxRetries: 3,
  backoffFn: (error, attempt) => {
    const base = 100 * Math.pow(2, attempt);
    return base + Math.random() * base; // Add jitter
  },
};
// Retry only on network errors
const retry: RetryConfig = {
  backoff: "exponential",
  maxRetries: 3,
  shouldRetry: (error) => {
    return error instanceof Error && 
      (error.message.includes("network") || 
       error.message.includes("timeout"));
  },
};
```

### Best Practices

- ✓ GOOD: Use exponential backoff for rate-limited APIs
- ✓ GOOD: Use shouldRetry to filter retryable errors (e.g., 429, 503)
- ✓ GOOD: Add jitter with custom backoff to prevent thundering herd
- ✓ GOOD: Use onRetry for logging/monitoring retry behavior
- ❌ BAD: Retrying non-transient errors (e.g., 400, 404)

### Related

`parallel`, `batch`

---

## SettledResult

Result type returned by parallel() and batch() when settled: true is set. Mirrors the Promise.allSettled result format. Use to collect all results including failures without throwing on first error.

### Signature

```typescript
type SettledResult<T> = { status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown }
```

### Import

```typescript
import { type SettledResult } from "@tidy-ts/shims";
```

### Parameters

- status: 'fulfilled' | 'rejected' - Whether the task succeeded or failed
- value: T - The result value (only when status is 'fulfilled')
- reason: unknown - The error (only when status is 'rejected')

### Returns

Used as return type when settled: true

### Examples

```typescript
// Process results with settled mode
const results = await batch(items, fn, { concurrency: 5, settled: true });

// Extract successes and failures
const successes = results
  .filter((r): r is { status: 'fulfilled'; value: T } => r.status === 'fulfilled')
  .map(r => r.value);

const failures = results
  .filter((r): r is { status: 'rejected'; reason: unknown } => r.status === 'rejected')
  .map(r => r.reason);
// Calculate success rate
const total = results.length;
const succeeded = results.filter(r => r.status === 'fulfilled').length;
console.log(`Success rate: ${succeeded}/${total}`);
```

### Best Practices

- ✓ GOOD: Use with settled: true when partial success is acceptable
- ✓ GOOD: Use type guards to narrow the union type
- ✓ GOOD: Log or report failures even when continuing with successes

### Related

`parallel`, `batch`

---
