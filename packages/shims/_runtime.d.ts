/**
 * Internal runtime utilities
 * Provides type-safe access to runtime-specific APIs
 */
/**
 * Get Deno namespace if available
 */
export declare function getDenoNamespace(): typeof Deno | null;
/**
 * Get Node.js fs/promises module
 */
export declare function getFsPromises(): Promise<typeof import("node:fs/promises")>;
/**
 * Get Node.js path module
 */
export declare function getPathModule(): typeof import("node:path");
/**
 * Get Node.js process module
 */
export declare function getProcessModule(): typeof import("node:process") | null;
/**
 * Get Node.js fileURLToPath function
 */
export declare function getFileURLToPath(): typeof import("node:url").fileURLToPath;
/**
 * Get Node.js pathToFileURL function
 */
export declare function getPathToFileURL(): typeof import("node:url").pathToFileURL;
/**
 * Get Node.js fs sync module (lazy-loads if needed)
 */
export declare function getFsSync(): typeof import("node:fs") | null;
