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
import { type AppError, type Result } from "../result.ts";
type EnvelopeEncryptionErrorExtra = {
    message: string;
    field?: string;
};
export declare const EnvelopeEncryptionError: {
    new (extra: EnvelopeEncryptionErrorExtra): AppError<"EnvelopeEncryptionError", EnvelopeEncryptionErrorExtra>;
};
export type EnvelopeEncryptionError = AppError<"EnvelopeEncryptionError", EnvelopeEncryptionErrorExtra>;
type EnvelopeDecryptionErrorExtra = {
    message: string;
    field?: string;
};
export declare const EnvelopeDecryptionError: {
    new (extra: EnvelopeDecryptionErrorExtra): AppError<"EnvelopeDecryptionError", EnvelopeDecryptionErrorExtra>;
};
export type EnvelopeDecryptionError = AppError<"EnvelopeDecryptionError", EnvelopeDecryptionErrorExtra>;
export type EnvelopeError = EnvelopeEncryptionError | EnvelopeDecryptionError;
type InvalidKeyIdErrorExtra = {
    keyId: string;
    reason: string;
};
export declare const InvalidKeyIdError: {
    new (extra: InvalidKeyIdErrorExtra): AppError<"InvalidKeyIdError", InvalidKeyIdErrorExtra>;
};
export type InvalidKeyIdError = AppError<"InvalidKeyIdError", InvalidKeyIdErrorExtra>;
type KeyNotFoundErrorExtra = {
    keyId: string;
    cause?: Error;
};
export declare const KeyNotFoundError: {
    new (extra: KeyNotFoundErrorExtra): AppError<"KeyNotFoundError", KeyNotFoundErrorExtra>;
};
export type KeyNotFoundError = AppError<"KeyNotFoundError", KeyNotFoundErrorExtra>;
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
/**
 * Encrypts multiple fields with a freshly generated DEK, then encrypts the DEK with the master key.
 * The DEK is prefixed with the masterKeyId for self-describing decryption.
 *
 * @param fields - Object with string or null values to encrypt
 * @param masterKey - Hex-encoded 32-byte master key
 * @param masterKeyId - Identifier for the master key (cannot contain colons)
 * @returns Result with encrypted fields and self-describing encrypted DEK (format: "masterKeyId:encryptedDek")
 */
export declare function encryptFields<T extends EncryptableFields>({ fields, masterKey, masterKeyId, }: {
    fields: T;
    masterKey: string;
    masterKeyId: string;
}): Promise<Result<EncryptFieldsResult<T>, EnvelopeEncryptionError | InvalidKeyIdError>>;
/**
 * Decrypts the DEK with master key, then decrypts specified fields.
 * The DEK is self-describing and contains the masterKeyId prefix.
 *
 * @param fields - Object with encrypted string or null values
 * @param dek - Self-describing encrypted DEK (format: "masterKeyId:encryptedDek")
 * @param getMasterKey - Callback to retrieve master key by its ID
 * @returns Result with decrypted fields
 */
export declare function decryptFields<T extends EncryptableFields>({ fields, dek, getMasterKey, }: {
    fields: T;
    dek: string;
    getMasterKey: (masterKeyId: string) => string;
}): Promise<Result<TransformedFields<T>, EnvelopeDecryptionError | KeyNotFoundError>>;
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
export declare function rotateMasterKey({ dek, newMasterKey, newMasterKeyId, getMasterKey, }: {
    dek: string;
    newMasterKey: string;
    newMasterKeyId: string;
    getMasterKey: (masterKeyId: string) => string;
}): Promise<Result<string, EnvelopeDecryptionError | EnvelopeEncryptionError | KeyNotFoundError | InvalidKeyIdError>>;
export {};
