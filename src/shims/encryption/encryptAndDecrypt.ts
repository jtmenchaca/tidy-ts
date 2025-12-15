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

import { type AppError, defineError, err, ok, type Result } from "../result.ts";
import {
  decodeBase64,
  decodeHex,
  encodeFromBytes,
  fromBase64URL,
  toBase64URL,
} from "./encodeAndDecode.ts";

// AES-GCM uses 12-byte (96-bit) IV - recommended by NIST
const IV_LENGTH = 12;

// Define the supported input and output encoding types
type InputEncoding = "utf8" | "base64" | "hex" | "binary";
type OutputEncoding = "base64" | "hex" | "binary";

// ============================================================================
// Encryption Error Types
// ============================================================================

/** Extra properties for InvalidKeyError */
type InvalidKeyErrorExtra = { reason: string };
/** Encryption key is invalid */
export const InvalidKeyError: {
  new (
    extra: InvalidKeyErrorExtra,
  ): AppError<"InvalidKeyError", InvalidKeyErrorExtra>;
} = defineError(
  "InvalidKeyError",
  ({ reason }: InvalidKeyErrorExtra) => `Invalid key: ${reason}`,
);
export type InvalidKeyError = AppError<"InvalidKeyError", InvalidKeyErrorExtra>;

/** Extra properties for EncryptionError */
type EncryptionErrorExtra = { message: string; cause?: Error };
/** Encryption operation failed */
export const EncryptionError: {
  new (
    extra: EncryptionErrorExtra,
  ): AppError<"EncryptionError", EncryptionErrorExtra>;
} = defineError(
  "EncryptionError",
  ({ message }: EncryptionErrorExtra) => `Encryption failed: ${message}`,
);
export type EncryptionError = AppError<"EncryptionError", EncryptionErrorExtra>;

/** Extra properties for DecryptionError */
type DecryptionErrorExtra = { message: string; cause?: Error };
/** Decryption operation failed */
export const DecryptionError: {
  new (
    extra: DecryptionErrorExtra,
  ): AppError<"DecryptionError", DecryptionErrorExtra>;
} = defineError(
  "DecryptionError",
  ({ message }: DecryptionErrorExtra) => `Decryption failed: ${message}`,
);
export type DecryptionError = AppError<"DecryptionError", DecryptionErrorExtra>;

/** Union of all encryption error types */
export type CryptoError =
  | InvalidKeyError
  | EncryptionError
  | DecryptionError;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parses a hex-encoded key string into bytes
 * @param key - Hex-encoded 32-byte key (64 hex characters)
 * @returns Result with raw key bytes or error
 */
function parseKey(key: string): Result<Uint8Array, InvalidKeyError> {
  try {
    const keyBytes = decodeHex(key);
    if (keyBytes.length !== 32) {
      return err(
        new InvalidKeyError({
          reason:
            `Expected 32 bytes (64 hex chars), got ${keyBytes.length} bytes`,
        }),
      );
    }
    return ok(keyBytes);
  } catch (e) {
    return err(
      new InvalidKeyError({
        reason: e instanceof Error ? e.message : String(e),
      }),
    );
  }
}

/**
 * Helper function to convert data to Uint8Array based on encoding
 */
function dataToUint8Array(data: string, encoding: InputEncoding): Uint8Array {
  switch (encoding) {
    case "utf8":
      return new TextEncoder().encode(data);
    case "base64":
      return decodeBase64(data);
    case "hex":
      return decodeHex(data);
    case "binary": {
      const bytes = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        bytes[i] = data.charCodeAt(i);
      }
      return bytes;
    }
  }
}

/**
 * Helper function to convert Uint8Array to string based on encoding
 */
function uint8ArrayToString(
  data: Uint8Array,
  encoding: OutputEncoding | "utf8",
): string {
  return encodeFromBytes({ data, encoding });
}

// ============================================================================
// Main Encryption/Decryption Functions
// ============================================================================

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
const encrypt = async ({
  key,
  data,
  inputEncoding = "utf8",
  outputEncoding = "base64",
  urlSafe = true,
}: {
  key: string;
  data: string;
  inputEncoding?: InputEncoding;
  outputEncoding?: OutputEncoding;
  urlSafe?: boolean;
}): Promise<Result<string, CryptoError>> => {
  const keyResult = parseKey(key);
  if (!keyResult.ok) {
    return keyResult;
  }
  const keyBytes = keyResult.value;

  try {
    // Convert input data to Uint8Array
    const dataBytes = dataToUint8Array(data, inputEncoding);

    // Generate fresh random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Import the key for AES-GCM
    // Copy to new ArrayBuffer to satisfy TypeScript's BufferSource type
    const keyBuffer = new Uint8Array(keyBytes).buffer as ArrayBuffer;
    const key = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"],
    );

    // Encrypt the data (includes 16-byte auth tag automatically)
    const dataBuffer = new Uint8Array(dataBytes).buffer as ArrayBuffer;
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      dataBuffer,
    );

    // Combine IV + ciphertext (auth tag is included in encryptedBuffer)
    const combined = new Uint8Array(IV_LENGTH + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), IV_LENGTH);

    // Convert to output encoding
    const encryptedOutput = uint8ArrayToString(combined, outputEncoding);

    // Only convert to Base64URL if output is base64 and urlSafe is true
    const result = urlSafe && outputEncoding === "base64"
      ? toBase64URL(encryptedOutput)
      : encryptedOutput;

    return ok(result);
  } catch (e) {
    const cause = e instanceof Error ? e : new Error(String(e));
    return err(new EncryptionError({ message: cause.message, cause }));
  }
};

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
const decrypt = async ({
  key,
  data,
  inputEncoding = "base64",
  outputEncoding = "utf8",
  urlSafe = true,
}: {
  key: string;
  data: string;
  inputEncoding?: OutputEncoding;
  outputEncoding?: InputEncoding;
  urlSafe?: boolean;
}): Promise<Result<string, CryptoError>> => {
  const keyResult = parseKey(key);
  if (!keyResult.ok) {
    return keyResult;
  }
  const keyBytes = keyResult.value;

  try {
    // Convert from Base64URL to standard Base64 if necessary
    const processedData = urlSafe && inputEncoding === "base64"
      ? fromBase64URL(data)
      : data;

    // Convert input data to Uint8Array
    const combined = dataToUint8Array(processedData, inputEncoding);

    // Extract IV and ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    // Import the key for AES-GCM
    // Copy to new ArrayBuffer to satisfy TypeScript's BufferSource type
    const keyBuffer = new Uint8Array(keyBytes).buffer as ArrayBuffer;
    const key = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );

    // Decrypt the data (also verifies auth tag)
    const ciphertextBuffer = new Uint8Array(ciphertext).buffer as ArrayBuffer;
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertextBuffer,
    );

    // Convert decrypted data to the specified output encoding
    const result = uint8ArrayToString(
      new Uint8Array(decryptedBuffer),
      outputEncoding,
    );

    return ok(result);
  } catch (e) {
    const cause = e instanceof Error ? e : new Error(String(e));
    return err(new DecryptionError({ message: cause.message, cause }));
  }
};

export { decrypt, encrypt, fromBase64URL, toBase64URL };
