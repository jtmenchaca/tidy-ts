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
export {
  copyFile,
  type DirEntry,
  exists,
  listDir,
  mkdir,
  open,
  readFile,
  readFileSync,
  readTextFile,
  remove,
  rename,
  stat,
  writeFile,
  writeFileSync,
  writeTextFile,
  writeTextFileSync,
} from "./fs.ts";

// Path utilities
export { dirname, fileURLToPath, pathToFileURL, resolve } from "./path.ts";

// Environment variables
export { env } from "./env.ts";

// Process management
export { args, exit, getArgs } from "./process.ts";

// Cross-runtime testing framework
export { test, type TestSubject, type WrappedTestOptions } from "./test.ts";

// Result type system
export { type AppError, defineError, err, ok, type Result } from "./result.ts";

// Enhanced fetch API with Result-based error handling
export {
  // Error types
  AbortError,
  HTTPError,
  NetworkError,
  ParseError,
  // Fetch API
  type RawResponse,
  tidyfetch,
  type TidyFetchError,
  TimeoutError,
} from "./fetch.ts";

// Error types
export { UnavailableAPIError, UnsupportedRuntimeError } from "./errors.ts";

// Encryption utilities (AES-256-GCM)
export {
  decrypt,
  encrypt,
  fromBase64URL,
  toBase64URL,
} from "./encryption/encryptAndDecrypt.ts";
export { generateKey } from "./encryption/generateKey.ts";

// Compression stream polyfill (automatically initializes)
import "./compression.ts";
