import { createDataFrame } from "../../src/dataframe/ts/dataframe/index.ts";
import { writeXLSX } from "../../src/dataframe/ts/io/write_xlsx.ts";
import { parseXLSXRaw } from "../../src/dataframe/ts/io/read_xlsx.ts";
import { expect } from "@std/expect";

Deno.test("empty DataFrame with columns - writes headers", async () => {
  // Create a DataFrame with columns but 0 rows (by filtering)
  const df = createDataFrame([
    { col1: "test", col2: 123 },
  ]).filter(() => false);

  expect(df.nrows()).toBe(0);
  expect(df.ncols()).toBe(2);
  expect(df.columns()).toEqual(["col1", "col2"]);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, df);

    // Check what was written
    const raw = await parseXLSXRaw(tempPath);
    console.log("Raw XLSX content:", raw);

    // Should have exactly 1 row (the header)
    expect(raw.length).toBe(1);
    expect(raw[0]).toEqual(["col1", "col2"]);
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("empty DataFrame with columns - raw parse shows headers", async () => {
  const df = createDataFrame([
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ]).filter(() => false);

  expect(df.nrows()).toBe(0);
  expect(df.ncols()).toBe(2);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, df);

    // Raw parse shows the headers are there
    const raw = await parseXLSXRaw(tempPath);
    expect(raw.length).toBe(1); // Just headers
    expect(raw[0]).toEqual(["name", "age"]);

    // Note: readXLSX with createDataFrame from empty array will have 0 columns
    // This is a DataFrame limitation - when you call createDataFrame([]),
    // it can't infer columns even if the XLSX has headers
  } finally {
    await Deno.remove(tempPath);
  }
});
