/**
 * AES-256-GCM Encryption Module
 *
 * Uses Web Crypto API with authenticated encryption (AES-GCM).
 * Each encryption generates a random 12-byte IV which is prepended to the ciphertext.
 *
 * Security properties:
 * - AES-GCM provides both encryption AND authentication (integrity checking)
 * - Fresh random IV for each encryption (semantic security)
 * - 256-bit keys (32 bytes, provided as 64 hex characters)
 */
import { type AppError, type Result } from "../result.ts";
import { fromBase64URL, toBase64URL } from "./encodeAndDecode.ts";
type InputEncoding = "utf8" | "base64" | "hex" | "binary";
type OutputEncoding = "base64" | "hex" | "binary";
/** Extra properties for InvalidKeyError */
type InvalidKeyErrorExtra = {
    reason: string;
};
/** Encryption key is invalid */
export declare const InvalidKeyError: {
    new (extra: InvalidKeyErrorExtra): AppError<"InvalidKeyError", InvalidKeyErrorExtra>;
};
export type InvalidKeyError = AppError<"InvalidKeyError", InvalidKeyErrorExtra>;
/** Extra properties for EncryptionError */
type EncryptionErrorExtra = {
    message: string;
    cause?: Error;
};
/** Encryption operation failed */
export declare const EncryptionError: {
    new (extra: EncryptionErrorExtra): AppError<"EncryptionError", EncryptionErrorExtra>;
};
export type EncryptionError = AppError<"EncryptionError", EncryptionErrorExtra>;
/** Extra properties for DecryptionError */
type DecryptionErrorExtra = {
    message: string;
    cause?: Error;
};
/** Decryption operation failed */
export declare const DecryptionError: {
    new (extra: DecryptionErrorExtra): AppError<"DecryptionError", DecryptionErrorExtra>;
};
export type DecryptionError = AppError<"DecryptionError", DecryptionErrorExtra>;
/** Union of all encryption error types */
export type CryptoError = InvalidKeyError | EncryptionError | DecryptionError;
/**
 * Encrypts data using AES-256-GCM algorithm
 *
 * The output format is: IV (12 bytes) + Ciphertext + Auth Tag (16 bytes)
 * This is all bundled together in the specified output encoding.
 *
 * @param key - Hex-encoded 32-byte key (64 hex characters)
 * @param data - The data to encrypt
 * @param inputEncoding - The encoding of the input data (default: utf8)
 * @param outputEncoding - The encoding for the encrypted output (default: base64)
 * @param urlSafe - Whether to return Base64URL format (default: true)
 * @returns Result with encrypted data or error
 */
declare const encrypt: ({ key, data, inputEncoding, outputEncoding, urlSafe, }: {
    key: string;
    data: string;
    inputEncoding?: InputEncoding;
    outputEncoding?: OutputEncoding;
    urlSafe?: boolean;
}) => Promise<Result<string, CryptoError>>;
/**
 * Decrypts data that was encrypted using AES-256-GCM algorithm
 *
 * Expects input format: IV (12 bytes) + Ciphertext + Auth Tag (16 bytes)
 *
 * @param key - Hex-encoded 32-byte key (64 hex characters)
 * @param data - The encrypted data
 * @param inputEncoding - The encoding of the encrypted input (default: base64)
 * @param outputEncoding - The encoding for the decrypted output (default: utf8)
 * @param urlSafe - Whether the input is in Base64URL format (default: true)
 * @returns Result with decrypted data or error
 */
declare const decrypt: ({ key, data, inputEncoding, outputEncoding, urlSafe, }: {
    key: string;
    data: string;
    inputEncoding?: OutputEncoding;
    outputEncoding?: InputEncoding;
    urlSafe?: boolean;
}) => Promise<Result<string, CryptoError>>;
export { decrypt, encrypt, fromBase64URL, toBase64URL };
