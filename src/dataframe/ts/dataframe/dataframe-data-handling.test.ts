/**
 * DataFrame data handling tests - missing data, null/undefined, and type handling
 */

import { expect } from "@std/expect";
import { z } from "zod";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

Deno.test("Missing Data Functions - replaceNA and replace", () => {
  // ============================================================================
  // Test Data Setup
  // ============================================================================

  // Define schema for clean typing
  const MissingDataSchema = z.object({
    name: z.string().nullable(),
    age: z.number().nullable(),
    score: z.number().nullable(),
    active: z.boolean().nullable(),
  });

  const dataWithMissing = createDataFrame([
    { name: "Alice", age: 25, score: null, active: true },
    { name: null, age: 30, score: 85, active: null },
    { name: "Carol", age: null, score: 92, active: false },
    { name: "David", age: 28, score: null, active: true },
    { name: "", age: 0, score: 88, active: false }, // Falsy but not null/undefined
  ], MissingDataSchema);

  // Now this type check should work cleanly
  const _dataWithMissingTypeCheck: DataFrame<{
    name: string | null;
    age: number | null;
    score: number | null;
    active: boolean | null;
  }> = dataWithMissing;

  console.log("Original data with missing values:");
  dataWithMissing.print();

  // ============================================================================
  // replaceNA Tests
  // ============================================================================

  console.log("\n=== replaceNA Tests ===");

  // Test 1: Replace null/undefined values with defaults
  const cleaned = dataWithMissing.replaceNA({
    name: "Unknown",
    age: 0,
    score: -1,
    active: false,
  });

  console.log("After replaceNA:");
  cleaned.print();

  expect(cleaned.nrows()).toBe(5);

  // Check that null values were replaced
  expect(cleaned[0].score).toBe(-1); // was null
  expect(cleaned[1].name).toBe("Unknown"); // was null
  expect(cleaned[1].active).toBe(false); // was null
  expect(cleaned[2].age).toBe(0); // was null
  expect(cleaned[3].score).toBe(-1); // was null

  // Check that falsy values were NOT replaced
  expect(cleaned[4].name).toBe(""); // empty string preserved
  expect(cleaned[4].age).toBe(0); // zero preserved (even though we replace null with 0)

  // Test 2: Partial replacement (only some columns)
  const partialCleaned = dataWithMissing.replaceNA({
    name: "Missing Name",
  });

  expect(partialCleaned[1].name).toBe("Missing Name"); // null replaced
  expect(partialCleaned[0].score).toBe(null); // score null preserved
  expect(partialCleaned[1].age).toBe(30); // non-null values preserved

  // ============================================================================
  // Integration with mutate
  // ============================================================================

  console.log("\n=== Integration with mutate ===");

  // Test replaceNA integration with mutate (proper usage pattern)
  const withCleanedColumns = dataWithMissing
    .replaceNA({
      score: -1,
      name: "Unknown",
    })
    .mutate({
      clean_score: (row) => row.score,
      clean_name: (row) => row.name,
    });

  console.log("After replaceNA + mutate:");
  withCleanedColumns.print();

  expect(withCleanedColumns[0].clean_score).toBe(-1); // null replaced
  expect(withCleanedColumns[1].clean_name).toBe("Unknown"); // null replaced
  expect(withCleanedColumns[3].clean_score).toBe(-1); // null replaced

  // ============================================================================
  // Type Safety Tests
  // ============================================================================

  console.log("\n=== Type Safety Tests ===");

  const TypeSafetySchema = z.object({
    id: z.number(),
    value: z.number().nullable(),
  });

  // Test that TypeScript types are preserved
  const typedData = createDataFrame([
    { id: 1, value: null },
    { id: 2, value: 42 },
  ], TypeSafetySchema);

  const _typedData: DataFrame<{
    id: number;
    value: number | null;
  }> = typedData;

  const typedCleaned = typedData.replaceNA({ value: 0 });

  const cleanValue: number = typedCleaned[0].value;
  expect(cleanValue).toBe(0);

  console.log("✅ All missing data tests passed!");
});
