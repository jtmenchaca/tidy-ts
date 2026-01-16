import type { DocEntry } from "../mcp-types.ts";

export const pathDocs: Record<string, DocEntry> = {
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
      '// Get current file\'s directory\nimport { dirname, fileURLToPath } from "@tidy-ts/shims";\n\nconst __dirname = dirname(fileURLToPath(import.meta.url));',
    ],
    related: ["resolve", "fileURLToPath"],
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
      '// Get __filename and __dirname equivalents\nimport { fileURLToPath, dirname } from "@tidy-ts/shims";\n\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = dirname(__filename);',
    ],
    related: ["pathToFileURL", "dirname"],
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
      '// Use for dynamic imports\nconst modulePath = pathToFileURL("/path/to/module.ts");\nconst module = await import(modulePath.href);',
    ],
    related: ["fileURLToPath"],
    bestPractices: [
      "✓ GOOD: Use when you need URL format from file paths",
      "✓ GOOD: Useful for dynamic imports in some runtimes",
    ],
  },
};
