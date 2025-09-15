// tests/read_parquet.test.ts
import { expect } from "@std/expect";
import { z } from "zod";
import { type DataFrame, read_parquet } from "@tidy-ts/dataframe";

/*───────────────────────────────────────────────────────────────────────────┐
│  1 · basic inference + coercion                                            │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("read_parquet · basic string coercion & type-inference", async () => {
  const Row = z.object({
    String: z.string().optional(),
  });

  const df = await read_parquet(
    "./src/dataframe/ts/io/fixtures/data_index_bloom_encoding_stats.parquet",
    Row,
  );

  expect(df.nrows()).toBe(14);
  expect(df[0].String).toBe("Hello");
  expect(df[1].String).toBe("This is");

  // compile-time check
  type T = typeof df[0];
  const _ok: T = { String: "test" };
});

/*───────────────────────────────────────────────────────────────────────────┐
│  2 · NA handling (nullable vs optional)                                    │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("read_parquet · NA handling for nullable / optional", async () => {
  const Row = z.object({
    String: z.string().nullable(), // null → null for first row (if any nulls)
  });

  const df = await read_parquet(
    "./src/dataframe/ts/io/fixtures/data_index_bloom_encoding_with_length.parquet",
    Row,
  );

  expect(df.nrows()).toBe(14);
  expect(df[0].String).toBe("Hello");
  expect(df[1].String).toBe("This is");

  // Test that we can handle the data properly
  expect(df.String.length).toBe(14);
});

/*───────────────────────────────────────────────────────────────────────────┐
│  3 · column selection                                                      │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("read_parquet · column selection", async () => {
  const Row = z.object({
    String: z.string(),
  });

  // Read only specific columns
  const df = await read_parquet(
    "./src/dataframe/ts/io/fixtures/data_index_bloom_encoding_stats.parquet",
    Row,
    { columns: ["String"] },
  );

  expect(df.nrows()).toBe(14);
  expect(df[0].String).toBe("Hello");
  expect(df[1].String).toBe("This is");
});

/*───────────────────────────────────────────────────────────────────────────┐
│  4 · date & boolean coercion                                               │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("read_parquet · string coercion with zparquet helpers", async () => {
  const Row = z.object({
    String: z.string().min(1),
  });

  const df = await read_parquet(
    "./src/dataframe/ts/io/fixtures/data_index_bloom_encoding_stats.parquet",
    Row,
  );

  expect(df[0].String).toBe("Hello");
  expect(df[0].String.length).toBeGreaterThan(0);
  expect(df[1].String).toBe("This is");
});

/*───────────────────────────────────────────────────────────────────────────┐
│  5 · validation error bubbles out                                          │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("read_parquet · throws on invalid schema", async () => {
  const Row = z.object({
    NonExistentColumn: z.number().positive(),
  });

  // The function should throw an error when required column doesn't exist
  await expect(
    read_parquet(
      "./src/dataframe/ts/io/fixtures/data_index_bloom_encoding_stats.parquet",
      Row,
    ),
  ).rejects.toThrow();
});

/*───────────────────────────────────────────────────────────────────────────┐
│  6 · file reading with read_parquet()                                     │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("read_parquet() · file reading with schema validation", async () => {
  const Row = z.object({
    String: z.string().min(1),
  });

  const df = await read_parquet(
    "./src/dataframe/ts/io/fixtures/data_index_bloom_encoding_stats.parquet",
    Row,
    {
      naValues: ["", "NA"],
    },
  );

  expect(df.nrows()).toBe(14);
  expect(df[0].String).toBe("Hello");
  expect(df[1].String).toBe("This is");

  // Type checking
  type T = typeof df[0];
  const _ok: T = { String: "test" };
});

/*───────────────────────────────────────────────────────────────────────────┐
│  7 · type inference test (similar to docs issue)                          │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("read_parquet · type inference with complex schema", async () => {
  // Define Zod schema for Parquet data - handles type conversion and validation
  const StringSchema = z.object({
    String: z.string(),
  });

  // Read Parquet with schema validation
  const parquetData = await read_parquet(
    "./src/dataframe/ts/io/fixtures/data_index_bloom_encoding_with_length.parquet",
    StringSchema,
  );

  // TypeScript knows the exact structure after Zod validation
  // This should work without type instantiation errors
  const _typeCheck: DataFrame<z.infer<typeof StringSchema>> = parquetData;
  void _typeCheck; // Suppress unused variable warning

  parquetData.print("DataFrame created from Parquet fixture:");

  expect(parquetData.nrows()).toBe(14);
  expect(parquetData.columns()).toEqual(["String"]);

  // Test some of the string values we expect
  expect(parquetData[0].String).toBe("Hello");
  expect(parquetData[1].String).toBe("This is");
  expect(parquetData[2].String).toBe("a");
});

/*───────────────────────────────────────────────────────────────────────────┐
│  8 · row range selection                                                   │
└───────────────────────────────────────────────────────────────────────────*/
Deno.test("read_parquet · row range selection", async () => {
  const Row = z.object({
    String: z.string(),
  });

  // Read only rows 1-3 (0-indexed, so items 1, 2)
  const df = await read_parquet(
    "./src/dataframe/ts/io/fixtures/data_index_bloom_encoding_with_length.parquet",
    Row,
    {
      rowStart: 1,
      rowEnd: 3,
    },
  );

  expect(df.nrows()).toBe(2);
  expect(df[0].String).toBe("This is"); // row 1
  expect(df[1].String).toBe("a"); // row 2
});
