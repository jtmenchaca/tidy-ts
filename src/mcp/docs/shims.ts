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
};
