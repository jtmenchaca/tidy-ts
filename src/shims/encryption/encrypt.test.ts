// Import the encryption utilities
import { encodeHex } from "@std/encoding/hex";
import { expect } from "@std/expect";
import { generateKey } from "../encryption/generateKey.ts";
import {
  decrypt,
  encrypt,
  fromBase64URL,
  toBase64URL,
} from "../encryption/encryptAndDecrypt.ts";
import { env } from "../env.ts";
import { test } from "../test.ts";

// Setup function to initialize environment - only need SECRET_KEY now
function setupTestEnvironment() {
  env.set("SECRET_KEY", generateKey());
  console.log("=== Testing AES-256-GCM Encryption ===");
  console.log(`SECRET_KEY=${env.get("SECRET_KEY")}`);
  console.log("=====================================\n");
}

test("Basic encryption and decryption", async () => {
  setupTestEnvironment();

  console.log("Test: Basic encryption and decryption");
  const secretMessage = "This is a secret message";
  const encrypted = await encrypt({ data: secretMessage });
  console.log("Original:", secretMessage);
  console.log("Encrypted:", encrypted);
  const decrypted = await decrypt({ data: encrypted });
  console.log("Decrypted:", decrypted);

  expect(decrypted).toBe(secretMessage);
});

test("Using different encodings (hex)", async () => {
  setupTestEnvironment();

  console.log("Test: Using different encodings (hex)");
  const jsonData = JSON.stringify({ userId: 123, role: "admin" });
  console.log("Original JSON:", jsonData);

  // Encrypt to hex format
  const encryptedHex = await encrypt({
    data: jsonData,
    outputEncoding: "hex",
  });
  console.log("Encrypted (hex):", encryptedHex);

  // Decrypt from hex format
  const decryptedFromHex = await decrypt({
    data: encryptedHex,
    inputEncoding: "hex",
  });
  console.log("Decrypted JSON:", decryptedFromHex);
  console.log("Parsed:", JSON.parse(decryptedFromHex));

  expect(decryptedFromHex).toBe(jsonData);
});

test("Working with binary data", async () => {
  setupTestEnvironment();

  console.log("Test: Working with binary data");
  const originalBytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
  const binaryData = new TextDecoder().decode(originalBytes);
  console.log("Original bytes:", Array.from(originalBytes));

  // Encrypt binary data
  const encryptedBinary = await encrypt({
    data: binaryData,
    inputEncoding: "utf8",
    outputEncoding: "base64",
  });
  console.log("Encrypted (base64):", encryptedBinary);

  // Decrypt back to binary
  const decryptedBinary = await decrypt({
    data: encryptedBinary,
    outputEncoding: "utf8",
  });

  // Convert back to Uint8Array for verification
  const resultBytes = new TextEncoder().encode(decryptedBinary);
  console.log("Decrypted bytes:", Array.from(resultBytes));

  expect(JSON.stringify(Array.from(originalBytes))).toBe(
    JSON.stringify(Array.from(resultBytes)),
  );
});

test("Encrypting large data", async () => {
  setupTestEnvironment();

  console.log("Test: Encrypting large data");

  // Create 1MB of random data in chunks to avoid QuotaExceededError
  const CHUNK_SIZE = 65536; // 64KB chunks
  const TOTAL_SIZE = 1024 * 1024; // 1MB
  const largeDataArray = new Uint8Array(TOTAL_SIZE);

  // Fill the array in chunks
  for (let offset = 0; offset < TOTAL_SIZE; offset += CHUNK_SIZE) {
    const chunkSize = Math.min(CHUNK_SIZE, TOTAL_SIZE - offset);
    const chunk = new Uint8Array(chunkSize);
    crypto.getRandomValues(chunk);
    largeDataArray.set(chunk, offset);
  }

  const largeData = encodeHex(largeDataArray);
  console.log(`Original data size: ${largeData.length} bytes`);

  console.time("Encryption time");
  const encryptedLarge = await encrypt({ data: largeData });
  console.timeEnd("Encryption time");
  console.log(`Encrypted data size: ${encryptedLarge.length} bytes`);

  console.time("Decryption time");
  const decryptedLarge = await decrypt({ data: encryptedLarge });
  console.timeEnd("Decryption time");
  console.log(`Decrypted data size: ${decryptedLarge.length} bytes`);

  expect(decryptedLarge).toBe(largeData);
});

test("Multiple encryptions produce different ciphertexts but decrypt correctly", async () => {
  setupTestEnvironment();

  console.log("Test: Multiple encryptions of the same data");
  const sampleText = "Same text, different encryptions";

  // Encrypt the same data twice - should produce DIFFERENT ciphertexts
  // because each encryption generates a fresh random IV
  const firstEncryption = await encrypt({ data: sampleText });
  const secondEncryption = await encrypt({ data: sampleText });

  console.log("Original:", sampleText);
  console.log("First encryption:", firstEncryption);
  console.log("Second encryption:", secondEncryption);

  // Assert different ciphertexts (semantic security - random IV)
  expect(firstEncryption).not.toBe(secondEncryption);

  // Both should decrypt to the same original text
  const firstDecrypted = await decrypt({ data: firstEncryption });
  const secondDecrypted = await decrypt({ data: secondEncryption });

  console.log("Decrypted first:", firstDecrypted);
  console.log("Decrypted second:", secondDecrypted);

  expect(firstDecrypted).toBe(sampleText);
  expect(secondDecrypted).toBe(sampleText);
});

test("Real-world usage examples", async () => {
  setupTestEnvironment();
  console.log("\n=== Real-world Usage Examples ===\n");

  // Example 1: Encrypting sensitive user data
  console.log("Example 1: Encrypting sensitive user data");
  const userData = JSON.stringify({
    userId: "user_12345",
    email: "user@example.com",
    creditCard: {
      number: "4111111111111111",
      expiry: "12/25",
      cvv: "123",
    },
    address: {
      street: "123 Main St",
      city: "Anytown",
      zipCode: "12345",
    },
  });

  console.log("Original user data:", userData);

  // Encrypt sensitive data for database storage
  const encryptedUserData = await encrypt({ data: userData });
  console.log("\nEncrypted data to store in database:");
  console.log(encryptedUserData);

  // Later, when retrieving from database
  const retrievedUserData = await decrypt({ data: encryptedUserData });
  console.log("\nDecrypted data after retrieval:");
  console.log(retrievedUserData);
  console.log("\nParsed user profile:", JSON.parse(retrievedUserData));

  // Example 2: Encrypting with different encodings
  console.log("\nExample 2: Using different encodings");

  // Encrypt API key as hex (might be useful for certain systems)
  const apiKey = "sk_live_abcdef123456789";
  const encryptedHex = await encrypt({
    data: apiKey,
    outputEncoding: "hex",
  });
  console.log("API key encrypted as hex:");
  console.log(encryptedHex);

  // Decrypt from hex
  const decryptedApiKey = await decrypt({
    data: encryptedHex,
    inputEncoding: "hex",
  });
  console.log("Decrypted API key:", decryptedApiKey);

  // Example 3: Practical encryption of configuration data
  console.log("\nExample 3: Encrypting configuration");

  // Application might need to securely store connection strings
  const appConfig = {
    databaseUrl: "postgresql://user:password@db.example.com:5432/mydb",
    apiKeys: {
      stripe: "sk_live_example_stripe_key",
      sendgrid: "SG.example_sendgrid_key",
      aws: "AKIAIOSFODNN7EXAMPLE",
    },
    jwtSecret: "extremely_secret_jwt_signing_key",
  };

  // In production, encrypt each sensitive field individually
  const encryptedConfig = {
    databaseUrl: await encrypt({ data: appConfig.databaseUrl }),
    apiKeys: {
      stripe: await encrypt({ data: appConfig.apiKeys.stripe }),
      sendgrid: await encrypt({ data: appConfig.apiKeys.sendgrid }),
      aws: await encrypt({ data: appConfig.apiKeys.aws }),
    },
    jwtSecret: await encrypt({ data: appConfig.jwtSecret }),
  };

  console.log("Encrypted config for .env or config file storage:");
  console.log(JSON.stringify(encryptedConfig, null, 2));

  // Later, when app needs to use the config
  const decryptedDbUrl = await decrypt({ data: encryptedConfig.databaseUrl });
  console.log("\nDecrypted database URL for use in application:");
  console.log(decryptedDbUrl);

  // Example 4: Using binary data
  console.log("\nExample 4: Working with binary data");

  // For example, encrypting a small image or document
  const binaryData = new Uint8Array([
    0x89,
    0x50,
    0x4E,
    0x47,
    0x0D,
    0x0A,
    0x1A,
    0x0A,
  ]); // PNG header
  const binaryString = new TextDecoder().decode(binaryData);

  const encryptedBinary = await encrypt({
    data: binaryString,
    inputEncoding: "utf8",
    outputEncoding: "base64",
  });

  console.log("Encrypted binary data (base64):");
  console.log(encryptedBinary);

  // When retrieving and decrypting
  const decryptedBinaryString = await decrypt({
    data: encryptedBinary,
    outputEncoding: "utf8",
  });

  const restoredBinary = new TextEncoder().encode(decryptedBinaryString);
  console.log("Decrypted binary data:", Array.from(restoredBinary));
  console.log("Original binary data: ", Array.from(binaryData));
  console.log(
    "Binary data correctly restored:",
    JSON.stringify(Array.from(restoredBinary)) ===
      JSON.stringify(Array.from(binaryData)),
  );
});

// Additional tests for Base64URL conversion functions
test("toBase64URL - should convert + to -", () => {
  const input = "abc+def";
  const result = toBase64URL(input);
  expect(result).toBe("abc-def");
});

test("toBase64URL - should convert / to _", () => {
  const input = "abc/def";
  const result = toBase64URL(input);
  expect(result).toBe("abc_def");
});

test("toBase64URL - should remove padding", () => {
  const input = "YWJj==";
  const result = toBase64URL(input);
  expect(result).toBe("YWJj");
});

test("toBase64URL - should handle all conversions together", () => {
  const input = "a+b/c==";
  const result = toBase64URL(input);
  expect(result).toBe("a-b_c");
});

test("fromBase64URL - should convert - to + and add padding", () => {
  const input = "abc-def";
  const result = fromBase64URL(input);
  // 7 chars needs 1 padding char to make it divisible by 4
  expect(result).toBe("abc+def=");
});

test("fromBase64URL - should convert _ to / and add padding", () => {
  const input = "abc_def";
  const result = fromBase64URL(input);
  // 7 chars needs 1 padding char to make it divisible by 4
  expect(result).toBe("abc/def=");
});

test("fromBase64URL - should add padding for length % 4 == 2", () => {
  const input = "YW"; // length 2, needs 2 padding chars
  const result = fromBase64URL(input);
  expect(result).toBe("YW==");
});

test("fromBase64URL - should add padding for length % 4 == 3", () => {
  const input = "YWI"; // length 3, needs 1 padding char
  const result = fromBase64URL(input);
  expect(result).toBe("YWI=");
});

test("fromBase64URL - should not add padding for length % 4 == 0", () => {
  const input = "YWJj"; // length 4, no padding needed
  const result = fromBase64URL(input);
  expect(result).toBe("YWJj");
});

test("toBase64URL and fromBase64URL - should be reversible", () => {
  const original = "SGVsbG8gV29ybGQh"; // "Hello World!" in base64
  const urlSafe = toBase64URL(original);
  const backToOriginal = fromBase64URL(urlSafe);
  expect(backToOriginal).toBe(original);
});

test("encrypt with urlSafe false - should not convert to Base64URL", async () => {
  setupTestEnvironment();
  const data = "test data";
  const encrypted = await encrypt({
    data,
    outputEncoding: "base64",
    urlSafe: false,
  });

  // Standard base64 might contain + or / characters
  // The result should be valid base64 (can be decoded)
  const decoded = atob(encrypted);
  expect(decoded.length).toBeGreaterThan(0);
});

test("decrypt with urlSafe false - should not convert from Base64URL", async () => {
  setupTestEnvironment();
  const data = "test data for non-urlsafe";

  // First encrypt without urlSafe
  const encrypted = await encrypt({
    data,
    outputEncoding: "base64",
    urlSafe: false,
  });

  // Then decrypt without urlSafe
  const decrypted = await decrypt({
    data: encrypted,
    inputEncoding: "base64",
    urlSafe: false,
  });

  expect(decrypted).toBe(data);
});

test("encrypt and decrypt with binary encoding", async () => {
  setupTestEnvironment();
  const originalData = "binary test";

  // Encrypt to binary
  const encryptedBinary = await encrypt({
    data: originalData,
    outputEncoding: "binary",
  });

  // Decrypt from binary
  const decrypted = await decrypt({
    data: encryptedBinary,
    inputEncoding: "binary",
    outputEncoding: "utf8",
    urlSafe: false, // binary doesn't use base64
  });

  expect(decrypted).toBe(originalData);
});

test("encrypt with base64 input encoding", async () => {
  setupTestEnvironment();
  // Encode "hello" as base64
  const base64Input = btoa("hello");

  const encrypted = await encrypt({
    data: base64Input,
    inputEncoding: "base64",
    outputEncoding: "base64",
  });

  // Decrypt should give back the original bytes
  const decrypted = await decrypt({
    data: encrypted,
    outputEncoding: "base64",
  });

  // Decode to verify
  const decodedResult = atob(decrypted);
  expect(decodedResult).toBe("hello");
});

// Tests for error handling - missing environment variables
test("encrypt - should throw when SECRET_KEY is not set", async () => {
  // Clear environment
  env.set("SECRET_KEY", "");

  let errorThrown = false;
  try {
    await encrypt({ data: "test" });
  } catch (error) {
    errorThrown = true;
    expect((error as Error).message).toBe("SECRET_KEY is not set");
  }
  expect(errorThrown).toBe(true);

  // Restore environment for other tests
  setupTestEnvironment();
});

test("AES-GCM authentication - should reject tampered ciphertext", async () => {
  setupTestEnvironment();

  const originalData = "sensitive information";
  const encrypted = await encrypt({ data: originalData });

  // Tamper with the ciphertext (flip a bit in the middle)
  const tamperedEncrypted = encrypted.slice(0, 20) + "X" +
    encrypted.slice(21);

  let errorThrown = false;
  try {
    await decrypt({ data: tamperedEncrypted });
  } catch (_error) {
    errorThrown = true;
    // AES-GCM will throw an error when authentication fails
  }

  expect(errorThrown).toBe(true);
});
