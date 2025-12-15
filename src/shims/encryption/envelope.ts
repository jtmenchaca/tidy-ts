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

// ============================================================================
// Type Definitions
// ============================================================================

/** Input fields for encryption - string values or null */
type EncryptableFields = Record<string, string | null>;

/** Maps input type to output type, preserving null */
type EncryptedFields<T extends EncryptableFields> = {
  [K in keyof T]: T[K] extends null ? null : string;
};

/** Result of encrypting fields */
type EncryptFieldsResult<T extends EncryptableFields> = {
  encrypted: EncryptedFields<T>;
  dek: string;
};

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Encrypts multiple fields with a freshly generated DEK, then encrypts the DEK with the master key.
 *
 * @param fields - Object with string or null values to encrypt
 * @param masterKey - Hex-encoded 32-byte master key
 * @returns Result with encrypted fields and encrypted DEK
 */
export async function encryptFields<T extends EncryptableFields>({
  fields,
  masterKey,
}: {
  fields: T;
  masterKey: string;
}): Promise<Result<EncryptFieldsResult<T>, EnvelopeEncryptionError>> {
  // Generate fresh DEK for this encryption
  const dek = generateKey();

  // Encrypt each non-null field with the DEK
  const encrypted = {} as EncryptedFields<T>;

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

  return ok({ encrypted, dek: dekResult.value });
}

/**
 * Decrypts the DEK with master key, then decrypts specified fields.
 *
 * @param fields - Object with encrypted string or null values
 * @param dek - Encrypted DEK (base64url)
 * @param masterKey - Hex-encoded 32-byte master key
 * @returns Result with decrypted fields
 */
export async function decryptFields<T extends EncryptableFields>({
  fields,
  dek,
  masterKey,
}: {
  fields: T;
  dek: string;
  masterKey: string;
}): Promise<Result<EncryptedFields<T>, EnvelopeDecryptionError>> {
  // Decrypt the DEK with the master key
  const dekResult = await decrypt({ key: masterKey, data: dek });
  if (!dekResult.ok) {
    return err(
      new EnvelopeDecryptionError({
        message: `Failed to decrypt DEK: ${dekResult.error.message}`,
      }),
    );
  }
  const decryptedDek = dekResult.value;

  // Decrypt each non-null field with the DEK
  const decrypted = {} as EncryptedFields<T>;

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
 * @param dek - Encrypted DEK (encrypted with old master key)
 * @param oldMasterKey - Hex-encoded 32-byte old master key
 * @param newMasterKey - Hex-encoded 32-byte new master key
 * @returns Result with DEK encrypted under new master key
 */
export async function rotateMasterKey({
  dek,
  oldMasterKey,
  newMasterKey,
}: {
  dek: string;
  oldMasterKey: string;
  newMasterKey: string;
}): Promise<Result<string, EnvelopeDecryptionError | EnvelopeEncryptionError>> {
  // Decrypt DEK with old master key
  const dekResult = await decrypt({ key: oldMasterKey, data: dek });
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

  return ok(newDekResult.value);
}
