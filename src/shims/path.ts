/**
 * Cross-runtime path utilities
 * Provides runtime-agnostic path operations that work with Deno, Bun, and Node.js
 */

import { getPathModule } from "./_runtime.ts";
import { importMeta } from "./process.ts";

/**
 * Get the directory name of a path
 *
 * @param filePath - The file path
 * @returns The directory name
 * @throws {UnavailableAPIError} If path utilities are not available
 * @example
 * ```ts
 * import { dirname } from "@tidy-ts/shims";
 * const dir = dirname("/path/to/file.txt"); // "/path/to"
 * ```
 */
export function dirname(filePath: string): string {
  // Use node:path which works in Deno, Bun, and Node.js
  // Always available - loaded at top level
  return getPathModule().dirname(filePath);
}

/**
 * Resolve a sequence of paths or path segments into an absolute path
 *
 * @param paths - Path segments to resolve
 * @returns The resolved absolute path
 * @throws {UnavailableAPIError} If path utilities are not available
 * @example
 * ```ts
 * import { resolve } from "@tidy-ts/shims";
 * const absPath = resolve("./lib", "file.txt"); // "/absolute/path/lib/file.txt"
 * ```
 */
export function resolve(...paths: string[]): string {
  // Use node:path which works in Deno, Bun, and Node.js
  // Always available - loaded at top level
  return getPathModule().resolve(...paths);
}

/**
 * Convert a file URL to a file path
 *
 * @param url - The file URL to convert
 * @returns The file path
 * @throws {UnavailableAPIError} If URL utilities are not available
 * @example
 * ```ts
 * import { fileURLToPath } from "@tidy-ts/shims";
 * const path = fileURLToPath("file:///path/to/file.ts");
 * ```
 */
export function fileURLToPath(url: string): string {
  return importMeta.urlToPath(url);
}
