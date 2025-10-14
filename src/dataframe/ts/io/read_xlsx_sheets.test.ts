import { parseXLSXRaw, readXLSX } from "./read_xlsx.ts";
import { expect } from "@std/expect";
import { z } from "zod";

/**
 * Tests for reading multiple sheets from XLSX files
 *
 * multiple-tabs.xlsx has three sheets in order:
 * 1. "first-sheet" - columns: id, name, email, age, active
 * 2. "second-sheet" - columns: id, name
 * 3. "Sheet1" - columns: id, name
 */

Deno.test("readXLSX - default to first sheet", async () => {
  const schema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    age: z.number().optional(),
    active: z.boolean(),
  });

  // Without sheet option, should read first sheet ("first-sheet")
  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    schema,
  );

  const rows = df.toArray();
  expect(rows.length).toBe(3); // 4 total rows - 1 header
  expect(rows[0].id).toBe(1);
  expect(rows[0].name).toBe("John");
  expect(rows[0].email).toBe("john@x.com");
  expect(rows[0].age).toBe(30);
  expect(rows[0].active).toBe(true);
});

Deno.test("readXLSX - read sheet by name: first-sheet", async () => {
  const schema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    age: z.number().optional(),
    active: z.boolean(),
  });

  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    schema,
    {
      sheet: "first-sheet",
    },
  );

  const rows = df.toArray();
  expect(rows.length).toBe(3);
  expect(rows[0].name).toBe("John");
});

Deno.test("readXLSX - read sheet by name: second-sheet", async () => {
  const schema = z.object({
    id: z.number(),
    name: z.string(),
  });

  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    schema,
    {
      sheet: "second-sheet",
    },
  );

  const rows = df.toArray();
  expect(rows.length).toBe(3);
});

Deno.test("readXLSX - read sheet by name: Sheet1", async () => {
  const schema = z.object({
    id: z.number(),
    name: z.string(),
  });

  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    schema,
    {
      sheet: "Sheet1",
    },
  );

  const rows = df.toArray();
  expect(rows.length).toBe(3);
});

Deno.test("readXLSX - read sheet by index 0 (first-sheet)", async () => {
  const schema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    age: z.number().optional(),
    active: z.boolean(),
  });

  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    schema,
    {
      sheet: 0,
    },
  );

  const rows = df.toArray();
  expect(rows.length).toBe(3);
  expect(rows[0].email).toBe("john@x.com");
});

Deno.test("readXLSX - read sheet by index 1 (second-sheet)", async () => {
  const schema = z.object({
    id: z.number(),
    name: z.string(),
  });

  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    schema,
    {
      sheet: 1,
    },
  );

  const rows = df.toArray();
  expect(rows.length).toBe(3);
  // Second sheet has different data than first sheet
  expect(df.ncols()).toBe(2); // Only id and name
});

Deno.test("readXLSX - read sheet by index 2 (Sheet1)", async () => {
  const schema = z.object({
    id: z.number(),
    name: z.string(),
  });

  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    schema,
    {
      sheet: 2,
    },
  );

  const rows = df.toArray();
  expect(rows.length).toBe(3);
  expect(df.ncols()).toBe(2);
});

Deno.test("readXLSX - error on invalid sheet name", async () => {
  const schema = z.object({
    col: z.string(),
  });

  try {
    await readXLSX("src/dataframe/ts/io/fixtures/multiple-tabs.xlsx", schema, {
      sheet: "nonexistent-sheet",
    });
    throw new Error("Should have thrown error for invalid sheet name");
  } catch (error) {
    expect((error as Error).message).toContain(
      'Sheet "nonexistent-sheet" not found',
    );
    expect((error as Error).message).toContain("Available sheets:");
  }
});

Deno.test("readXLSX - error on invalid sheet index", async () => {
  const schema = z.object({
    col: z.string(),
  });

  try {
    await readXLSX("src/dataframe/ts/io/fixtures/multiple-tabs.xlsx", schema, {
      sheet: 10,
    });
    throw new Error("Should have thrown error for invalid sheet index");
  } catch (error) {
    expect((error as Error).message).toContain("Sheet index 10 out of range");
  }
});

Deno.test("parseXLSXRaw - can read different sheets", async () => {
  // First sheet
  const first = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    {
      sheet: "first-sheet",
    },
  );
  expect(first.length).toBeGreaterThan(0);
  expect(first[0]).toEqual(["id", "name", "email", "age", "active"]);

  // Second sheet
  const second = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    {
      sheet: "second-sheet",
    },
  );
  expect(second.length).toBeGreaterThan(0);
  expect(second[0]).toEqual(["id", "name"]);

  // Third sheet
  const third = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    {
      sheet: "Sheet1",
    },
  );
  expect(third.length).toBeGreaterThan(0);
  expect(third[0]).toEqual(["id", "name"]);

  // Verify first sheet has different headers than second/third
  expect(first[0].length).toBe(5);
  expect(second[0].length).toBe(2);
  expect(third[0].length).toBe(2);
});
