// Browser-compatible input tests for readCSV (ArrayBuffer, File, Blob)
import { expect } from "@std/expect";
import { z } from "zod";
import { readCSV } from "./read_csv.ts";

/*───────────────────────────────────────────────────────────────────────────┐
│  Browser-compatible input tests (ArrayBuffer, File, Blob)                 │
└───────────────────────────────────────────────────────────────────────────*/

Deno.test("readCSV - ArrayBuffer input", async () => {
  const schema = z.object({
    id: z.number().int(),
    name: z.string(),
    email: z.string().email(),
    age: z.number().optional(),
  });

  // Create CSV content and convert to ArrayBuffer
  const csvContent = `id,name,email,age
1,Alice,alice@example.com,30
2,Bob,bob@example.com,25
3,Charlie,charlie@example.com,`;
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(csvContent).buffer;

  // Read from ArrayBuffer
  const df = await readCSV(arrayBuffer, schema);

  expect(df.nrows()).toBe(3);
  expect(df.ncols()).toBe(4);

  const rows = df.toArray();
  expect(rows[0]).toEqual({
    id: 1,
    name: "Alice",
    email: "alice@example.com",
    age: 30,
  });
  expect(rows[2].age).toBeUndefined();
});

Deno.test("readCSV - File input", async () => {
  const schema = z.object({
    id: z.number().int(),
    name: z.string(),
    email: z.string().email(),
    age: z.number(),
  });

  // Create CSV content and convert to File object
  const csvContent = `id,name,email,age
1,Alice,alice@example.com,30
2,Bob,bob@example.com,25`;
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(csvContent).buffer;
  const file = new File([arrayBuffer], "test.csv", {
    type: "text/csv",
  });

  // Read from File object
  const df = await readCSV(file, schema);

  expect(df.nrows()).toBe(2);
  expect(df.ncols()).toBe(4);

  const rows = df.toArray();
  expect(rows[0]).toEqual({
    id: 1,
    name: "Alice",
    email: "alice@example.com",
    age: 30,
  });
});

Deno.test("readCSV - Blob input", async () => {
  const schema = z.object({
    id: z.number().int(),
    name: z.string(),
    email: z.string().email(),
    age: z.number(),
  });

  // Create CSV content and convert to Blob object
  const csvContent = `id,name,email,age
1,Alice,alice@example.com,30
2,Bob,bob@example.com,25`;
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(csvContent).buffer;
  const blob = new Blob([arrayBuffer], {
    type: "text/csv",
  });

  // Read from Blob object
  const df = await readCSV(blob, schema);

  expect(df.nrows()).toBe(2);
  expect(df.ncols()).toBe(4);

  const rows = df.toArray();
  expect(rows[0]).toEqual({
    id: 1,
    name: "Alice",
    email: "alice@example.com",
    age: 30,
  });
});

Deno.test("readCSV - ArrayBuffer with no_types", async () => {
  // Create CSV content and convert to ArrayBuffer
  const csvContent = `id,name,age,active
1,Alice,30,true
2,Bob,25,false
3,Charlie,35,true`;
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(csvContent).buffer;

  // Read from ArrayBuffer with no_types
  const df = await readCSV(arrayBuffer, { no_types: true });

  expect(df.nrows()).toBe(3);
  expect(df.ncols()).toBe(4);

  const rows = df.toArray();
  expect(rows[0].id).toBe("1"); // Without schema, values remain as strings
  expect(rows[0].name).toBe("Alice");
  expect(rows[0].age).toBe("30");
  expect(rows[0].active).toBe("true");

  // Test DataFrame operations work
  const filtered = df.toArray().filter((row) => row.age === "30");
  expect(filtered.length).toBe(1);
});

Deno.test("readCSV - File with schema validation", async () => {
  const schema = z.object({
    id: z.number().int(),
    name: z.string(),
    age: z.number(),
    active: z.boolean(),
  });

  // Create CSV content and convert to File object
  const csvContent = `id,name,age,active
1,Alice,30,true
2,Bob,25,false
3,Charlie,35,true`;
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(csvContent).buffer;
  const file = new File([arrayBuffer], "test.csv", {
    type: "text/csv",
  });

  // Read from File with schema
  const df = await readCSV(file, schema);

  expect(df.nrows()).toBe(3);
  expect(df.ncols()).toBe(4);

  const rows = df.toArray();
  expect(rows[0].id).toBe(1);
  expect(rows[0].name).toBe("Alice");
  expect(rows[0].age).toBe(30);
  expect(rows[0].active).toBe(true);
});

Deno.test("readCSV - Blob with options", async () => {
  const schema = z.object({
    id: z.number().int(),
    name: z.string(),
    age: z.number(),
    status: z.string().optional(),
  });

  // Create CSV content with NA values and convert to Blob
  const csvContent = `id,name,age,status
1,Alice,30,active
2,Bob,25,NA
3,Charlie,35,`;
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(csvContent).buffer;
  const blob = new Blob([arrayBuffer], {
    type: "text/csv",
  });

  // Read from Blob with trim and naValues options
  const df = await readCSV(blob, schema, {
    trim: true,
    naValues: ["NA", ""],
  });

  expect(df.nrows()).toBe(3);
  expect(df.ncols()).toBe(4);

  const rows = df.toArray();
  expect(rows[0].name).toBe("Alice");
  expect(rows[0].age).toBe(30);
  expect(rows[0].status).toBe("active");
  expect(rows[1].status).toBeUndefined(); // NA should become undefined for optional
  expect(rows[2].status).toBeUndefined(); // Empty should become undefined for optional
});

Deno.test("readCSV - ArrayBuffer with date and boolean fields", async () => {
  const schema = z.object({
    id: z.number(),
    ok: z.boolean(),
    when: z.date(),
  });

  // Create CSV content and convert to ArrayBuffer
  const csvContent = `id,ok,when
1,true,2024-01-01
2,false,2024-12-31`;
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(csvContent).buffer;

  // Read from ArrayBuffer
  const df = await readCSV(arrayBuffer, schema);

  expect(df.nrows()).toBe(2);
  const rows = df.toArray();

  expect(rows[0].id).toBe(1);
  expect(rows[0].ok).toBe(true);
  expect(rows[0].when).toBeInstanceOf(Date);
  expect(rows[0].when.getFullYear()).toBe(2024);

  expect(rows[1].id).toBe(2);
  expect(rows[1].ok).toBe(false);
  expect(rows[1].when).toBeInstanceOf(Date);
});

Deno.test("readCSV - File with no_types and schema validation", async () => {
  const schema = z.object({
    id: z.number().int(),
    name: z.string(),
    age: z.number(),
  });

  // Create CSV content and convert to File object
  const csvContent = `id,name,age
1,Alice,30
2,Bob,25`;
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(csvContent).buffer;
  const file = new File([arrayBuffer], "test.csv", {
    type: "text/csv",
  });

  // Read from File with schema and no_types
  const df = await readCSV(file, schema, { no_types: true });

  expect(df.nrows()).toBe(2);
  expect(df.ncols()).toBe(3);

  const rows = df.toArray();
  // Schema validation still happens, but returns DataFrame<any>
  expect(rows[0].id).toBe(1);
  expect(rows[0].name).toBe("Alice");
  expect(rows[0].age).toBe(30);

  // Test DataFrame operations work
  const grouped = df.groupBy("name");
  const summarized = grouped.summarize({
    count: (g) => g.nrows(),
  });
  expect(summarized.nrows()).toBe(2);
});

Deno.test("readCSV - Blob with empty CSV", async () => {
  // Create empty CSV with headers only
  const csvContent = `id,name
`;
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(csvContent).buffer;
  const blob = new Blob([arrayBuffer], {
    type: "text/csv",
  });

  // Read from Blob with no_types
  const df = await readCSV(blob, { no_types: true });

  expect(df.nrows()).toBe(0);
  expect(df.ncols()).toBe(2);
  expect(df.columns()).toEqual(["id", "name"]);
  expect(df.isEmpty()).toBe(true);
});

Deno.test("readCSV - ArrayBuffer error handling", async () => {
  const schema = z.object({
    id: z.number().int(),
    name: z.string(),
  });

  // Create invalid CSV content (missing required field)
  const csvContent = `id
1`;
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(csvContent).buffer;

  try {
    await readCSV(arrayBuffer, schema);
    throw new Error("Expected error to be thrown");
  } catch (error) {
    expect((error as Error).message).toBeTruthy();
    // Should fail because "name" field is missing
  }
});

Deno.test("readCSV - File with large dataset", async () => {
  const schema = z.object({
    id: z.number().int(),
    name: z.string(),
    score: z.number(),
  });

  // Create CSV with many rows
  const rows: string[] = ["id,name,score"];
  for (let i = 1; i <= 100; i++) {
    rows.push(`${i},Person${i},${80 + (i % 20)}`);
  }
  const csvContent = rows.join("\n");
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(csvContent).buffer;
  const file = new File([arrayBuffer], "large.csv", {
    type: "text/csv",
  });

  // Read from File
  const df = await readCSV(file, schema);

  expect(df.nrows()).toBe(100);
  expect(df.ncols()).toBe(3);

  // Test DataFrame operations work
  const grouped = df.groupBy("name");
  const summarized = grouped.summarize({
    count: (g) => g.nrows(),
    avgScore: (g) => {
      const scores = g.toArray().map((r) => r.score);
      return scores.reduce((a, b) => a + b, 0) / scores.length;
    },
  });

  expect(summarized.nrows()).toBe(100);
  expect(summarized.ncols()).toBe(3);
});

Deno.test("readCSV - ArrayBuffer with delimiter option", async () => {
  const schema = z.object({
    id: z.number().int(),
    name: z.string(),
    age: z.number(),
  });

  // Create CSV with semicolon delimiter
  const csvContent = `id;name;age
1;Alice;30
2;Bob;25`;
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(csvContent).buffer;

  // Read from ArrayBuffer with comma option
  const df = await readCSV(arrayBuffer, schema, {
    comma: ";",
  });

  expect(df.nrows()).toBe(2);
  expect(df.ncols()).toBe(3);

  const rows = df.toArray();
  expect(rows[0].id).toBe(1);
  expect(rows[0].name).toBe("Alice");
  expect(rows[0].age).toBe(30);
});

Deno.test("readCSV - File with NA values", async () => {
  const schema = z.object({
    id: z.number().int(),
    name: z.string(),
    score: z.number().nullable(),
  });

  // Create CSV with NA values
  const csvContent = `id,name,score
1,Alice,85
2,Bob,NA
3,Charlie,90`;
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(csvContent).buffer;
  const file = new File([arrayBuffer], "test.csv", {
    type: "text/csv",
  });

  // Read from File with naValues option
  const df = await readCSV(file, schema, {
    naValues: ["NA"],
  });

  expect(df.nrows()).toBe(3);
  const rows = df.toArray();
  expect(rows[0].score).toBe(85);
  expect(rows[1].score).toBeNull(); // NA should become null for nullable field
  expect(rows[2].score).toBe(90);
});

Deno.test("readCSV - Blob with UTF-8 encoding", async () => {
  const schema = z.object({
    id: z.number().int(),
    name: z.string(),
    city: z.string(),
  });

  // Create CSV with UTF-8 characters
  const csvContent = `id,name,city
1,José,México
2,François,Paris
3,北京,上海`;
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(csvContent).buffer;
  const blob = new Blob([arrayBuffer], {
    type: "text/csv;charset=utf-8",
  });

  // Read from Blob
  const df = await readCSV(blob, schema);

  expect(df.nrows()).toBe(3);
  const rows = df.toArray();
  expect(rows[0].name).toBe("José");
  expect(rows[0].city).toBe("México");
  expect(rows[2].name).toBe("北京");
  expect(rows[2].city).toBe("上海");
});
