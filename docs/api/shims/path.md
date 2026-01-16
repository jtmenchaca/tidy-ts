# Path

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [resolve](#resolve)
- [dirname](#dirname)
- [fileURLToPath](#fileurltopath)
- [pathToFileURL](#pathtofileurl)

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
// Get current file's directory
import { dirname, fileURLToPath } from "@tidy-ts/shims";

const __dirname = dirname(fileURLToPath(import.meta.url));
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
// Get __filename and __dirname equivalents
import { fileURLToPath, dirname } from "@tidy-ts/shims";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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
// Use for dynamic imports
const modulePath = pathToFileURL("/path/to/module.ts");
const module = await import(modulePath.href);
```

### Best Practices

- ✓ GOOD: Use when you need URL format from file paths
- ✓ GOOD: Useful for dynamic imports in some runtimes

### Related

`fileURLToPath`

---
