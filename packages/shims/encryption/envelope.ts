/**
 * Envelope Encryption Module
 *
 * Provides per-record DEK (Data Encryption Key) management with a master key hierarchy.
 * Each encryption generates a fresh DEK which is then encrypted with the master key.
 *
 * Pattern:
 * - Data is encrypted with a random DEK (AES-256-GCM)
 * - DEK is encrypted with the master key
 * - Both encrypted data and encrypted DEK are stored together
 */

import { type AppError, defineError, err, ok, type Result } from "../result.ts";
import { generateKey } from "./generateKey.ts";
import { decrypt, encrypt } from "./encryptAndDecrypt.ts";

// ============================================================================
// Error Types
// ============================================================================

type EnvelopeEncryptionErrorExtra = { message: string; field?: string };
export const EnvelopeEncryptionError: {
  new (extra: EnvelopeEncryptionErrorExtra): AppError<
    "EnvelopeEncryptionError",
    EnvelopeEncryptionErrorExtra
  >;
} = defineError(
  "EnvelopeEncryptionError",
  ({ message, field }: EnvelopeEncryptionErrorExtra) =>
    field
      ? `Envelope encryption failed for field '${field}': ${message}`
      : `Envelope encryption failed: ${message}`,
);
export type EnvelopeEncryptionError = AppError<
  "EnvelopeEncryptionError",
  EnvelopeEncryptionErrorExtra
>;

type EnvelopeDecryptionErrorExtra = { message: string; field?: string };
export const EnvelopeDecryptionError: {
  new (extra: EnvelopeDecryptionErrorExtra): AppError<
    "EnvelopeDecryptionError",
    EnvelopeDecryptionErrorExtra
  >;
} = defineError(
  "EnvelopeDecryptionError",
  ({ message, field }: EnvelopeDecryptionErrorExtra) =>
    field
      ? `Envelope decryption failed for field '${field}': ${message}`
      : `Envelope decryption failed: ${message}`,
);
export type EnvelopeDecryptionError = AppError<
  "EnvelopeDecryptionError",
  EnvelopeDecryptionErrorExtra
>;

export type EnvelopeError = EnvelopeEncryptionError | EnvelopeDecryptionError;

type InvalidKeyIdErrorExtra = { keyId: string; reason: string };
export const InvalidKeyIdError: {
  new (extra: InvalidKeyIdErrorExtra): AppError<
    "InvalidKeyIdError",
    InvalidKeyIdErrorExtra
  >;
} = defineError(
  "InvalidKeyIdError",
  ({ keyId, reason }: InvalidKeyIdErrorExtra) =>
    `Invalid key ID '${keyId}': ${reason}`,
);
export type InvalidKeyIdError = AppError<
  "InvalidKeyIdError",
  InvalidKeyIdErrorExtra
>;

type KeyNotFoundErrorExtra = { keyId: string; cause?: Error };
export const KeyNotFoundError: {
  new (extra: KeyNotFoundErrorExtra): AppError<
    "KeyNotFoundError",
    KeyNotFoundErrorExtra
  >;
} = defineError(
  "KeyNotFoundError",
  ({ keyId }: KeyNotFoundErrorExtra) =>
    `Master key not found for key ID '${keyId}'`,
);
export type KeyNotFoundError = AppError<
  "KeyNotFoundError",
  KeyNotFoundErrorExtra
>;

// ============================================================================
// Key ID Helpers
// ============================================================================

const KEY_ID_DELIMITER = ":";

/**
 * Validates a masterKeyId. Must be non-empty and contain no colons.
 */
function validateKeyId({
  masterKeyId,
}: {
  masterKeyId: string;
}): Result<string, InvalidKeyIdError> {
  if (!masterKeyId || masterKeyId.length === 0) {
    return err(
      new InvalidKeyIdError({
        keyId: masterKeyId,
        reason: "Key ID cannot be empty",
      }),
    );
  }
  if (masterKeyId.includes(KEY_ID_DELIMITER)) {
    return err(
      new InvalidKeyIdError({
        keyId: masterKeyId,
        reason: `Key ID cannot contain '${KEY_ID_DELIMITER}'`,
      }),
    );
  }
  return ok(masterKeyId);
}

/**
 * Parses a prefixed DEK string into masterKeyId and encrypted payload.
 * Format: "masterKeyId:encryptedPayload"
 */
function parsePrefixedDek({
  dek,
}: {
  dek: string;
}): Result<{ masterKeyId: string; payload: string }, EnvelopeDecryptionError> {
  const delimiterIndex = dek.indexOf(KEY_ID_DELIMITER);
  if (delimiterIndex === -1) {
    return err(
      new EnvelopeDecryptionError({
        message:
          `Invalid DEK format (expected 'masterKeyId${KEY_ID_DELIMITER}payload')`,
      }),
    );
  }
  const masterKeyId = dek.slice(0, delimiterIndex);
  const payload = dek.slice(delimiterIndex + 1);
  if (!masterKeyId) {
    return err(
      new EnvelopeDecryptionError({
        message: "Invalid DEK format: empty masterKeyId",
      }),
    );
  }
  if (!payload) {
    return err(
      new EnvelopeDecryptionError({
        message: "Invalid DEK format: empty payload",
      }),
    );
  }
  return ok({ masterKeyId, payload });
}

/**
 * Creates a prefixed DEK string from masterKeyId and encrypted payload.
 */
function createPrefixedDek({
  masterKeyId,
  payload,
}: {
  masterKeyId: string;
  payload: string;
}): string {
  return `${masterKeyId}${KEY_ID_DELIMITER}${payload}`;
}

/**
 * Safely calls getMasterKey and wraps any thrown error in a Result.
 */
function safeGetMasterKey({
  getMasterKey,
  masterKeyId,
}: {
  getMasterKey: (masterKeyId: string) => string;
  masterKeyId: string;
}): Result<string, KeyNotFoundError> {
  try {
    const key = getMasterKey(masterKeyId);
    if (!key) {
      return err(new KeyNotFoundError({ keyId: masterKeyId }));
    }
    return ok(key);
  } catch (e) {
    const cause = e instanceof Error ? e : new Error(String(e));
    return err(new KeyNotFoundError({ keyId: masterKeyId, cause }));
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

/** Input fields for encryption - string values or null */
type EncryptableFields = Record<string, string | null>;

/** Maps input type to output type, preserving null (used for both encrypted and decrypted results) */
type TransformedFields<T extends EncryptableFields> = {
  [K in keyof T]: T[K] extends null ? null : string;
};

/** Result of encrypting fields */
type EncryptFieldsResult<T extends EncryptableFields> = {
  encrypted: TransformedFields<T>;
  dek: string;
};

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Encrypts multiple fields with a freshly generated DEK, then encrypts the DEK with the master key.
 * The DEK is prefixed with the masterKeyId for self-describing decryption.
 *
 * @param fields - Object with string or null values to encrypt
 * @param masterKey - Hex-encoded 32-byte master key
 * @param masterKeyId - Identifier for the master key (cannot contain colons)
 * @returns Result with encrypted fields and self-describing encrypted DEK (format: "masterKeyId:encryptedDek")
 */
export async function encryptFields<T extends EncryptableFields>({
  fields,
  masterKey,
  masterKeyId,
}: {
  fields: T;
  masterKey: string;
  masterKeyId: string;
}): Promise<
  Result<EncryptFieldsResult<T>, EnvelopeEncryptionError | InvalidKeyIdError>
> {
  // Validate masterKeyId
  const keyIdResult = validateKeyId({ masterKeyId });
  if (!keyIdResult.ok) {
    return keyIdResult;
  }

  // Generate fresh DEK for this encryption
  const dek = generateKey();

  // Encrypt each non-null field with the DEK
  const encrypted = {} as TransformedFields<T>;

  for (const [key, value] of Object.entries(fields)) {
    if (value === null) {
      (encrypted as Record<string, string | null>)[key] = null;
      continue;
    }

    const result = await encrypt({ key: dek, data: value });
    if (!result.ok) {
      return err(
        new EnvelopeEncryptionError({
          message: result.error.message,
          field: key,
        }),
      );
    }
    (encrypted as Record<string, string | null>)[key] = result.value;
  }

  // Encrypt the DEK with the master key
  const dekResult = await encrypt({ key: masterKey, data: dek });
  if (!dekResult.ok) {
    return err(
      new EnvelopeEncryptionError({
        message: `Failed to encrypt DEK: ${dekResult.error.message}`,
      }),
    );
  }

  // Prefix the encrypted DEK with masterKeyId for self-describing decryption
  const prefixedDek = createPrefixedDek({
    masterKeyId,
    payload: dekResult.value,
  });

  return ok({ encrypted, dek: prefixedDek });
}

/**
 * Decrypts the DEK with master key, then decrypts specified fields.
 * The DEK is self-describing and contains the masterKeyId prefix.
 *
 * @param fields - Object with encrypted string or null values
 * @param dek - Self-describing encrypted DEK (format: "masterKeyId:encryptedDek")
 * @param getMasterKey - Callback to retrieve master key by its ID
 * @returns Result with decrypted fields
 */
export async function decryptFields<T extends EncryptableFields>({
  fields,
  dek,
  getMasterKey,
}: {
  fields: T;
  dek: string;
  getMasterKey: (masterKeyId: string) => string;
}): Promise<
  Result<TransformedFields<T>, EnvelopeDecryptionError | KeyNotFoundError>
> {
  // Parse the prefixed DEK to extract masterKeyId and payload
  const parseResult = parsePrefixedDek({ dek });
  if (!parseResult.ok) {
    return parseResult;
  }
  const { masterKeyId, payload } = parseResult.value;

  // Get the master key for this masterKeyId
  const masterKeyResult = safeGetMasterKey({ getMasterKey, masterKeyId });
  if (!masterKeyResult.ok) {
    return masterKeyResult;
  }
  const masterKey = masterKeyResult.value;

  // Decrypt the DEK with the master key
  const dekResult = await decrypt({ key: masterKey, data: payload });
  if (!dekResult.ok) {
    return err(
      new EnvelopeDecryptionError({
        message: `Failed to decrypt DEK: ${dekResult.error.message}`,
      }),
    );
  }
  const decryptedDek = dekResult.value;

  // Decrypt each non-null field with the DEK
  const decrypted = {} as TransformedFields<T>;

  for (const [key, value] of Object.entries(fields)) {
    if (value === null) {
      (decrypted as Record<string, string | null>)[key] = null;
      continue;
    }

    const result = await decrypt({ key: decryptedDek, data: value });
    if (!result.ok) {
      return err(
        new EnvelopeDecryptionError({
          message: result.error.message,
          field: key,
        }),
      );
    }
    (decrypted as Record<string, string | null>)[key] = result.value;
  }

  return ok(decrypted);
}

/**
 * Re-encrypts a DEK from old master key to new master key.
 * The underlying data remains unchanged - only the DEK wrapper is updated.
 *
 * @param dek - Self-describing encrypted DEK (format: "masterKeyId:encryptedDek")
 * @param newMasterKey - Hex-encoded 32-byte new master key
 * @param newMasterKeyId - Key ID for the new master key
 * @param getMasterKey - Callback to retrieve old master key by its ID
 * @returns Result with DEK encrypted under new master key (format: "newMasterKeyId:encryptedDek")
 */
export async function rotateMasterKey({
  dek,
  newMasterKey,
  newMasterKeyId,
  getMasterKey,
}: {
  dek: string;
  newMasterKey: string;
  newMasterKeyId: string;
  getMasterKey: (masterKeyId: string) => string;
}): Promise<
  Result<
    string,
    | EnvelopeDecryptionError
    | EnvelopeEncryptionError
    | KeyNotFoundError
    | InvalidKeyIdError
  >
> {
  // Validate new masterKeyId
  const keyIdResult = validateKeyId({ masterKeyId: newMasterKeyId });
  if (!keyIdResult.ok) {
    return keyIdResult;
  }

  // Parse the prefixed DEK to extract old masterKeyId and payload
  const parseResult = parsePrefixedDek({ dek });
  if (!parseResult.ok) {
    return parseResult;
  }
  const { masterKeyId: oldMasterKeyId, payload } = parseResult.value;

  // Get the old master key
  const oldMasterKeyResult = safeGetMasterKey({
    getMasterKey,
    masterKeyId: oldMasterKeyId,
  });
  if (!oldMasterKeyResult.ok) {
    return oldMasterKeyResult;
  }
  const oldMasterKey = oldMasterKeyResult.value;

  // Decrypt DEK with old master key
  const dekResult = await decrypt({ key: oldMasterKey, data: payload });
  if (!dekResult.ok) {
    return err(
      new EnvelopeDecryptionError({
        message:
          `Failed to decrypt DEK with old master key: ${dekResult.error.message}`,
      }),
    );
  }
  const rawDek = dekResult.value;

  // Re-encrypt DEK with new master key
  const newDekResult = await encrypt({ key: newMasterKey, data: rawDek });
  if (!newDekResult.ok) {
    return err(
      new EnvelopeEncryptionError({
        message:
          `Failed to encrypt DEK with new master key: ${newDekResult.error.message}`,
      }),
    );
  }

  // Prefix with new masterKeyId
  return ok(
    createPrefixedDek({
      masterKeyId: newMasterKeyId,
      payload: newDekResult.value,
    }),
  );
}
