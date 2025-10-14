import { writeXLSX } from "./write_xlsx.ts";
import { readXLSX } from "./read_xlsx.ts";
import { createDataFrame } from "../dataframe/index.ts";
import { expect } from "@std/expect";
import { z } from "zod";

Deno.test("writeXLSX - basic write and read roundtrip", async () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    city: z.string(),
  });

  const df = createDataFrame([
    { name: "Alice", age: 30, city: "Seattle" },
    { name: "Bob", age: 25, city: "Portland" },
    { name: "Charlie", age: 35, city: "Boston" },
  ], schema);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, df);
    const readDf = await readXLSX(tempPath, schema);

    expect(readDf.nrows()).toBe(3);
    expect(readDf.ncols()).toBe(3);

    const rows = readDf.toArray();
    expect(rows[0]).toEqual({ name: "Alice", age: 30, city: "Seattle" });
    expect(rows[1]).toEqual({ name: "Bob", age: 25, city: "Portland" });
    expect(rows[2]).toEqual({ name: "Charlie", age: 35, city: "Boston" });
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("writeXLSX - mixed types with dates and booleans", async () => {
  const schema = z.object({
    id: z.number(),
    name: z.string(),
    active: z.boolean(),
    created: z.date(),
  });

  const df = createDataFrame([
    { id: 1, name: "Alice", active: true, created: new Date(2024, 0, 1) },
    { id: 2, name: "Bob", active: false, created: new Date(2024, 5, 15) },
    { id: 3, name: "Charlie", active: true, created: new Date(2025, 11, 31) },
  ], schema);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, df);
    const readDf = await readXLSX(tempPath, schema);

    expect(readDf.nrows()).toBe(3);
    const rows = readDf.toArray();

    expect(rows[0].id).toBe(1);
    expect(rows[0].name).toBe("Alice");
    expect(rows[0].active).toBe(true);
    expect(rows[0].created.getFullYear()).toBe(2024);
    expect(rows[0].created.getMonth()).toBe(0);

    expect(rows[1].active).toBe(false);
    expect(rows[1].created.getMonth()).toBe(5);

    expect(rows[2].created.getFullYear()).toBe(2025);
    expect(rows[2].created.getMonth()).toBe(11);
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("writeXLSX - optional fields with undefined values", async () => {
  const schema = z.object({
    col1: z.string().optional(),
    col2: z.string().optional(),
    col3: z.string().optional(),
  });

  const df = createDataFrame([
    { col1: "a", col2: undefined, col3: "c" },
    { col1: undefined, col2: "b", col3: undefined },
    { col1: "x", col2: "y", col3: "z" },
  ], schema);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, df);
    const readDf = await readXLSX(tempPath, schema);

    expect(readDf.nrows()).toBe(3);
    const rows = readDf.toArray();

    expect(rows[0].col1).toBe("a");
    expect(rows[0].col2).toBeUndefined();
    expect(rows[0].col3).toBe("c");

    expect(rows[1].col1).toBeUndefined();
    expect(rows[1].col2).toBe("b");
    expect(rows[1].col3).toBeUndefined();

    expect(rows[2].col1).toBe("x");
    expect(rows[2].col2).toBe("y");
    expect(rows[2].col3).toBe("z");
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("writeXLSX - large numbers precision", async () => {
  const schema = z.object({
    id: z.number(),
    value: z.number(),
    scientific: z.number(),
  });

  const df = createDataFrame([
    { id: 1, value: 1234567890, scientific: 1.23e10 },
    { id: 2, value: 9876543210, scientific: 3.14e-5 },
  ], schema);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, df);
    const readDf = await readXLSX(tempPath, schema);

    const rows = readDf.toArray();
    expect(rows[0].value).toBe(1234567890);
    expect(rows[0].scientific).toBeCloseTo(1.23e10, 1);

    expect(rows[1].value).toBe(9876543210);
    expect(rows[1].scientific).toBeCloseTo(3.14e-5, 6);
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("writeXLSX - special characters in strings", async () => {
  const schema = z.object({
    text: z.string(),
  });

  const df = createDataFrame([
    { text: "Hello & goodbye" },
    { text: 'Quotes: "test"' },
    { text: "Apostrophe: it's" },
    { text: "Less than: <value>" },
    { text: "Greater than: >value>" },
  ], schema);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, df);
    const readDf = await readXLSX(tempPath, schema);

    const rows = readDf.toArray();
    expect(rows[0].text).toBe("Hello & goodbye");
    expect(rows[1].text).toBe('Quotes: "test"');
    expect(rows[2].text).toBe("Apostrophe: it's");
    expect(rows[3].text).toBe("Less than: <value>");
    expect(rows[4].text).toBe("Greater than: >value>");
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("writeXLSX - empty dataframe", async () => {
  const schema = z.object({
    col1: z.string(),
    col2: z.number(),
  });

  const df = createDataFrame([], schema);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    // Just verify we can write an empty dataframe without errors
    await writeXLSX(tempPath, df);

    // Reading back empty dataframes is tricky - the XLSX will have headers but no data rows
    // For now, just verify the write succeeded
    const fileInfo = await Deno.stat(tempPath);
    expect(fileInfo.size).toBeGreaterThan(0);
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("writeXLSX - single row dataframe", async () => {
  const schema = z.object({
    name: z.string(),
    value: z.number(),
  });

  const df = createDataFrame([
    { name: "single", value: 42 },
  ], schema);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, df);
    const readDf = await readXLSX(tempPath, schema);

    expect(readDf.nrows()).toBe(1);
    const rows = readDf.toArray();
    expect(rows[0]).toEqual({ name: "single", value: 42 });
  } finally {
    await Deno.remove(tempPath);
  }
});

Deno.test("writeXLSX - many columns", async () => {
  const schema = z.object({
    a: z.string(),
    b: z.string(),
    c: z.string(),
    d: z.string(),
    e: z.string(),
    f: z.string(),
    g: z.string(),
    h: z.string(),
  });

  const df = createDataFrame([
    { a: "1", b: "2", c: "3", d: "4", e: "5", f: "6", g: "7", h: "8" },
    { a: "a", b: "b", c: "c", d: "d", e: "e", f: "f", g: "g", h: "h" },
  ], schema);

  const tempPath = await Deno.makeTempFile({ suffix: ".xlsx" });

  try {
    await writeXLSX(tempPath, df);
    const readDf = await readXLSX(tempPath, schema);

    expect(readDf.nrows()).toBe(2);
    expect(readDf.ncols()).toBe(8);

    const rows = readDf.toArray();
    expect(rows[0].a).toBe("1");
    expect(rows[0].h).toBe("8");
    expect(rows[1].a).toBe("a");
    expect(rows[1].h).toBe("h");
  } finally {
    await Deno.remove(tempPath);
  }
});
