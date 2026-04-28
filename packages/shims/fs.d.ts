/**
 * Cross-runtime file system APIs
 * Provides runtime-agnostic file operations that work with Deno, Bun, and Node.js
 */
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
export declare function readFile(filePath: string): Promise<Uint8Array>;
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
export declare function readTextFile(filePath: string): Promise<string>;
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
export declare function writeFile(filePath: string, data: Uint8Array, options?: {
    create?: boolean;
    mode?: number;
}): Promise<void>;
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
export declare function writeTextFile(filePath: string, data: string, options?: {
    create?: boolean;
    mode?: number;
}): Promise<void>;
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
export declare function mkdir(dirPath: string, options?: {
    recursive?: boolean;
    mode?: number;
}): Promise<void>;
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
export declare function stat(filePath: string): Promise<{
    size: number;
    isFile: boolean;
    isDirectory: boolean;
    mtime: Date | null;
    atime: Date | null;
    birthtime: Date | null;
}>;
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
export declare function open(filePath: string, mode?: "r" | "w" | "a" | "r+" | "w+" | "a+"): Promise<{
    read: (buffer: Uint8Array, offset: number, length: number, position: number) => Promise<{
        bytesRead: number;
        buffer: Uint8Array;
    }>;
    close: () => Promise<void>;
}>;
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
export declare function readFileSync(filePath: string): Uint8Array;
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
export declare function writeFileSync(filePath: string, data: Uint8Array | string): void;
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
export declare function writeTextFileSync(filePath: string, data: string): void;
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
export declare function remove(filePath: string, options?: {
    recursive?: boolean;
}): Promise<void>;
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
export declare function listDir(dirPath: string): Promise<DirEntry[]>;
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
export declare function copyFile(src: string, dest: string, options?: {
    overwrite?: boolean;
}): Promise<void>;
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
export declare function rename(oldPath: string, newPath: string): Promise<void>;
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
export declare function exists(filePath: string): Promise<boolean>;
