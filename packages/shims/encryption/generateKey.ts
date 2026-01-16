import { encodeHex } from "@std/encoding/hex";

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
export function generateKey(length = 32): string {
  const keyBytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(keyBytes);
  return encodeHex(keyBytes);
}

// deno-coverage-ignore-start
if (import.meta.main) {
  const args = globalThis.Deno?.args ?? [];

  if (args.includes("-h") || args.includes("--help")) {
    console.log(`
generate-key - Generate cryptographically secure random keys

Generates keys for AES-256-GCM encryption using Web Crypto API.
Output is a hexadecimal string (2 chars per byte).

Usage:
  generate-key [length]

Arguments:
  length    Number of bytes (default: 32)

Common key sizes:
  32 bytes  256-bit key for AES-256-GCM (default, recommended)
  16 bytes  128-bit key for AES-128-GCM

Examples:
  generate-key        # 32-byte key → 64 hex chars
  generate-key 16     # 16-byte key → 32 hex chars

Output format:
  SECRET_KEY=<hex-string>

Use with @tidy-ts/shims encrypt/decrypt:
  Set SECRET_KEY in your environment, then use encrypt() and decrypt().
`);
    Deno.exit(0);
  }

  const lengthArg = args[0] ? parseInt(args[0], 10) : 32;
  const length = isNaN(lengthArg) ? 32 : lengthArg;

  const key = generateKey(length);
  console.log(`\n✅ Generated ${length}-byte (${length * 8}-bit) key`);
  console.log(`SECRET_KEY=${key}`);
}
// deno-coverage-ignore-stop
