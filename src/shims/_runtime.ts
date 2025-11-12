/**
 * Internal runtime utilities
 * Provides type-safe access to runtime-specific APIs
 */

import { currentRuntime, Runtime } from "./detect.ts";

// Import node:path and node:url directly - all runtimes (Node.js, Bun, Deno) support these natively
import * as _pathModule from "node:path";
import { fileURLToPath as _fileURLToPathFn } from "node:url";

// Lazy-loaded Node.js modules
let _fs: typeof import("node:fs/promises") | null = null;
let _fsSync: typeof import("node:fs") | null = null;
let _process: typeof import("node:process") | null = null;

// Path and URL modules are always available (loaded at top level)
const _path: typeof import("node:path") = _pathModule;
const _fileURLToPath: typeof import("node:url").fileURLToPath =
  _fileURLToPathFn;

/**
 * Lazy load Node.js modules for async operations
 * Note: path and fileURLToPath are loaded at top level, so this only loads fs/process
 */
export async function ensureNodeModules(): Promise<void> {
  // Load fs and process only for Node.js/Bun (Deno has its own APIs)
  if (
    !_fs && (currentRuntime === Runtime.Node || currentRuntime === Runtime.Bun)
  ) {
    _fs = await import("node:fs/promises");
    _process = await import("node:process");
  }
}

/**
 * Initialize synchronous Node.js modules (for Node.js/Bun only)
 * This runs synchronously at module load time
 */
if (currentRuntime === Runtime.Node || currentRuntime === Runtime.Bun) {
  try {
    // @ts-ignore - require may not be typed in all environments
    if (typeof require !== "undefined") {
      // CommonJS or Node.js with require available
      // @ts-ignore - require may not be typed in all environments
      const nodeProcess = require("node:process");
      // @ts-ignore - require may not be typed in all environments
      const nodeFs = require("node:fs");
      // Path and fileURLToPath are already loaded at top level via ESM imports
      _process = nodeProcess;
      _fsSync = nodeFs;
    } else {
      // ESM context - process is available on globalThis
      // Other modules will be loaded lazily via ensureNodeModules()
      // @ts-ignore - process may not be typed in all environments
      if (typeof globalThis.process !== "undefined") {
        // @ts-ignore - process may not be typed in all environments
        _process = globalThis.process;
      }
    }
  } catch {
    // If require fails, use globalThis.process as fallback
    // @ts-ignore - process may not be typed in all environments
    if (typeof globalThis.process !== "undefined") {
      // @ts-ignore - process may not be typed in all environments
      _process = globalThis.process;
    }
  }
}

// Path and fileURLToPath are already loaded at top level via ESM imports

/**
 * Get Deno namespace if available
 */
export function getDenoNamespace(): typeof Deno | null {
  if (currentRuntime === Runtime.Deno) {
    return (globalThis as { Deno?: typeof Deno }).Deno ?? null;
  }
  return null;
}

/**
 * Get Node.js fs/promises module
 */
export async function getFsPromises(): Promise<
  typeof import("node:fs/promises")
> {
  await ensureNodeModules();
  if (!_fs) {
    throw new Error("File system API not available");
  }
  return _fs;
}

/**
 * Get Node.js path module
 */
export function getPathModule(): typeof import("node:path") {
  return _path;
}

/**
 * Get Node.js process module
 */
export function getProcessModule(): typeof import("node:process") | null {
  return _process;
}

/**
 * Get Node.js fileURLToPath function
 */
export function getFileURLToPath(): typeof import("node:url").fileURLToPath {
  return _fileURLToPath;
}

/**
 * Get Node.js fs sync module
 */
export function getFsSync(): typeof import("node:fs") | null {
  return _fsSync;
}

/**
 * Ensure fs sync module is loaded
 */
export async function ensureFsSync(): Promise<void> {
  if (
    !_fsSync &&
    (currentRuntime === Runtime.Node || currentRuntime === Runtime.Bun)
  ) {
    _fsSync = await import("node:fs");
  }
}
