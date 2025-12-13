/**
 * Cross-runtime process management APIs
 */

import { currentRuntime } from "./detect.ts";
import { UnavailableAPIError } from "./errors.ts";
import { getDenoNamespace, getProcessModule } from "./_runtime.ts";

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

/**
 * Runtime-agnostic command line arguments
 *
 * Provides lazy-loaded access to command line arguments across all runtimes.
 * Arguments are loaded once on first access and cached.
 *
 * @example
 * ```ts
 * import { args } from "@tidy-ts/shims";
 *
 * // Access arguments like an array
 * const firstArg = args[0];
 * const allArgs = [...args];
 *
 * // Iterate over arguments
 * for (const arg of args) {
 *   console.log(arg);
 * }
 * ```
 */
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
