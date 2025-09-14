import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Simple async function for testing
async function processAsync(value: unknown): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return `processed-${value}`;
}

Deno.test("forEachRow with async function - simplest case", async () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  console.log("Original DataFrame:");
  df.print();

  const results: string[] = [];

  // Test async function in forEachRow
  const resultDF = await df.forEachRow(async (row, idx) => {
    const processed = await processAsync(row.name);
    results.push(`Row ${idx}: ${processed}`);
    console.log(`Processed row ${idx}: ${row.name} -> ${processed}`);
  });

  // Should return the same DataFrame for chaining
  expect(resultDF).toBe(df);

  // Check that async processing completed
  expect(results.length).toBe(2);
  expect(results[0]).toBe("Row 0: processed-Alice");
  expect(results[1]).toBe("Row 1: processed-Bob");
});

Deno.test("forEachRow with sync function - comparison", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const results: string[] = [];

  // Test sync function in forEachRow (should not return Promise)
  const resultDF = df.forEachRow((row, idx) => {
    results.push(`Row ${idx}: sync-${row.name}`);
  });

  // Should return the same DataFrame immediately
  expect(resultDF).toBe(df);
  expect(results.length).toBe(2);
  expect(results[0]).toBe("Row 0: sync-Alice");
  expect(results[1]).toBe("Row 1: sync-Bob");
});

Deno.test("forEachCol with async function - simplest case", async () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", score: 95 },
    { id: 2, name: "Bob", score: 87 },
  ]);

  console.log("Original DataFrame:");
  df.print();

  const results: string[] = [];

  // Test async function in forEachCol
  const resultDF = await df.forEachCol(async (colName, df) => {
    const processed = await processAsync(colName);
    // deno-lint-ignore no-explicit-any
    const colValues = (df as any)[colName as string];
    results.push(
      `Column ${String(colName)}: ${processed}, values: [${
        Array.isArray(colValues) ? colValues.join(", ") : colValues
      }]`,
    );
    console.log(`Processed column ${String(colName)} -> ${processed}`);
  });

  // Should return the same DataFrame for chaining
  expect(resultDF).toBe(df);

  // Check that async processing completed for all columns
  expect(results.length).toBe(3);
  expect(results[0]).toContain("Column id: processed-id");
  expect(results[1]).toContain("Column name: processed-name");
  expect(results[2]).toContain("Column score: processed-score");
});

Deno.test("forEachCol with sync function - comparison", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const results: string[] = [];

  // Test sync function in forEachCol (should not return Promise)
  const resultDF = df.forEachCol((colName) => {
    results.push(`Column: sync-${String(colName)}`);
  });

  // Should return the same DataFrame immediately
  expect(resultDF).toBe(df);
  expect(results.length).toBe(2);
  expect(results[0]).toBe("Column: sync-id");
  expect(results[1]).toBe("Column: sync-name");
});

Deno.test("async forEach with chaining", async () => {
  const df = createDataFrame([
    { category: "A", value: 10 },
    { category: "B", value: 20 },
    { category: "A", value: 30 },
  ]);

  const processedRows: string[] = [];

  // Chain operations: filter -> async forEachRow -> mutate
  const afterFilter = df.filter((r) => r.value >= 15); // Remove first row

  const afterAsyncForEach = await afterFilter
    .forEachRow(async (row, _idx) => {
      const processed = await processAsync(`${row.category}-${row.value}`);
      processedRows.push(processed);
      console.log(`Async processed: ${processed}`);
    });

  const result = afterAsyncForEach
    .mutate({
      doubled: (r) => r.value * 2,
    });

  console.log("Final result after chaining:");
  result.print();

  const data = result.toArray();

  // Should have 2 rows after filter
  expect(data.length).toBe(2);
  expect(data[0].value).toBe(20);
  expect(data[0].doubled).toBe(40);
  expect(data[1].value).toBe(30);
  expect(data[1].doubled).toBe(60);

  // Check that async processing completed
  expect(processedRows.length).toBe(2);
  expect(processedRows[0]).toBe("processed-B-20");
  expect(processedRows[1]).toBe("processed-A-30");
});
