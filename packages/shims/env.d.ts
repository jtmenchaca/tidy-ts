/**
 * Cross-runtime environment variable APIs
 */
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
export declare const env: {
    toObject(): Record<string, string>;
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    loadFromFile(paths: string | string[] | URL, options?: LoadFromFileOptions): Promise<Record<string, string>>;
    loadFromFileSync(paths: string | string[] | URL, options?: LoadFromFileOptions): Record<string, string>;
};
