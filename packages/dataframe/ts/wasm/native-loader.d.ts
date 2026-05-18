/**
 * Try to load the native .node addon. Returns null if not available.
 *
 * Resolution order:
 * 1. npm platform package via createRequire: @tidy-ts/dataframe-{platform}-{arch}
 * 2. npm: specifier via dynamic import (for Deno JSR consumers)
 */
export declare function tryLoadNative(): Promise<Record<string, any> | null>;
/**
 * Build a wasmInternal-compatible proxy from the native addon.
 * Maps snake_case WASM names to camelCase napi names,
 * converts TypedArray args, and parses JSON results.
 */
export declare function buildNativeProxy(native: Record<string, any>): Record<string, any>;
