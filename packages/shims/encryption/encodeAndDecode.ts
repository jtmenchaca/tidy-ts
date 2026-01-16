import { decodeBase64, encodeBase64 } from "@std/encoding/base64";
import { decodeHex, encodeHex } from "@std/encoding/hex";

export type PlaintextEncoding = "utf8" | "base64" | "hex" | "binary";
export type CiphertextEncoding = "base64" | "hex" | "binary";
export type AnyEncoding = PlaintextEncoding | CiphertextEncoding;

export { decodeBase64, decodeHex, encodeBase64, encodeHex };

/**
 * Converts standard Base64 to Base64URL format (RFC 4648 §5).
 * Replaces '+' with '-', '/' with '_', and removes '=' padding.
 */
export function toBase64URL(base64: string): string {
  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Converts Base64URL back to standard Base64 (RFC 4648 §4).
 * Replaces '-' with '+', '_' with '/', and adds '=' padding.
 */
export function fromBase64URL(base64url: string): string {
  let base64 = base64url
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const pad = base64.length % 4;
  if (pad) {
    base64 += "=".repeat(4 - pad);
  }

  return base64;
}

export function decodeToBytes(
  { data, encoding }: {
    data: string;
    encoding: PlaintextEncoding | CiphertextEncoding;
  },
): Uint8Array {
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

export function encodeFromBytes(
  { data, encoding }: {
    data: Uint8Array;
    encoding: CiphertextEncoding | "utf8";
  },
): string {
  switch (encoding) {
    case "utf8":
      return new TextDecoder().decode(data);
    case "base64":
      return encodeBase64(data);
    case "hex":
      return encodeHex(data);
    case "binary": {
      let result = "";
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data[i]);
      }
      return result;
    }
  }
}
