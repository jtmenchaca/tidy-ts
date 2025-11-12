/**
 * @tidy-ts/shims - Cross-runtime compatibility shims
 *
 * Provides runtime-agnostic APIs for file system, environment variables,
 * process management, and testing that work across Deno, Bun, and Node.js.
 *
 * @module
 */

// Runtime detection
export { currentRuntime, getCurrentRuntime, Runtime } from "./detect.ts";

// File system APIs
export { mkdir, readTextFile, remove, writeTextFile } from "./fs.ts";

// Environment variables
export { env } from "./env.ts";

// Process management
export { args, exit, getArgs, importMeta } from "./process.ts";

// Cross-runtime testing framework
export { test, type TestSubject, type WrappedTestOptions } from "./test.ts";

// Error types
export { UnavailableAPIError, UnsupportedRuntimeError } from "./errors.ts";

// Compression stream polyfill (automatically initializes)
import "./compression.ts";
