/**
 * @tidy-ts/shims/encryption - Encryption utilities
 *
 * Browser-safe encryption module using Web Crypto API.
 * Works in browsers, Deno, Bun, and Node.js.
 *
 * @module
 */

// AES-256-GCM encryption/decryption
export {
  type CryptoError,
  decrypt,
  DecryptionError,
  encrypt,
  EncryptionError,
  fromBase64URL,
  InvalidKeyError,
  toBase64URL,
} from "./encryptAndDecrypt.ts";

// Key generation
export { generateKey } from "./generateKey.ts";

// Envelope encryption (per-record DEK with master key)
export {
  decryptFields,
  encryptFields,
  type EnvelopeDecryptionError,
  type EnvelopeEncryptionError,
  type EnvelopeError,
  type InvalidKeyIdError,
  type KeyNotFoundError,
  rotateMasterKey,
} from "./envelope.ts";
