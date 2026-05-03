/**
 * @tidy-ts/shims - Cross-runtime compatibility shims
 *
 * Provides runtime-agnostic APIs for file system, environment variables,
 * process management, and testing that work across Deno, Bun, and Node.js.
 *
 * @module
 */
export { currentRuntime, getCurrentRuntime, Runtime } from "./detect.ts";
export { copyFile, type DirEntry, exists, listDir, mkdir, open, readFile, readFileSync, readTextFile, remove, rename, stat, writeFile, writeFileSync, writeTextFile, writeTextFileSync, } from "./fs.ts";
export { dirname, fileURLToPath, pathToFileURL, resolve } from "./path.ts";
export { env } from "./env.ts";
export { args, exit, getArgs } from "./process.ts";
export { test, type TestSubject, type WrappedTestOptions } from "./test.ts";
export { type AppError, defineError, err, ok, type Result, tryAsync, } from "./result.ts";
export { AbortError, HTTPError, NetworkError, ParseError, type RawResponse, tidyfetch, type TidyFetchError, TimeoutError, } from "./fetch.ts";
export { UnavailableAPIError, UnsupportedRuntimeError } from "./errors.ts";
export { type CryptoError, decrypt, DecryptionError, encrypt, EncryptionError, fromBase64URL, InvalidKeyError, toBase64URL, } from "./encryption/encryptAndDecrypt.ts";
export { generateKey } from "./encryption/generateKey.ts";
export { decryptFields, encryptFields, type EnvelopeDecryptionError, type EnvelopeEncryptionError, type EnvelopeError, type InvalidKeyIdError, type KeyNotFoundError, rotateMasterKey, } from "./encryption/envelope.ts";
export { batch, chunk, type CustomBackoff, type ExponentialBackoff, type LinearBackoff, parallel, type RetryConfig, type SettledResult, } from "./async.ts";
import "./compression.ts";
export { createSpinner, type Spinner, type SpinnerStyle, withSpinner, } from "./spinner/spinner.ts";
import "./temporal-polyfill/global.ts";
export { Temporal, toTemporalInstant } from "./temporal-polyfill/impl.ts";
export * from "./temporal-zod/index.ts";
