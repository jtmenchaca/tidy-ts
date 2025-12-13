/**
 * AES-256-GCM Encryption Module
 *
 * Uses Web Crypto API with authenticated encryption (AES-GCM).
 * Each encryption generates a random 12-byte IV which is prepended to the ciphertext.
 *
 * Security improvements over previous implementation:
 * - AES-GCM provides both encryption AND authentication (integrity checking)
 * - Fresh random IV for each encryption (semantic security)
 * - No static IV from environment - only key needed
 */

import { decodeBase64, encodeBase64 } from "@std/encoding/base64";
import { decodeHex, encodeHex } from "@std/encoding/hex";
import { env } from "../env.ts";
import { args, exit } from "../process.ts";

// AES-GCM uses 12-byte (96-bit) IV - recommended by NIST
const IV_LENGTH = 12;

// Define the supported input and output encoding types
type InputEncoding = "utf8" | "base64" | "hex" | "binary";
type OutputEncoding = "base64" | "hex" | "binary";

/**
 * Gets the encryption key from environment
 * @returns The raw key bytes
 */
function getKey(): Uint8Array {
  const keyHex = env.get("SECRET_KEY");
  if (!keyHex) {
    throw new Error("SECRET_KEY is not set");
  }
  return decodeHex(keyHex);
}

/**
 * Converts standard Base64 to Base64URL format (RFC 4648 §5)
 * @param base64 - Standard Base64 string
 * @returns Base64URL-encoded string
 */
const toBase64URL = (base64: string): string => {
  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

/**
 * Converts Base64URL format back to standard Base64 (RFC 4648 §4)
 * @param base64url - Base64URL-encoded string
 * @returns Standard Base64 string with padding
 */
const fromBase64URL = (base64url: string): string => {
  let base64 = base64url
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const pad = base64.length % 4;
  if (pad) {
    base64 += "=".repeat(4 - pad);
  }

  return base64;
};

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

/**
 * Encrypts data using AES-256-GCM algorithm
 *
 * The output format is: IV (12 bytes) + Ciphertext + Auth Tag (16 bytes)
 * This is all bundled together in the specified output encoding.
 *
 * @param data - The data to encrypt
 * @param inputEncoding - The encoding of the input data (default: utf8)
 * @param outputEncoding - The encoding for the encrypted output (default: base64)
 * @param urlSafe - Whether to return Base64URL format (default: true)
 * @returns The encrypted data in the specified encoding
 */
const encrypt = async ({
  data,
  inputEncoding = "utf8",
  outputEncoding = "base64",
  urlSafe = true,
}: {
  data: string;
  inputEncoding?: InputEncoding;
  outputEncoding?: OutputEncoding;
  urlSafe?: boolean;
}): Promise<string> => {
  const keyBytes = getKey();

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
  return urlSafe && outputEncoding === "base64"
    ? toBase64URL(encryptedOutput)
    : encryptedOutput;
};

/**
 * Decrypts data that was encrypted using AES-256-GCM algorithm
 *
 * Expects input format: IV (12 bytes) + Ciphertext + Auth Tag (16 bytes)
 *
 * @param data - The encrypted data
 * @param inputEncoding - The encoding of the encrypted input (default: base64)
 * @param outputEncoding - The encoding for the decrypted output (default: utf8)
 * @param urlSafe - Whether the input is in Base64URL format (default: true)
 * @returns The decrypted data in the specified encoding
 */
const decrypt = async ({
  data,
  inputEncoding = "base64",
  outputEncoding = "utf8",
  urlSafe = true,
}: {
  data: string;
  inputEncoding?: OutputEncoding;
  outputEncoding?: InputEncoding;
  urlSafe?: boolean;
}): Promise<string> => {
  const keyBytes = getKey();

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
  return uint8ArrayToString(
    new Uint8Array(decryptedBuffer),
    outputEncoding,
  );
};

export { decodeBase64, decrypt, encrypt, fromBase64URL, toBase64URL };

// deno-coverage-ignore-start
if (import.meta.main) {
  const [envFile, operation, data, inputEncoding, outputEncoding] = args;

  if (!envFile || !operation || !data) {
    console.error(`
Usage: deno run encryptAndDecrypt.ts <env-file> <operation> <data> [inputEncoding] [outputEncoding]

Operations:
  encrypt         Encrypt data (default: utf8 → base64url)
  decrypt         Decrypt data (default: base64url → utf8)
  decode-base64   Decode Base64/Base64URL to UTF-8
  encode-base64url Convert text to Base64URL

Input Encodings:
  utf8    UTF-8 text (default for encrypt)
  base64  Base64/Base64URL (default for decrypt)
  hex     Hexadecimal
  binary  Binary data

Output Encodings:
  base64  Base64URL (default for encrypt)
  hex     Hexadecimal
  binary  Binary data
  utf8    UTF-8 text (default for decrypt)

Examples:
  deno run encryptAndDecrypt.ts .env encrypt 'my password'                # UTF-8 → Base64URL
  deno run encryptAndDecrypt.ts .env encrypt 'deadbeef' hex base64        # Hex → Base64URL
  deno run encryptAndDecrypt.ts .env decrypt 'abc-123_' base64 utf8       # Base64URL → UTF-8
  deno run encryptAndDecrypt.ts .env encrypt '{"key":"value"}' utf8 hex   # UTF-8 → Hex
  deno run encryptAndDecrypt.ts .env encode-base64url 'Hello World!'      # Text → Base64URL

Note:
  - SECRET_KEY env var must be set (64 hex chars = 32 bytes)
  - SECRET_IV is no longer needed - IV is generated per encryption
`);
    exit(1);
  }

  // Load environment variables from the specified file
  await env.loadFromFile(envFile);
  console.log(`Loaded environment from: ${envFile}`);

  const secretKey = env.get("SECRET_KEY");
  console.log("SECRET_KEY present:", !!secretKey, "length:", secretKey?.length);

  try {
    if (operation.toLowerCase() === "encrypt") {
      const inEncoding = (inputEncoding || "utf8") as InputEncoding;
      const outEncoding = (outputEncoding || "base64") as OutputEncoding;

      encrypt({
        data,
        inputEncoding: inEncoding,
        outputEncoding: outEncoding,
        urlSafe: true,
      }).then((result) => {
        console.log(
          `\n✅ Encrypted result (${inEncoding} → ${outEncoding}, URL-safe):`,
        );
        console.log(result);
        console.log("\nSafe to use in .env file");
      }).catch((err) => {
        console.error("❌ Error:", err.message || String(err));
        exit(1);
      });
    } else if (operation.toLowerCase() === "decrypt") {
      const inEncoding = (inputEncoding || "base64") as OutputEncoding;
      const outEncoding = (outputEncoding || "utf8") as InputEncoding;

      decrypt({
        data,
        inputEncoding: inEncoding,
        outputEncoding: outEncoding,
      }).then((result) => {
        console.log(
          `\n✅ Decrypted result (${inEncoding} → ${outEncoding}):`,
        );
        console.log(result);
      }).catch((err) => {
        console.error("❌ Error:", err.message || String(err));
        exit(1);
      });
    } else if (operation.toLowerCase() === "decode-base64") {
      try {
        const decodedBytes = decodeBase64(data);
        const result = new TextDecoder().decode(decodedBytes);
        console.log("\n✅ Decoded Base64 result:");
        console.log(result);
      } catch (error) {
        console.error(
          "❌ Error:",
          error instanceof Error ? error.message : String(error),
        );
        exit(1);
      }
    } else if (operation.toLowerCase() === "encode-base64url") {
      try {
        const base64 = encodeBase64(new TextEncoder().encode(data));
        const result = toBase64URL(base64);
        console.log("\n✅ Base64URL encoded result:");
        console.log(result);
        console.log("\nSafe to use in .env file");
      } catch (error) {
        console.error(
          "❌ Error:",
          error instanceof Error ? error.message : String(error),
        );
        exit(1);
      }
    } else {
      console.error(
        "Invalid operation. Use 'encrypt', 'decrypt', 'decode-base64', or 'encode-base64url'",
      );
      exit(1);
    }
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : String(error),
    );
    exit(1);
  }
}
// deno-coverage-ignore-stop
