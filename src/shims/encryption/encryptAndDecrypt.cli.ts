// deno-coverage-ignore-file
import { currentRuntime, Runtime } from "../detect.ts";
import { env } from "../env.ts";
import { args, exit } from "../process.ts";
import { decrypt, encrypt } from "./encryptAndDecrypt.ts";
import { decodeBase64, encodeBase64, toBase64URL } from "./encodeAndDecode.ts";

type InputEncoding = "utf8" | "base64" | "hex" | "binary";
type OutputEncoding = "base64" | "hex" | "binary";

if (currentRuntime === Runtime.Deno && import.meta.main) {
  const [envFile, operation, data, inputEncoding, outputEncoding] = args;

  if (!envFile || !operation || !data) {
    console.error(`
Usage: deno run encryptAndDecrypt.cli.ts <env-file> <operation> <data> [inputEncoding] [outputEncoding]

Operations:
  encrypt         Encrypt data (default: utf8 → base64url)
  decrypt         Decrypt data (default: base64url → utf8)
  decode-base64   Decode Base64/Base64URL to UTF-8
  encode-base64url Convert text to Base64URL

Encodings (for inputEncoding and outputEncoding):
  utf8    UTF-8 text
  base64  Base64/Base64URL
  hex     Hexadecimal
  binary  Binary data

Defaults:
  encrypt: utf8 → base64 (plaintext in, encoded ciphertext out)
  decrypt: base64 → utf8 (encoded ciphertext in, plaintext out)

Examples:
  deno run encryptAndDecrypt.cli.ts .env encrypt 'my password'                # UTF-8 → Base64URL
  deno run encryptAndDecrypt.cli.ts .env encrypt 'deadbeef' hex base64        # Hex → Base64URL
  deno run encryptAndDecrypt.cli.ts .env decrypt 'abc-123_' base64 utf8       # Base64URL → UTF-8
  deno run encryptAndDecrypt.cli.ts .env encrypt '{"key":"value"}' utf8 hex   # UTF-8 → Hex
  deno run encryptAndDecrypt.cli.ts .env encode-base64url 'Hello World!'      # Text → Base64URL

Note:
  - SECRET_KEY env var must be set (64 hex chars = 32 bytes)
  - SECRET_IV is no longer needed - IV is generated per encryption
`);
    exit(1);
  }

  await env.loadFromFile(envFile);
  console.log(`Loaded environment from: ${envFile}`);

  const secretKey = env.get("SECRET_KEY");
  console.log("SECRET_KEY present:", !!secretKey, "length:", secretKey?.length);

  if (!secretKey) {
    console.error("Error: SECRET_KEY environment variable is not set");
    exit(1);
  }

  if (operation.toLowerCase() === "encrypt") {
    const inEncoding = (inputEncoding || "utf8") as InputEncoding;
    const outEncoding = (outputEncoding || "base64") as OutputEncoding;

    const result = await encrypt({
      key: secretKey,
      data,
      inputEncoding: inEncoding,
      outputEncoding: outEncoding,
      urlSafe: true,
    });

    if (result.ok) {
      console.log(
        `\nEncrypted result (${inEncoding} → ${outEncoding}, URL-safe):`,
      );
      console.log(result.value);
      console.log("\nSafe to use in .env file");
    } else {
      console.error("Error:", result.error.message);
      exit(1);
    }
  } else if (operation.toLowerCase() === "decrypt") {
    const inEncoding = (inputEncoding || "base64") as OutputEncoding;
    const outEncoding = (outputEncoding || "utf8") as InputEncoding;

    const result = await decrypt({
      key: secretKey,
      data,
      inputEncoding: inEncoding,
      outputEncoding: outEncoding,
    });

    if (result.ok) {
      console.log(
        `\nDecrypted result (${inEncoding} → ${outEncoding}):`,
      );
      console.log(result.value);
    } else {
      console.error("Error:", result.error.message);
      exit(1);
    }
  } else if (operation.toLowerCase() === "decode-base64") {
    try {
      const decodedBytes = decodeBase64(data);
      const result = new TextDecoder().decode(decodedBytes);
      console.log("\nDecoded Base64 result:");
      console.log(result);
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error),
      );
      exit(1);
    }
  } else if (operation.toLowerCase() === "encode-base64url") {
    try {
      const base64 = encodeBase64(new TextEncoder().encode(data));
      const result = toBase64URL(base64);
      console.log("\nBase64URL encoded result:");
      console.log(result);
      console.log("\nSafe to use in .env file");
    } catch (error) {
      console.error(
        "Error:",
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
}
