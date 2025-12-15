import { expect } from "@std/expect";
import { test } from "../test.ts";
import { generateKey } from "./generateKey.ts";
import {
  decryptFields,
  encryptFields,
  EnvelopeDecryptionError,
  EnvelopeEncryptionError,
  rotateMasterKey,
} from "./envelope.ts";

test("encryptFields - encrypts multiple fields", async () => {
  const masterKey = generateKey();

  const result = await encryptFields({
    fields: {
      title: "Doctor appointment",
      description: "Annual checkup with Dr. Smith",
    },
    masterKey,
  });

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.encrypted.title).not.toBe("Doctor appointment");
    expect(result.value.encrypted.description).not.toBe(
      "Annual checkup with Dr. Smith",
    );
    expect(typeof result.value.dek).toBe("string");
    expect(result.value.dek.length).toBeGreaterThan(0);
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

  const result1 = await encryptFields({ fields, masterKey });
  const result2 = await encryptFields({ fields, masterKey });

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

  const encryptResult = await encryptFields({
    fields: {
      title: "Doctor appointment",
      description: "Annual checkup with Dr. Smith",
    },
    masterKey,
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  const decryptResult = await decryptFields({
    fields: encryptResult.value.encrypted,
    dek: encryptResult.value.dek,
    masterKey,
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

  const encryptResult = await encryptFields({
    fields: {
      title: "Test",
      notes: null,
    },
    masterKey,
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  const decryptResult = await decryptFields({
    fields: encryptResult.value.encrypted,
    dek: encryptResult.value.dek,
    masterKey,
  });

  expect(decryptResult.ok).toBe(true);
  if (decryptResult.ok) {
    expect(decryptResult.value.title).toBe("Test");
    expect(decryptResult.value.notes).toBe(null);
  }
});

test("decryptFields - selective decryption", async () => {
  const masterKey = generateKey();

  const encryptResult = await encryptFields({
    fields: {
      title: "Doctor appointment",
      description: "Annual checkup",
      notes: "Bring insurance card",
    },
    masterKey,
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  // Only decrypt title
  const decryptResult = await decryptFields({
    fields: { title: encryptResult.value.encrypted.title },
    dek: encryptResult.value.dek,
    masterKey,
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

  // Encrypt with old master key
  const encryptResult = await encryptFields({
    fields: { secret: "confidential data" },
    masterKey: oldMasterKey,
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  // Rotate the master key
  const rotateResult = await rotateMasterKey({
    dek: encryptResult.value.dek,
    oldMasterKey,
    newMasterKey,
  });

  expect(rotateResult.ok).toBe(true);
  if (!rotateResult.ok) return;

  // Verify old DEK no longer works with new master key
  const oldDekDecrypt = await decryptFields({
    fields: encryptResult.value.encrypted,
    dek: encryptResult.value.dek,
    masterKey: newMasterKey,
  });
  expect(oldDekDecrypt.ok).toBe(false);

  // Verify new DEK works with new master key
  const newDekDecrypt = await decryptFields({
    fields: encryptResult.value.encrypted,
    dek: rotateResult.value,
    masterKey: newMasterKey,
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
  });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toBeInstanceOf(EnvelopeEncryptionError);
  }
});

test("decryptFields - returns error for invalid master key", async () => {
  const masterKey = generateKey();

  const encryptResult = await encryptFields({
    fields: { title: "Test" },
    masterKey,
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  const decryptResult = await decryptFields({
    fields: encryptResult.value.encrypted,
    dek: encryptResult.value.dek,
    masterKey: "wrong-key",
  });

  expect(decryptResult.ok).toBe(false);
  if (!decryptResult.ok) {
    expect(decryptResult.error).toBeInstanceOf(EnvelopeDecryptionError);
  }
});

test("decryptFields - returns error for tampered ciphertext", async () => {
  const masterKey = generateKey();

  const encryptResult = await encryptFields({
    fields: { title: "Test" },
    masterKey,
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  // Tamper with the ciphertext
  const tampered = encryptResult.value.encrypted.title.slice(0, -5) + "XXXXX";

  const decryptResult = await decryptFields({
    fields: { title: tampered },
    dek: encryptResult.value.dek,
    masterKey,
  });

  expect(decryptResult.ok).toBe(false);
  if (!decryptResult.ok) {
    expect(decryptResult.error).toBeInstanceOf(EnvelopeDecryptionError);
    expect(decryptResult.error.field).toBe("title");
  }
});

test("rotateMasterKey - returns error for wrong old master key", async () => {
  const masterKey = generateKey();
  const wrongKey = generateKey();
  const newMasterKey = generateKey();

  const encryptResult = await encryptFields({
    fields: { title: "Test" },
    masterKey,
  });

  expect(encryptResult.ok).toBe(true);
  if (!encryptResult.ok) return;

  const rotateResult = await rotateMasterKey({
    dek: encryptResult.value.dek,
    oldMasterKey: wrongKey,
    newMasterKey,
  });

  expect(rotateResult.ok).toBe(false);
  if (!rotateResult.ok) {
    expect(rotateResult.error).toBeInstanceOf(EnvelopeDecryptionError);
  }
});

test("full workflow - create, read, update record", async () => {
  const masterKey = generateKey();

  // Create: encrypt initial data
  const createResult = await encryptFields({
    fields: {
      title: "Meeting",
      description: "Team standup",
    },
    masterKey,
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
    masterKey,
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
  });
  expect(updateResult.ok).toBe(true);
  if (!updateResult.ok) return;

  // New DEK should be different
  expect(updateResult.value.dek).not.toBe(record.dek);

  // Verify updated data decrypts correctly
  const verifyResult = await decryptFields({
    fields: updateResult.value.encrypted,
    dek: updateResult.value.dek,
    masterKey,
  });
  expect(verifyResult.ok).toBe(true);
  if (verifyResult.ok) {
    expect(verifyResult.value.title).toBe("Updated Meeting");
    expect(verifyResult.value.description).toBe("Team standup - rescheduled");
  }
});
