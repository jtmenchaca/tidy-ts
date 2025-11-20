/**
 * Test async detection behavior with stats module functions
 *
 * This test specifically examines how s.min(), s.max(), and other stats
 * functions behave in the async detection system when used in summarize().
 */

import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "../../src/dataframe/mod.ts";

Deno.test("async detection - s.min() in summarize should return DataFrame", () => {
  console.log("\n=== Testing s.min() async detection ===\n");

  const data = createDataFrame([
    { category: "A", value: 10 },
    { category: "A", value: 20 },
    { category: "B", value: 5 },
    { category: "B", value: 15 },
  ]);

  const result = data
    .groupBy("category")
    .summarize({
      minValue: (g) => s.min(g.value),
    });

  console.log("Result type:", typeof result);
  console.log("Result constructor:", result.constructor.name);
  console.log("Has nrows:", typeof result.nrows);

  // Should be a DataFrame, not PromisedDataFrame
  expect(typeof result.nrows).toBe("function");

  const rowCount = result.nrows();
  expect(rowCount).toBe(2);

  const rows = result.toArray();
  expect(rows).toEqual([
    { category: "A", minValue: 10 },
    { category: "B", minValue: 5 },
  ]);
});

Deno.test("async detection - s.max() in summarize should return DataFrame", () => {
  console.log("\n=== Testing s.max() async detection ===\n");

  const data = createDataFrame([
    { category: "A", value: 10 },
    { category: "A", value: 20 },
    { category: "B", value: 5 },
    { category: "B", value: 15 },
  ]);

  const result = data
    .groupBy("category")
    .summarize({
      maxValue: (g) => s.max(g.value),
    });

  console.log("Result type:", typeof result);
  console.log("Result constructor:", result.constructor.name);
  console.log("Has nrows:", typeof result.nrows);

  // Should be a DataFrame, not PromisedDataFrame
  expect(typeof result.nrows).toBe("function");

  const rowCount = result.nrows();
  expect(rowCount).toBe(2);

  const rows = result.toArray();
  expect(rows).toEqual([
    { category: "A", maxValue: 20 },
    { category: "B", maxValue: 15 },
  ]);
});

Deno.test("async detection - s.min() and s.max() together", () => {
  console.log("\n=== Testing s.min() and s.max() together ===\n");

  const data = createDataFrame([
    { category: "A", value: 10 },
    { category: "A", value: 20 },
    { category: "B", value: 5 },
    { category: "B", value: 15 },
  ]);

  const result = data
    .groupBy("category")
    .summarize({
      minValue: (g) => s.min(g.value),
      maxValue: (g) => s.max(g.value),
    });

  console.log("Result type:", typeof result);
  console.log("Result constructor:", result.constructor.name);
  console.log("Has nrows:", typeof result.nrows);

  // Should be a DataFrame, not PromisedDataFrame
  expect(typeof result.nrows).toBe("function");

  const rowCount = result.nrows();
  expect(rowCount).toBe(2);

  const rows = result.toArray();
  expect(rows).toEqual([
    { category: "A", minValue: 10, maxValue: 20 },
    { category: "B", minValue: 5, maxValue: 15 },
  ]);
});

Deno.test("async detection - s.mean() should return DataFrame", () => {
  console.log("\n=== Testing s.mean() async detection ===\n");

  const data = createDataFrame([
    { category: "A", value: 10 },
    { category: "A", value: 20 },
    { category: "B", value: 5 },
    { category: "B", value: 15 },
  ]);

  const result = data
    .groupBy("category")
    .summarize({
      avgValue: (g) => s.mean(g.value),
    });

  expect(typeof result.nrows).toBe("function");
  expect(result.nrows()).toBe(2);
});

Deno.test("async detection - s.sum() should return DataFrame", () => {
  console.log("\n=== Testing s.sum() async detection ===\n");

  const data = createDataFrame([
    { category: "A", value: 10 },
    { category: "A", value: 20 },
    { category: "B", value: 5 },
    { category: "B", value: 15 },
  ]);

  const result = data
    .groupBy("category")
    .summarize({
      total: (g) => s.sum(g.value),
    });

  expect(typeof result.nrows).toBe("function");
  expect(result.nrows()).toBe(2);
});

Deno.test("async detection - s.median() should return DataFrame", () => {
  console.log("\n=== Testing s.median() async detection ===\n");

  const data = createDataFrame([
    { category: "A", value: 10 },
    { category: "A", value: 20 },
    { category: "A", value: 30 },
    { category: "B", value: 5 },
    { category: "B", value: 15 },
  ]);

  const result = data
    .groupBy("category")
    .summarize({
      medianValue: (g) => s.median(g.value),
    });

  expect(typeof result.nrows).toBe("function");
  expect(result.nrows()).toBe(2);
});

Deno.test("async detection - s.stdev() should return DataFrame", () => {
  console.log("\n=== Testing s.stdev() async detection ===\n");

  const data = createDataFrame([
    { category: "A", value: 10 },
    { category: "A", value: 20 },
    { category: "B", value: 5 },
    { category: "B", value: 15 },
  ]);

  const result = data
    .groupBy("category")
    .summarize({
      stdDev: (g) => s.stdev(g.value),
    });

  expect(typeof result.nrows).toBe("function");
  expect(result.nrows()).toBe(2);
});

Deno.test("async detection - s.variance() should return DataFrame", () => {
  console.log("\n=== Testing s.variance() async detection ===\n");

  const data = createDataFrame([
    { category: "A", value: 10 },
    { category: "A", value: 20 },
    { category: "B", value: 5 },
    { category: "B", value: 15 },
  ]);

  const result = data
    .groupBy("category")
    .summarize({
      variance: (g) => s.variance(g.value),
    });

  expect(typeof result.nrows).toBe("function");
  expect(result.nrows()).toBe(2);
});

Deno.test("async detection - multiple stats functions together", () => {
  console.log("\n=== Testing multiple stats functions ===\n");

  const data = createDataFrame([
    { category: "A", value: 10 },
    { category: "A", value: 20 },
    { category: "A", value: 30 },
    { category: "B", value: 5 },
    { category: "B", value: 15 },
    { category: "B", value: 25 },
  ]);

  const result = data
    .groupBy("category")
    .summarize({
      min: (g) => s.min(g.value),
      max: (g) => s.max(g.value),
      mean: (g) => s.mean(g.value),
      median: (g) => s.median(g.value),
      sum: (g) => s.sum(g.value),
      stdev: (g) => s.stdev(g.value),
    });

  console.log("Result type:", typeof result);
  console.log("Result constructor:", result.constructor.name);
  console.log("Has nrows:", typeof result.nrows);

  expect(typeof result.nrows).toBe("function");
  expect(result.nrows()).toBe(2);
});

Deno.test("async detection - property access should return DataFrame", () => {
  console.log("\n=== Testing property access async detection ===\n");

  const data = createDataFrame([
    { category: "A", description: "First", value: 10 },
    { category: "A", description: "Second", value: 20 },
    { category: "B", description: "Third", value: 5 },
  ]);

  const result = data
    .groupBy("category")
    .summarize({
      firstDesc: (g) => g.description[0],
      count: (g) => g.nrows(),
    });

  console.log("Result type:", typeof result);
  console.log("Result constructor:", result.constructor.name);
  console.log("Has nrows:", typeof result.nrows);

  expect(typeof result.nrows).toBe("function");
  expect(result.nrows()).toBe(2);
});

Deno.test("async detection - larger dataset with s.min/s.max", () => {
  console.log("\n=== Testing with larger dataset ===\n");

  // Create a larger dataset similar to user's scenario
  const largeData = [];
  for (let i = 0; i < 1000; i++) {
    largeData.push({
      icd10: `ICD${Math.floor(i / 100)}`,
      mdc: `MDC${Math.floor(i / 100)}`,
      drg_num: 100 + i,
    });
  }

  const data = createDataFrame(largeData);

  const result = data
    .groupBy("icd10", "mdc")
    .summarize({
      drgStart: (g) => s.min(g.drg_num),
      drgEnd: (g) => s.max(g.drg_num),
    });

  console.log("Result type:", typeof result);
  console.log("Result constructor:", result.constructor.name);
  console.log("Has nrows:", typeof result.nrows);

  expect(typeof result.nrows).toBe("function");
  expect(result.nrows()).toBe(10);
});

Deno.test("async detection - with parseInt like user's DRG code", () => {
  console.log("\n=== Testing with parseInt (DRG scenario) ===\n");

  const testData = createDataFrame([
    { icd10: "A00", mdc: "MDC01", drg: "100" },
    { icd10: "A00", mdc: "MDC01", drg: "105" },
    { icd10: "A00", mdc: "MDC01", drg: "110" },
    { icd10: "B01", mdc: "MDC02", drg: "200" },
    { icd10: "B01", mdc: "MDC02", drg: "210" },
  ]);

  console.log("Step 1: Creating DataFrame with string DRG values");

  // Add numeric DRG column using parseInt - exactly like user's code
  const withNumericDrg = testData.mutate({
    drg_num: (row) => parseInt(row.drg),
  });

  console.log("Step 2: Mutated to add drg_num column");
  console.log("withNumericDrg has nrows:", typeof withNumericDrg.nrows);

  // This is where the issue occurs - using s.min and s.max in summarize
  const icdGroups = withNumericDrg
    .groupBy("icd10", "mdc")
    .summarize({
      drgStart: (g) => s.min(g.drg_num),
      drgEnd: (g) => s.max(g.drg_num),
    });

  console.log("Step 3: After groupBy().summarize()");
  console.log("icdGroups type:", typeof icdGroups);
  console.log("icdGroups constructor:", icdGroups.constructor.name);
  console.log("icdGroups has nrows:", typeof icdGroups.nrows);

  // This should work - nrows() should be available
  expect(typeof icdGroups.nrows).toBe("function");
  const rowCount = icdGroups.nrows();
  expect(rowCount).toBe(2);

  const rows = icdGroups.toArray();
  expect(rows).toEqual([
    { icd10: "A00", mdc: "MDC01", drgStart: 100, drgEnd: 110 },
    { icd10: "B01", mdc: "MDC02", drgStart: 200, drgEnd: 210 },
  ]);
});

Deno.test("async detection - testing with actual async function should return PromisedDataFrame", async () => {
  console.log("\n=== Testing with actual async function ===\n");

  const data = createDataFrame([
    { category: "A", value: 10 },
    { category: "B", value: 20 },
  ]);

  // This SHOULD return a PromisedDataFrame
  const result = data
    .groupBy("category")
    .summarize({
      asyncValue: async (g) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return s.sum(g.value);
      },
    });

  console.log("Result type:", typeof result);
  console.log("Result constructor:", result.constructor.name);
  console.log("Has nrows:", typeof result.nrows);
  console.log("Has then:", typeof (result as any).then);

  // This should be a PromisedDataFrame, so we need to await it
  const awaited = await result;
  expect(typeof awaited.nrows).toBe("function");
  expect(awaited.nrows()).toBe(2);
});

Deno.test("NaN handling - s.min() and s.max() with NaN values", () => {
  console.log("\n=== Testing NaN handling in s.min() and s.max() ===\n");

  const data = createDataFrame([
    { category: "A", value: 10 },
    { category: "A", value: NaN },
    { category: "A", value: 20 },
    { category: "B", value: 5 },
    { category: "B", value: NaN },
    { category: "B", value: 15 },
  ]);

  console.log("Testing with NaN values in dataset");

  const result = data
    .groupBy("category")
    .summarize({
      minValue: (g) => {
        console.log(`Category ${g.category[0]} values:`, g.value);
        const minResult = s.min(g.value);
        console.log(`s.min result:`, minResult);
        return minResult;
      },
      maxValue: (g) => {
        const maxResult = s.max(g.value);
        console.log(`s.max result:`, maxResult);
        return maxResult;
      },
    });

  console.log("Result type:", typeof result);
  console.log("Result constructor:", result.constructor.name);
  console.log("Has nrows:", typeof result.nrows);

  expect(typeof result.nrows).toBe("function");

  const rows = result.toArray();
  console.log("Result rows:", rows);

  // Check what the actual values are
  rows.forEach((row) => {
    console.log(
      `Category ${row.category}: min=${row.minValue}, max=${row.maxValue}`,
    );
    console.log(`  min is NaN: ${Number.isNaN(row.minValue)}`);
    console.log(`  max is NaN: ${Number.isNaN(row.maxValue)}`);
  });
});

Deno.test("NaN handling - direct s.min() and s.max() calls with array containing NaN", () => {
  console.log("\n=== Testing direct s.min/s.max with NaN array ===\n");

  const testArray = [10, NaN, 20, 5];

  const minResult = s.min(testArray);
  const maxResult = s.max(testArray);

  console.log("Input array:", testArray);
  console.log("s.min result:", minResult, "- isNaN:", Number.isNaN(minResult));
  console.log("s.max result:", maxResult, "- isNaN:", Number.isNaN(maxResult));

  // Document the actual behavior
  console.log("Math.min behavior:", Math.min(...testArray));
  console.log("Math.max behavior:", Math.max(...testArray));
});
