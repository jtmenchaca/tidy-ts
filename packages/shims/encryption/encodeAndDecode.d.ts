export type PlaintextEncoding = "utf8" | "base64" | "hex" | "binary";
export type CiphertextEncoding = "base64" | "hex" | "binary";
export type AnyEncoding = PlaintextEncoding | CiphertextEncoding;
export declare function encodeBase64(data: Uint8Array): string;
export declare function decodeBase64(b64: string): Uint8Array;
export declare function encodeHex(data: Uint8Array): string;
export declare function decodeHex(hex: string): Uint8Array;
/**
 * Converts standard Base64 to Base64URL format (RFC 4648 §5).
 * Replaces '+' with '-', '/' with '_', and removes '=' padding.
 */
export declare function toBase64URL(base64: string): string;
/**
 * Converts Base64URL back to standard Base64 (RFC 4648 §4).
 * Replaces '-' with '+', '_' with '/', and adds '=' padding.
 */
export declare function fromBase64URL(base64url: string): string;
export declare function decodeToBytes({ data, encoding }: {
    data: string;
    encoding: PlaintextEncoding | CiphertextEncoding;
}): Uint8Array;
export declare function encodeFromBytes({ data, encoding }: {
    data: Uint8Array;
    encoding: CiphertextEncoding | "utf8";
}): string;
