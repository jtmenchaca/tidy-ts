// tests/writeArrow.test.ts
import { expect } from "@std/expect";
import { remove, test } from "@tidy-ts/shims";
import { z } from "zod";
import { createDataFrame, readArrow, writeArrow } from "../../../mod.ts";

const TEST_FILE = "/tmp/test-output.arrow";

test("writeArrow - basic roundtrip", async () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", active: true, score: 95.5 },
    { id: 2, name: "Bob", active: false, score: 88.0 },
  ]);

  await writeArrow(df, TEST_FILE);

  const schema = z.object({
    id: z.number(),
    name: z.string(),
    active: z.boolean(),
    score: z.number(),
  });

  const result = await readArrow(TEST_FILE, schema);

  expect(result.nrows()).toBe(2);
  const rows = result.toArray();
  expect(rows[0].name).toBe("Alice");
  expect(rows[1].name).toBe("Bob");
  expect(rows[0].active).toBe(true);
  expect(rows[0].score).toBe(95.5);
});

test("writeArrow - date handling", async () => {
  const now = new Date();
  const df = createDataFrame([
    { id: 1, timestamp: now },
  ]);

  await writeArrow(df, TEST_FILE);

  const schema = z.object({
    id: z.number(),
    timestamp: z.date(),
  });

  const result = await readArrow(TEST_FILE, schema, { useDate: true });

  const rows = result.toArray();
  expect(rows[0].timestamp.getTime()).toBe(now.getTime());
});

test("writeArrow - empty dataframe", async () => {
  const emptyData: { id: number; name: string }[] = [];
  const df = createDataFrame(emptyData);

  await writeArrow(df, TEST_FILE);

  const schema = z.object({
    id: z.number(),
    name: z.string(),
  });

  const result = await readArrow(TEST_FILE, schema);
  expect(result.nrows()).toBe(0);
  expect(result.columns()).toEqual(["id", "name"]);

  // Clean up
  try {
    await remove(TEST_FILE);
  } catch {
    // Ignore if file doesn't exist
  }
});
