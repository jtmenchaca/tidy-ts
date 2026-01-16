import type { DocEntry } from "../mcp-types.ts";

export const filesystemDocs: Record<string, DocEntry> = {
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
    related: ["readFile", "writeFile", "exists"],
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
    ],
    related: ["mkdir", "stat", "exists"],
    bestPractices: [
      "✓ GOOD: Use to enumerate directory contents",
      "✓ GOOD: Check isFile and isDirectory to determine entry type",
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
    ],
    related: ["copyFile", "remove", "exists"],
    bestPractices: [
      "✓ GOOD: Atomic operation (faster than copy + delete)",
      "✓ GOOD: Works for both files and directories",
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
    ],
    related: ["stat", "readFile", "writeFile"],
    bestPractices: [
      "✓ GOOD: Convenient boolean check for existence",
      "✓ GOOD: Never throws errors (returns false for non-existent paths)",
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
};
