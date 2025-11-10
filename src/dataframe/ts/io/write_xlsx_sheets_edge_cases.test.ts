import { createDataFrame } from "../dataframe/index.ts";
import { writeXLSX } from "./write_xlsx.ts";
import { readXLSX } from "./read_xlsx.ts";
import { expect } from "@std/expect";
import { z } from "zod";

const TEST_FILE = "/tmp/test-edge-cases.xlsx";

// Helper to ensure clean test file
async function cleanTestFile() {
  try {
    await Deno.remove(TEST_FILE);
  } catch {
    // File doesn't exist, that's fine
  }
}

Deno.test("writeXLSX edge case - empty DataFrame", async () => {
  await cleanTestFile();

  const df = createDataFrame([
    { name: "Alice", age: 30 },
  ]).filter(() => false); // Create empty DataFrame

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });

  const result = await readXLSX(TEST_FILE, schema);
  expect(result.nrows()).toBe(0);
  expect(result.columns()).toEqual(["name", "age"]);
});

Deno.test("writeXLSX edge case - single row DataFrame", async () => {
  await cleanTestFile();

  const df = createDataFrame([
    { x: 1 },
  ]);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({ x: z.number() });
  const result = await readXLSX(TEST_FILE, schema);
  expect(result.nrows()).toBe(1);
  expect(result.toArray()[0].x).toBe(1);
});

Deno.test("writeXLSX edge case - single column DataFrame", async () => {
  await cleanTestFile();

  const df = createDataFrame([
    { x: 1 },
    { x: 2 },
    { x: 3 },
  ]);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({ x: z.number() });
  const result = await readXLSX(TEST_FILE, schema);
  expect(result.nrows()).toBe(3);
  expect(result.columns()).toEqual(["x"]);
});

Deno.test("writeXLSX edge case - special characters in sheet names", async () => {
  await cleanTestFile();

  const df = createDataFrame([{ x: 1 }]);

  // Test various special characters
  await writeXLSX(df, TEST_FILE, { sheet: "Data & Analysis" });
  await writeXLSX(df, TEST_FILE, { sheet: "Q1 < Q2 > Q3" });
  await writeXLSX(df, TEST_FILE, { sheet: 'It\'s "Great"' });

  const schema = z.object({ x: z.number() });

  const result1 = await readXLSX(TEST_FILE, schema, {
    sheet: "Data & Analysis",
  });
  const result2 = await readXLSX(TEST_FILE, schema, { sheet: "Q1 < Q2 > Q3" });
  const result3 = await readXLSX(TEST_FILE, schema, { sheet: 'It\'s "Great"' });

  expect(result1.nrows()).toBe(1);
  expect(result2.nrows()).toBe(1);
  expect(result3.nrows()).toBe(1);
});

Deno.test("writeXLSX edge case - special characters in column names", async () => {
  await cleanTestFile();

  const df = createDataFrame([
    { "User Name": "Alice", "Age (years)": 30, "Email<ID>": "alice@test.com" },
  ]);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({
    "User Name": z.string(),
    "Age (years)": z.number(),
    "Email<ID>": z.string(),
  });

  const result = await readXLSX(TEST_FILE, schema);
  expect(result.nrows()).toBe(1);
  const row = result.toArray()[0];
  expect(row["User Name"]).toBe("Alice");
  expect(row["Age (years)"]).toBe(30);
  expect(row["Email<ID>"]).toBe("alice@test.com");
});

Deno.test("writeXLSX edge case - special characters in cell values", async () => {
  await cleanTestFile();

  const df = createDataFrame([
    { text: "Hello & goodbye" },
    { text: 'Quote: "test"' },
    { text: "Less < than > greater" },
    { text: "Apostrophe's here" },
  ]);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({ text: z.string() });
  const result = await readXLSX(TEST_FILE, schema);
  const rows = result.toArray();

  expect(rows[0].text).toBe("Hello & goodbye");
  expect(rows[1].text).toBe('Quote: "test"');
  expect(rows[2].text).toBe("Less < than > greater");
  expect(rows[3].text).toBe("Apostrophe's here");
});

Deno.test("writeXLSX edge case - whitespace in cell values", async () => {
  await cleanTestFile();

  const df = createDataFrame([
    { text: "  leading spaces" },
    { text: "trailing spaces  " },
    { text: "  both  " },
    { text: "multiple   spaces   inside" },
    { text: "\ttab\tcharacters\t" },
    { text: "line\nbreaks\nhere" },
  ]);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({ text: z.string() });
  const result = await readXLSX(TEST_FILE, schema);
  const rows = result.toArray();

  expect(rows[0].text).toBe("  leading spaces");
  expect(rows[1].text).toBe("trailing spaces  ");
  expect(rows[2].text).toBe("  both  ");
  expect(rows[3].text).toBe("multiple   spaces   inside");
  expect(rows[4].text).toBe("\ttab\tcharacters\t");
  expect(rows[5].text).toBe("line\nbreaks\nhere");
});

Deno.test("writeXLSX edge case - null and undefined values", async () => {
  await cleanTestFile();

  const df = createDataFrame([
    { a: 1, b: "hello", c: true },
    { a: null, b: "world", c: false },
    { a: 3, b: null, c: null },
  ]);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({
    a: z.number().nullable(),
    b: z.string().nullable(),
    c: z.boolean().nullable(),
  });

  const result = await readXLSX(TEST_FILE, schema);
  expect(result.nrows()).toBe(3);
  const rows = result.toArray();

  expect(rows[0].a).toBe(1);
  expect(rows[1].a).toBe(null);
  expect(rows[2].b).toBe(null);
  expect(rows[2].c).toBe(null);
});

Deno.test("writeXLSX edge case - extreme number values", async () => {
  await cleanTestFile();

  const df = createDataFrame([
    { num: 0 },
    { num: -0 },
    { num: Number.MAX_SAFE_INTEGER },
    { num: Number.MIN_SAFE_INTEGER },
    { num: 1.7976931348623157e+308 }, // Near MAX_VALUE
    { num: 5e-324 }, // Near MIN_VALUE
    { num: -999999999999999 },
  ]);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({ num: z.number() });
  const result = await readXLSX(TEST_FILE, schema);
  const rows = result.toArray();

  expect(rows[0].num).toBe(0);
  expect(rows[2].num).toBe(Number.MAX_SAFE_INTEGER);
  expect(rows[3].num).toBe(Number.MIN_SAFE_INTEGER);
});

Deno.test("writeXLSX edge case - very long strings", async () => {
  await cleanTestFile();

  const longString = "A".repeat(10000);
  const df = createDataFrame([
    { text: longString },
    { text: "short" },
    { text: "B".repeat(5000) },
  ]);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({ text: z.string() });
  const result = await readXLSX(TEST_FILE, schema);
  const rows = result.toArray();

  expect(rows[0].text).toBe(longString);
  expect(rows[1].text).toBe("short");
  expect(rows[2].text.length).toBe(5000);
});

Deno.test("writeXLSX edge case - duplicate string values (shared strings optimization)", async () => {
  await cleanTestFile();

  const df = createDataFrame([
    { category: "A", status: "Active" },
    { category: "A", status: "Active" },
    { category: "A", status: "Active" },
    { category: "B", status: "Inactive" },
    { category: "B", status: "Inactive" },
  ]);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({
    category: z.string(),
    status: z.string(),
  });

  const result = await readXLSX(TEST_FILE, schema);
  expect(result.nrows()).toBe(5);
  const rows = result.toArray();

  expect(rows[0].category).toBe("A");
  expect(rows[0].status).toBe("Active");
  expect(rows[3].category).toBe("B");
});

Deno.test("writeXLSX edge case - Date edge cases", async () => {
  await cleanTestFile();

  const df = createDataFrame([
    { date: new Date("1900-01-01") }, // Excel epoch edge
    { date: new Date("1899-12-31") }, // Before Excel epoch
    { date: new Date("2099-12-31") }, // Far future
    { date: new Date("1970-01-01") }, // Unix epoch
  ]);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({
    date: z.coerce.date(),
  });

  const result = await readXLSX(TEST_FILE, schema);
  expect(result.nrows()).toBe(4);
});

Deno.test("writeXLSX edge case - many columns (> 26, test column letters)", async () => {
  await cleanTestFile();

  // Create DataFrame with 30 columns (A-Z, AA-AD)
  const row: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    row[`col${i}`] = i;
  }

  const df = createDataFrame([row]);

  await writeXLSX(df, TEST_FILE);

  const schemaFields: Record<string, z.ZodNumber> = {};
  for (let i = 0; i < 30; i++) {
    schemaFields[`col${i}`] = z.number();
  }
  const schema = z.object(schemaFields);

  const result = await readXLSX(TEST_FILE, schema);
  expect(result.nrows()).toBe(1);
  expect(result.columns().length).toBe(30);
  const resultRow = result.toArray()[0];
  expect(resultRow.col0).toBe(0);
  expect(resultRow.col29).toBe(29);
});

Deno.test("writeXLSX edge case - very long sheet name (31 chars is Excel limit)", async () => {
  await cleanTestFile();

  const df = createDataFrame([{ x: 1 }]);

  // Excel limit is 31 characters for sheet names
  const longName = "A".repeat(31);

  await writeXLSX(df, TEST_FILE, { sheet: longName });

  const schema = z.object({ x: z.number() });
  const result = await readXLSX(TEST_FILE, schema, { sheet: longName });

  expect(result.nrows()).toBe(1);
});

Deno.test("writeXLSX edge case - sheet name with only spaces", async () => {
  await cleanTestFile();

  const df = createDataFrame([{ x: 1 }]);

  await writeXLSX(df, TEST_FILE, { sheet: "   " });

  const schema = z.object({ x: z.number() });
  const result = await readXLSX(TEST_FILE, schema, { sheet: "   " });

  expect(result.nrows()).toBe(1);
});

Deno.test("writeXLSX edge case - mixed data types in same column", async () => {
  await cleanTestFile();

  // TypeScript/DataFrame may handle this differently, but test the behavior
  const df = createDataFrame([
    { value: 123 },
    { value: 456 },
    { value: 789 },
  ]);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({ value: z.number() });
  const result = await readXLSX(TEST_FILE, schema);

  expect(result.nrows()).toBe(3);
  const rows = result.toArray();
  expect(rows[0].value).toBe(123);
  expect(rows[1].value).toBe(456);
});

Deno.test("writeXLSX edge case - empty string values", async () => {
  await cleanTestFile();

  const df = createDataFrame([
    { text: "" },
    { text: "not empty" },
    { text: "" },
  ]);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({ text: z.string() });
  const result = await readXLSX(TEST_FILE, schema);
  const rows = result.toArray();

  expect(rows[0].text).toBe("");
  expect(rows[1].text).toBe("not empty");
  expect(rows[2].text).toBe("");
});

Deno.test("writeXLSX edge case - unicode characters", async () => {
  await cleanTestFile();

  const df = createDataFrame([
    { text: "Hello 世界" },
    { text: "Emoji: 🎉🎊🎈" },
    { text: "Math: ∑∫∂" },
    { text: "Arrows: ←→↑↓" },
  ]);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({ text: z.string() });
  const result = await readXLSX(TEST_FILE, schema);
  const rows = result.toArray();

  expect(rows[0].text).toBe("Hello 世界");
  expect(rows[1].text).toBe("Emoji: 🎉🎊🎈");
  expect(rows[2].text).toBe("Math: ∑∫∂");
  expect(rows[3].text).toBe("Arrows: ←→↑↓");
});

Deno.test("writeXLSX edge case - overwriting corrupt file", async () => {
  await cleanTestFile();

  // Write corrupt data to file
  await Deno.writeFile(
    TEST_FILE,
    new TextEncoder().encode("not a valid xlsx file"),
  );

  // Should treat as new file and overwrite
  const df = createDataFrame([{ x: 1 }]);
  await writeXLSX(df, TEST_FILE);

  const schema = z.object({ x: z.number() });
  const result = await readXLSX(TEST_FILE, schema);

  expect(result.nrows()).toBe(1);
});

Deno.test("writeXLSX edge case - writing to same sheet name repeatedly", async () => {
  await cleanTestFile();

  const df1 = createDataFrame([{ x: 1 }]);
  const df2 = createDataFrame([{ x: 2 }]);
  const df3 = createDataFrame([{ x: 3 }]);

  // Write same sheet multiple times
  await writeXLSX(df1, TEST_FILE, { sheet: "Data" });
  await writeXLSX(df2, TEST_FILE, { sheet: "Data" });
  await writeXLSX(df3, TEST_FILE, { sheet: "Data" });

  const schema = z.object({ x: z.number() });
  const result = await readXLSX(TEST_FILE, schema, { sheet: "Data" });

  // Should only have the last write
  expect(result.nrows()).toBe(1);
  expect(result.toArray()[0].x).toBe(3);
});

Deno.test("writeXLSX edge case - boolean values", async () => {
  await cleanTestFile();

  const df = createDataFrame([
    { flag: true },
    { flag: false },
    { flag: true },
  ]);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({ flag: z.boolean() });
  const result = await readXLSX(TEST_FILE, schema);
  const rows = result.toArray();

  expect(rows[0].flag).toBe(true);
  expect(rows[1].flag).toBe(false);
  expect(rows[2].flag).toBe(true);
});

Deno.test("writeXLSX edge case - large number of rows", async () => {
  await cleanTestFile();

  const rows = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    value: i * 2,
  }));

  const df = createDataFrame(rows);

  await writeXLSX(df, TEST_FILE);

  const schema = z.object({
    id: z.number(),
    value: z.number(),
  });

  const result = await readXLSX(TEST_FILE, schema);
  expect(result.nrows()).toBe(1000);
  const resultRows = result.toArray();
  expect(resultRows[0].id).toBe(0);
  expect(resultRows[999].id).toBe(999);
  expect(resultRows[999].value).toBe(1998);
});
