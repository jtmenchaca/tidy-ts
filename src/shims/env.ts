/**
 * Cross-runtime environment variable APIs
 */

import { currentRuntime } from "./detect.ts";
import { UnavailableAPIError } from "./errors.ts";
import { getDenoNamespace, getProcessModule } from "./_runtime.ts";

// Import parse and file reading for loadFromFile
import { parse } from "./dotenv-parse.ts";
import { readFileSync, readTextFile } from "./fs.ts";

/**
 * Environment variables API compatible across Deno, Bun, and Node.js
 *
 * @example
 * ```ts
 * import { env } from "@tidy-ts/shims";
 *
 * const apiKey = env.get("API_KEY");
 * const allEnv = env.toObject();
 * env.set("DEBUG", "true");
 * env.delete("TEMP_VAR");
 *
 * // Load from .env file(s)
 * await env.loadFromFile(".env");
 * await env.loadFromFile([".env", ".env.local"]);
 *
 * // Load without exporting to environment
 * const config = await env.loadFromFile(".env", { export: false });
 *
 * // Synchronous loading
 * const configSync = env.loadFromFileSync(".env");
 * ```
 */
export interface LoadFromFileOptions {
  /**
   * Whether to export variables to the process environment.
   * @default {true}
   */
  export?: boolean;
}

/**
 * Runtime-agnostic environment variable utilities
 *
 * Provides cross-runtime access to environment variables with support for
 * reading, writing, deleting, and loading from .env files.
 *
 * @example
 * ```ts
 * import { env } from "@tidy-ts/shims";
 *
 * // Get environment variable
 * const apiKey = env.get("API_KEY");
 *
 * // Set environment variable
 * env.set("DEBUG", "true");
 *
 * // Load from .env file
 * await env.loadFromFile(".env");
 *
 * // Get all environment variables
 * const allVars = env.toObject();
 * ```
 */
export const env: {
  toObject(): Record<string, string>;
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  loadFromFile(
    paths: string | string[] | URL,
    options?: LoadFromFileOptions,
  ): Promise<Record<string, string>>;
  loadFromFileSync(
    paths: string | string[] | URL,
    options?: LoadFromFileOptions,
  ): Record<string, string>;
} = {
  /**
   * Get all environment variables as an object
   *
   * @returns A record of all environment variables
   * @throws {UnavailableAPIError} If the process API is not available
   */
  toObject(): Record<string, string> {
    const deno = getDenoNamespace();
    if (deno) {
      return deno.env.toObject();
    }

    const process = getProcessModule();
    if (!process) {
      throw new UnavailableAPIError("env.toObject()", currentRuntime);
    }

    return { ...process.env } as Record<string, string>;
  },

  /**
   * Get a specific environment variable
   *
   * @param key - The environment variable name
   * @returns The environment variable value, or undefined if not set
   * @throws {UnavailableAPIError} If the process API is not available
   */
  get(key: string): string | undefined {
    const deno = getDenoNamespace();
    if (deno) {
      return deno.env.get(key);
    }

    const process = getProcessModule();
    if (!process) {
      throw new UnavailableAPIError("env.get()", currentRuntime);
    }

    return process.env[key];
  },

  /**
   * Set an environment variable
   *
   * @param key - The environment variable name
   * @param value - The value to set
   * @throws {UnavailableAPIError} If the process API is not available
   * @example
   * ```ts
   * import { env } from "@tidy-ts/shims";
   * env.set("DEBUG", "true");
   * ```
   */
  set(key: string, value: string): void {
    const deno = getDenoNamespace();
    if (deno) {
      deno.env.set(key, value);
      return;
    }

    const process = getProcessModule();
    if (!process) {
      throw new UnavailableAPIError("env.set()", currentRuntime);
    }

    process.env[key] = value;
  },

  /**
   * Delete an environment variable
   *
   * @param key - The environment variable name to delete
   * @throws {UnavailableAPIError} If the process API is not available
   * @example
   * ```ts
   * import { env } from "@tidy-ts/shims";
   * env.delete("TEMP_VAR");
   * ```
   */
  delete(key: string): void {
    const deno = getDenoNamespace();
    if (deno) {
      deno.env.delete(key);
      return;
    }

    const process = getProcessModule();
    if (!process) {
      throw new UnavailableAPIError("env.delete()", currentRuntime);
    }

    delete process.env[key];
  },

  /**
   * Load environment variables from one or more `.env` files
   *
   * Variables are loaded in order. If `export` is true (default), variables are set
   * in the process environment. Existing environment variables are not overridden.
   * If a file doesn't exist, it's silently skipped.
   *
   * @param paths - Single file path, URL, or array of file paths/URLs to load
   * @param options - Options for loading
   * @returns A merged record of all loaded environment variables
   * @example
   * ```ts
   * import { env } from "@tidy-ts/shims";
   *
   * // Load from single file and export to environment
   * await env.loadFromFile(".env");
   *
   * // Load from multiple files (later files take precedence)
   * const config = await env.loadFromFile([".env", ".env.local", ".env.production"]);
   *
   * // Load without exporting to environment
   * const config = await env.loadFromFile(".env", { export: false });
   *
   * // Load from URL
   * const config = await env.loadFromFile(new URL("file:///path/to/.env"));
   * ```
   */
  async loadFromFile(
    paths: string | string[] | URL,
    options: LoadFromFileOptions = {},
  ): Promise<Record<string, string>> {
    const { export: _export = true } = options;
    const pathArray = Array.isArray(paths) ? paths : [paths];
    const merged: Record<string, string> = {};

    for (const filePath of pathArray) {
      try {
        const pathStr = filePath instanceof URL ? filePath.pathname : filePath;
        const text = await readTextFile(pathStr);
        const parsed = parse(text);

        // Merge into result object (later files override earlier ones in the result)
        Object.assign(merged, parsed);

        // Set in environment if export is enabled (but don't override existing env vars)
        if (_export) {
          for (const [key, value] of Object.entries(parsed)) {
            if (env.get(key) === undefined) {
              env.set(key, value);
            }
          }
        }
      } catch (e) {
        // Check for file not found error (cross-runtime compatible)
        if (
          e &&
          typeof e === "object" &&
          "code" in e &&
          e.code === "ENOENT"
        ) {
          // File doesn't exist, skip silently
          continue;
        }
        // Also check for Deno.errors.NotFound if in Deno
        if (e && e.constructor && e.constructor.name === "NotFound") {
          // File doesn't exist, skip silently
          continue;
        }
        // Re-throw other errors
        throw e;
      }
    }

    return merged;
  },

  /**
   * Synchronously load environment variables from one or more `.env` files
   *
   * Variables are loaded in order. If `export` is true (default), variables are set
   * in the process environment. Existing environment variables are not overridden.
   * If a file doesn't exist, it's silently skipped.
   *
   * @param paths - Single file path, URL, or array of file paths/URLs to load
   * @param options - Options for loading
   * @returns A merged record of all loaded environment variables
   * @example
   * ```ts
   * import { env } from "@tidy-ts/shims";
   *
   * // Load synchronously and export to environment
   * const config = env.loadFromFileSync(".env");
   *
   * // Load without exporting
   * const config = env.loadFromFileSync(".env", { export: false });
   * ```
   */
  loadFromFileSync(
    paths: string | string[] | URL,
    options: LoadFromFileOptions = {},
  ): Record<string, string> {
    const { export: _export = true } = options;
    const pathArray = Array.isArray(paths) ? paths : [paths];
    const merged: Record<string, string> = {};

    for (const filePath of pathArray) {
      try {
        const pathStr = filePath instanceof URL ? filePath.pathname : filePath;
        const text = new TextDecoder().decode(readFileSync(pathStr));
        const parsed = parse(text);

        // Merge into result object (later files override earlier ones in the result)
        Object.assign(merged, parsed);

        // Set in environment if export is enabled (but don't override existing env vars)
        if (_export) {
          for (const [key, value] of Object.entries(parsed)) {
            if (env.get(key) === undefined) {
              env.set(key, value);
            }
          }
        }
      } catch (e) {
        // Check for file not found error (cross-runtime compatible)
        if (
          e &&
          typeof e === "object" &&
          "code" in e &&
          e.code === "ENOENT"
        ) {
          // File doesn't exist, skip silently
          continue;
        }
        // Also check for Deno.errors.NotFound if in Deno
        if (e && e.constructor && e.constructor.name === "NotFound") {
          // File doesn't exist, skip silently
          continue;
        }
        // Re-throw other errors
        throw e;
      }
    }

    return merged;
  },
};
