# Filesystem

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [readFile](#readfile)
- [readTextFile](#readtextfile)
- [writeFile](#writefile)
- [writeTextFile](#writetextfile)
- [mkdir](#mkdir)
- [stat](#stat)
- [remove](#remove)
- [listDir](#listdir)
- [copyFile](#copyfile)
- [rename](#rename)
- [exists](#exists)
- [open](#open)
- [readFileSync](#readfilesync)
- [writeFileSync](#writefilesync)
- [writeTextFileSync](#writetextfilesync)

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

`readFile`, `writeFile`, `exists`

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
```

### Best Practices

- ✓ GOOD: Use to enumerate directory contents
- ✓ GOOD: Check isFile and isDirectory to determine entry type

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

### Anti-patterns

- ❌ BAD: Using readFile + writeFile when copyFile is simpler

### Related

`rename`, `readFile`, `writeFile`

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
```

### Best Practices

- ✓ GOOD: Atomic operation (faster than copy + delete)
- ✓ GOOD: Works for both files and directories

### Anti-patterns

- ❌ BAD: Using copyFile + remove when rename is faster

### Related

`copyFile`, `remove`, `exists`

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
```

### Best Practices

- ✓ GOOD: Convenient boolean check for existence
- ✓ GOOD: Never throws errors (returns false for non-existent paths)

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
