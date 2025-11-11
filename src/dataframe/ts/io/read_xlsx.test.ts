import { readXLSX } from "./read_xlsx.ts";
import { expect } from "@std/expect";
import { z } from "zod";

Deno.test("readXLSX - basic schema validation", async () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    city: z.string(),
  });

  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/single-row.xlsx",
    schema,
  );

  df.print();

  expect(df.nrows()).toBe(1);
  expect(df.ncols()).toBe(3);

  const rows = df.toArray();
  expect(rows[0]).toEqual({
    name: "Alice",
    age: 30,
    city: "Seattle",
  });
});

Deno.test("readXLSX - mixed types with schema coercion", async () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    score: z.number(),
    active: z.boolean(),
    date: z.string(), // Keep as string for now
  });

  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/mixed-types.xlsx",
    schema,
  );

  df.print();

  expect(df.nrows()).toBe(3);

  const rows = df.toArray();
  expect(rows[0].name).toBe("Alice");
  expect(rows[0].age).toBe(25);
  expect(rows[0].score).toBeCloseTo(98.5, 1);
  expect(rows[0].active).toBe(true);
});

Deno.test("readXLSX - optional fields with empty cells", async () => {
  const schema = z.object({
    col1: z.string().optional(),
    col2: z.string().optional(),
    col3: z.string().optional(),
    col4: z.string().optional(),
  });

  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/empty-cells.xlsx",
    schema,
  );

  // XLSX has: col1,col2,col3,col4
  //           a,,c,d
  //           ,b,,d
  //           a,b,c,
  // Note: The row with all empty cells (,,,) is not present in the XLSX file
  expect(df.nrows()).toBe(3);
  const rows = df.toArray();

  // First row: a,,c,d
  expect(rows[0].col1).toBe("a");
  expect(rows[0].col2).toBeUndefined();
  expect(rows[0].col3).toBe("c");
  expect(rows[0].col4).toBe("d");

  // Second row: ,b,,d
  expect(rows[1].col1).toBeUndefined();
  expect(rows[1].col2).toBe("b");
  expect(rows[1].col3).toBeUndefined();
  expect(rows[1].col4).toBe("d");

  // Third row: a,b,c,
  expect(rows[2].col1).toBe("a");
  expect(rows[2].col2).toBe("b");
  expect(rows[2].col3).toBe("c");
  expect(rows[2].col4).toBeUndefined();
});

Deno.test("readXLSX - penguins dataset", async () => {
  const schema = z.object({
    species: z.string(),
    island: z.string(),
    bill_length_mm: z.number().optional(),
    bill_depth_mm: z.number().optional(),
    flipper_length_mm: z.number().optional(),
    body_mass_g: z.number().optional(),
    sex: z.string().optional(),
    year: z.number().optional(),
  });

  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/penguins.xlsx",
    schema,
  );

  df.print();

  expect(df.nrows()).toBeGreaterThan(300);
  expect(df.ncols()).toBe(8);

  const rows = df.toArray();
  expect(rows[0].species).toBeTruthy();
  expect(rows[0].island).toBeTruthy();
});

Deno.test("readXLSX - NA value handling", async () => {
  const schema = z.object({
    score: z.number().optional(),
    rating: z.number().optional(),
  });

  // The XLSX file has corrupted data in row 4 ("NA`;"), so validation should fail
  // XLSX has: score,rating
  //           85,4.2
  //           NA,3.8
  //           90,NA
  //           78,NA`; (corrupted - should cause validation error)

  try {
    await readXLSX(
      "src/dataframe/ts/io/fixtures/na-handling.xlsx",
      schema,
      { naValues: ["NA", ""] },
    );
    throw new Error("Expected validation error on corrupted row 4");
  } catch (error) {
    // Should fail on row 4 because "NA`;" is not a valid number and not in naValues
    expect((error as Error).message).toContain("Row 4 validation failed");
    expect((error as Error).message).toContain("rating");
  }
});

Deno.test("readXLSX - date and boolean fields", async () => {
  const schema = z.object({
    id: z.number(),
    ok: z.boolean(),
    when: z.date(), // Parse Excel serial numbers as dates
  });

  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/date-boolean.xlsx",
    schema,
  );

  // CSV has: id,ok,when
  //          1,TRUE,1/1/24
  //          2,0,12/31/25
  // XLSX stores dates as Excel serial numbers (e.g., 45292 for 2024-01-01)

  expect(df.nrows()).toBe(2);
  const rows = df.toArray();

  expect(rows[0].id).toBe(1);
  expect(rows[0].ok).toBe(true);
  expect(rows[0].when).toBeInstanceOf(Date);
  // Excel serial 45292 should be around 2024-01-01
  expect(rows[0].when.getFullYear()).toBe(2024);
  expect(rows[0].when.getMonth()).toBe(0); // January

  expect(rows[1].id).toBe(2);
  expect(rows[1].ok).toBe(false); // 0 should be false
  expect(rows[1].when).toBeInstanceOf(Date);
  // Excel serial 46022 should be around 2025-12-31
  expect(rows[1].when.getFullYear()).toBe(2025);
  expect(rows[1].when.getMonth()).toBe(11); // December
});

Deno.test("readXLSX - large numbers precision", async () => {
  const schema = z.object({
    id: z.number(),
    value: z.number(),
    scientific: z.number(),
  });

  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/large-numbers.xlsx",
    schema,
  );

  df.print();

  const rows = df.toArray();
  expect(rows[0].id).toBe(1);
  expect(typeof rows[0].value).toBe("number");
  expect(typeof rows[0].scientific).toBe("number");
});

Deno.test("readXLSX - error on missing columns", async () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    missing_column: z.string(),
  });

  try {
    await readXLSX("src/dataframe/ts/io/fixtures/single-row.xlsx", schema);
    throw new Error("Expected error to be thrown");
  } catch (error) {
    expect((error as Error).message).toContain("Missing required columns");
    expect((error as Error).message).toContain("missing_column");
  }
});

/*───────────────────────────────────────────────────────────────────────────┐
│  no_types option tests                                                     │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("readXLSX - no_types without schema", async () => {
  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/single-row.xlsx",
    { no_types: true },
  );

  expect(df.nrows()).toBe(1);
  expect(df.ncols()).toBe(3);
  expect(df.columns()).toEqual(["name", "age", "city"]);

  const rows = df.toArray();
  expect(rows[0].name).toBe("Alice");
  expect(rows[0].age).toBe(30);
  expect(rows[0].city).toBe("Seattle");

  // Test DataFrame operations work
  const filtered = df.filter((row) => row.age > 25);
  expect(filtered.nrows()).toBe(1);

  const mutated = df.mutate({ doubleAge: (row) => row.age * 2 });
  expect(mutated.nrows()).toBe(1);
  expect(mutated.toArray()[0].doubleAge).toBe(60);
});

Deno.test("readXLSX - no_types with schema validation", async () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    city: z.string(),
  });

  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/single-row.xlsx",
    schema,
    { no_types: true },
  );

  expect(df.nrows()).toBe(1);
  expect(df.ncols()).toBe(3);

  const rows = df.toArray();
  // Schema validation still happens, but returns DataFrame<any>
  expect(rows[0].name).toBe("Alice");
  expect(rows[0].age).toBe(30);
  expect(rows[0].city).toBe("Seattle");

  // Test DataFrame operations work
  const grouped = df.groupBy("city");
  const summarized = grouped.summarize({
    count: (g) => g.nrows(),
    avgAge: (g) => {
      const ages = g.toArray().map((r) => r.age);
      return ages.reduce((a, b) => a + b, 0) / ages.length;
    },
  });
  expect(summarized.nrows()).toBe(1);
  expect(summarized.toArray()[0].avgAge).toBe(30);
});

Deno.test("readXLSX - no_types with mixed types", async () => {
  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/mixed-types.xlsx",
    { no_types: true },
  );

  expect(df.nrows()).toBe(3);
  expect(df.ncols()).toBe(5);

  const rows = df.toArray();
  expect(rows[0].name).toBe("Alice");
  expect(typeof rows[0].age).toBe("number");
  expect(typeof rows[0].score).toBe("number");
  expect(typeof rows[0].active).toBe("boolean");

  // Test chaining operations
  const result = df
    .filter((row) => row.active)
    .mutate({ scorePlus10: (row) => row.score + 10 })
    .select("name", "scorePlus10")
    .arrange("scorePlus10", "desc");

  expect(result.nrows()).toBeGreaterThan(0);
  expect(result.ncols()).toBe(2);
});

Deno.test("readXLSX - no_types with empty file", async () => {
  // Create an empty XLSX file for testing
  const { writeXLSX } = await import("./write_xlsx.ts");
  const { createDataFrame } = await import("../dataframe/index.ts");

  const emptyDf = createDataFrame([]);
  const tempFile = "./tmp/test-empty.xlsx";
  await writeXLSX(emptyDf, tempFile);

  try {
    const df = await readXLSX(tempFile, { no_types: true });

    expect(df.nrows()).toBe(0);
    expect(df.ncols()).toBe(0);
    expect(df.isEmpty()).toBe(true);
  } finally {
    try {
      await Deno.remove(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }
});

Deno.test("readXLSX - no_types with sheet selection", async () => {
  const df = await readXLSX(
    "src/dataframe/ts/io/fixtures/penguins.xlsx",
    { no_types: true, sheet: 0 },
  );

  expect(df.nrows()).toBeGreaterThan(0);
  expect(df.ncols()).toBeGreaterThan(0);

  // Test operations work
  const distinct = df.distinct("species");
  expect(distinct.nrows()).toBeGreaterThan(0);
});

/*───────────────────────────────────────────────────────────────────────────┐
│  Browser-compatible input tests (ArrayBuffer, File, Blob)                 │
└───────────────────────────────────────────────────────────────────────────*/

Deno.test("readXLSX - ArrayBuffer input", async () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    city: z.string(),
  });

  // Read file into ArrayBuffer
  const fileData = await Deno.readFile(
    "src/dataframe/ts/io/fixtures/single-row.xlsx",
  );
  const arrayBuffer = fileData.buffer.slice(
    fileData.byteOffset,
    fileData.byteOffset + fileData.byteLength,
  );

  // Read from ArrayBuffer
  const df = await readXLSX(arrayBuffer, schema);

  expect(df.nrows()).toBe(1);
  expect(df.ncols()).toBe(3);

  const rows = df.toArray();
  expect(rows[0]).toEqual({
    name: "Alice",
    age: 30,
    city: "Seattle",
  });
});

Deno.test("readXLSX - File input", async () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    city: z.string(),
  });

  // Read file into ArrayBuffer, then create File object
  const fileData = await Deno.readFile(
    "src/dataframe/ts/io/fixtures/single-row.xlsx",
  );
  const arrayBuffer = fileData.buffer.slice(
    fileData.byteOffset,
    fileData.byteOffset + fileData.byteLength,
  );
  const file = new File([arrayBuffer], "single-row.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Read from File object
  const df = await readXLSX(file, schema);

  expect(df.nrows()).toBe(1);
  expect(df.ncols()).toBe(3);

  const rows = df.toArray();
  expect(rows[0]).toEqual({
    name: "Alice",
    age: 30,
    city: "Seattle",
  });
});

Deno.test("readXLSX - Blob input", async () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    city: z.string(),
  });

  // Read file into ArrayBuffer, then create Blob object
  const fileData = await Deno.readFile(
    "src/dataframe/ts/io/fixtures/single-row.xlsx",
  );
  const arrayBuffer = fileData.buffer.slice(
    fileData.byteOffset,
    fileData.byteOffset + fileData.byteLength,
  );
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Read from Blob object
  const df = await readXLSX(blob, schema);

  expect(df.nrows()).toBe(1);
  expect(df.ncols()).toBe(3);

  const rows = df.toArray();
  expect(rows[0]).toEqual({
    name: "Alice",
    age: 30,
    city: "Seattle",
  });
});

Deno.test("readXLSX - ArrayBuffer with no_types", async () => {
  // Read file into ArrayBuffer
  const fileData = await Deno.readFile(
    "src/dataframe/ts/io/fixtures/mixed-types.xlsx",
  );
  const arrayBuffer = fileData.buffer.slice(
    fileData.byteOffset,
    fileData.byteOffset + fileData.byteLength,
  );

  // Read from ArrayBuffer with no_types
  const df = await readXLSX(arrayBuffer, { no_types: true });

  expect(df.nrows()).toBe(3);
  expect(df.ncols()).toBe(5);

  const rows = df.toArray();
  expect(rows[0].name).toBe("Alice");
  expect(typeof rows[0].age).toBe("number");
  expect(typeof rows[0].score).toBe("number");
  expect(typeof rows[0].active).toBe("boolean");

  // Test DataFrame operations work - verify filtering works
  const activeRows = df.toArray().filter((row) => row.active);
  expect(activeRows.length).toBeGreaterThan(0);
});

Deno.test("readXLSX - File with sheet selection", async () => {
  const schema = z.object({
    species: z.string(),
    island: z.string(),
    bill_length_mm: z.number().optional(),
  });

  // Read file into ArrayBuffer, then create File object
  const fileData = await Deno.readFile(
    "src/dataframe/ts/io/fixtures/penguins.xlsx",
  );
  const arrayBuffer = fileData.buffer.slice(
    fileData.byteOffset,
    fileData.byteOffset + fileData.byteLength,
  );
  const file = new File([arrayBuffer], "penguins.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Read from File with sheet selection
  const df = await readXLSX(file, schema, { sheet: 0 });

  expect(df.nrows()).toBeGreaterThan(300);
  expect(df.ncols()).toBeGreaterThanOrEqual(3);

  const rows = df.toArray();
  expect(rows[0].species).toBeTruthy();
  expect(rows[0].island).toBeTruthy();
});

Deno.test("readXLSX - Blob with options", async () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    city: z.string(),
  });

  // Read file into ArrayBuffer, then create Blob object
  const fileData = await Deno.readFile(
    "src/dataframe/ts/io/fixtures/single-row.xlsx",
  );
  const arrayBuffer = fileData.buffer.slice(
    fileData.byteOffset,
    fileData.byteOffset + fileData.byteLength,
  );
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Read from Blob with options (trim, naValues)
  const df = await readXLSX(blob, schema, {
    trim: true,
    naValues: ["NA", ""],
  });

  expect(df.nrows()).toBe(1);
  expect(df.ncols()).toBe(3);

  const rows = df.toArray();
  expect(rows[0].name).toBe("Alice");
  expect(rows[0].age).toBe(30);
  expect(rows[0].city).toBe("Seattle");
});

Deno.test("readXLSX - ArrayBuffer with date and boolean fields", async () => {
  const schema = z.object({
    id: z.number(),
    ok: z.boolean(),
    when: z.date(),
  });

  // Read file into ArrayBuffer
  const fileData = await Deno.readFile(
    "src/dataframe/ts/io/fixtures/date-boolean.xlsx",
  );
  const arrayBuffer = fileData.buffer.slice(
    fileData.byteOffset,
    fileData.byteOffset + fileData.byteLength,
  );

  // Read from ArrayBuffer
  const df = await readXLSX(arrayBuffer, schema);

  expect(df.nrows()).toBe(2);
  const rows = df.toArray();

  expect(rows[0].id).toBe(1);
  expect(rows[0].ok).toBe(true);
  expect(rows[0].when).toBeInstanceOf(Date);
  expect(rows[0].when.getFullYear()).toBe(2024);

  expect(rows[1].id).toBe(2);
  expect(rows[1].ok).toBe(false);
  expect(rows[1].when).toBeInstanceOf(Date);
  expect(rows[1].when.getFullYear()).toBe(2025);
});

Deno.test("readXLSX - File with no_types and schema validation", async () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    city: z.string(),
  });

  // Read file into ArrayBuffer, then create File object
  const fileData = await Deno.readFile(
    "src/dataframe/ts/io/fixtures/single-row.xlsx",
  );
  const arrayBuffer = fileData.buffer.slice(
    fileData.byteOffset,
    fileData.byteOffset + fileData.byteLength,
  );
  const file = new File([arrayBuffer], "single-row.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Read from File with schema and no_types
  const df = await readXLSX(file, schema, { no_types: true });

  expect(df.nrows()).toBe(1);
  expect(df.ncols()).toBe(3);

  const rows = df.toArray();
  // Schema validation still happens, but returns DataFrame<any>
  expect(rows[0].name).toBe("Alice");
  expect(rows[0].age).toBe(30);
  expect(rows[0].city).toBe("Seattle");

  // Test DataFrame operations work
  const grouped = df.groupBy("city");
  const summarized = grouped.summarize({
    count: (g) => g.nrows(),
  });
  expect(summarized.nrows()).toBe(1);
});

Deno.test("readXLSX - Blob with empty file", async () => {
  // Create an empty XLSX file for testing
  const { writeXLSX } = await import("./write_xlsx.ts");
  const { createDataFrame } = await import("../dataframe/index.ts");

  const emptyDf = createDataFrame([]);
  const tempFile = "./tmp/test-empty-browser.xlsx";
  await writeXLSX(emptyDf, tempFile);

  try {
    // Read file into ArrayBuffer, then create Blob object
    const fileData = await Deno.readFile(tempFile);
    const arrayBuffer = fileData.buffer.slice(
      fileData.byteOffset,
      fileData.byteOffset + fileData.byteLength,
    );
    const blob = new Blob([arrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Read from Blob with no_types
    const df = await readXLSX(blob, { no_types: true });

    expect(df.nrows()).toBe(0);
    expect(df.ncols()).toBe(0);
    expect(df.isEmpty()).toBe(true);
  } finally {
    try {
      await Deno.remove(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }
});

Deno.test("readXLSX - ArrayBuffer error handling", async () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    city: z.string(),
  });

  // Create invalid ArrayBuffer (not a valid XLSX file)
  const invalidBuffer = new ArrayBuffer(10);
  const view = new Uint8Array(invalidBuffer);
  view.set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  try {
    await readXLSX(invalidBuffer, schema);
    throw new Error("Expected error to be thrown");
  } catch (error) {
    expect((error as Error).message).toBeTruthy();
    // Should fail because it's not a valid XLSX file
  }
});

Deno.test("readXLSX - File with large dataset", async () => {
  const schema = z.object({
    species: z.string(),
    island: z.string(),
    bill_length_mm: z.number().optional(),
    bill_depth_mm: z.number().optional(),
    flipper_length_mm: z.number().optional(),
    body_mass_g: z.number().optional(),
    sex: z.string().optional(),
    year: z.number().optional(),
  });

  // Read file into ArrayBuffer, then create File object
  const fileData = await Deno.readFile(
    "src/dataframe/ts/io/fixtures/penguins.xlsx",
  );
  const arrayBuffer = fileData.buffer.slice(
    fileData.byteOffset,
    fileData.byteOffset + fileData.byteLength,
  );
  const file = new File([arrayBuffer], "penguins.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Read from File
  const df = await readXLSX(file, schema);

  expect(df.nrows()).toBeGreaterThan(300);
  expect(df.ncols()).toBe(8);

  // Test DataFrame operations work
  const grouped = df.groupBy("species");
  const summarized = grouped.summarize({
    count: (g) => g.nrows(),
    avgBillLength: (g) => {
      const values = g.toArray()
        .map((r) => r.bill_length_mm)
        .filter((v): v is number => v !== undefined);
      return values.reduce((a, b) => a + b, 0) / values.length;
    },
  });

  expect(summarized.nrows()).toBeGreaterThan(0);
  expect(summarized.ncols()).toBe(3);
});
