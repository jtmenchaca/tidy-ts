import { parseXLSXRaw, readXLSX } from "../../src/dataframe/ts/io/read_xlsx.ts";
import { expect } from "@std/expect";
import { z } from "zod";

/**
 * Verify that reading without sheet parameter gets the FIRST sheet in order,
 * not a sheet named "Sheet1"
 *
 * multiple-tabs.xlsx has sheets in this order:
 * 1. "first-sheet" (5 columns: id, name, email, age, active)
 * 2. "second-sheet" (2 columns: id, name)
 * 3. "Sheet1" (2 columns: id, name)
 */

Deno.test("default reads FIRST sheet, not Sheet1", async () => {
  // Read without specifying sheet - should get first-sheet (5 columns)
  const defaultRead = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
  );

  console.log("Default read headers:", defaultRead[0]);
  console.log("Number of columns:", defaultRead[0].length);

  // First sheet has 5 columns
  expect(defaultRead[0].length).toBe(5);
  expect(defaultRead[0]).toEqual(["id", "name", "email", "age", "active"]);

  // Explicitly read "Sheet1" - should have only 2 columns
  const sheet1Read = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    { sheet: "Sheet1" },
  );

  console.log("Sheet1 headers:", sheet1Read[0]);
  console.log("Number of columns:", sheet1Read[0].length);

  // Sheet1 has only 2 columns
  expect(sheet1Read[0].length).toBe(2);
  expect(sheet1Read[0]).toEqual(["id", "name"]);

  // Verify they're different
  expect(defaultRead[0]).not.toEqual(sheet1Read[0]);
});

Deno.test("readXLSX defaults to first sheet with correct schema", async () => {
  // Schema for first-sheet (5 columns)
  const firstSheetSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    age: z.number().optional(),
    active: z.boolean(),
  });

  // This should work - first sheet has these columns
  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    firstSheetSchema,
  );

  expect(df.ncols()).toBe(5);
  expect(df.columns()).toEqual(["id", "name", "email", "age", "active"]);

  // Schema for Sheet1 (only 2 columns)
  const sheet1Schema = z.object({
    id: z.number(),
    name: z.string(),
  });

  // Reading default with Sheet1 schema should FAIL because first-sheet has more columns
  // but we only care about the columns in the schema, so this should actually work
  // (it just ignores extra columns)

  // Instead, let's verify that reading Sheet1 explicitly gives different data
  const sheet1Df = await readXLSX(
    "src/dataframe/ts/io/fixtures/multiple-tabs.xlsx",
    sheet1Schema,
    { sheet: "Sheet1" },
  );

  expect(sheet1Df.ncols()).toBe(2);
  expect(sheet1Df.columns()).toEqual(["id", "name"]);
});
