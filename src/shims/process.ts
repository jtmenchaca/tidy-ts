/**
 * Cross-runtime process management APIs
 */

import { currentRuntime } from "./detect.ts";
import { UnavailableAPIError } from "./errors.ts";
import {
  getDenoNamespace,
  getFileURLToPath,
  getProcessModule,
} from "./_runtime.ts";

/**
 * Exit the process with the given exit code
 *
 * @param code - Exit code (0 = success, non-zero = failure)
 * @throws {UnavailableAPIError} If the process API is not available
 * @example
 * ```ts
 * import { exit } from "@tidy-ts/shims";
 * exit(0); // Exit successfully
 * ```
 */
export function exit(code: number): never {
  const deno = getDenoNamespace();
  if (deno) {
    deno.exit(code);
    // Deno.exit never returns, but TypeScript doesn't know that
    throw new Error("Unreachable");
  }

  const process = getProcessModule();
  if (!process) {
    throw new UnavailableAPIError("exit()", currentRuntime);
  }

  process.exit(code);
  // process.exit never returns, but TypeScript doesn't know that
  throw new Error("Unreachable");
}

/**
 * Get command line arguments
 *
 * @returns Read-only array of command line arguments
 * @throws {UnavailableAPIError} If the process API is not available
 * @example
 * ```ts
 * import { getArgs } from "@tidy-ts/shims";
 * const args = getArgs();
 * ```
 */
export function getArgs(): readonly string[] {
  const deno = getDenoNamespace();
  if (deno) {
    return deno.args;
  }

  const process = getProcessModule();
  if (!process) {
    throw new UnavailableAPIError("getArgs()", currentRuntime);
  }

  return process.argv.slice(2);
}

/**
 * Command line arguments (frozen for immutability)
 * Lazily initialized to ensure process module is available
 *
 * @example
 * ```ts
 * import { args } from "@tidy-ts/shims";
 * console.log(args);
 * ```
 */
let _args: readonly string[] | null = null;

function getArgsLazy(): readonly string[] {
  if (_args === null) {
    _args = Object.freeze(getArgs());
  }
  return _args;
}

export const args: readonly string[] = new Proxy([] as readonly string[], {
  get(_target, prop) {
    const actualArgs = getArgsLazy();
    if (prop === "length") return actualArgs.length;
    if (typeof prop === "string" && /^\d+$/.test(prop)) {
      return actualArgs[Number(prop)];
    }
    if (prop === Symbol.iterator) {
      return actualArgs[Symbol.iterator].bind(actualArgs);
    }
    if (prop in actualArgs) {
      // deno-lint-ignore no-explicit-any
      const value = (actualArgs as any)[prop];
      return typeof value === "function" ? value.bind(actualArgs) : value;
    }
    return undefined;
  },
  ownKeys() {
    return Object.keys(getArgsLazy());
  },
  getOwnPropertyDescriptor(_target, prop) {
    const actualArgs = getArgsLazy();
    return Object.getOwnPropertyDescriptor(actualArgs, prop);
  },
}) as readonly string[];

/**
 * Import meta utilities for working with module metadata
 *
 * @example
 * ```ts
 * import { importMeta } from "@tidy-ts/shims";
 *
 * if (importMeta.main) {
 *   console.log("Running as main script");
 * }
 *
 * const currentFile = importMeta.getFilename();
 * const currentDir = importMeta.getDirname();
 * ```
 */
export const importMeta: {
  get main(): boolean;
  get url(): string;
  urlToPath(url: string): string;
  getFilename(): string;
  getDirname(): string;
} = {
  /**
   * Check if current module is the main entry point
   */
  get main(): boolean {
    const deno = getDenoNamespace();
    if (deno) {
      // @ts-ignore - import.meta.main is Deno-specific
      return import.meta.main ?? false;
    }

    const process = getProcessModule();
    const fileURLToPath = getFileURLToPath();
    if (!process || !fileURLToPath) {
      return false;
    }

    try {
      const mainModule = (process as { main?: { filename?: string } }).main;
      if (mainModule?.filename) {
        const currentFile = fileURLToPath(import.meta.url);
        return mainModule.filename === currentFile;
      }
    } catch {
      // If we can't determine, assume false
    }

    return false;
  },

  /**
   * Get the current module URL
   */
  get url(): string {
    return import.meta.url;
  },

  /**
   * Convert import.meta.url to file path
   *
   * @param url - The URL to convert
   * @returns The file path
   * @throws {UnavailableAPIError} If URL utilities are not available
   */
  urlToPath(url: string): string {
    const deno = getDenoNamespace();
    if (deno) {
      // @ts-ignore - fileURLToPath exists on Deno but may not be in types
      // deno-lint-ignore no-explicit-any
      return (deno as any).fileURLToPath(url);
    }

    const fileURLToPath = getFileURLToPath();
    if (!fileURLToPath) {
      throw new UnavailableAPIError("urlToPath()", currentRuntime);
    }

    return fileURLToPath(url);
  },

  /**
   * Get directory name from import.meta.url
   *
   * @returns The directory path
   * @throws {UnavailableAPIError} If URL utilities are not available
   */
  getDirname(): string {
    try {
      const filename = this.getFilename();
      // Simple path manipulation - works cross-platform
      const lastSlash = Math.max(
        filename.lastIndexOf("/"),
        filename.lastIndexOf("\\"),
      );
      return lastSlash >= 0 ? filename.substring(0, lastSlash + 1) : "";
    } catch {
      throw new UnavailableAPIError("getDirname()", currentRuntime);
    }
  },

  /**
   * Get file name from import.meta.url
   *
   * @returns The file path
   * @throws {UnavailableAPIError} If URL utilities are not available
   */
  getFilename(): string {
    try {
      return this.urlToPath(this.url);
    } catch {
      // Fallback: use URL parsing when fileURLToPath is not available (e.g., ESM without require)
      const url = new URL(this.url);
      if (url.protocol === "file:") {
        // Decode the pathname to handle special characters
        return decodeURIComponent(url.pathname);
      }
      return this.url;
    }
  },
};
