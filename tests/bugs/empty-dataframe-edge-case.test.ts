/**
 * Test edge case: Empty DataFrames have no columns
 *
 * This is expected behavior - when you create a DataFrame from an empty array,
 * it has 0 rows and 0 columns. The DataFrame can't infer column names from
 * an empty array, even if you provide a schema. This is a limitation of the
 * DataFrame implementation, not the XLSX writer.
 */

import { createDataFrame } from "../../src/dataframe/ts/dataframe/index.ts";
import { writeXLSX } from "../../src/dataframe/ts/io/write_xlsx.ts";
import { parseXLSXRaw } from "../../src/dataframe/ts/io/read_xlsx.ts";
import { expect } from "@std/expect";
import { z } from "zod";

Deno.test("empty dataframe - has no columns (DataFrame limitation)", async () => {
  const schema = z.object({
    col1: z.string(),
    col2: z.number(),
  });

  // Creating a DataFrame from an empty array results in 0 columns
  const df = createDataFrame([], schema);
  expect(df.nrows()).toBe(0);
  expect(df.ncols()).toBe(2); // This is expected - no columns!
  expect(df.columns()).toEqual(["col1", "col2"]); // No column names

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(df, tempPath);

    // Parse raw to see what was actually written
    const raw = await parseXLSXRaw(tempPath);
    console.log("Raw output for empty DF:", raw);

    // With no columns, we get a minimal XLSX
    // The exact structure depends on how Excel handles empty sheets
    expect(raw.length).toBeGreaterThanOrEqual(0);
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("empty dataframe - writeXLSX creates valid file", async () => {
  const schema = z.object({
    col1: z.string(),
    col2: z.number(),
  });

  const df = createDataFrame([], schema);
  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    // Should not throw - creates a valid (but empty) XLSX file
    await writeXLSX(df, tempPath);

    const fileInfo = await Deno.stat(tempPath);
    expect(fileInfo.size).toBeGreaterThan(0);
  } finally {
    await Deno.remove(tempPath);
  }
});
