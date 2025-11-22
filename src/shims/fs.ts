/**
 * Cross-runtime file system APIs
 * Provides runtime-agnostic file operations that work with Deno, Bun, and Node.js
 */

import { currentRuntime } from "./detect.ts";
import { UnavailableAPIError } from "./errors.ts";
import {
  getDenoNamespace,
  getFsPromises,
  getFsSync,
  getPathModule,
} from "./_runtime.ts";

/**
 * Read a file asynchronously as binary data
 *
 * @param filePath - Path to the file to read
 * @returns The file contents as a Uint8Array
 * @throws {UnavailableAPIError} If the file system API is not available
 * @example
 * ```ts
 * import { readFile } from "@tidy-ts/shims";
 * const data = await readFile("./file.bin");
 * ```
 */
export async function readFile(filePath: string): Promise<Uint8Array> {
  const deno = getDenoNamespace();
  if (deno) {
    return await deno.readFile(filePath);
  }

  const fs = await getFsPromises();
  const buffer = await fs.readFile(filePath);
  return new Uint8Array(buffer);
}

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
 * Write a file asynchronously with binary data
 *
 * @param filePath - Path to the file to write
 * @param data - The binary data to write (Uint8Array)
 * @param options - Optional write options (create, mode)
 * @throws {UnavailableAPIError} If the file system API is not available
 * @example
 * ```ts
 * import { writeFile } from "@tidy-ts/shims";
 * await writeFile("./output.bin", new Uint8Array([1, 2, 3]));
 * ```
 */
export async function writeFile(
  filePath: string,
  data: Uint8Array,
  options?: { create?: boolean; mode?: number },
): Promise<void> {
  const deno = getDenoNamespace();
  const path = getPathModule();

  // Ensure directory exists (works in all runtimes)
  const dir = path.dirname(filePath);

  if (deno) {
    try {
      await deno.mkdir(dir, { recursive: true });
    } catch {
      // Directory might already exist, ignore
    }
    return await deno.writeFile(filePath, data, options);
  }

  const fs = await getFsPromises();
  // Ensure directory exists
  await fs.mkdir(dir, { recursive: true });
  // Node.js fs.writeFile accepts Uint8Array directly
  await fs.writeFile(filePath, data);
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
  const path = getPathModule();

  // Ensure directory exists (works in all runtimes)
  const dir = path.dirname(filePath);

  if (deno) {
    try {
      await deno.mkdir(dir, { recursive: true });
    } catch {
      // Directory might already exist, ignore
    }
    return await deno.writeTextFile(filePath, data, options);
  }

  const fs = await getFsPromises();
  // Ensure directory exists
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
 * Get file or directory statistics
 *
 * @param filePath - Path to the file or directory
 * @returns File statistics including size, isFile, isDirectory, etc.
 * @throws {UnavailableAPIError} If the file system API is not available
 * @example
 * ```ts
 * import { stat } from "@tidy-ts/shims";
 * const stats = await stat("./file.txt");
 * console.log(`File size: ${stats.size} bytes`);
 * ```
 */
export async function stat(filePath: string): Promise<{
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  mtime: Date | null;
  atime: Date | null;
  birthtime: Date | null;
}> {
  const deno = getDenoNamespace();
  if (deno) {
    const fileInfo = await deno.stat(filePath);
    return {
      size: fileInfo.size,
      isFile: fileInfo.isFile,
      isDirectory: fileInfo.isDirectory,
      mtime: fileInfo.mtime,
      atime: fileInfo.atime,
      birthtime: fileInfo.birthtime,
    };
  }

  // Use node:fs/promises which works in Deno, Bun, and Node.js
  const fs = await import("node:fs/promises");
  const stats = await fs.stat(filePath);
  return {
    size: stats.size,
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
    mtime: stats.mtime,
    atime: stats.atime,
    birthtime: stats.birthtime,
  };
}

/**
 * Open a file for reading or writing
 *
 * @param filePath - Path to the file to open
 * @param mode - File mode ("r" for read, "w" for write, etc.)
 * @returns A file handle with read, write, and close methods
 * @throws {UnavailableAPIError} If the file system API is not available
 * @example
 * ```ts
 * import { open } from "@tidy-ts/shims";
 * const file = await open("./file.txt", "r");
 * const buffer = new Uint8Array(1024);
 * await file.read(buffer, 0, buffer.length, 0);
 * await file.close();
 * ```
 */
export async function open(
  filePath: string,
  mode: "r" | "w" | "a" | "r+" | "w+" | "a+" = "r",
): Promise<{
  read: (
    buffer: Uint8Array,
    offset: number,
    length: number,
    position: number,
  ) => Promise<{ bytesRead: number; buffer: Uint8Array }>;
  close: () => Promise<void>;
}> {
  const deno = getDenoNamespace();
  if (deno) {
    const file = await deno.open(filePath, {
      read: true,
      write: mode.includes("w") || mode.includes("+"),
    });
    return {
      read: async (
        buffer: Uint8Array,
        offset: number,
        length: number,
        _position: number,
      ) => {
        const result = await file.read(
          buffer.subarray(offset, offset + length),
        );
        return {
          bytesRead: result ?? 0,
          buffer,
        };
      },
      close: () => {
        file.close();
        return Promise.resolve();
      },
    };
  }

  // Use node:fs/promises which works in Deno, Bun, and Node.js
  const fs = await import("node:fs/promises");
  const fileHandle = await fs.open(filePath, mode);
  return {
    read: async (
      buffer: Uint8Array,
      offset: number,
      length: number,
      position: number,
    ) => {
      const result = await fileHandle.read(buffer, offset, length, position);
      return {
        bytesRead: result.bytesRead,
        buffer: buffer,
      };
    },
    close: () => fileHandle.close(),
  };
}

/**
 * Read a file synchronously as binary data
 *
 * @param filePath - Path to the file to read
 * @returns The file contents as a Uint8Array
 * @throws {UnavailableAPIError} If the file system API is not available
 * @example
 * ```ts
 * import { readFileSync } from "@tidy-ts/shims";
 * const data = readFileSync("./file.bin");
 * ```
 */
export function readFileSync(filePath: string): Uint8Array {
  const deno = getDenoNamespace();
  if (deno) {
    return deno.readFileSync(filePath);
  }

  // Use node:fs which works in Deno, Bun, and Node.js
  const fs = getFsSync();
  if (!fs) {
    throw new UnavailableAPIError("readFileSync()", currentRuntime);
  }
  const buffer = fs.readFileSync(filePath);
  return new Uint8Array(buffer);
}

/**
 * Write a file synchronously with binary data
 *
 * @param filePath - Path to the file to write
 * @param data - The binary data to write (Uint8Array)
 * @throws {UnavailableAPIError} If the file system API is not available
 * @example
 * ```ts
 * import { writeFileSync } from "@tidy-ts/shims";
 * writeFileSync("./output.bin", new Uint8Array([1, 2, 3]));
 * ```
 */
export function writeFileSync(
  filePath: string,
  data: Uint8Array | string,
): void {
  const deno = getDenoNamespace();
  const path = getPathModule();

  // Ensure directory exists (works in all runtimes)
  const dir = path.dirname(filePath);

  if (deno) {
    try {
      deno.mkdirSync(dir, { recursive: true });
    } catch {
      // Directory might already exist, ignore
    }
    if (typeof data === "string") {
      deno.writeTextFileSync(filePath, data);
    } else {
      deno.writeFileSync(filePath, data);
    }
    return;
  }

  // Use node:fs which works in Deno, Bun, and Node.js
  const fs = getFsSync();
  if (!fs) {
    throw new UnavailableAPIError("writeFileSync()", currentRuntime);
  }
  // Ensure directory exists
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    // Directory might already exist, ignore
  }
  fs.writeFileSync(filePath, data);
}

/**
 * Write a text file synchronously
 *
 * @param filePath - Path to the file to write
 * @param data - The content to write
 * @throws {UnavailableAPIError} If the file system API is not available
 * @example
 * ```ts
 * import { writeTextFileSync } from "@tidy-ts/shims";
 * writeTextFileSync("./output.txt", "Hello, World!");
 * ```
 */
export function writeTextFileSync(filePath: string, data: string): void {
  writeFileSync(filePath, data);
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

/**
 * Directory entry returned by listDir
 */
export interface DirEntry {
  /** The name of the file or directory */
  name: string;
  /** Whether this is a file */
  isFile: boolean;
  /** Whether this is a directory */
  isDirectory: boolean;
  /** Whether this is a symbolic link */
  isSymbolicLink: boolean;
}

/**
 * List files and directories in a directory
 *
 * @param dirPath - Path to the directory to list
 * @returns Array of directory entries with name and type information
 * @throws {UnavailableAPIError} If the file system API is not available
 * @example
 * ```ts
 * import { listDir } from "@tidy-ts/shims";
 * const entries = await listDir("./my-dir");
 * for (const entry of entries) {
 *   console.log(`${entry.name} - ${entry.isDirectory ? 'dir' : 'file'}`);
 * }
 * ```
 */
export async function listDir(dirPath: string): Promise<DirEntry[]> {
  // Use node:fs/promises which works in Deno, Bun, and Node.js
  const fs = await import("node:fs/promises");
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  return entries.map((entry) => ({
    name: entry.name,
    isFile: entry.isFile(),
    isDirectory: entry.isDirectory(),
    isSymbolicLink: entry.isSymbolicLink(),
  }));
}

/**
 * Copy a file from source to destination
 *
 * @param src - Source file path
 * @param dest - Destination file path
 * @param options - Optional copy options
 * @param options.overwrite - Whether to overwrite existing file (default: true)
 * @throws {UnavailableAPIError} If the file system API is not available
 * @example
 * ```ts
 * import { copyFile } from "@tidy-ts/shims";
 * await copyFile("./source.txt", "./destination.txt");
 * await copyFile("./source.txt", "./dest.txt", { overwrite: false });
 * ```
 */
export async function copyFile(
  src: string,
  dest: string,
  options?: { overwrite?: boolean },
): Promise<void> {
  // Use node:fs/promises which works in Deno, Bun, and Node.js
  const fs = await import("node:fs/promises");

  // Default to overwrite = true (matches Deno behavior)
  const overwrite = options?.overwrite ?? true;

  if (overwrite) {
    // Overwrite if exists
    await fs.copyFile(src, dest);
  } else {
    // Use COPYFILE_EXCL flag to fail if destination exists
    const constants = await import("node:fs");
    await fs.copyFile(src, dest, constants.constants.COPYFILE_EXCL);
  }
}

/**
 * Rename or move a file or directory
 *
 * @param oldPath - Current path
 * @param newPath - New path
 * @throws {UnavailableAPIError} If the file system API is not available
 * @example
 * ```ts
 * import { rename } from "@tidy-ts/shims";
 * await rename("./old-name.txt", "./new-name.txt");
 * await rename("./old-dir", "./new-dir");
 * ```
 */
export async function rename(oldPath: string, newPath: string): Promise<void> {
  // Use node:fs/promises which works in Deno, Bun, and Node.js
  const fs = await import("node:fs/promises");
  await fs.rename(oldPath, newPath);
}

/**
 * Check if a file or directory exists
 *
 * @param filePath - Path to check
 * @returns true if the path exists, false otherwise
 * @example
 * ```ts
 * import { exists } from "@tidy-ts/shims";
 * if (await exists("./my-file.txt")) {
 *   console.log("File exists!");
 * }
 * ```
 */
export async function exists(filePath: string): Promise<boolean> {
  try {
    // Use node:fs/promises which works in Deno, Bun, and Node.js
    const fs = await import("node:fs/promises");
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
