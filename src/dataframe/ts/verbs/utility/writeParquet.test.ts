import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { parquetReadObjects } from "hyparquet";
import { write_parquet as writeParquet } from "./writeParquet.verb.ts";

Deno.test("writeParquet() basic functionality", async () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", age: 30 },
    { id: 2, name: "Bob", age: 25 },
  ]);

  const tempFile = "./test-basic.parquet";
  writeParquet(df, tempFile);

  // Read back the file to verify
  const uint8Array = await Deno.readFile(tempFile);
  const buffer = uint8Array.buffer.slice(
    uint8Array.byteOffset,
    uint8Array.byteOffset + uint8Array.byteLength,
  );
  const data = await parquetReadObjects({ file: buffer });

  expect(data.length).toBe(2);
  expect(data[0].id).toBe(1);
  expect(data[0].name).toBe("Alice");
  expect(data[0].age).toBe(30);
  expect(data[1].id).toBe(2);
  expect(data[1].name).toBe("Bob");
  expect(data[1].age).toBe(25);

  await Deno.remove(tempFile);
});

Deno.test("writeParquet() no options needed", async () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const tempFile = "./test-simple.parquet";
  writeParquet(df, tempFile);

  // Read back and verify
  const uint8Array = await Deno.readFile(tempFile);
  const buffer = uint8Array.buffer.slice(
    uint8Array.byteOffset,
    uint8Array.byteOffset + uint8Array.byteLength,
  );
  const data = await parquetReadObjects({ file: buffer });

  expect(data.length).toBe(2);
  expect(data[0].id).toBe(1);
  expect(data[0].name).toBe("Alice");
  expect(data[1].id).toBe(2);
  expect(data[1].name).toBe("Bob");

  await Deno.remove(tempFile);
});

Deno.test("writeParquet() chaining works", async () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", age: 30 },
    { id: 2, name: "Bob", age: 25 },
  ]);

  const tempFile = "./test-chaining.parquet";

  writeParquet(df, tempFile);

  const result = df
    .mutate({ doubleAge: (row) => row.age * 2 })
    .filter((row) => row.doubleAge > 50);

  expect(result.nrows()).toBe(1);
  expect(result[0].name).toBe("Alice");
  expect(result[0].doubleAge).toBe(60);

  // Verify file was written
  expect((await Deno.stat(tempFile)).isFile).toBe(true);

  // Verify file contents
  const uint8Array = await Deno.readFile(tempFile);
  const buffer = uint8Array.buffer.slice(
    uint8Array.byteOffset,
    uint8Array.byteOffset + uint8Array.byteLength,
  );
  const data = await parquetReadObjects({ file: buffer });
  expect(data.length).toBe(2); // Original data before mutation

  await Deno.remove(tempFile);
});

Deno.test("writeParquet() empty DataFrame", () => {
  const emptyDf = createDataFrame([]);
  const tempFile = "./test-empty.parquet";

  // Should not throw, but create empty/minimal file
  writeParquet(emptyDf, tempFile);

  // For empty DataFrame, hyparquet-writer will create a minimal parquet file or throw
  // We'll just verify it doesn't crash the operation
  expect(true).toBe(true);

  // Clean up - file may not exist if hyparquet-writer handles empty data differently
  try {
    Deno.removeSync(tempFile);
  } catch {
    // Ignore if file doesn't exist
  }
});

Deno.test("writeParquet() with different data types", async () => {
  const df = createDataFrame([
    {
      name: "Alice",
      score: 95.5,
      passed: true,
      count: 42,
    },
    {
      name: "Bob",
      score: 87.2,
      passed: false,
      count: 38,
    },
  ]);

  const tempFile = "./test-types.parquet";
  writeParquet(df, tempFile);

  // Read back and verify types are preserved
  const uint8Array = await Deno.readFile(tempFile);
  const buffer = uint8Array.buffer.slice(
    uint8Array.byteOffset,
    uint8Array.byteOffset + uint8Array.byteLength,
  );
  const data = await parquetReadObjects({ file: buffer });

  expect(data.length).toBe(2);
  expect(typeof data[0].name).toBe("string");
  expect(typeof data[0].score).toBe("number");
  expect(typeof data[0].passed).toBe("boolean");
  expect(typeof data[0].count).toBe("number");

  expect(data[0].name).toBe("Alice");
  expect(data[0].score).toBe(95.5);
  expect(data[0].passed).toBe(true);
  expect(data[0].count).toBe(42);

  await Deno.remove(tempFile);
});

Deno.test("writeParquet() with null values", async () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", score: 95.5 },
    { id: 2, name: "Bob", score: null },
    { id: 3, name: null, score: 87.2 },
  ]);

  const tempFile = "./test-nulls.parquet";
  writeParquet(df, tempFile);

  // Read back and verify nulls are preserved
  const uint8Array = await Deno.readFile(tempFile);
  const buffer = uint8Array.buffer.slice(
    uint8Array.byteOffset,
    uint8Array.byteOffset + uint8Array.byteLength,
  );
  const data = await parquetReadObjects({ file: buffer });

  expect(data.length).toBe(3);
  expect(data[0].score).toBe(95.5);
  expect(data[1].score).toBeNull();
  expect(data[2].name).toBeNull();

  await Deno.remove(tempFile);
});
