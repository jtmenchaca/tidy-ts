/**
 * Cross-runtime process management APIs
 */
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
export declare function exit(code: number): never;
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
export declare function getArgs(): readonly string[];
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
export declare const args: readonly string[];
