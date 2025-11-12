/**
 * Internal runtime utilities
 * Provides type-safe access to runtime-specific APIs
 */

import { currentRuntime, Runtime } from "./detect.ts";

// Lazy-loaded Node.js modules
let _fs: typeof import("node:fs/promises") | null = null;
let _path: typeof import("node:path") | null = null;
let _process: typeof import("node:process") | null = null;
let _fileURLToPath: typeof import("node:url").fileURLToPath | null = null;

/**
 * Lazy load Node.js modules for async operations
 */
export async function ensureNodeModules(): Promise<void> {
  if (currentRuntime !== Runtime.Deno && !_fs) {
    _fs = await import("node:fs/promises");
    _path = await import("node:path");
    _process = await import("node:process");
    const urlModule = await import("node:url");
    _fileURLToPath = urlModule.fileURLToPath;
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
      const nodePath = require("node:path");
      // @ts-ignore - require may not be typed in all environments
      const nodeUrl = require("node:url");
      // @ts-ignore - require may not be typed in all environments
      const nodeProcess = require("node:process");
      _path = nodePath;
      _fileURLToPath = nodeUrl.fileURLToPath;
      _process = nodeProcess;
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
export function getPathModule(): typeof import("node:path") | null {
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
export function getFileURLToPath():
  | typeof import("node:url").fileURLToPath
  | null {
  return _fileURLToPath;
}
