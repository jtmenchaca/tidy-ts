# Encryption

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [encrypt](#encrypt)
- [decrypt](#decrypt)
- [generateKey](#generatekey)
- [encryptFields](#encryptfields)
- [decryptFields](#decryptfields)
- [rotateMasterKey](#rotatemasterkey)
- [CryptoError](#cryptoerror)
- [InvalidKeyError](#invalidkeyerror)
- [EncryptionError](#encryptionerror)
- [DecryptionError](#decryptionerror)
- [EnvelopeEncryptionError](#envelopeencryptionerror)
- [EnvelopeDecryptionError](#envelopedecryptionerror)
- [KeyNotFoundError](#keynotfounderror)
- [toBase64URL](#tobase64url)
- [fromBase64URL](#frombase64url)

---

## encrypt

Encrypts data using AES-256-GCM algorithm. Uses Web Crypto API with authenticated encryption. Each encryption generates a random 12-byte IV which is prepended to the ciphertext. Output format: IV (12 bytes) + Ciphertext + Auth Tag (16 bytes).

### Signature

```typescript
encrypt({ key, data, inputEncoding?, outputEncoding?, urlSafe? }): Promise<Result<string, CryptoError>>
```

### Import

```typescript
import { encrypt } from "@tidy-ts/shims";
```

### Parameters

- key: Hex-encoded 32-byte key (64 hex characters)
- data: The data to encrypt
- inputEncoding: Encoding of input ('utf8' | 'base64' | 'hex' | 'binary', default: 'utf8')
- outputEncoding: Encoding for output ('base64' | 'hex' | 'binary', default: 'base64')
- urlSafe: Whether to return Base64URL format (default: true)

### Returns

Promise<Result<string, CryptoError>>

### Examples

```typescript
// Basic encryption
import { encrypt, generateKey } from "@tidy-ts/shims";

const key = generateKey(); // 64 hex chars
const result = await encrypt({ key, data: "secret message" });

if (result.ok) {
  console.log(result.value); // Base64URL encoded ciphertext
}
// With specific encodings
const result = await encrypt({
  key,
  data: "secret",
  inputEncoding: "utf8",
  outputEncoding: "hex",
  urlSafe: false,
});
```

### Best Practices

- ✓ GOOD: Generate a new key with generateKey()
- ✓ GOOD: Store encrypted data, not plain text
- ✓ GOOD: Use urlSafe: true for URLs and filenames

### Anti-patterns

- ❌ BAD: Hardcoding keys in source code
- ❌ BAD: Reusing IVs (this is handled automatically)

### Related

`decrypt`, `generateKey`, `CryptoError`

---

## decrypt

Decrypts data that was encrypted using AES-256-GCM. Expects input format: IV (12 bytes) + Ciphertext + Auth Tag (16 bytes). Verifies authentication tag to ensure data integrity.

### Signature

```typescript
decrypt({ key, data, inputEncoding?, outputEncoding?, urlSafe? }): Promise<Result<string, CryptoError>>
```

### Import

```typescript
import { decrypt } from "@tidy-ts/shims";
```

### Parameters

- key: Hex-encoded 32-byte key (64 hex characters) - must match encryption key
- data: The encrypted data
- inputEncoding: Encoding of encrypted input ('base64' | 'hex' | 'binary', default: 'base64')
- outputEncoding: Encoding for decrypted output ('utf8' | 'base64' | 'hex' | 'binary', default: 'utf8')
- urlSafe: Whether input is Base64URL format (default: true)

### Returns

Promise<Result<string, CryptoError>>

### Examples

```typescript
// Basic decryption
import { decrypt } from "@tidy-ts/shims";

const result = await decrypt({ key, data: encryptedData });

if (result.ok) {
  console.log(result.value); // "secret message"
} else {
  console.error(result.error.message);
}
// Handle decryption errors
const result = await decrypt({ key, data: encryptedData });

if (!result.ok) {
  if (result.error instanceof DecryptionError) {
    // Authentication failed or corrupted data
    console.error("Decryption failed:", result.error.message);
  } else if (result.error instanceof InvalidKeyError) {
    console.error("Invalid key:", result.error.reason);
  }
}
```

### Best Practices

- ✓ GOOD: Handle DecryptionError for corrupted or tampered data
- ✓ GOOD: Handle InvalidKeyError for malformed keys

### Anti-patterns

- ❌ BAD: Ignoring decryption errors

### Related

`encrypt`, `generateKey`, `CryptoError`, `DecryptionError`

---

## generateKey

Generates a cryptographically secure random key for AES-256-GCM encryption. Uses Web Crypto API (crypto.getRandomValues) for secure randomness. Returns key as hexadecimal string.

### Signature

```typescript
generateKey(length?: number): string
```

### Import

```typescript
import { generateKey } from "@tidy-ts/shims";
```

### Parameters

- length: Number of bytes (default: 32 for AES-256-GCM)

### Returns

string - Hexadecimal encoded key (64 hex chars for 32 bytes)

### Examples

```typescript
// Generate 256-bit key (default)
import { generateKey } from "@tidy-ts/shims";

const key = generateKey();
console.log(key); // 64 hex characters
// Generate 128-bit key
const key128 = generateKey(16);
console.log(key128); // 32 hex characters
// Store key securely
const key = generateKey();
process.env.ENCRYPTION_KEY = key; // Store in env
```

### Best Practices

- ✓ GOOD: Generate keys at deployment time, not in code
- ✓ GOOD: Store keys in environment variables or secrets manager
- ✓ GOOD: Use 32 bytes (256 bits) for AES-256-GCM

### Anti-patterns

- ❌ BAD: Committing keys to source control
- ❌ BAD: Generating keys at runtime for persistent encryption

### Related

`encrypt`, `decrypt`

---

## encryptFields

Envelope encryption: encrypts multiple fields with a freshly generated DEK (Data Encryption Key), then encrypts the DEK with the master key. The DEK is prefixed with masterKeyId for self-describing decryption. Pattern: Data encrypted with random DEK, DEK encrypted with master key.

### Signature

```typescript
encryptFields<T>({ fields, masterKey, masterKeyId }): Promise<Result<{ encrypted: T; dek: string }, EnvelopeError | InvalidKeyIdError>>
```

### Import

```typescript
import { encryptFields } from "@tidy-ts/shims";
```

### Parameters

- fields: Object with string or null values to encrypt
- masterKey: Hex-encoded 32-byte master key
- masterKeyId: Identifier for the master key (cannot contain colons)

### Returns

Promise<Result<{ encrypted: TransformedFields<T>; dek: string }, EnvelopeEncryptionError | InvalidKeyIdError>>

### Examples

```typescript
// Encrypt user PII
import { encryptFields, generateKey } from "@tidy-ts/shims";

const masterKey = generateKey();
const masterKeyId = "mk_v1";

const result = await encryptFields({
  fields: {
    ssn: "123-45-6789",
    email: "user@example.com",
    name: null, // null values preserved
  },
  masterKey,
  masterKeyId,
});

if (result.ok) {
  // Store encrypted fields and DEK together
  await db.insert({
    ...result.value.encrypted,
    dek: result.value.dek, // "mk_v1:encryptedDEK..."
  });
}
```

### Best Practices

- ✓ GOOD: Use envelope encryption for per-record encryption
- ✓ GOOD: Store DEK alongside encrypted data
- ✓ GOOD: Use descriptive masterKeyId for key versioning

### Related

`decryptFields`, `rotateMasterKey`, `EnvelopeEncryptionError`

---

## decryptFields

Decrypts fields using envelope encryption. The DEK is self-describing (contains masterKeyId prefix). Calls getMasterKey callback to retrieve the appropriate master key, then decrypts DEK, then decrypts each field.

### Signature

```typescript
decryptFields<T>({ fields, dek, getMasterKey }): Promise<Result<T, EnvelopeDecryptionError | KeyNotFoundError>>
```

### Import

```typescript
import { decryptFields } from "@tidy-ts/shims";
```

### Parameters

- fields: Object with encrypted string or null values
- dek: Self-describing encrypted DEK (format: 'masterKeyId:encryptedDek')
- getMasterKey: Callback to retrieve master key by its ID

### Returns

Promise<Result<TransformedFields<T>, EnvelopeDecryptionError | KeyNotFoundError>>

### Examples

```typescript
// Decrypt user PII
import { decryptFields } from "@tidy-ts/shims";

const masterKeys = {
  mk_v1: process.env.MASTER_KEY_V1!,
  mk_v2: process.env.MASTER_KEY_V2!,
};

const result = await decryptFields({
  fields: record.encrypted,
  dek: record.dek,
  getMasterKey: (keyId) => masterKeys[keyId],
});

if (result.ok) {
  console.log(result.value.ssn); // "123-45-6789"
  console.log(result.value.email); // "user@example.com"
}
```

### Best Practices

- ✓ GOOD: Support multiple masterKeyIds for key rotation
- ✓ GOOD: Throw in getMasterKey if key not found (will be wrapped in KeyNotFoundError)

### Related

`encryptFields`, `rotateMasterKey`, `KeyNotFoundError`

---

## rotateMasterKey

Re-encrypts a DEK from old master key to new master key. The underlying data remains unchanged - only the DEK wrapper is updated. Use for master key rotation without re-encrypting all data.

### Signature

```typescript
rotateMasterKey({ dek, newMasterKey, newMasterKeyId, getMasterKey }): Promise<Result<string, EnvelopeError | InvalidKeyIdError | KeyNotFoundError>>
```

### Import

```typescript
import { rotateMasterKey } from "@tidy-ts/shims";
```

### Parameters

- dek: Self-describing encrypted DEK (format: 'masterKeyId:encryptedDek')
- newMasterKey: Hex-encoded 32-byte new master key
- newMasterKeyId: Key ID for the new master key
- getMasterKey: Callback to retrieve old master key by its ID

### Returns

Promise<Result<string, EnvelopeError | InvalidKeyIdError | KeyNotFoundError>> - New DEK string

### Examples

```typescript
// Rotate master key for a record
import { rotateMasterKey } from "@tidy-ts/shims";

const result = await rotateMasterKey({
  dek: record.dek, // "mk_v1:encryptedDEK..."
  newMasterKey: process.env.MASTER_KEY_V2!,
  newMasterKeyId: "mk_v2",
  getMasterKey: (keyId) => masterKeys[keyId],
});

if (result.ok) {
  // Update only the DEK, encrypted data unchanged
  await db.update(record.id, { dek: result.value });
  // New DEK: "mk_v2:encryptedDEK..."
}
```

### Best Practices

- ✓ GOOD: Rotate master keys periodically
- ✓ GOOD: Keep old master keys available until all DEKs rotated
- ✓ GOOD: Batch rotate DEKs during low-traffic periods

### Related

`encryptFields`, `decryptFields`

---

## CryptoError

Union of all basic encryption error types. Use instanceof to narrow to specific error types.

### Signature

```typescript
type CryptoError = InvalidKeyError | EncryptionError | DecryptionError
```

### Import

```typescript
import type { CryptoError } from "@tidy-ts/shims";
```

### Returns

Discriminated union of crypto error types

### Examples

```typescript
// Handle crypto errors
import { encrypt, InvalidKeyError, EncryptionError } from "@tidy-ts/shims";

const result = await encrypt({ key, data });

if (!result.ok) {
  if (result.error instanceof InvalidKeyError) {
    console.error("Bad key:", result.error.reason);
  } else if (result.error instanceof EncryptionError) {
    console.error("Encryption failed:", result.error.message);
  }
}
```

### Best Practices

- ✓ GOOD: Use instanceof to narrow error types

### Related

`InvalidKeyError`, `EncryptionError`, `DecryptionError`

---

## InvalidKeyError

Encryption key is invalid. Thrown when key is not 64 hex characters (32 bytes) or contains invalid characters.

### Signature

```typescript
class InvalidKeyError extends Error { reason: string }
```

### Import

```typescript
import { InvalidKeyError } from "@tidy-ts/shims";
```

### Parameters

- reason: Description of why key is invalid

### Returns

InvalidKeyError instance

### Examples

```typescript
// Handle invalid key
if (result.error instanceof InvalidKeyError) {
  console.error("Invalid key:", result.error.reason);
  // "Expected 32 bytes (64 hex chars), got 16 bytes"
}
```

### Best Practices

- ✓ GOOD: Validate keys before use with generateKey()

### Related

`CryptoError`, `generateKey`

---

## EncryptionError

Encryption operation failed. Contains the underlying error as cause.

### Signature

```typescript
class EncryptionError extends Error { cause?: Error }
```

### Import

```typescript
import { EncryptionError } from "@tidy-ts/shims";
```

### Parameters

- message: Error description
- cause: Underlying error (optional)

### Returns

EncryptionError instance

### Examples

```typescript
// Handle encryption error
if (result.error instanceof EncryptionError) {
  console.error("Encryption failed:", result.error.message);
  console.error("Cause:", result.error.cause);
}
```

### Related

`CryptoError`, `encrypt`

---

## DecryptionError

Decryption operation failed. Typically means wrong key, corrupted data, or tampered ciphertext (authentication tag verification failed).

### Signature

```typescript
class DecryptionError extends Error { cause?: Error }
```

### Import

```typescript
import { DecryptionError } from "@tidy-ts/shims";
```

### Parameters

- message: Error description
- cause: Underlying error (optional)

### Returns

DecryptionError instance

### Examples

```typescript
// Handle decryption error
if (result.error instanceof DecryptionError) {
  // Could be wrong key or tampered data
  console.error("Decryption failed:", result.error.message);
}
```

### Best Practices

- ✓ GOOD: Treat decryption failure as potential tampering

### Related

`CryptoError`, `decrypt`

---

## EnvelopeEncryptionError

Envelope encryption failed. May include which field failed to encrypt.

### Signature

```typescript
class EnvelopeEncryptionError extends Error { field?: string }
```

### Import

```typescript
import { EnvelopeEncryptionError } from "@tidy-ts/shims";
```

### Parameters

- message: Error description
- field: The field that failed (optional)

### Returns

EnvelopeEncryptionError instance

### Examples

```typescript
// Handle field encryption error
if (result.error instanceof EnvelopeEncryptionError) {
  if (result.error.field) {
    console.error(`Failed to encrypt field: ${result.error.field}`);
  }
}
```

### Related

`encryptFields`, `EnvelopeError`

---

## EnvelopeDecryptionError

Envelope decryption failed. May include which field failed to decrypt.

### Signature

```typescript
class EnvelopeDecryptionError extends Error { field?: string }
```

### Import

```typescript
import { EnvelopeDecryptionError } from "@tidy-ts/shims";
```

### Parameters

- message: Error description
- field: The field that failed (optional)

### Returns

EnvelopeDecryptionError instance

### Examples

```typescript
// Handle field decryption error
if (result.error instanceof EnvelopeDecryptionError) {
  if (result.error.field) {
    console.error(`Failed to decrypt field: ${result.error.field}`);
  }
}
```

### Related

`decryptFields`, `EnvelopeError`

---

## KeyNotFoundError

Master key not found for the given key ID. Thrown when getMasterKey callback fails or returns empty.

### Signature

```typescript
class KeyNotFoundError extends Error { keyId: string; cause?: Error }
```

### Import

```typescript
import { KeyNotFoundError } from "@tidy-ts/shims";
```

### Parameters

- keyId: The master key ID that was not found
- cause: Underlying error (optional)

### Returns

KeyNotFoundError instance

### Examples

```typescript
// Handle missing master key
if (result.error instanceof KeyNotFoundError) {
  console.error(`Master key not found: ${result.error.keyId}`);
  // May need to restore from backup or rotate
}
```

### Best Practices

- ✓ GOOD: Keep master keys for old keyIds until all data rotated

### Related

`decryptFields`, `rotateMasterKey`

---

## toBase64URL

Convert standard Base64 to URL-safe Base64 (Base64URL). Replaces + with -, / with _, and removes = padding.

### Signature

```typescript
toBase64URL(base64: string): string
```

### Import

```typescript
import { toBase64URL } from "@tidy-ts/shims";
```

### Parameters

- base64: Standard Base64 encoded string

### Returns

string - Base64URL encoded string

### Examples

```typescript
// Convert to URL-safe
import { toBase64URL } from "@tidy-ts/shims";

const urlSafe = toBase64URL("SGVsbG8rV29ybGQv");
// "SGVsbG8tV29ybGRf"
```

### Best Practices

- ✓ GOOD: Use for URLs, filenames, and data URIs

### Related

`fromBase64URL`, `encrypt`

---

## fromBase64URL

Convert URL-safe Base64 (Base64URL) back to standard Base64. Replaces - with +, _ with /, and restores = padding.

### Signature

```typescript
fromBase64URL(base64url: string): string
```

### Import

```typescript
import { fromBase64URL } from "@tidy-ts/shims";
```

### Parameters

- base64url: Base64URL encoded string

### Returns

string - Standard Base64 encoded string

### Examples

```typescript
// Convert from URL-safe
import { fromBase64URL } from "@tidy-ts/shims";

const standard = fromBase64URL("SGVsbG8tV29ybGRf");
// "SGVsbG8rV29ybGQv"
```

### Related

`toBase64URL`, `decrypt`

---
