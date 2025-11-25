import type { DocEntry } from "./mcp-types.ts";

export const shimsDocs: Record<string, DocEntry> = {
  // Runtime Detection
  getCurrentRuntime: {
    name: "getCurrentRuntime",
    category: "shims",
    signature: "getCurrentRuntime(): Runtime",
    description:
      "Detects the current JavaScript runtime environment. Returns an enum value identifying whether code is running in Deno, Bun, Node.js, Browser, or other environments. Useful for conditional logic based on runtime capabilities.",
    imports: [
      'import { getCurrentRuntime, Runtime } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns:
      "Runtime enum value (Deno, Bun, Node, Browser, Tauri, Workerd, Netlify, EdgeLight, Fastly, or Unsupported)",
    examples: [
      '// Detect current runtime\nimport { getCurrentRuntime, Runtime } from "@tidy-ts/shims";\n\nconst runtime = getCurrentRuntime();\nif (runtime === Runtime.Deno) {\n  console.log("Running in Deno");\n} else if (runtime === Runtime.Node) {\n  console.log("Running in Node.js");\n}',
      "// Use for conditional imports or logic\nif (getCurrentRuntime() === Runtime.Browser) {\n  // Browser-specific code\n} else {\n  // Server-side code\n}",
    ],
    related: ["currentRuntime"],
    bestPractices: [
      "✓ GOOD: Use for conditional logic based on runtime capabilities",
      "✓ GOOD: Check runtime before using platform-specific APIs",
      "✓ GOOD: Prefer runtime-agnostic shims over direct runtime checks when possible",
    ],
  },

  currentRuntime: {
    name: "currentRuntime",
    category: "shims",
    signature: "const currentRuntime: Runtime",
    description:
      "Cached runtime detection result. Determined once when module loads, providing fast access to runtime information without repeated detection.",
    imports: [
      'import { currentRuntime, Runtime } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns:
      "Runtime enum value (Deno, Bun, Node, Browser, Tauri, Workerd, Netlify, EdgeLight, Fastly, or Unsupported)",
    examples: [
      '// Quick runtime check\nimport { currentRuntime, Runtime } from "@tidy-ts/shims";\n\nif (currentRuntime === Runtime.Deno) {\n  console.log("Running in Deno");\n}',
      "// Conditional configuration\nconst config = {\n  timeout: currentRuntime === Runtime.Browser ? 5000 : 30000,\n};",
    ],
    related: ["getCurrentRuntime"],
    bestPractices: [
      "✓ GOOD: Use this constant for performance (cached value)",
      "✓ GOOD: Prefer over repeated getCurrentRuntime() calls",
    ],
  },

  // File System Operations
  readFile: {
    name: "readFile",
    category: "shims",
    signature: "readFile(filePath: string): Promise<Uint8Array>",
    description:
      "Read a file asynchronously as binary data. Works identically across Deno, Bun, and Node.js runtimes, providing a unified API for file reading.",
    imports: [
      'import { readFile } from "@tidy-ts/shims";',
    ],
    parameters: [
      "filePath: Path to the file to read",
    ],
    returns: "Promise<Uint8Array> - The file contents as binary data",
    examples: [
      '// Read binary file\nimport { readFile } from "@tidy-ts/shims";\n\nconst data = await readFile("./file.bin");\nconsole.log(`Read ${data.length} bytes`);',
      "// Convert to text if needed\nconst data = await readFile('./file.txt');\nconst text = new TextDecoder().decode(data);",
    ],
    related: ["readTextFile", "readFileSync", "writeFile"],
    bestPractices: [
      "✓ GOOD: Use for binary files or when you need raw bytes",
      "✓ GOOD: Use readTextFile() instead if reading text files",
    ],
  },

  readTextFile: {
    name: "readTextFile",
    category: "shims",
    signature: "readTextFile(filePath: string): Promise<string>",
    description:
      "Read a text file asynchronously as a UTF-8 string. Automatically handles text encoding across all supported runtimes.",
    imports: [
      'import { readTextFile } from "@tidy-ts/shims";',
    ],
    parameters: [
      "filePath: Path to the text file to read",
    ],
    returns: "Promise<string> - The file contents as a string",
    examples: [
      '// Read text file\nimport { readTextFile } from "@tidy-ts/shims";\n\nconst content = await readTextFile("./config.json");\nconst config = JSON.parse(content);',
      "// Read and process text\nconst markdown = await readTextFile('./README.md');\nconst lines = markdown.split('\\n');",
    ],
    related: ["readFile", "writeTextFile", "readFileSync"],
    bestPractices: [
      "✓ GOOD: Use for text files (UTF-8 encoding assumed)",
      "✓ GOOD: Preferred over readFile() for text content",
    ],
  },

  writeFile: {
    name: "writeFile",
    category: "shims",
    signature:
      "writeFile(filePath: string, data: Uint8Array, options?: { create?: boolean; mode?: number }): Promise<void>",
    description:
      "Write a file asynchronously with binary data. Automatically creates parent directories if they don't exist. Works consistently across Deno, Bun, and Node.js.",
    imports: [
      'import { writeFile } from "@tidy-ts/shims";',
    ],
    parameters: [
      "filePath: Path to the file to write",
      "data: The binary data to write (Uint8Array)",
      "options.create: Whether to create the file if it doesn't exist (default: true)",
      "options.mode: File permissions mode (Unix-style, optional)",
    ],
    returns: "Promise<void>",
    examples: [
      '// Write binary data\nimport { writeFile } from "@tidy-ts/shims";\n\nconst data = new Uint8Array([1, 2, 3, 4, 5]);\nawait writeFile("./output.bin", data);',
      '// Parent directories are created automatically\nawait writeFile("./deeply/nested/path/file.bin", data);',
      "// Convert text to bytes\nconst text = 'Hello, World!';\nconst bytes = new TextEncoder().encode(text);\nawait writeFile('./message.txt', bytes);",
    ],
    related: ["writeTextFile", "readFile", "writeFileSync"],
    bestPractices: [
      "✓ GOOD: Use for binary files or when you have Uint8Array data",
      "✓ GOOD: Use writeTextFile() instead for text content",
      "✓ GOOD: Parent directories are automatically created",
    ],
  },

  writeTextFile: {
    name: "writeTextFile",
    category: "shims",
    signature:
      "writeTextFile(filePath: string, data: string, options?: { create?: boolean; mode?: number }): Promise<void>",
    description:
      "Write a text file asynchronously. Automatically creates parent directories if they don't exist. Handles UTF-8 encoding automatically.",
    imports: [
      'import { writeTextFile } from "@tidy-ts/shims";',
    ],
    parameters: [
      "filePath: Path to the file to write",
      "data: The text content to write",
      "options.create: Whether to create the file if it doesn't exist (default: true)",
      "options.mode: File permissions mode (Unix-style, optional)",
    ],
    returns: "Promise<void>",
    examples: [
      '// Write text file\nimport { writeTextFile } from "@tidy-ts/shims";\n\nawait writeTextFile("./output.txt", "Hello, World!");',
      '// Write JSON\nconst data = { name: "Alice", age: 30 };\nawait writeTextFile("./data.json", JSON.stringify(data, null, 2));',
      '// Parent directories are created automatically\nawait writeTextFile("./logs/2024/app.log", "Application started");',
    ],
    related: ["writeFile", "readTextFile", "writeTextFileSync"],
    bestPractices: [
      "✓ GOOD: Preferred method for writing text files",
      "✓ GOOD: UTF-8 encoding is automatic",
      "✓ GOOD: Parent directories are automatically created",
    ],
  },

  mkdir: {
    name: "mkdir",
    category: "shims",
    signature:
      "mkdir(dirPath: string, options?: { recursive?: boolean; mode?: number }): Promise<void>",
    description:
      "Create a directory. Supports recursive directory creation to make nested paths in one call.",
    imports: [
      'import { mkdir } from "@tidy-ts/shims";',
    ],
    parameters: [
      "dirPath: Path to the directory to create",
      "options.recursive: Create parent directories if needed (default: false)",
      "options.mode: Directory permissions mode (Unix-style, optional)",
    ],
    returns: "Promise<void>",
    examples: [
      '// Create single directory\nimport { mkdir } from "@tidy-ts/shims";\n\nawait mkdir("./my-dir");',
      '// Create nested directories\nawait mkdir("./path/to/nested/dir", { recursive: true });',
    ],
    related: ["writeFile", "writeTextFile", "remove"],
    bestPractices: [
      "✓ GOOD: Use recursive: true for nested paths",
      "✓ GOOD: writeFile/writeTextFile auto-create parent dirs, so mkdir often unnecessary",
    ],
  },

  stat: {
    name: "stat",
    category: "shims",
    signature:
      "stat(filePath: string): Promise<{ size: number; isFile: boolean; isDirectory: boolean; mtime: Date | null; atime: Date | null; birthtime: Date | null }>",
    description:
      "Get file or directory statistics including size, type, and timestamps. Works consistently across all supported runtimes.",
    imports: [
      'import { stat } from "@tidy-ts/shims";',
    ],
    parameters: [
      "filePath: Path to the file or directory",
    ],
    returns:
      "Promise with size (bytes), isFile, isDirectory, mtime (modification time), atime (access time), birthtime (creation time)",
    examples: [
      '// Get file info\nimport { stat } from "@tidy-ts/shims";\n\nconst info = await stat("./file.txt");\nconsole.log(`File size: ${info.size} bytes`);\nconsole.log(`Is file: ${info.isFile}`);\nconsole.log(`Modified: ${info.mtime}`);',
      "// Check if path is directory\nconst info = await stat('./my-dir');\nif (info.isDirectory) {\n  console.log('This is a directory');\n}",
    ],
    related: ["readFile", "writeFile"],
    bestPractices: [
      "✓ GOOD: Use to check file size before reading",
      "✓ GOOD: Use to differentiate files from directories",
    ],
  },

  remove: {
    name: "remove",
    category: "shims",
    signature:
      "remove(filePath: string, options?: { recursive?: boolean }): Promise<void>",
    description:
      "Remove a file or directory. Supports recursive deletion of directories and their contents. Does not throw if file doesn't exist.",
    imports: [
      'import { remove } from "@tidy-ts/shims";',
    ],
    parameters: [
      "filePath: Path to the file or directory to remove",
      "options.recursive: Remove directory and all contents (required for non-empty directories)",
    ],
    returns: "Promise<void>",
    examples: [
      '// Remove file\nimport { remove } from "@tidy-ts/shims";\n\nawait remove("./file.txt");',
      '// Remove directory and contents\nawait remove("./my-dir", { recursive: true });',
      "// Safe to call on non-existent files (no error thrown)\nawait remove('./maybe-exists.txt');",
    ],
    related: ["writeFile", "mkdir", "exists"],
    bestPractices: [
      "✓ GOOD: Use recursive: true for directories with contents",
      "✓ GOOD: Safe to call on non-existent paths",
    ],
    antiPatterns: [
      "❌ BAD: Forgetting recursive: true when removing non-empty directories",
    ],
  },

  listDir: {
    name: "listDir",
    category: "shims",
    signature: "listDir(dirPath: string): Promise<DirEntry[]>",
    description:
      "List files and directories in a directory. Returns an array of directory entries with name and type information. Works consistently across Deno, Bun, and Node.js.",
    imports: [
      'import { listDir } from "@tidy-ts/shims";',
    ],
    parameters: [
      "dirPath: Path to the directory to list",
    ],
    returns:
      "Promise<DirEntry[]> - Array of entries with name, isFile, isDirectory, isSymbolicLink",
    examples: [
      '// List directory contents\nimport { listDir } from "@tidy-ts/shims";\n\nconst entries = await listDir("./my-dir");\nfor (const entry of entries) {\n  if (entry.isDirectory) {\n    console.log(`📁 ${entry.name}`);\n  } else {\n    console.log(`📄 ${entry.name}`);\n  }\n}',
      "// Filter files only\nconst files = entries.filter(e => e.isFile);\nconsole.log(`Found ${files.length} files`);",
      "// Find subdirectories\nconst dirs = entries.filter(e => e.isDirectory);\ndirs.forEach(dir => console.log(dir.name));",
    ],
    related: ["mkdir", "stat", "exists"],
    bestPractices: [
      "✓ GOOD: Use to enumerate directory contents",
      "✓ GOOD: Check isFile and isDirectory to determine entry type",
      "✓ GOOD: Combine with stat() for detailed file information",
    ],
  },

  copyFile: {
    name: "copyFile",
    category: "shims",
    signature:
      "copyFile(src: string, dest: string, options?: { overwrite?: boolean }): Promise<void>",
    description:
      "Copy a file from source to destination. By default overwrites if destination exists. Works consistently across Deno, Bun, and Node.js.",
    imports: [
      'import { copyFile } from "@tidy-ts/shims";',
    ],
    parameters: [
      "src: Source file path",
      "dest: Destination file path",
      "options.overwrite: Whether to overwrite existing file (default: true)",
    ],
    returns: "Promise<void>",
    examples: [
      '// Copy file (overwrites by default)\nimport { copyFile } from "@tidy-ts/shims";\n\nawait copyFile("./source.txt", "./destination.txt");',
      "// Copy without overwriting\nawait copyFile('./source.txt', './dest.txt', { overwrite: false });\n// Throws error if destination exists",
      "// Backup file\nconst timestamp = new Date().toISOString().replace(/:/g, '-');\nawait copyFile('./data.json', `./backups/data-${timestamp}.json`);",
    ],
    related: ["rename", "readFile", "writeFile"],
    bestPractices: [
      "✓ GOOD: Default behavior overwrites existing files",
      "✓ GOOD: Use overwrite: false to prevent accidental overwrites",
      "✓ GOOD: Great for creating backups or duplicating files",
    ],
    antiPatterns: [
      "❌ BAD: Using readFile + writeFile when copyFile is simpler",
    ],
  },

  rename: {
    name: "rename",
    category: "shims",
    signature: "rename(oldPath: string, newPath: string): Promise<void>",
    description:
      "Rename or move a file or directory. Can move across directories. Works consistently across Deno, Bun, and Node.js.",
    imports: [
      'import { rename } from "@tidy-ts/shims";',
    ],
    parameters: [
      "oldPath: Current file or directory path",
      "newPath: New file or directory path",
    ],
    returns: "Promise<void>",
    examples: [
      '// Rename file\nimport { rename } from "@tidy-ts/shims";\n\nawait rename("./old-name.txt", "./new-name.txt");',
      "// Move file to different directory\nawait rename('./file.txt', './archive/file.txt');",
      "// Rename directory\nawait rename('./old-folder', './new-folder');",
      "// Move and rename\nawait rename('./data/temp.json', './output/results.json');",
    ],
    related: ["copyFile", "remove", "exists"],
    bestPractices: [
      "✓ GOOD: Atomic operation (faster than copy + delete)",
      "✓ GOOD: Works for both files and directories",
      "✓ GOOD: Can move across directories",
    ],
    antiPatterns: [
      "❌ BAD: Using copyFile + remove when rename is faster",
    ],
  },

  exists: {
    name: "exists",
    category: "shims",
    signature: "exists(filePath: string): Promise<boolean>",
    description:
      "Check if a file or directory exists. Returns true if path exists, false otherwise. Does not throw errors. Works consistently across Deno, Bun, and Node.js.",
    imports: [
      'import { exists } from "@tidy-ts/shims";',
    ],
    parameters: [
      "filePath: Path to check for existence",
    ],
    returns: "Promise<boolean> - true if exists, false otherwise",
    examples: [
      '// Check if file exists\nimport { exists } from "@tidy-ts/shims";\n\nif (await exists("./config.json")) {\n  console.log("Config file found");\n} else {\n  console.log("Config file missing");\n}',
      "// Conditional file creation\nif (!await exists('./data.json')) {\n  await writeTextFile('./data.json', '[]');\n}",
      "// Check directory\nif (await exists('./logs')) {\n  console.log('Logs directory exists');\n}",
    ],
    related: ["stat", "readFile", "writeFile"],
    bestPractices: [
      "✓ GOOD: Convenient boolean check for existence",
      "✓ GOOD: Never throws errors (returns false for non-existent paths)",
      "✓ GOOD: Use before reading files to avoid errors",
    ],
    antiPatterns: [
      "❌ BAD: Race conditions (file may be deleted between exists() and readFile())",
    ],
  },

  open: {
    name: "open",
    category: "shims",
    signature:
      'open(filePath: string, mode?: "r" | "w" | "a" | "r+" | "w+" | "a+"): Promise<FileHandle>',
    description:
      "Open a file for reading or writing with fine-grained control. Returns a file handle with read() and close() methods. Useful for reading large files in chunks.",
    imports: [
      'import { open } from "@tidy-ts/shims";',
    ],
    parameters: [
      "filePath: Path to the file to open",
      'mode: File mode - "r" (read), "w" (write), "a" (append), "r+" (read/write), etc.',
    ],
    returns:
      "Promise<FileHandle> with read(buffer, offset, length, position) and close() methods",
    examples: [
      '// Read file in chunks\nimport { open } from "@tidy-ts/shims";\n\nconst file = await open("./large-file.bin", "r");\nconst buffer = new Uint8Array(1024);\nconst { bytesRead } = await file.read(buffer, 0, buffer.length, 0);\nconsole.log(`Read ${bytesRead} bytes`);\nawait file.close();',
    ],
    related: ["readFile", "writeFile"],
    bestPractices: [
      "✓ GOOD: Use for reading large files in chunks",
      "✓ GOOD: Always call close() when done",
      "✓ GOOD: Use readFile() for small files instead",
    ],
  },

  readFileSync: {
    name: "readFileSync",
    category: "shims",
    signature: "readFileSync(filePath: string): Uint8Array",
    description:
      "Read a file synchronously as binary data. Blocks execution until file is read. Use async readFile() when possible for better performance.",
    imports: [
      'import { readFileSync } from "@tidy-ts/shims";',
    ],
    parameters: [
      "filePath: Path to the file to read",
    ],
    returns: "Uint8Array - The file contents as binary data",
    examples: [
      '// Read file synchronously\nimport { readFileSync } from "@tidy-ts/shims";\n\nconst data = readFileSync("./config.bin");',
    ],
    related: ["readFile", "writeFileSync"],
    bestPractices: [
      "✓ GOOD: Only use when async I/O is not possible",
      "✓ GOOD: Prefer async readFile() for better performance",
    ],
    antiPatterns: [
      "❌ BAD: Using sync I/O in async contexts (blocks event loop)",
    ],
  },

  writeFileSync: {
    name: "writeFileSync",
    category: "shims",
    signature:
      "writeFileSync(filePath: string, data: Uint8Array | string): void",
    description:
      "Write a file synchronously with binary or text data. Blocks execution until write completes. Automatically creates parent directories.",
    imports: [
      'import { writeFileSync } from "@tidy-ts/shims";',
    ],
    parameters: [
      "filePath: Path to the file to write",
      "data: Binary data (Uint8Array) or text (string) to write",
    ],
    returns: "void",
    examples: [
      '// Write file synchronously\nimport { writeFileSync } from "@tidy-ts/shims";\n\nwriteFileSync("./output.txt", "Hello, World!");',
      "// Write binary data\nwriteFileSync('./output.bin', new Uint8Array([1, 2, 3]));",
    ],
    related: ["writeFile", "readFileSync", "writeTextFileSync"],
    bestPractices: [
      "✓ GOOD: Only use when async I/O is not possible",
      "✓ GOOD: Prefer async writeFile() for better performance",
      "✓ GOOD: Parent directories are automatically created",
    ],
    antiPatterns: [
      "❌ BAD: Using sync I/O in async contexts (blocks event loop)",
    ],
  },

  writeTextFileSync: {
    name: "writeTextFileSync",
    category: "shims",
    signature: "writeTextFileSync(filePath: string, data: string): void",
    description:
      "Write a text file synchronously. Blocks execution until write completes. Automatically creates parent directories.",
    imports: [
      'import { writeTextFileSync } from "@tidy-ts/shims";',
    ],
    parameters: [
      "filePath: Path to the file to write",
      "data: Text content to write",
    ],
    returns: "void",
    examples: [
      '// Write text file synchronously\nimport { writeTextFileSync } from "@tidy-ts/shims";\n\nwriteTextFileSync("./output.txt", "Hello, World!");',
    ],
    related: ["writeTextFile", "writeFileSync"],
    bestPractices: [
      "✓ GOOD: Only use when async I/O is not possible",
      "✓ GOOD: Prefer async writeTextFile() for better performance",
    ],
  },

  // Path Utilities
  resolve: {
    name: "resolve",
    category: "shims",
    signature: "resolve(...paths: string[]): string",
    description:
      "Resolve a sequence of paths into an absolute path. Handles both forward and backward slashes correctly on all platforms.",
    imports: [
      'import { resolve } from "@tidy-ts/shims";',
    ],
    parameters: [
      "...paths: Path segments to resolve",
    ],
    returns: "string - The absolute path",
    examples: [
      '// Resolve to absolute path\nimport { resolve } from "@tidy-ts/shims";\n\nconst absPath = resolve("./data", "file.txt");\nconsole.log(absPath); // /current/working/dir/data/file.txt',
      '// Resolve multiple segments\nconst path = resolve("/root", "nested", "dir", "file.txt");',
    ],
    related: ["dirname", "fileURLToPath"],
    bestPractices: [
      "✓ GOOD: Use to convert relative paths to absolute paths",
      "✓ GOOD: Works consistently across all platforms",
    ],
  },

  dirname: {
    name: "dirname",
    category: "shims",
    signature: "dirname(path: string): string",
    description:
      "Get the directory name from a file path. Returns the parent directory path.",
    imports: [
      'import { dirname } from "@tidy-ts/shims";',
    ],
    parameters: [
      "path: File or directory path",
    ],
    returns: "string - The parent directory path",
    examples: [
      '// Get directory from path\nimport { dirname } from "@tidy-ts/shims";\n\nconst dir = dirname("/path/to/file.txt");\nconsole.log(dir); // /path/to',
    ],
    related: ["resolve", "importMeta"],
    bestPractices: [
      "✓ GOOD: Use to extract directory from file paths",
    ],
  },

  fileURLToPath: {
    name: "fileURLToPath",
    category: "shims",
    signature: "fileURLToPath(url: string | URL): string",
    description:
      "Convert a file:// URL to a file system path. Useful when working with import.meta.url.",
    imports: [
      'import { fileURLToPath } from "@tidy-ts/shims";',
    ],
    parameters: [
      "url: File URL to convert (string or URL object)",
    ],
    returns: "string - The file system path",
    examples: [
      '// Convert import.meta.url to path\nimport { fileURLToPath } from "@tidy-ts/shims";\n\nconst currentFile = fileURLToPath(import.meta.url);\nconsole.log(currentFile);',
    ],
    related: ["pathToFileURL", "importMeta"],
    bestPractices: [
      "✓ GOOD: Use with import.meta.url to get current file path",
    ],
  },

  pathToFileURL: {
    name: "pathToFileURL",
    category: "shims",
    signature: "pathToFileURL(path: string): URL",
    description: "Convert a file system path to a file:// URL object.",
    imports: [
      'import { pathToFileURL } from "@tidy-ts/shims";',
    ],
    parameters: [
      "path: File system path to convert",
    ],
    returns: "URL - The file:// URL object",
    examples: [
      '// Convert path to URL\nimport { pathToFileURL } from "@tidy-ts/shims";\n\nconst url = pathToFileURL("/path/to/file.txt");\nconsole.log(url.href); // file:///path/to/file.txt',
    ],
    related: ["fileURLToPath"],
    bestPractices: [
      "✓ GOOD: Use when you need URL format from file paths",
    ],
  },

  // Environment Variables
  env: {
    name: "env",
    category: "shims",
    signature:
      "env.get(key: string): string | undefined\nenv.set(key: string, value: string): void\nenv.delete(key: string): void\nenv.toObject(): Record<string, string>\nenv.loadFromFile(path: string | string[] | URL, options?: { export?: boolean }): Promise<Record<string, string>>\nenv.loadFromFileSync(path: string | string[] | URL, options?: { export?: boolean }): Record<string, string>",
    description:
      "Access and modify environment variables in a runtime-agnostic way. Provides get() to retrieve individual variables, set() to modify them, delete() to remove them, toObject() to get all environment variables as an object, and loadFromFile() to load variables from .env files.",
    imports: [
      'import { env } from "@tidy-ts/shims";',
    ],
    parameters: [
      "key: Environment variable name",
      "value: Value to set (for set() method)",
      "path: File path(s) or URL to .env file(s) (for loadFromFile)",
      "options.export: Whether to export loaded vars to process environment (default: true)",
    ],
    returns:
      "string | undefined (for get), void (for set/delete), Record<string, string> (for toObject/loadFromFile)",
    examples: [
      '// Get environment variable\nimport { env } from "@tidy-ts/shims";\n\nconst apiKey = env.get("API_KEY");\nif (!apiKey) {\n  throw new Error("API_KEY not set");\n}',
      '// Set environment variable\nenv.set("DEBUG", "true");\nenv.set("LOG_LEVEL", "verbose");',
      '// Delete environment variable\nenv.delete("TEMP_VAR");',
      "// Get all environment variables\nconst allEnv = env.toObject();\nconsole.log(allEnv);",
      "// With default value\nconst port = env.get('PORT') || '3000';",
      '// Load from .env file (exports to environment by default)\nawait env.loadFromFile(".env");',
      '// Load from multiple files (later files override earlier ones)\nconst config = await env.loadFromFile([".env", ".env.local", ".env.production"]);',
      '// Load without exporting to process environment\nconst config = await env.loadFromFile(".env", { export: false });',
      '// Synchronous loading\nconst configSync = env.loadFromFileSync(".env");',
      '// Load from URL\nconst config = await env.loadFromFile(new URL("file:///path/to/.env"));',
      '// Test setup/teardown\nconst original = env.get("API_URL");\nenv.set("API_URL", "http://test.example.com");\n// ... run tests ...\nif (original) {\n  env.set("API_URL", original);\n} else {\n  env.delete("API_URL");\n}',
    ],
    related: ["args", "importMeta"],
    bestPractices: [
      "✓ GOOD: Use get() for reading variables",
      "✓ GOOD: Use set() for temporarily modifying variables (e.g., in tests)",
      "✓ GOOD: Always check for undefined when variable might not be set",
      "✓ GOOD: Provide sensible defaults for optional config",
      "✓ GOOD: Restore original values after temporary modifications",
      "✓ GOOD: Use loadFromFile() at app startup to load .env configuration",
      "✓ GOOD: Load multiple .env files in order of precedence (e.g., .env, .env.local)",
      "✓ GOOD: Existing environment variables are never overridden by .env files",
    ],
  },

  // Process Management
  args: {
    name: "args",
    category: "shims",
    signature: "const args: readonly string[]",
    description:
      "Command line arguments passed to the script. Frozen for immutability. Excludes runtime executable and script path (just the arguments).",
    imports: [
      'import { args } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "readonly string[] - Array of command line arguments",
    examples: [
      '// Access command line arguments\nimport { args } from "@tidy-ts/shims";\n\nconsole.log("Arguments:", args);\nif (args.length > 0) {\n  console.log("First arg:", args[0]);\n}',
      "// Process flags\nconst verbose = args.includes('--verbose');\nconst debug = args.includes('--debug');",
    ],
    related: ["getArgs", "env"],
    bestPractices: [
      "✓ GOOD: Immutable array (readonly)",
      "✓ GOOD: Excludes runtime name and script path",
    ],
  },

  getArgs: {
    name: "getArgs",
    category: "shims",
    signature: "getArgs(): readonly string[]",
    description:
      "Get command line arguments as a function call. Returns the same data as the args constant but as a function.",
    imports: [
      'import { getArgs } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "readonly string[] - Array of command line arguments",
    examples: [
      '// Get arguments\nimport { getArgs } from "@tidy-ts/shims";\n\nconst arguments = getArgs();\nconsole.log(arguments);',
    ],
    related: ["args"],
    bestPractices: [
      "✓ GOOD: Use args constant for simpler access",
    ],
  },

  exit: {
    name: "exit",
    category: "shims",
    signature: "exit(code: number): never",
    description:
      "Exit the process with the given exit code. 0 indicates success, non-zero indicates failure. Never returns.",
    imports: [
      'import { exit } from "@tidy-ts/shims";',
    ],
    parameters: [
      "code: Exit code (0 = success, non-zero = failure)",
    ],
    returns: "never - Function never returns",
    examples: [
      '// Exit successfully\nimport { exit } from "@tidy-ts/shims";\n\nexit(0);',
      "// Exit with error\nif (!config.isValid) {\n  console.error('Invalid configuration');\n  exit(1);\n}",
    ],
    related: ["args", "env"],
    bestPractices: [
      "✓ GOOD: Use 0 for success",
      "✓ GOOD: Use non-zero (typically 1) for errors",
      "✓ GOOD: Log error messages before exiting",
    ],
  },

  importMeta: {
    name: "importMeta",
    category: "shims",
    signature:
      "importMeta.main: boolean\nimportMeta.url: string\nimportMeta.urlToPath(url: string): string\nimportMeta.getFilename(): string\nimportMeta.getDirname(): string",
    description:
      "Import meta utilities for working with module metadata. Check if module is main, get current file path, get directory name, and convert URLs to paths.",
    imports: [
      'import { importMeta } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "Object with main, url, urlToPath(), getFilename(), getDirname()",
    examples: [
      '// Check if running as main script\nimport { importMeta } from "@tidy-ts/shims";\n\nif (importMeta.main) {\n  console.log("Running as main script");\n  // Run CLI logic\n}',
      "// Get current file path\nconst currentFile = importMeta.getFilename();\nconsole.log('Current file:', currentFile);",
      "// Get current directory\nconst currentDir = importMeta.getDirname();\nconsole.log('Current directory:', currentDir);",
      "// Get module URL\nconsole.log('Module URL:', importMeta.url);",
    ],
    related: ["fileURLToPath", "dirname"],
    bestPractices: [
      "✓ GOOD: Use importMeta.main to conditionally run CLI code",
      "✓ GOOD: Use getFilename() to get current file path",
      "✓ GOOD: Use getDirname() to get current directory",
    ],
  },

  // Testing Framework
  test: {
    name: "test",
    category: "shims",
    signature:
      "test(name: string, testFn: (() => void | Promise<void>) | TestSubject, options?: WrappedTestOptions): Promise<void>",
    description:
      "Cross-runtime testing framework that works identically in Deno, Bun, and Node.js. Define and execute tests with a unified API. Supports async tests, timeouts, and skip functionality.",
    imports: [
      'import { test } from "@tidy-ts/shims";',
    ],
    parameters: [
      "name: Test name/description",
      "testFn: Test function (async or sync)",
      "options.timeout: Timeout duration in milliseconds (optional)",
      "options.skip: Whether to skip the test (optional)",
      "options.waitForCallback: Wait for done callback in async tests (optional)",
    ],
    returns: "Promise<void>",
    examples: [
      '// Simple test\nimport { test } from "@tidy-ts/shims";\n\ntest("addition works", () => {\n  const result = 1 + 1;\n  if (result !== 2) throw new Error("Math is broken!");\n});',
      '// Async test\ntest("async operation", async () => {\n  const data = await fetchData();\n  if (!data) throw new Error("No data received");\n});',
      "// Test with timeout\ntest('slow operation', async () => {\n  await slowOperation();\n}, { timeout: 5000 });",
      "// Skip test\ntest('not ready yet', () => {\n  // Test code\n}, { skip: true });",
      "// Test with done callback\ntest('callback test', (context, done) => {\n  setTimeout(() => {\n    done();\n  }, 100);\n}, { waitForCallback: true });",
    ],
    related: [],
    bestPractices: [
      "✓ GOOD: Use async/await for async tests",
      "✓ GOOD: Set reasonable timeouts for slow operations",
      "✓ GOOD: Use skip: true for tests that aren't ready",
      "✓ GOOD: Throw errors for test failures",
    ],
    antiPatterns: [
      "❌ BAD: Not setting timeouts on potentially slow tests",
      "❌ BAD: Leaving skipped tests in codebase long-term",
    ],
  },

  // Error Types
  UnavailableAPIError: {
    name: "UnavailableAPIError",
    category: "shims",
    signature: "class UnavailableAPIError extends Error",
    description:
      "Error thrown when an API is not available in the current runtime. Contains information about which API was called and which runtime it was called in.",
    imports: [
      'import { UnavailableAPIError } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "Error instance",
    examples: [
      '// Catch unavailable API\nimport { readFile, UnavailableAPIError } from "@tidy-ts/shims";\n\ntry {\n  await readFile("./file.txt");\n} catch (error) {\n  if (error instanceof UnavailableAPIError) {\n    console.error("File system not available in this runtime");\n  }\n}',
    ],
    related: ["UnsupportedRuntimeError"],
    bestPractices: [
      "✓ GOOD: Check for this error when using file system APIs in browsers",
    ],
  },

  UnsupportedRuntimeError: {
    name: "UnsupportedRuntimeError",
    category: "shims",
    signature: "class UnsupportedRuntimeError extends Error",
    description:
      "Error thrown when code is running in an unsupported runtime. Contains information about detected runtime and list of supported runtimes.",
    imports: [
      'import { UnsupportedRuntimeError } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "Error instance",
    examples: [
      '// Catch unsupported runtime\nimport { getCurrentRuntime, UnsupportedRuntimeError } from "@tidy-ts/shims";\n\ntry {\n  const runtime = getCurrentRuntime();\n  // Some runtime-specific logic\n} catch (error) {\n  if (error instanceof UnsupportedRuntimeError) {\n    console.error("This runtime is not supported");\n  }\n}',
    ],
    related: ["UnavailableAPIError", "getCurrentRuntime"],
    bestPractices: [
      "✓ GOOD: Use to gracefully handle unsupported environments",
    ],
  },

  // Enhanced Fetch API with Result-based Error Handling
  tidyfetch: {
    name: "tidyfetch",
    category: "shims",
    signature:
      "tidyfetch<T>(url: string, options?: FetchOptions): Promise<Result<T, TidyFetchError>>",
    description:
      "Enhanced fetch API with Result-based error handling, automatic JSON parsing, retries, timeouts, caching, and interceptors. Returns Result<T, TidyFetchError> for type-safe error handling without exceptions. Works identically across Deno, Bun, and Node.js.",
    imports: [
      'import { tidyfetch } from "@tidy-ts/shims";',
      'import { tidyfetch, type Result, type TidyFetchError } from "@tidy-ts/shims";',
      'import { tidyfetch, HTTPError, NetworkError, TimeoutError } from "@tidy-ts/shims";',
    ],
    parameters: [
      "url: The URL to fetch (absolute, or relative if baseURL is provided)",
      "options.baseURL: Base URL to prepend to all requests",
      "options.query: Query parameters as an object (auto-appended to URL)",
      "options.body: Request body (plain objects auto-stringified to JSON)",
      "options.timeout: Request timeout in milliseconds (default: 0 = no timeout)",
      "options.retry: Number of retry attempts (default: 0)",
      "options.retryDelay: Delay between retries in ms (default: 0)",
      "options.retryStatusCodes: Status codes that trigger retry (default: [408, 429, 500, 502, 503, 504])",
      "options.cacheTTL: Response cache TTL in ms (default: 0 = no cache)",
      "options.responseType: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream' (default: 'json')",
      "options.onRequest: Interceptor called before request is sent",
      "options.onResponse: Interceptor called after successful response",
      "options.onResponseError: Interceptor called on error (receives typed error object)",
      "options.parseResponse: Custom function to parse response body",
    ],
    returns:
      "Promise<Result<T, TidyFetchError>> - Result type with ok/error discriminant",
    examples: [
      '// Basic GET with Result handling\nimport { tidyfetch } from "@tidy-ts/shims";\n\ninterface User { id: number; name: string; }\n\nconst result = await tidyfetch<User>("/api/users/1");\nif (result.ok) {\n  console.log(result.value.name); // Type-safe access\n} else {\n  console.error(result.error.message);\n}',
      '// POST with auto JSON body\nconst result = await tidyfetch<User>("/api/users", {\n  method: "POST",\n  body: { name: "Alice", email: "alice@example.com" }\n});\nif (result.ok) {\n  console.log("Created:", result.value);\n}',
      '// Handle specific error types\nimport { tidyfetch, HTTPError, TimeoutError } from "@tidy-ts/shims";\n\nconst result = await tidyfetch("/api/data");\nif (!result.ok) {\n  if (result.error instanceof HTTPError) {\n    console.log(`HTTP ${result.error.statusCode}: ${result.error.statusText}`);\n  } else if (result.error instanceof TimeoutError) {\n    console.log("Request timed out");\n  }\n}',
    ],
    related: [
      "tidyfetch.create",
      "tidyfetch.raw",
      "Result",
      "HTTPError",
      "TidyFetchError",
    ],
    bestPractices: [
      "✓ GOOD: Check result.ok before accessing result.value",
      "✓ GOOD: Use instanceof to check specific error types",
      "✓ GOOD: Set timeouts on all production requests",
      "✓ GOOD: Use retry for idempotent requests",
    ],
    antiPatterns: [
      "❌ BAD: Accessing result.value without checking result.ok",
      "❌ BAD: Retrying non-idempotent requests",
      "❌ BAD: Ignoring the error type when handling failures",
    ],
  },

  "tidyfetch.create": {
    name: "tidyfetch.create",
    category: "shims",
    signature: "tidyfetch.create(defaults: FetchOptions): TidyFetchInstance",
    description:
      "Factory function to create a preconfigured tidyfetch instance with default options. Returns a TidyFetchInstance that returns Result for type-safe error handling. Perfect for creating API clients with shared configuration.",
    imports: [
      'import { tidyfetch, type TidyFetchInstance } from "@tidy-ts/shims";',
    ],
    parameters: [
      "defaults: Default FetchOptions applied to all requests from this instance",
    ],
    returns: "TidyFetchInstance - Function returning Result<T, TidyFetchError>",
    examples: [
      '// Create an API client (returns Result)\nimport { tidyfetch } from "@tidy-ts/shims";\n\nconst api = tidyfetch.create({\n  baseURL: "https://api.example.com",\n  headers: { "Authorization": `Bearer ${token}` },\n  timeout: 10000\n});\n\n// Returns Result\nconst result = await api<User[]>("/users");\nif (result.ok) {\n  console.log(result.value);\n}',
      '// Multiple API clients\nconst publicApi = tidyfetch.create({\n  baseURL: "https://api.example.com/public"\n});\n\nconst adminApi = tidyfetch.create({\n  baseURL: "https://api.example.com/admin",\n  headers: { "X-Admin-Token": adminToken }\n});',
    ],
    related: ["tidyfetch", "TidyFetchInstance"],
    bestPractices: [
      "✓ GOOD: Create separate instances for different API services",
      "✓ GOOD: Set common headers and timeout in defaults",
    ],
  },

  "tidyfetch.get": {
    name: "tidyfetch.get",
    category: "shims",
    signature:
      "tidyfetch.get<T>(url: string, options?: FetchOptions): Promise<Result<T, TidyFetchError>>",
    description:
      "Shorthand for GET requests. Returns Result for type-safe error handling. GET requests are typically used to retrieve resources.",
    imports: [
      'import { tidyfetch } from "@tidy-ts/shims";',
    ],
    parameters: [
      "url: The URL to fetch",
      "options: Additional FetchOptions (method is set automatically)",
    ],
    returns: "Promise<Result<T, TidyFetchError>> - Result with value or error",
    examples: [
      '// Basic GET\nconst result = await tidyfetch.get<User[]>("/api/users");\nif (result.ok) {\n  console.log(result.value);\n}',
      '// GET with query parameters\nconst result = await tidyfetch.get<User>("/api/users/1", {\n  query: { include: "posts,comments" }\n});',
    ],
    related: ["tidyfetch", "tidyfetch.post", "tidyfetch.put"],
    bestPractices: [
      "✓ GOOD: Use for retrieving resources",
      "✓ GOOD: Check result.ok before accessing result.value",
    ],
  },

  "tidyfetch.post": {
    name: "tidyfetch.post",
    category: "shims",
    signature:
      "tidyfetch.post<T>(url: string, options?: FetchOptions): Promise<Result<T, TidyFetchError>>",
    description:
      "Shorthand for POST requests. Returns Result for type-safe error handling. POST requests are typically used to create new resources. Body objects are auto-stringified to JSON.",
    imports: [
      'import { tidyfetch } from "@tidy-ts/shims";',
    ],
    parameters: [
      "url: The URL to post to",
      "options: FetchOptions including body data",
    ],
    returns: "Promise<Result<T, TidyFetchError>> - Result with value or error",
    examples: [
      '// Create a resource\nconst result = await tidyfetch.post<User>("/api/users", {\n  body: { name: "Alice", email: "alice@example.com" }\n});\nif (result.ok) {\n  console.log("Created:", result.value);\n}',
    ],
    related: ["tidyfetch", "tidyfetch.get", "tidyfetch.put", "tidyfetch.patch"],
    bestPractices: [
      "✓ GOOD: Use for creating new resources",
      "✓ GOOD: Body objects are automatically JSON stringified",
    ],
  },

  "tidyfetch.put": {
    name: "tidyfetch.put",
    category: "shims",
    signature:
      "tidyfetch.put<T>(url: string, options?: FetchOptions): Promise<Result<T, TidyFetchError>>",
    description:
      "Shorthand for PUT requests. Returns Result for type-safe error handling. PUT requests are typically used to replace entire resources.",
    imports: [
      'import { tidyfetch } from "@tidy-ts/shims";',
    ],
    parameters: [
      "url: The URL of the resource to replace",
      "options: FetchOptions including the new resource data",
    ],
    returns: "Promise<Result<T, TidyFetchError>> - Result with value or error",
    examples: [
      '// Replace a resource\nconst result = await tidyfetch.put<User>("/api/users/1", {\n  body: { name: "Alice Smith", email: "alice@example.com", role: "admin" }\n});\nif (result.ok) {\n  console.log("Updated:", result.value);\n}',
    ],
    related: ["tidyfetch", "tidyfetch.patch", "tidyfetch.post"],
    bestPractices: [
      "✓ GOOD: Use for full resource replacement",
      "✓ GOOD: Include all required fields in body",
    ],
  },

  "tidyfetch.patch": {
    name: "tidyfetch.patch",
    category: "shims",
    signature:
      "tidyfetch.patch<T>(url: string, options?: FetchOptions): Promise<Result<T, TidyFetchError>>",
    description:
      "Shorthand for PATCH requests. Returns Result for type-safe error handling. PATCH requests are typically used for partial updates to resources.",
    imports: [
      'import { tidyfetch } from "@tidy-ts/shims";',
    ],
    parameters: [
      "url: The URL of the resource to update",
      "options: FetchOptions including the partial update data",
    ],
    returns: "Promise<Result<T, TidyFetchError>> - Result with value or error",
    examples: [
      '// Partial update\nconst result = await tidyfetch.patch<User>("/api/users/1", {\n  body: { email: "newemail@example.com" }\n});\nif (result.ok) {\n  console.log("Patched:", result.value);\n}',
    ],
    related: ["tidyfetch", "tidyfetch.put", "tidyfetch.post"],
    bestPractices: [
      "✓ GOOD: Use for partial resource updates",
      "✓ GOOD: Only include fields that need to change",
    ],
  },

  "tidyfetch.delete": {
    name: "tidyfetch.delete",
    category: "shims",
    signature:
      "tidyfetch.delete<T>(url: string, options?: FetchOptions): Promise<Result<T, TidyFetchError>>",
    description:
      "Shorthand for DELETE requests. Returns Result for type-safe error handling. DELETE requests are used to remove resources.",
    imports: [
      'import { tidyfetch } from "@tidy-ts/shims";',
    ],
    parameters: [
      "url: The URL of the resource to delete",
      "options: Additional FetchOptions",
    ],
    returns: "Promise<Result<T, TidyFetchError>> - Result with value or error",
    examples: [
      '// Delete a resource\nconst result = await tidyfetch.delete("/api/users/1");\nif (result.ok) {\n  console.log("Deleted successfully");\n}',
      '// Delete with confirmation response\nconst result = await tidyfetch.delete<{ success: boolean }>("/api/users/1");\nif (result.ok && result.value.success) {\n  console.log("Confirmed deleted");\n}',
    ],
    related: ["tidyfetch", "tidyfetch.post"],
    bestPractices: [
      "✓ GOOD: Use for removing resources",
      "✓ GOOD: Handle 204 No Content responses gracefully",
    ],
  },

  "tidyfetch.raw": {
    name: "tidyfetch.raw",
    category: "shims",
    signature:
      "tidyfetch.raw<T>(url: string, options?: FetchOptions): Promise<Result<RawResponse<T>, TidyFetchError>>",
    description:
      "Fetch with access to the full Response object plus parsed data. Returns Result containing the complete Response with a `_data` property containing parsed data. Use when you need access to response headers, status codes, or other Response properties.",
    imports: [
      'import { tidyfetch, type RawResponse } from "@tidy-ts/shims";',
    ],
    parameters: [
      "url: The URL to fetch",
      "options: Enhanced FetchOptions",
    ],
    returns:
      "Promise<Result<RawResponse<T>, TidyFetchError>> - Result with Response object containing _data property",
    examples: [
      '// Access response headers and status\nconst result = await tidyfetch.raw<User>("/api/users/1");\nif (result.ok) {\n  console.log(result.value.status);                     // 200\n  console.log(result.value.headers.get("x-rate-limit")); // "100"\n  console.log(result.value._data.name);                 // "Alice"\n}',
      '// Check for specific headers\nconst result = await tidyfetch.raw("/api/data");\nif (result.ok) {\n  const etag = result.value.headers.get("etag");\n  const cacheControl = result.value.headers.get("cache-control");\n}',
    ],
    related: ["tidyfetch", "RawResponse"],
    bestPractices: [
      "✓ GOOD: Use when you need response headers (rate limits, ETags, etc.)",
      "✓ GOOD: Check result.ok before accessing result.value",
      "✓ GOOD: Access _data for parsed content",
    ],
  },

  "tidyfetch.native": {
    name: "tidyfetch.native",
    category: "shims",
    signature:
      "tidyfetch.native(input: RequestInfo, init?: RequestInit): Promise<Response>",
    description:
      "Direct access to the native fetch API. Bypasses all tidyfetch enhancements (auto JSON, retries, etc.) and calls globalThis.fetch directly. Use when you need full control over the Response object.",
    imports: [
      'import { tidyfetch } from "@tidy-ts/shims";',
    ],
    parameters: [
      "input: URL or Request object",
      "init: Standard RequestInit options",
    ],
    returns: "Promise<Response> - Standard Response object",
    examples: [
      '// Direct fetch access\nconst response = await tidyfetch.native("/api/data");\nconst text = await response.text();',
      '// Stream handling\nconst response = await tidyfetch.native("/api/stream");\nconst reader = response.body?.getReader();\n// Process stream manually',
    ],
    related: ["tidyfetch", "tidyfetch.raw"],
    bestPractices: [
      "✓ GOOD: Use for streaming responses",
      "✓ GOOD: Use when you need full Response control",
      "✓ GOOD: Use when tidyfetch processing is unnecessary",
    ],
  },

  // Result Type and Error Handling
  Result: {
    name: "Result",
    category: "shims",
    signature:
      "type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }",
    description:
      "Type-safe Result type for error handling without exceptions. Used by tidyfetch to return either a successful value or a typed error. Check the `ok` discriminant to determine which variant you have.",
    imports: [
      'import { type Result } from "@tidy-ts/shims";',
    ],
    parameters: [
      "T: The success value type",
      "E: The error type",
    ],
    returns:
      "Discriminated union with ok boolean, value (if ok), error (if not ok)",
    examples: [
      '// Pattern matching on Result\nimport { tidyfetch, type Result, type TidyFetchError } from "@tidy-ts/shims";\n\nconst result: Result<User, TidyFetchError> = await tidyfetch<User>("/api/user");\n\nif (result.ok) {\n  // TypeScript knows result.value exists\n  console.log(result.value.name);\n} else {\n  // TypeScript knows result.error exists\n  console.error(result.error.message);\n}',
    ],
    related: ["ok", "err", "TidyFetchError"],
    bestPractices: [
      "✓ GOOD: Always check result.ok before accessing value or error",
      "✓ GOOD: Use with type guards for full type safety",
      "✓ GOOD: Prefer over try/catch for expected errors",
    ],
  },

  ok: {
    name: "ok",
    category: "shims",
    signature: "ok<T>(value: T): Result<T, never>",
    description:
      "Constructor function to create a successful Result. Returns a Result with ok: true and the given value.",
    imports: [
      'import { ok } from "@tidy-ts/shims";',
    ],
    parameters: [
      "value: The success value to wrap",
    ],
    returns: "Result<T, never> with ok: true and value property",
    examples: [
      '// Create a success Result\nimport { ok, type Result } from "@tidy-ts/shims";\n\nfunction divide(a: number, b: number): Result<number, string> {\n  if (b === 0) return err("Division by zero");\n  return ok(a / b);\n}',
    ],
    related: ["err", "Result"],
    bestPractices: [
      "✓ GOOD: Use to wrap successful values in Result",
    ],
  },

  err: {
    name: "err",
    category: "shims",
    signature: "err<E>(error: E): Result<never, E>",
    description:
      "Constructor function to create a failed Result. Returns a Result with ok: false and the given error.",
    imports: [
      'import { err } from "@tidy-ts/shims";',
    ],
    parameters: [
      "error: The error value to wrap",
    ],
    returns: "Result<never, E> with ok: false and error property",
    examples: [
      '// Create an error Result\nimport { err, ok, type Result } from "@tidy-ts/shims";\n\nfunction parseJSON(str: string): Result<unknown, Error> {\n  try {\n    return ok(JSON.parse(str));\n  } catch (e) {\n    return err(e instanceof Error ? e : new Error(String(e)));\n  }\n}',
    ],
    related: ["ok", "Result"],
    bestPractices: [
      "✓ GOOD: Use to wrap error values in Result",
    ],
  },

  TidyFetchError: {
    name: "TidyFetchError",
    category: "shims",
    signature:
      "type TidyFetchError = NetworkError | TimeoutError | HTTPError | ParseError | AbortError",
    description:
      "Union type of all possible tidyfetch error types. Use with instanceof to narrow to specific error types for detailed error handling.",
    imports: [
      'import { type TidyFetchError } from "@tidy-ts/shims";',
      'import { HTTPError, NetworkError, TimeoutError, ParseError, AbortError } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "Type alias (not a value)",
    examples: [
      '// Handle different error types\nimport { tidyfetch, HTTPError, TimeoutError, NetworkError } from "@tidy-ts/shims";\n\nconst result = await tidyfetch("/api/data");\nif (!result.ok) {\n  const error = result.error;\n  if (error instanceof HTTPError) {\n    console.log(`HTTP ${error.statusCode}: ${error.statusText}`);\n  } else if (error instanceof TimeoutError) {\n    console.log("Request timed out");\n  } else if (error instanceof NetworkError) {\n    console.log("Network error:", error.cause);\n  }\n}',
    ],
    related: [
      "HTTPError",
      "NetworkError",
      "TimeoutError",
      "ParseError",
      "AbortError",
    ],
    bestPractices: [
      "✓ GOOD: Use instanceof to narrow to specific error types",
      "✓ GOOD: Handle each error type appropriately",
    ],
  },

  HTTPError: {
    name: "HTTPError",
    category: "shims",
    signature:
      "class HTTPError extends Error { statusCode: number; statusText: string; url: string; body?: unknown; response: Response }",
    description:
      "Error returned when server responds with non-2xx status code. Contains status code, status text, URL, response body, and full Response object.",
    imports: [
      'import { HTTPError } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns:
      "Error with statusCode, statusText, url, body, response properties",
    examples: [
      '// Handle HTTP errors\nimport { tidyfetch, HTTPError } from "@tidy-ts/shims";\n\nconst result = await tidyfetch("/api/protected");\nif (!result.ok && result.error instanceof HTTPError) {\n  if (result.error.statusCode === 401) {\n    console.log("Unauthorized - please login");\n  } else if (result.error.statusCode === 404) {\n    console.log("Resource not found");\n  }\n  console.log("Response body:", result.error.body);\n}',
    ],
    related: ["TidyFetchError", "NetworkError", "TimeoutError"],
    bestPractices: [
      "✓ GOOD: Check statusCode for specific error handling",
      "✓ GOOD: Access body for API error details",
      "✓ GOOD: Access response.headers for rate limit info",
    ],
  },

  NetworkError: {
    name: "NetworkError",
    category: "shims",
    signature: "class NetworkError extends Error { cause: unknown }",
    description:
      "Error returned when a network-level failure occurs (DNS resolution, connection refused, etc.). Contains the original error as cause.",
    imports: [
      'import { NetworkError } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "Error with cause property containing original error",
    examples: [
      '// Handle network errors\nimport { tidyfetch, NetworkError } from "@tidy-ts/shims";\n\nconst result = await tidyfetch("/api/data");\nif (!result.ok && result.error instanceof NetworkError) {\n  console.log("Network failed:", result.error.cause);\n  // Show offline message, retry later, etc.\n}',
    ],
    related: ["TidyFetchError", "HTTPError", "TimeoutError"],
    bestPractices: [
      "✓ GOOD: Show user-friendly offline message",
      "✓ GOOD: Implement retry logic for transient failures",
    ],
  },

  TimeoutError: {
    name: "TimeoutError",
    category: "shims",
    signature: "class TimeoutError extends Error { timeout: number }",
    description:
      "Error returned when a request exceeds the configured timeout. Contains the timeout duration that was exceeded.",
    imports: [
      'import { TimeoutError } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "Error with timeout property (milliseconds)",
    examples: [
      '// Handle timeout errors\nimport { tidyfetch, TimeoutError } from "@tidy-ts/shims";\n\nconst result = await tidyfetch("/api/slow", { timeout: 5000 });\nif (!result.ok && result.error instanceof TimeoutError) {\n  console.log(`Request timed out after ${result.error.timeout}ms`);\n}',
    ],
    related: ["TidyFetchError", "HTTPError", "AbortError"],
    bestPractices: [
      "✓ GOOD: Set appropriate timeouts for different operations",
      "✓ GOOD: Show user feedback for slow operations",
    ],
  },

  ParseError: {
    name: "ParseError",
    category: "shims",
    signature:
      "class ParseError extends Error { body: string; cause: unknown }",
    description:
      "Error returned when response body cannot be parsed (e.g., invalid JSON). Contains the raw body text and the original parse error.",
    imports: [
      'import { ParseError } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "Error with body (raw text) and cause (original error) properties",
    examples: [
      '// Handle parse errors\nimport { tidyfetch, ParseError } from "@tidy-ts/shims";\n\nconst result = await tidyfetch("/api/data");\nif (!result.ok && result.error instanceof ParseError) {\n  console.log("Failed to parse response:", result.error.body);\n  console.log("Parse error:", result.error.cause);\n}',
    ],
    related: ["TidyFetchError", "HTTPError"],
    bestPractices: [
      "✓ GOOD: Log raw body for debugging",
      "✓ GOOD: Consider using responseType: 'text' if JSON not expected",
    ],
  },

  AbortError: {
    name: "AbortError",
    category: "shims",
    signature: "class AbortError extends Error { reason?: unknown }",
    description:
      "Error returned when a request is cancelled via AbortController. Contains the abort reason if provided.",
    imports: [
      'import { AbortError } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "Error with optional reason property",
    examples: [
      '// Handle aborted requests\nimport { tidyfetch, AbortError } from "@tidy-ts/shims";\n\nconst controller = new AbortController();\nsetTimeout(() => controller.abort("User cancelled"), 5000);\n\nconst result = await tidyfetch("/api/data", { signal: controller.signal });\nif (!result.ok && result.error instanceof AbortError) {\n  console.log("Request aborted:", result.error.reason);\n}',
    ],
    related: ["TidyFetchError", "TimeoutError"],
    bestPractices: [
      "✓ GOOD: Use AbortController for user-initiated cancellation",
      "✓ GOOD: Clean up pending requests on component unmount",
    ],
  },

  defineError: {
    name: "defineError",
    category: "shims",
    signature:
      "defineError<Name extends string, Extra extends object>(name: Name, messageTemplate: (extra: Extra) => string): ErrorConstructor",
    description:
      "Factory function to create custom typed error classes. Used internally to create HTTPError, NetworkError, etc. Can be used to define your own application-specific errors.",
    imports: [
      'import { defineError, type AppError } from "@tidy-ts/shims";',
    ],
    parameters: [
      "name: The error name (becomes error.name)",
      "messageTemplate: Function that generates error message from extra properties",
    ],
    returns: "Error class constructor that accepts extra properties",
    examples: [
      '// Define a custom error\nimport { defineError, type AppError } from "@tidy-ts/shims";\n\nconst ValidationError = defineError(\n  "ValidationError",\n  (extra: { field: string; value: unknown }) =>\n    `Invalid value for ${extra.field}: ${extra.value}`\n);\n\ntype ValidationError = AppError<"ValidationError", { field: string; value: unknown }>;\n\n// Usage\nconst error = new ValidationError({ field: "email", value: "invalid" });\nconsole.log(error.name);    // "ValidationError"\nconsole.log(error.field);   // "email"\nconsole.log(error.message); // "Invalid value for email: invalid"',
    ],
    related: ["AppError", "HTTPError", "NetworkError"],
    bestPractices: [
      "✓ GOOD: Use for domain-specific error types",
      "✓ GOOD: Include relevant context in extra properties",
      "✓ GOOD: Define corresponding type alias with AppError",
    ],
  },

  FetchOptions: {
    name: "FetchOptions",
    category: "shims",
    signature: "interface FetchOptions extends Omit<RequestInit, 'body'>",
    description:
      "Configuration options for tidyfetch requests. Extends standard RequestInit with additional features: query parameters, auto JSON body, retries, timeouts, caching, and interceptors.",
    imports: [
      'import { type FetchOptions } from "@tidy-ts/shims";',
    ],
    parameters: [
      "baseURL?: string - Base URL prepended to all requests",
      "query?: Record<string, string | number | boolean | undefined> - Query params (undefined filtered out)",
      "body?: BodyInit | Record<string, unknown> - Body (plain objects auto-stringified)",
      "timeout?: number - Request timeout in ms (default: 0 = no timeout)",
      "retry?: number - Number of retry attempts (default: 0)",
      "retryDelay?: number - Delay between retries in ms (default: 0)",
      "retryStatusCodes?: number[] - Status codes triggering retry (default: [408, 429, 500, 502, 503, 504])",
      "cacheTTL?: number - Response cache TTL in ms (default: 0 = no cache)",
      "responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream' - How to parse response (default: 'json')",
      "onRequest?: (context) => void | Promise<void> - Pre-request interceptor",
      "onResponse?: (context) => void | Promise<void> - Post-response interceptor",
      "onResponseError?: (context) => void | Promise<void> - Error response interceptor",
      "parseResponse?: (text: string) => unknown - Custom response parser",
    ],
    returns: "N/A (interface)",
    examples: [
      '// Full configuration example\nconst options: FetchOptions = {\n  baseURL: "https://api.example.com",\n  query: { page: 1, limit: 10 },\n  body: { name: "Alice" },\n  timeout: 5000,\n  retry: 3,\n  retryDelay: 1000,\n  cacheTTL: 60000,\n  onRequest: ({ request }) => console.log("Fetching:", request.url),\n  onResponse: ({ response }) => console.log("Status:", response.status),\n};',
    ],
    related: ["tidyfetch", "tidyfetch.create"],
    bestPractices: [
      "✓ GOOD: Set timeout for all production requests",
      "✓ GOOD: Use interceptors for logging and auth",
      "✓ GOOD: Use cacheTTL for stable, frequently-accessed data",
    ],
  },

  RawResponse: {
    name: "RawResponse",
    category: "shims",
    signature: "interface RawResponse<T> extends Response { _data: T }",
    description:
      "Response type returned by tidyfetch.raw(). Extends standard Response with a `_data` property containing the parsed response body. Original Response body is still accessible via clone().",
    imports: [
      'import { type RawResponse } from "@tidy-ts/shims";',
    ],
    parameters: [
      "_data: T - The parsed response body",
    ],
    returns: "N/A (interface)",
    examples: [
      '// Using RawResponse\nconst response: RawResponse<User> = await tidyfetch.raw<User>("/api/users/1");\n\n// Access parsed data\nconsole.log(response._data.name);\n\n// Access Response properties\nconsole.log(response.status);\nconsole.log(response.headers.get("content-type"));\n\n// Clone and read body again\nconst text = await response.clone().text();',
    ],
    related: ["tidyfetch.raw", "tidyfetch"],
    bestPractices: [
      "✓ GOOD: Use _data for type-safe parsed content",
      "✓ GOOD: Use clone() if you need raw body after parsing",
    ],
  },
};
