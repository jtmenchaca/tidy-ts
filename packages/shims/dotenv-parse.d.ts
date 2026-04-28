/**
 * Parse `.env` file content into an object.
 *
 * This is an internal utility used by `env.loadFromFile()` and `env.loadFromFileSync()`.
 * For loading `.env` files, use those methods instead.
 *
 * Note: The key needs to match the pattern /^[a-zA-Z_][a-zA-Z0-9_]*$/.
 *
 * @example Parse dotenv string
 * ```ts
 * import { parse } from "@tidy-ts/shims/dotenv-parse";
 *
 * const config = parse("GREETING=hello world\nPORT=3000");
 * console.log(config.GREETING); // "hello world"
 * ```
 *
 * @example Load from file (recommended)
 * ```ts
 * import { env } from "@tidy-ts/shims";
 *
 * // Load and export to environment
 * await env.loadFromFile(".env");
 *
 * // Load without exporting
 * const config = await env.loadFromFile(".env", { export: false });
 * ```
 *
 * @param text The dotenv-formatted text to parse.
 * @returns A record of parsed environment variables.
 */
export declare function parse(text: string): Record<string, string>;
