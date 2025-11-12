/**
 * Deno-compatible namespace object
 * Provides a subset of Deno APIs for cross-runtime compatibility
 *
 * This allows code written for Deno to work across different runtimes
 * without modification.
 *
 * @example
 * ```ts
 * import { Deno as DenoShim } from "@tidy-ts/shims";
 *
 * for (const entry of DenoShim.readDirSync("./dir")) {
 *   console.log(entry.name, entry.isFile, entry.isDirectory);
 * }
 *
 * const data = DenoShim.readFileSync("./file.bin");
 * const text = DenoShim.readTextFileSync("./file.txt");
 * ```
 */

import { currentRuntime } from "./detect.ts";
import { UnavailableAPIError } from "./errors.ts";
import { getDenoNamespace, getFsSync } from "./_runtime.ts";

/**
 * Deno-compatible namespace object
 * Provides synchronous file system operations compatible with Deno's API
 */
export const Deno: {
  readDirSync(
    dirPath: string,
  ): Iterable<{ name: string; isFile: boolean; isDirectory: boolean }>;
  readFileSync(filePath: string): Uint8Array;
  readTextFileSync(filePath: string): string;
} = {
  /**
   * Read directory synchronously
   *
   * @param dirPath - Path to the directory to read
   * @returns Iterable of directory entries
   * @throws {UnavailableAPIError} If the file system API is not available
   */
  readDirSync(
    dirPath: string,
  ): Iterable<{ name: string; isFile: boolean; isDirectory: boolean }> {
    const deno = getDenoNamespace();
    if (deno) {
      return deno.readDirSync(dirPath);
    }

    const fsSync = getFsSync();
    if (!fsSync) {
      throw new UnavailableAPIError("Deno.readDirSync()", currentRuntime);
    }

    const entries = fsSync.readdirSync(dirPath, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      isFile: entry.isFile(),
      isDirectory: entry.isDirectory(),
    }));
  },

  /**
   * Read file synchronously as Uint8Array
   *
   * @param filePath - Path to the file to read
   * @returns The file contents as Uint8Array
   * @throws {UnavailableAPIError} If the file system API is not available
   */
  readFileSync(filePath: string): Uint8Array {
    const deno = getDenoNamespace();
    if (deno) {
      return deno.readFileSync(filePath);
    }

    const fsSync = getFsSync();
    if (!fsSync) {
      throw new UnavailableAPIError("Deno.readFileSync()", currentRuntime);
    }

    return fsSync.readFileSync(filePath);
  },

  /**
   * Read text file synchronously
   *
   * @param filePath - Path to the file to read
   * @returns The file contents as a string
   * @throws {UnavailableAPIError} If the file system API is not available
   */
  readTextFileSync(filePath: string): string {
    const deno = getDenoNamespace();
    if (deno) {
      return deno.readTextFileSync(filePath);
    }

    const fsSync = getFsSync();
    if (!fsSync) {
      throw new UnavailableAPIError("Deno.readTextFileSync()", currentRuntime);
    }

    return fsSync.readFileSync(filePath, "utf-8");
  },
};
