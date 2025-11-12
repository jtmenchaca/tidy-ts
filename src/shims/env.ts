/**
 * Cross-runtime environment variable APIs
 */

import { currentRuntime } from "./detect.ts";
import { UnavailableAPIError } from "./errors.ts";
import { getDenoNamespace, getProcessModule } from "./_runtime.ts";

/**
 * Environment variables API compatible across Deno, Bun, and Node.js
 *
 * @example
 * ```ts
 * import { env } from "@tidy-ts/shims";
 *
 * const apiKey = env.get("API_KEY");
 * const allEnv = env.toObject();
 * ```
 */
export const env: {
  toObject(): Record<string, string>;
  get(key: string): string | undefined;
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
};
