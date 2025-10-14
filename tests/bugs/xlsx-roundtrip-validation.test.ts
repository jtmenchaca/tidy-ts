/**
 * Validation tests to ensure roundtrip tests aren't passing due to adjusted expectations
 */

import { parseXLSXRaw, readXLSX } from "../../src/dataframe/ts/io/read_xlsx.ts";
import { writeXLSX } from "../../src/dataframe/ts/io/write_xlsx.ts";
import { expect } from "@std/expect";
import { z } from "zod";

Deno.test("validation - special chars are truly preserved", async () => {
  const schema = z.object({
    text: z.string().optional(),
    symbols: z.string().optional(),
    unicode: z.string().optional(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/special-chars.xlsx",
    schema,
  );
  const origRows = original.toArray();

  // Verify original data has special characters
  expect(origRows.length).toBeGreaterThan(0);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });
  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);
    const reloadRows = reloaded.toArray();

    // Character-by-character comparison
    for (let i = 0; i < origRows.length; i++) {
      if (origRows[i].text !== undefined) {
        expect(reloadRows[i].text).toBe(origRows[i].text);
        expect(reloadRows[i].text?.length).toBe(origRows[i].text?.length);
      }
      if (origRows[i].symbols !== undefined) {
        expect(reloadRows[i].symbols).toBe(origRows[i].symbols);
      }
      if (origRows[i].unicode !== undefined) {
        expect(reloadRows[i].unicode).toBe(origRows[i].unicode);
      }
    }
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("validation - large numbers maintain precision", async () => {
  const schema = z.object({
    id: z.number(),
    value: z.number(),
    scientific: z.number(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/large-numbers.xlsx",
    schema,
  );
  const origRows = original.toArray();

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });
  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);
    const reloadRows = reloaded.toArray();

    for (let i = 0; i < origRows.length; i++) {
      // Integer values should be exact
      expect(reloadRows[i].id).toBe(origRows[i].id);
      expect(reloadRows[i].value).toBe(origRows[i].value);

      // Scientific notation - verify it's close enough (Excel has limited precision)
      const relativeError = Math.abs(
        (reloadRows[i].scientific - origRows[i].scientific) /
          origRows[i].scientific,
      );
      expect(relativeError).toBeLessThan(1e-10); // Less than 0.00000001% error
    }
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("validation - wide table preserves all columns", async () => {
  const rawOriginal = await parseXLSXRaw(
    "src/dataframe/ts/io/fixtures/wide-table.xlsx",
  );
  const expectedCols = rawOriginal[0].length;

  // Should be 31 columns (a-z, aa-ae)
  expect(expectedCols).toBe(31);

  const cols = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "aa",
    "ab",
    "ac",
    "ad",
    "ae",
  ];
  const schemaObj: Record<string, z.ZodString> = {};
  for (const col of cols) {
    schemaObj[col] = z.string();
  }
  const schema = z.object(schemaObj);

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/wide-table.xlsx",
    schema,
  );

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });
  try {
    await writeXLSX(tempPath, original);
    const rawReloaded = await parseXLSXRaw(tempPath);

    // Verify column count is preserved
    expect(rawReloaded[0].length).toBe(expectedCols);

    // Verify all column names are preserved
    for (let i = 0; i < cols.length; i++) {
      expect(rawReloaded[0][i]).toBe(cols[i]);
    }
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("validation - empty cells remain empty, not converted to defaults", async () => {
  const schema = z.object({
    col1: z.string().optional(),
    col2: z.string().optional(),
    col3: z.string().optional(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/empty-cells.xlsx",
    schema,
  );
  const origRows = original.toArray();

  // Verify original has undefined values
  let hasUndefined = false;
  for (const row of origRows) {
    if (
      row.col1 === undefined || row.col2 === undefined || row.col3 === undefined
    ) {
      hasUndefined = true;
      break;
    }
  }
  expect(hasUndefined).toBe(true);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });
  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);
    const reloadRows = reloaded.toArray();

    // Verify undefined values are preserved
    for (let i = 0; i < origRows.length; i++) {
      expect(reloadRows[i].col1).toBe(origRows[i].col1);
      expect(reloadRows[i].col2).toBe(origRows[i].col2);
      expect(reloadRows[i].col3).toBe(origRows[i].col3);
    }
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("validation - dates preserve time information", async () => {
  const schema = z.object({
    id: z.number(),
    ok: z.boolean(),
    when: z.date(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/date-boolean.xlsx",
    schema,
  );
  const origRows = original.toArray();

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });
  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);
    const reloadRows = reloaded.toArray();

    for (let i = 0; i < origRows.length; i++) {
      // Dates should match exactly (to the millisecond)
      expect(reloadRows[i].when.getTime()).toBe(origRows[i].when.getTime());

      // Also verify the date components individually
      expect(reloadRows[i].when.getFullYear()).toBe(
        origRows[i].when.getFullYear(),
      );
      expect(reloadRows[i].when.getMonth()).toBe(origRows[i].when.getMonth());
      expect(reloadRows[i].when.getDate()).toBe(origRows[i].when.getDate());
    }
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("validation - long strings preserve full content", async () => {
  const schema = z.object({
    id: z.number(),
    description: z.string(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/long-strings.xlsx",
    schema,
  );
  const origRows = original.toArray();

  // Verify we have long strings
  let hasLongString = false;
  for (const row of origRows) {
    if (row.description.length > 100) {
      hasLongString = true;
      break;
    }
  }
  expect(hasLongString).toBe(true);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });
  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);
    const reloadRows = reloaded.toArray();

    for (let i = 0; i < origRows.length; i++) {
      // Exact string match, character by character
      expect(reloadRows[i].description).toBe(origRows[i].description);
      expect(reloadRows[i].description.length).toBe(
        origRows[i].description.length,
      );
    }
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("validation - penguins dataset row count and undefined handling", async () => {
  const schema = z.object({
    species: z.string(),
    island: z.string(),
    bill_length_mm: z.number().optional(),
    bill_depth_mm: z.number().optional(),
    flipper_length_mm: z.number().optional(),
    body_mass_g: z.number().optional(),
    sex: z.string().optional(),
    year: z.number(),
  });

  const original = await readXLSX(
    "src/dataframe/ts/io/fixtures/penguins.xlsx",
    schema,
  );
  const origRows = original.toArray();

  // Verify we have the expected number of rows (should be 344)
  expect(origRows.length).toBeGreaterThan(300);

  // Verify original has some undefined values
  let hasUndefined = false;
  for (const row of origRows) {
    if (row.bill_length_mm === undefined || row.sex === undefined) {
      hasUndefined = true;
      break;
    }
  }
  expect(hasUndefined).toBe(true);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });
  try {
    await writeXLSX(tempPath, original);
    const reloaded = await readXLSX(tempPath, schema);
    const reloadRows = reloaded.toArray();

    // Same row count
    expect(reloadRows.length).toBe(origRows.length);

    // Spot check several rows for exact equality
    for (let i = 0; i < Math.min(50, origRows.length); i++) {
      expect(reloadRows[i].species).toBe(origRows[i].species);
      expect(reloadRows[i].island).toBe(origRows[i].island);
      expect(reloadRows[i].year).toBe(origRows[i].year);
      expect(reloadRows[i].bill_length_mm).toBe(origRows[i].bill_length_mm);
      expect(reloadRows[i].bill_depth_mm).toBe(origRows[i].bill_depth_mm);
      expect(reloadRows[i].sex).toBe(origRows[i].sex);
    }
  } finally {
    await Deno.remove(tempPath);
  }
});
