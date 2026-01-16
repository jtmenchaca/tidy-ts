import type { DocEntry } from "../mcp-types.ts";

export const encryptionDocs: Record<string, DocEntry> = {
  encrypt: {
    name: "encrypt",
    category: "shims",
    signature:
      "encrypt({ key, data, inputEncoding?, outputEncoding?, urlSafe? }): Promise<Result<string, CryptoError>>",
    description:
      "Encrypts data using AES-256-GCM algorithm. Uses Web Crypto API with authenticated encryption. Each encryption generates a random 12-byte IV which is prepended to the ciphertext. Output format: IV (12 bytes) + Ciphertext + Auth Tag (16 bytes).",
    imports: [
      'import { encrypt } from "@tidy-ts/shims";',
    ],
    parameters: [
      "key: Hex-encoded 32-byte key (64 hex characters)",
      "data: The data to encrypt",
      "inputEncoding: Encoding of input ('utf8' | 'base64' | 'hex' | 'binary', default: 'utf8')",
      "outputEncoding: Encoding for output ('base64' | 'hex' | 'binary', default: 'base64')",
      "urlSafe: Whether to return Base64URL format (default: true)",
    ],
    returns: "Promise<Result<string, CryptoError>>",
    examples: [
      '// Basic encryption\nimport { encrypt, generateKey } from "@tidy-ts/shims";\n\nconst key = generateKey(); // 64 hex chars\nconst result = await encrypt({ key, data: "secret message" });\n\nif (result.ok) {\n  console.log(result.value); // Base64URL encoded ciphertext\n}',
      '// With specific encodings\nconst result = await encrypt({\n  key,\n  data: "secret",\n  inputEncoding: "utf8",\n  outputEncoding: "hex",\n  urlSafe: false,\n});',
    ],
    related: ["decrypt", "generateKey", "CryptoError"],
    bestPractices: [
      "✓ GOOD: Generate a new key with generateKey()",
      "✓ GOOD: Store encrypted data, not plain text",
      "✓ GOOD: Use urlSafe: true for URLs and filenames",
    ],
    antiPatterns: [
      "❌ BAD: Hardcoding keys in source code",
      "❌ BAD: Reusing IVs (this is handled automatically)",
    ],
  },

  decrypt: {
    name: "decrypt",
    category: "shims",
    signature:
      "decrypt({ key, data, inputEncoding?, outputEncoding?, urlSafe? }): Promise<Result<string, CryptoError>>",
    description:
      "Decrypts data that was encrypted using AES-256-GCM. Expects input format: IV (12 bytes) + Ciphertext + Auth Tag (16 bytes). Verifies authentication tag to ensure data integrity.",
    imports: [
      'import { decrypt } from "@tidy-ts/shims";',
    ],
    parameters: [
      "key: Hex-encoded 32-byte key (64 hex characters) - must match encryption key",
      "data: The encrypted data",
      "inputEncoding: Encoding of encrypted input ('base64' | 'hex' | 'binary', default: 'base64')",
      "outputEncoding: Encoding for decrypted output ('utf8' | 'base64' | 'hex' | 'binary', default: 'utf8')",
      "urlSafe: Whether input is Base64URL format (default: true)",
    ],
    returns: "Promise<Result<string, CryptoError>>",
    examples: [
      '// Basic decryption\nimport { decrypt } from "@tidy-ts/shims";\n\nconst result = await decrypt({ key, data: encryptedData });\n\nif (result.ok) {\n  console.log(result.value); // "secret message"\n} else {\n  console.error(result.error.message);\n}',
      '// Handle decryption errors\nconst result = await decrypt({ key, data: encryptedData });\n\nif (!result.ok) {\n  if (result.error instanceof DecryptionError) {\n    // Authentication failed or corrupted data\n    console.error("Decryption failed:", result.error.message);\n  } else if (result.error instanceof InvalidKeyError) {\n    console.error("Invalid key:", result.error.reason);\n  }\n}',
    ],
    related: ["encrypt", "generateKey", "CryptoError", "DecryptionError"],
    bestPractices: [
      "✓ GOOD: Handle DecryptionError for corrupted or tampered data",
      "✓ GOOD: Handle InvalidKeyError for malformed keys",
    ],
    antiPatterns: [
      "❌ BAD: Ignoring decryption errors",
    ],
  },

  generateKey: {
    name: "generateKey",
    category: "shims",
    signature: "generateKey(length?: number): string",
    description:
      "Generates a cryptographically secure random key for AES-256-GCM encryption. Uses Web Crypto API (crypto.getRandomValues) for secure randomness. Returns key as hexadecimal string.",
    imports: [
      'import { generateKey } from "@tidy-ts/shims";',
    ],
    parameters: [
      "length: Number of bytes (default: 32 for AES-256-GCM)",
    ],
    returns: "string - Hexadecimal encoded key (64 hex chars for 32 bytes)",
    examples: [
      '// Generate 256-bit key (default)\nimport { generateKey } from "@tidy-ts/shims";\n\nconst key = generateKey();\nconsole.log(key); // 64 hex characters',
      "// Generate 128-bit key\nconst key128 = generateKey(16);\nconsole.log(key128); // 32 hex characters",
      "// Store key securely\nconst key = generateKey();\nprocess.env.ENCRYPTION_KEY = key; // Store in env",
    ],
    related: ["encrypt", "decrypt"],
    bestPractices: [
      "✓ GOOD: Generate keys at deployment time, not in code",
      "✓ GOOD: Store keys in environment variables or secrets manager",
      "✓ GOOD: Use 32 bytes (256 bits) for AES-256-GCM",
    ],
    antiPatterns: [
      "❌ BAD: Committing keys to source control",
      "❌ BAD: Generating keys at runtime for persistent encryption",
    ],
  },

  encryptFields: {
    name: "encryptFields",
    category: "shims",
    signature:
      "encryptFields<T>({ fields, masterKey, masterKeyId }): Promise<Result<{ encrypted: T; dek: string }, EnvelopeError | InvalidKeyIdError>>",
    description:
      "Envelope encryption: encrypts multiple fields with a freshly generated DEK (Data Encryption Key), then encrypts the DEK with the master key. The DEK is prefixed with masterKeyId for self-describing decryption. Pattern: Data encrypted with random DEK, DEK encrypted with master key.",
    imports: [
      'import { encryptFields } from "@tidy-ts/shims";',
    ],
    parameters: [
      "fields: Object with string or null values to encrypt",
      "masterKey: Hex-encoded 32-byte master key",
      "masterKeyId: Identifier for the master key (cannot contain colons)",
    ],
    returns:
      "Promise<Result<{ encrypted: TransformedFields<T>; dek: string }, EnvelopeEncryptionError | InvalidKeyIdError>>",
    examples: [
      '// Encrypt user PII\nimport { encryptFields, generateKey } from "@tidy-ts/shims";\n\nconst masterKey = generateKey();\nconst masterKeyId = "mk_v1";\n\nconst result = await encryptFields({\n  fields: {\n    ssn: "123-45-6789",\n    email: "user@example.com",\n    name: null, // null values preserved\n  },\n  masterKey,\n  masterKeyId,\n});\n\nif (result.ok) {\n  // Store encrypted fields and DEK together\n  await db.insert({\n    ...result.value.encrypted,\n    dek: result.value.dek, // "mk_v1:encryptedDEK..."\n  });\n}',
    ],
    related: ["decryptFields", "rotateMasterKey", "EnvelopeEncryptionError"],
    bestPractices: [
      "✓ GOOD: Use envelope encryption for per-record encryption",
      "✓ GOOD: Store DEK alongside encrypted data",
      "✓ GOOD: Use descriptive masterKeyId for key versioning",
    ],
  },

  decryptFields: {
    name: "decryptFields",
    category: "shims",
    signature:
      "decryptFields<T>({ fields, dek, getMasterKey }): Promise<Result<T, EnvelopeDecryptionError | KeyNotFoundError>>",
    description:
      "Decrypts fields using envelope encryption. The DEK is self-describing (contains masterKeyId prefix). Calls getMasterKey callback to retrieve the appropriate master key, then decrypts DEK, then decrypts each field.",
    imports: [
      'import { decryptFields } from "@tidy-ts/shims";',
    ],
    parameters: [
      "fields: Object with encrypted string or null values",
      "dek: Self-describing encrypted DEK (format: 'masterKeyId:encryptedDek')",
      "getMasterKey: Callback to retrieve master key by its ID",
    ],
    returns:
      "Promise<Result<TransformedFields<T>, EnvelopeDecryptionError | KeyNotFoundError>>",
    examples: [
      '// Decrypt user PII\nimport { decryptFields } from "@tidy-ts/shims";\n\nconst masterKeys = {\n  mk_v1: process.env.MASTER_KEY_V1!,\n  mk_v2: process.env.MASTER_KEY_V2!,\n};\n\nconst result = await decryptFields({\n  fields: record.encrypted,\n  dek: record.dek,\n  getMasterKey: (keyId) => masterKeys[keyId],\n});\n\nif (result.ok) {\n  console.log(result.value.ssn); // "123-45-6789"\n  console.log(result.value.email); // "user@example.com"\n}',
    ],
    related: ["encryptFields", "rotateMasterKey", "KeyNotFoundError"],
    bestPractices: [
      "✓ GOOD: Support multiple masterKeyIds for key rotation",
      "✓ GOOD: Throw in getMasterKey if key not found (will be wrapped in KeyNotFoundError)",
    ],
  },

  rotateMasterKey: {
    name: "rotateMasterKey",
    category: "shims",
    signature:
      "rotateMasterKey({ dek, newMasterKey, newMasterKeyId, getMasterKey }): Promise<Result<string, EnvelopeError | InvalidKeyIdError | KeyNotFoundError>>",
    description:
      "Re-encrypts a DEK from old master key to new master key. The underlying data remains unchanged - only the DEK wrapper is updated. Use for master key rotation without re-encrypting all data.",
    imports: [
      'import { rotateMasterKey } from "@tidy-ts/shims";',
    ],
    parameters: [
      "dek: Self-describing encrypted DEK (format: 'masterKeyId:encryptedDek')",
      "newMasterKey: Hex-encoded 32-byte new master key",
      "newMasterKeyId: Key ID for the new master key",
      "getMasterKey: Callback to retrieve old master key by its ID",
    ],
    returns:
      "Promise<Result<string, EnvelopeError | InvalidKeyIdError | KeyNotFoundError>> - New DEK string",
    examples: [
      '// Rotate master key for a record\nimport { rotateMasterKey } from "@tidy-ts/shims";\n\nconst result = await rotateMasterKey({\n  dek: record.dek, // "mk_v1:encryptedDEK..."\n  newMasterKey: process.env.MASTER_KEY_V2!,\n  newMasterKeyId: "mk_v2",\n  getMasterKey: (keyId) => masterKeys[keyId],\n});\n\nif (result.ok) {\n  // Update only the DEK, encrypted data unchanged\n  await db.update(record.id, { dek: result.value });\n  // New DEK: "mk_v2:encryptedDEK..."\n}',
    ],
    related: ["encryptFields", "decryptFields"],
    bestPractices: [
      "✓ GOOD: Rotate master keys periodically",
      "✓ GOOD: Keep old master keys available until all DEKs rotated",
      "✓ GOOD: Batch rotate DEKs during low-traffic periods",
    ],
  },

  CryptoError: {
    name: "CryptoError",
    category: "shims",
    signature:
      "type CryptoError = InvalidKeyError | EncryptionError | DecryptionError",
    description:
      "Union of all basic encryption error types. Use instanceof to narrow to specific error types.",
    imports: [
      'import type { CryptoError } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "Discriminated union of crypto error types",
    examples: [
      '// Handle crypto errors\nimport { encrypt, InvalidKeyError, EncryptionError } from "@tidy-ts/shims";\n\nconst result = await encrypt({ key, data });\n\nif (!result.ok) {\n  if (result.error instanceof InvalidKeyError) {\n    console.error("Bad key:", result.error.reason);\n  } else if (result.error instanceof EncryptionError) {\n    console.error("Encryption failed:", result.error.message);\n  }\n}',
    ],
    related: ["InvalidKeyError", "EncryptionError", "DecryptionError"],
    bestPractices: [
      "✓ GOOD: Use instanceof to narrow error types",
    ],
  },

  InvalidKeyError: {
    name: "InvalidKeyError",
    category: "shims",
    signature: "class InvalidKeyError extends Error { reason: string }",
    description:
      "Encryption key is invalid. Thrown when key is not 64 hex characters (32 bytes) or contains invalid characters.",
    imports: [
      'import { InvalidKeyError } from "@tidy-ts/shims";',
    ],
    parameters: [
      "reason: Description of why key is invalid",
    ],
    returns: "InvalidKeyError instance",
    examples: [
      '// Handle invalid key\nif (result.error instanceof InvalidKeyError) {\n  console.error("Invalid key:", result.error.reason);\n  // "Expected 32 bytes (64 hex chars), got 16 bytes"\n}',
    ],
    related: ["CryptoError", "generateKey"],
    bestPractices: [
      "✓ GOOD: Validate keys before use with generateKey()",
    ],
  },

  EncryptionError: {
    name: "EncryptionError",
    category: "shims",
    signature: "class EncryptionError extends Error { cause?: Error }",
    description:
      "Encryption operation failed. Contains the underlying error as cause.",
    imports: [
      'import { EncryptionError } from "@tidy-ts/shims";',
    ],
    parameters: [
      "message: Error description",
      "cause: Underlying error (optional)",
    ],
    returns: "EncryptionError instance",
    examples: [
      '// Handle encryption error\nif (result.error instanceof EncryptionError) {\n  console.error("Encryption failed:", result.error.message);\n  console.error("Cause:", result.error.cause);\n}',
    ],
    related: ["CryptoError", "encrypt"],
    bestPractices: [],
  },

  DecryptionError: {
    name: "DecryptionError",
    category: "shims",
    signature: "class DecryptionError extends Error { cause?: Error }",
    description:
      "Decryption operation failed. Typically means wrong key, corrupted data, or tampered ciphertext (authentication tag verification failed).",
    imports: [
      'import { DecryptionError } from "@tidy-ts/shims";',
    ],
    parameters: [
      "message: Error description",
      "cause: Underlying error (optional)",
    ],
    returns: "DecryptionError instance",
    examples: [
      '// Handle decryption error\nif (result.error instanceof DecryptionError) {\n  // Could be wrong key or tampered data\n  console.error("Decryption failed:", result.error.message);\n}',
    ],
    related: ["CryptoError", "decrypt"],
    bestPractices: [
      "✓ GOOD: Treat decryption failure as potential tampering",
    ],
  },

  EnvelopeEncryptionError: {
    name: "EnvelopeEncryptionError",
    category: "shims",
    signature: "class EnvelopeEncryptionError extends Error { field?: string }",
    description:
      "Envelope encryption failed. May include which field failed to encrypt.",
    imports: [
      'import { EnvelopeEncryptionError } from "@tidy-ts/shims";',
    ],
    parameters: [
      "message: Error description",
      "field: The field that failed (optional)",
    ],
    returns: "EnvelopeEncryptionError instance",
    examples: [
      "// Handle field encryption error\nif (result.error instanceof EnvelopeEncryptionError) {\n  if (result.error.field) {\n    console.error(`Failed to encrypt field: ${result.error.field}`);\n  }\n}",
    ],
    related: ["encryptFields", "EnvelopeError"],
    bestPractices: [],
  },

  EnvelopeDecryptionError: {
    name: "EnvelopeDecryptionError",
    category: "shims",
    signature: "class EnvelopeDecryptionError extends Error { field?: string }",
    description:
      "Envelope decryption failed. May include which field failed to decrypt.",
    imports: [
      'import { EnvelopeDecryptionError } from "@tidy-ts/shims";',
    ],
    parameters: [
      "message: Error description",
      "field: The field that failed (optional)",
    ],
    returns: "EnvelopeDecryptionError instance",
    examples: [
      "// Handle field decryption error\nif (result.error instanceof EnvelopeDecryptionError) {\n  if (result.error.field) {\n    console.error(`Failed to decrypt field: ${result.error.field}`);\n  }\n}",
    ],
    related: ["decryptFields", "EnvelopeError"],
    bestPractices: [],
  },

  KeyNotFoundError: {
    name: "KeyNotFoundError",
    category: "shims",
    signature:
      "class KeyNotFoundError extends Error { keyId: string; cause?: Error }",
    description:
      "Master key not found for the given key ID. Thrown when getMasterKey callback fails or returns empty.",
    imports: [
      'import { KeyNotFoundError } from "@tidy-ts/shims";',
    ],
    parameters: [
      "keyId: The master key ID that was not found",
      "cause: Underlying error (optional)",
    ],
    returns: "KeyNotFoundError instance",
    examples: [
      "// Handle missing master key\nif (result.error instanceof KeyNotFoundError) {\n  console.error(`Master key not found: ${result.error.keyId}`);\n  // May need to restore from backup or rotate\n}",
    ],
    related: ["decryptFields", "rotateMasterKey"],
    bestPractices: [
      "✓ GOOD: Keep master keys for old keyIds until all data rotated",
    ],
  },

  toBase64URL: {
    name: "toBase64URL",
    category: "shims",
    signature: "toBase64URL(base64: string): string",
    description:
      "Convert standard Base64 to URL-safe Base64 (Base64URL). Replaces + with -, / with _, and removes = padding.",
    imports: [
      'import { toBase64URL } from "@tidy-ts/shims";',
    ],
    parameters: [
      "base64: Standard Base64 encoded string",
    ],
    returns: "string - Base64URL encoded string",
    examples: [
      '// Convert to URL-safe\nimport { toBase64URL } from "@tidy-ts/shims";\n\nconst urlSafe = toBase64URL("SGVsbG8rV29ybGQv");\n// "SGVsbG8tV29ybGRf"',
    ],
    related: ["fromBase64URL", "encrypt"],
    bestPractices: [
      "✓ GOOD: Use for URLs, filenames, and data URIs",
    ],
  },

  fromBase64URL: {
    name: "fromBase64URL",
    category: "shims",
    signature: "fromBase64URL(base64url: string): string",
    description:
      "Convert URL-safe Base64 (Base64URL) back to standard Base64. Replaces - with +, _ with /, and restores = padding.",
    imports: [
      'import { fromBase64URL } from "@tidy-ts/shims";',
    ],
    parameters: [
      "base64url: Base64URL encoded string",
    ],
    returns: "string - Standard Base64 encoded string",
    examples: [
      '// Convert from URL-safe\nimport { fromBase64URL } from "@tidy-ts/shims";\n\nconst standard = fromBase64URL("SGVsbG8tV29ybGRf");\n// "SGVsbG8rV29ybGQv"',
    ],
    related: ["toBase64URL", "decrypt"],
    bestPractices: [],
  },
};
