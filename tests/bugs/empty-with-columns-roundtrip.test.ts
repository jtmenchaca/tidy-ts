/**
 * Test that empty DataFrames with columns can do a proper roundtrip
 */

import { createDataFrame } from "../../src/dataframe/ts/dataframe/index.ts";
import { writeXLSX } from "../../src/dataframe/ts/io/write_xlsx.ts";
import { readXLSX } from "../../src/dataframe/ts/io/read_xlsx.ts";
import { expect } from "@std/expect";
import { z } from "zod";

Deno.test("empty DF with columns - full roundtrip works", async () => {
  // Create an empty DataFrame that HAS columns (by filtering)
  const original = createDataFrame([
    { name: "Alice", age: 30, city: "Seattle" },
    { name: "Bob", age: 25, city: "Portland" },
  ]).filter(() => false);

  expect(original.nrows()).toBe(0);
  expect(original.ncols()).toBe(3);
  expect(original.columns()).toEqual(["name", "age", "city"]);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    // Write it
    await writeXLSX(tempPath, original);

    // Read it back
    const schema = z.object({
      name: z.string().optional(),
      age: z.number().optional(),
      city: z.string().optional(),
    });

    const reloaded = await readXLSX(tempPath, schema);

    // Should preserve columns even with 0 rows!
    expect(reloaded.nrows()).toBe(0);
    expect(reloaded.ncols()).toBe(3);
    expect(reloaded.columns()).toEqual(["name", "age", "city"]);
    expect(reloaded.toArray()).toEqual([]);
  } finally {
    await Deno.remove(tempPath);
  }
});
