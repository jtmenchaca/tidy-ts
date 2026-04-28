/**
 * Generates a cryptographically secure random key for AES-256-GCM encryption.
 *
 * Uses Web Crypto API (crypto.getRandomValues) for secure randomness.
 * The default 32-byte (256-bit) key is designed for use with the
 * AES-256-GCM encryption in encryptAndDecrypt.ts.
 *
 * @param length - The number of bytes (default: 32 for AES-256-GCM)
 * @returns A key as a hexadecimal string (64 hex chars for 32 bytes)
 */
export declare function generateKey(length?: number): string;
