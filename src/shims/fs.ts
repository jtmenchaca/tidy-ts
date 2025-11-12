/**
 * Cross-runtime file system APIs
 * Provides runtime-agnostic file operations that work with Deno, Bun, and Node.js
 */

import { currentRuntime } from "./detect.ts";
import { UnavailableAPIError } from "./errors.ts";
import { getDenoNamespace, getFsPromises, getPathModule } from "./_runtime.ts";

/**
 * Read a text file asynchronously
 *
 * @param filePath - Path to the file to read
 * @returns The file contents as a string
 * @throws {UnavailableAPIError} If the file system API is not available
 * @example
 * ```ts
 * import { readTextFile } from "@tidy-ts/shims";
 * const content = await readTextFile("./file.txt");
 * ```
 */
export async function readTextFile(filePath: string): Promise<string> {
  const deno = getDenoNamespace();
  if (deno) {
    return await deno.readTextFile(filePath);
  }

  const fs = await getFsPromises();
  return await fs.readFile(filePath, "utf-8");
}

/**
 * Write a text file asynchronously
 *
 * @param filePath - Path to the file to write
 * @param data - The content to write
 * @param options - Optional write options (create, mode)
 * @throws {UnavailableAPIError} If the file system API is not available
 * @example
 * ```ts
 * import { writeTextFile } from "@tidy-ts/shims";
 * await writeTextFile("./output.txt", "Hello, World!");
 * ```
 */
export async function writeTextFile(
  filePath: string,
  data: string,
  options?: { create?: boolean; mode?: number },
): Promise<void> {
  const deno = getDenoNamespace();
  if (deno) {
    return await deno.writeTextFile(filePath, data, options);
  }

  const fs = await getFsPromises();
  const path = getPathModule();
  if (!path) {
    throw new UnavailableAPIError("writeTextFile()", currentRuntime);
  }

  // Ensure directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, data, "utf-8");
}

/**
 * Create a directory
 *
 * @param dirPath - Path to the directory to create
 * @param options - Optional directory options (recursive, mode)
 * @throws {UnavailableAPIError} If the file system API is not available
 * @example
 * ```ts
 * import { mkdir } from "@tidy-ts/shims";
 * await mkdir("./my-dir", { recursive: true });
 * ```
 */
export async function mkdir(
  dirPath: string,
  options?: { recursive?: boolean; mode?: number },
): Promise<void> {
  const deno = getDenoNamespace();
  if (deno) {
    return await deno.mkdir(dirPath, options);
  }

  const fs = await getFsPromises();
  await fs.mkdir(dirPath, { recursive: options?.recursive ?? false });
}

/**
 * Remove a file or directory
 *
 * @param filePath - Path to the file or directory to remove
 * @param options - Optional removal options (recursive)
 * @throws {UnavailableAPIError} If the file system API is not available
 * @example
 * ```ts
 * import { remove } from "@tidy-ts/shims";
 * await remove("./my-dir", { recursive: true });
 * ```
 */
export async function remove(
  filePath: string,
  options?: { recursive?: boolean },
): Promise<void> {
  const deno = getDenoNamespace();
  if (deno) {
    return await deno.remove(filePath, options);
  }

  const fs = await getFsPromises();
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await fs.rm(filePath, {
        recursive: options?.recursive ?? false,
        force: true,
      });
    } else {
      await fs.unlink(filePath);
    }
  } catch (error: unknown) {
    // If file doesn't exist, that's okay (matches Deno behavior)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }
}
