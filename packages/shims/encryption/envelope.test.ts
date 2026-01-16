import { expect } from "@std/expect";
import { test } from "../test.ts";
import { generateKey } from "./generateKey.ts";
import {
  decryptFields,
  encryptFields,
  EnvelopeDecryptionError,
  EnvelopeEncryptionError,
  InvalidKeyIdError,
  KeyNotFoundError,
  rotateMasterKey,
} from "./envelope.ts";

// Helper to create a getMasterKey callback for tests
function createKeyStore(
  keys: Record<string, string>,
): (keyId: string) => string {
  return (keyId: string) => {
    const key = keys[keyId];
    if (!key) throw new Error(`Key not found: ${keyId}`);
    return key;
  };
}

test("encryptFields - encrypts multiple fields", async () => {
  const masterKey = generateKey();

  const result = await encryptFields({
    fields: {
      title: "Doctor appointment",
      description: "Annual checkup with Dr. Smith",
    },
    masterKey,
    masterKeyId: "v1",
  });

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.encrypted.title).not.toBe("Doctor appointment");
    expect(result.value.encrypted.description).not.toBe(
      "Annual checkup with Dr. Smith",
    );
    expect(typeof result.value.dek).toBe("string");
    expect(result.value.dek.length).toBeGreaterThan(0);
    // DEK should be prefixed with masterKeyId
    expect(result.value.dek.startsWith("v1:")).toBe(true);
  }
});

test("encryptFields - passes through null values", async () => {
  const masterKey = generateKey();

  const result = await encryptFields({
    fields: {
      title: "Test",
      notes: null,
    },
    masterKey,
    masterKeyId: "v1",
  });

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.encrypted.title).not.toBe("Test");
    expect(result.value.encrypted.notes).toBe(null);
  }
});

test("encryptFields - generates different DEK each time", async () => {
  const masterKey = generateKey();
  const fields = { title: "Same content" };

  const result1 = await encryptFields({ fields, masterKey, masterKeyId: "v1" });
  const result2 = await encryptFields({ fields, masterKey, masterKeyId: "v1" });

  expect(result1.ok).toBe(true);
  expect(result2.ok).toBe(true);
  if (result1.ok && result2.ok) {
    // Different DEKs
    expect(result1.value.dek).not.toBe(result2.value.dek);
    // Different ciphertexts (due to different DEK + random IV)
    expect(result1.value.encrypted.title).not.toBe(
      result2.value.encrypted.title,
    );
  }
});

test("decryptFields - decrypts encrypted fields", async () => {
  const masterKey = generateKey();
  const keyStore = createKeyStore({ v1: masterKey });

  const encryptResult = await encryptFields({
    fields: {
      title: "Doctor appointment",
      description: "Annual checkup with Dr. Smith",
    },
    masterKey,
    masterKeyId: "v1",
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  const decryptResult = await decryptFields({
    fields: encryptResult.value.encrypted,
    dek: encryptResult.value.dek,
    getMasterKey: keyStore,
  });

  expect(decryptResult.ok).toBe(true);
  if (decryptResult.ok) {
    expect(decryptResult.value.title).toBe("Doctor appointment");
    expect(decryptResult.value.description).toBe(
      "Annual checkup with Dr. Smith",
    );
  }
});

test("decryptFields - passes through null values", async () => {
  const masterKey = generateKey();
  const keyStore = createKeyStore({ v1: masterKey });

  const encryptResult = await encryptFields({
    fields: {
      title: "Test",
      notes: null,
    },
    masterKey,
    masterKeyId: "v1",
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  const decryptResult = await decryptFields({
    fields: encryptResult.value.encrypted,
    dek: encryptResult.value.dek,
    getMasterKey: keyStore,
  });

  expect(decryptResult.ok).toBe(true);
  if (decryptResult.ok) {
    expect(decryptResult.value.title).toBe("Test");
    expect(decryptResult.value.notes).toBe(null);
  }
});

test("decryptFields - selective decryption", async () => {
  const masterKey = generateKey();
  const keyStore = createKeyStore({ v1: masterKey });

  const encryptResult = await encryptFields({
    fields: {
      title: "Doctor appointment",
      description: "Annual checkup",
      notes: "Bring insurance card",
    },
    masterKey,
    masterKeyId: "v1",
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  // Only decrypt title
  const decryptResult = await decryptFields({
    fields: { title: encryptResult.value.encrypted.title },
    dek: encryptResult.value.dek,
    getMasterKey: keyStore,
  });

  expect(decryptResult.ok).toBe(true);
  if (decryptResult.ok) {
    expect(decryptResult.value.title).toBe("Doctor appointment");
    expect(Object.keys(decryptResult.value)).toEqual(["title"]);
  }
});

test("rotateMasterKey - re-encrypts DEK with new master key", async () => {
  const oldMasterKey = generateKey();
  const newMasterKey = generateKey();
  const keyStore = createKeyStore({ v1: oldMasterKey, v2: newMasterKey });

  // Encrypt with old master key
  const encryptResult = await encryptFields({
    fields: { secret: "confidential data" },
    masterKey: oldMasterKey,
    masterKeyId: "v1",
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  // Rotate the master key
  const rotateResult = await rotateMasterKey({
    dek: encryptResult.value.dek,
    newMasterKey,
    newMasterKeyId: "v2",
    getMasterKey: keyStore,
  });

  expect(rotateResult.ok).toBe(true);
  if (!rotateResult.ok) return;

  // Verify rotated DEK has new key ID prefix
  expect(rotateResult.value.startsWith("v2:")).toBe(true);

  // Verify new DEK works with new master key
  const newDekDecrypt = await decryptFields({
    fields: encryptResult.value.encrypted,
    dek: rotateResult.value,
    getMasterKey: keyStore,
  });

  expect(newDekDecrypt.ok).toBe(true);
  if (newDekDecrypt.ok) {
    expect(newDekDecrypt.value.secret).toBe("confidential data");
  }
});

test("encryptFields - returns error for invalid master key", async () => {
  const result = await encryptFields({
    fields: { title: "Test" },
    masterKey: "invalid",
    masterKeyId: "v1",
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toBeInstanceOf(EnvelopeEncryptionError);
  }
});

test("decryptFields - returns error for wrong master key", async () => {
  const masterKey = generateKey();
  const wrongKey = generateKey();

  const encryptResult = await encryptFields({
    fields: { title: "Test" },
    masterKey,
    masterKeyId: "v1",
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  // getMasterKey returns wrong key
  const decryptResult = await decryptFields({
    fields: encryptResult.value.encrypted,
    dek: encryptResult.value.dek,
    getMasterKey: () => wrongKey,
  });

  expect(decryptResult.ok).toBe(false);
  if (!decryptResult.ok) {
    expect(decryptResult.error).toBeInstanceOf(EnvelopeDecryptionError);
  }
});

test("decryptFields - returns error for tampered ciphertext", async () => {
  const masterKey = generateKey();
  const keyStore = createKeyStore({ v1: masterKey });

  const encryptResult = await encryptFields({
    fields: { title: "Test" },
    masterKey,
    masterKeyId: "v1",
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  // Tamper with the ciphertext
  const tampered = encryptResult.value.encrypted.title.slice(0, -5) + "XXXXX";

  const decryptResult = await decryptFields({
    fields: { title: tampered },
    dek: encryptResult.value.dek,
    getMasterKey: keyStore,
  });

  expect(decryptResult.ok).toBe(false);
  if (!decryptResult.ok) {
    expect(decryptResult.error).toBeInstanceOf(EnvelopeDecryptionError);
    if (decryptResult.error instanceof EnvelopeDecryptionError) {
      expect(decryptResult.error.field).toBe("title");
    }
  }
});

test("rotateMasterKey - returns error for wrong old master key", async () => {
  const masterKey = generateKey();
  const wrongKey = generateKey();
  const newMasterKey = generateKey();

  const encryptResult = await encryptFields({
    fields: { title: "Test" },
    masterKey,
    masterKeyId: "v1",
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  // getMasterKey returns wrong key for v1
  const rotateResult = await rotateMasterKey({
    dek: encryptResult.value.dek,
    newMasterKey,
    newMasterKeyId: "v2",
    getMasterKey: () => wrongKey,
  });

  expect(rotateResult.ok).toBe(false);
  if (!rotateResult.ok) {
    expect(rotateResult.error).toBeInstanceOf(EnvelopeDecryptionError);
  }
});

test("full workflow - create, read, update record", async () => {
  const masterKey = generateKey();
  const keyStore = createKeyStore({ v1: masterKey });

  // Create: encrypt initial data
  const createResult = await encryptFields({
    fields: {
      title: "Meeting",
      description: "Team standup",
    },
    masterKey,
    masterKeyId: "v1",
  });
  expect(createResult.ok).toBe(true);
  if (!createResult.ok) return;

  // Simulate storing in database
  const record = {
    id: 1,
    title: createResult.value.encrypted.title,
    description: createResult.value.encrypted.description,
    dek: createResult.value.dek,
  };

  // Read: decrypt for display
  const readResult = await decryptFields({
    fields: { title: record.title, description: record.description },
    dek: record.dek,
    getMasterKey: keyStore,
  });
  expect(readResult.ok).toBe(true);
  if (!readResult.ok) return;
  expect(readResult.value.title).toBe("Meeting");
  expect(readResult.value.description).toBe("Team standup");

  // Update: re-encrypt with new DEK
  const updateResult = await encryptFields({
    fields: {
      title: "Updated Meeting",
      description: "Team standup - rescheduled",
    },
    masterKey,
    masterKeyId: "v1",
  });
  expect(updateResult.ok).toBe(true);
  if (!updateResult.ok) return;

  // New DEK should be different
  expect(updateResult.value.dek).not.toBe(record.dek);

  // Verify updated data decrypts correctly
  const verifyResult = await decryptFields({
    fields: updateResult.value.encrypted,
    dek: updateResult.value.dek,
    getMasterKey: keyStore,
  });
  expect(verifyResult.ok).toBe(true);
  if (verifyResult.ok) {
    expect(verifyResult.value.title).toBe("Updated Meeting");
    expect(verifyResult.value.description).toBe("Team standup - rescheduled");
  }
});

test("encryptFields - returns error for invalid masterKeyId with colon", async () => {
  const masterKey = generateKey();

  const result = await encryptFields({
    fields: { title: "Test" },
    masterKey,
    masterKeyId: "v1:invalid",
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toBeInstanceOf(InvalidKeyIdError);
  }
});

test("encryptFields - returns error for empty masterKeyId", async () => {
  const masterKey = generateKey();

  const result = await encryptFields({
    fields: { title: "Test" },
    masterKey,
    masterKeyId: "",
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toBeInstanceOf(InvalidKeyIdError);
  }
});

test("decryptFields - returns error for missing masterKeyId in DEK", async () => {
  const masterKey = generateKey();

  // Manually construct invalid DEK without prefix
  const decryptResult = await decryptFields({
    fields: { title: "encrypted-data" },
    dek: "no-prefix-here",
    getMasterKey: () => masterKey,
  });

  expect(decryptResult.ok).toBe(false);
  if (!decryptResult.ok) {
    expect(decryptResult.error).toBeInstanceOf(EnvelopeDecryptionError);
  }
});

test("decryptFields - returns error when getMasterKey throws", async () => {
  const masterKey = generateKey();

  const encryptResult = await encryptFields({
    fields: { title: "Test" },
    masterKey,
    masterKeyId: "v1",
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  const decryptResult = await decryptFields({
    fields: encryptResult.value.encrypted,
    dek: encryptResult.value.dek,
    getMasterKey: () => {
      throw new Error("Key not found in vault");
    },
  });

  expect(decryptResult.ok).toBe(false);
  if (!decryptResult.ok) {
    expect(decryptResult.error).toBeInstanceOf(KeyNotFoundError);
  }
});

test("decryptFields - returns error when getMasterKey returns empty", async () => {
  const masterKey = generateKey();

  const encryptResult = await encryptFields({
    fields: { title: "Test" },
    masterKey,
    masterKeyId: "v1",
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  const decryptResult = await decryptFields({
    fields: encryptResult.value.encrypted,
    dek: encryptResult.value.dek,
    getMasterKey: () => "",
  });

  expect(decryptResult.ok).toBe(false);
  if (!decryptResult.ok) {
    expect(decryptResult.error).toBeInstanceOf(KeyNotFoundError);
  }
});
