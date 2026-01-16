import { expect } from "@std/expect";
import { remove, test, writeTextFile } from "@tidy-ts/shims";
import { z } from "zod";
import { readJSON } from "@tidy-ts/dataframe";

test("readJSON: validates simple object", async () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    active: z.boolean(),
  });

  const testData = {
    name: "John",
    age: 30,
    active: true,
  };

  // Create temporary file
  const tempFile = "./temp_simple.json";
  await writeTextFile(tempFile, JSON.stringify(testData));

  try {
    const result = await readJSON(tempFile, schema);

    expect(result.name).toBe("John");
    expect(result.age).toBe(30);
    expect(result.active).toBe(true);

    // Type check
    const _typeCheck: { name: string; age: number; active: boolean } = result;
  } finally {
    await remove(tempFile).catch(() => {});
  }
});

test("readJSON: returns DataFrame for array data", async () => {
  const UserSchema = z.array(z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    score: z.number().optional(),
  }));

  const users = [
    { id: 1, name: "Alice", email: "alice@example.com", score: 95 },
    { id: 2, name: "Bob", email: "bob@example.com" },
    { id: 3, name: "Charlie", email: "charlie@example.com", score: 88 },
  ];

  const tempFile = "./temp_users.json";
  await writeTextFile(tempFile, JSON.stringify(users));

  try {
    const df = await readJSON(tempFile, UserSchema);

    expect(df.nrows()).toBe(3);
    expect(df[0].name).toBe("Alice");
    expect(df[1].score).toBeUndefined();
    expect(df[2].score).toBe(88);
  } finally {
    await remove(tempFile).catch(() => {});
  }
});

test("readJSON: throws on validation error", async () => {
  const schema = z.object({
    email: z.string().email(),
    age: z.number().positive(),
  });

  const invalidData = {
    email: "not-an-email",
    age: -5,
  };

  const tempFile = "./temp_invalid.json";
  await writeTextFile(tempFile, JSON.stringify(invalidData));

  try {
    await expect(readJSON(tempFile, schema)).rejects.toThrow(
      "JSON validation failed",
    );
  } finally {
    await remove(tempFile).catch(() => {});
  }
});

test("readJSON: handles complex nested schema", async () => {
  const ConfigSchema = z.object({
    app: z.object({
      name: z.string(),
      version: z.string(),
    }),
    database: z.object({
      host: z.string(),
      port: z.number(),
      ssl: z.boolean(),
    }),
    features: z.array(z.string()),
    optional: z.string().optional(),
  });

  const configData = {
    app: {
      name: "MyApp",
      version: "1.0.0",
    },
    database: {
      host: "localhost",
      port: 5432,
      ssl: false,
    },
    features: ["auth", "logging"],
  };

  const tempFile = "./temp_config.json";
  await writeTextFile(tempFile, JSON.stringify(configData));

  try {
    const result = await readJSON(tempFile, ConfigSchema);

    expect(result.app.name).toBe("MyApp");
    expect(result.database.port).toBe(5432);
    expect(result.features).toEqual(["auth", "logging"]);
    expect(result.optional).toBeUndefined();
  } finally {
    await remove(tempFile).catch(() => {});
  }
});

test("readJSON: handles empty array", async () => {
  const EmptyArraySchema = z.array(z.object({
    id: z.number(),
  }));

  const emptyData: unknown[] = [];

  const tempFile = "./temp_empty.json";
  await writeTextFile(tempFile, JSON.stringify(emptyData));

  try {
    const result = await readJSON(tempFile, EmptyArraySchema);

    // Empty arrays should still be returned as the validated array, not converted to DataFrame
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  } finally {
    await remove(tempFile).catch(() => {});
  }
});
