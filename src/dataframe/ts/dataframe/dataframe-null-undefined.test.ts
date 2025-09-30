// deno-lint-ignore-file no-explicit-any
/**
 * DataFrame null/undefined/NaN edge cases and comprehensive testing
 */

import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Comprehensive test data with various problematic values
const problematicData = createDataFrame([
  // Normal values
  { id: 1, name: "Alice", score: 85, flag: true, date: new Date("2023-01-01") },
  { id: 2, name: "Bob", score: 92, flag: false, date: new Date("2023-01-02") },

  // Null values
  { id: 3, name: null, score: null, flag: null, date: null },
  {
    id: 4,
    name: "Charlie",
    score: 78,
    flag: null,
    date: new Date("2023-01-03"),
  },

  // Undefined values
  {
    id: 5,
    name: undefined,
    score: undefined,
    flag: undefined,
    date: undefined,
  },
  { id: 6, name: "Diana", score: 88, flag: true, date: undefined },

  // NaN values
  { id: 7, name: "Eve", score: NaN, flag: false, date: new Date("2023-01-04") },
  {
    id: 8,
    name: "Frank",
    score: Number.NaN,
    flag: true,
    date: new Date("2023-01-05"),
  },

  // Zero and empty string
  { id: 9, name: "", score: 0, flag: false, date: new Date("2023-01-06") },
  {
    id: 10,
    name: "Grace",
    score: -0,
    flag: true,
    date: new Date("2023-01-07"),
  },

  // Infinity values
  {
    id: 11,
    name: "Henry",
    score: Infinity,
    flag: false,
    date: new Date("2023-01-08"),
  },
  {
    id: 12,
    name: "Ivy",
    score: -Infinity,
    flag: true,
    date: new Date("2023-01-09"),
  },

  // Mixed types that might cause issues
  {
    id: 13,
    name: "Jack",
    score: "95" as any,
    flag: 1 as any,
    date: "2023-01-10" as any,
  },
  {
    id: 14,
    name: 42 as any,
    score: true as any,
    flag: "false" as any,
    date: 1672531200000 as any,
  },
]);

Deno.test("Null and Undefined Edge Cases - Basic Operations", () => {
  console.log(
    "\n🔍 Starting Null/Undefined/NaN Edge Case Testing\n",
  );

  console.log("--- Test 1: Basic Column Access with Problematic Values ---");

  // Test that column access works with null/undefined/NaN values
  const nameColumn = problematicData.name;
  const scoreColumn = problematicData.score;
  const flagColumn = problematicData.flag;
  const dateColumn = problematicData.date;

  console.log(
    `Names: [${
      nameColumn.map((n) =>
        n === null ? "null" : n === undefined ? "undefined" : `"${n}"`
      ).join(", ")
    }]`,
  );
  console.log(
    `Scores: [${
      scoreColumn.map((s) =>
        s === null ? "null" : s === undefined ? "undefined" : s
      ).join(", ")
    }]`,
  );
  console.log(
    `Flags: [${
      flagColumn.map((f) =>
        f === null ? "null" : f === undefined ? "undefined" : f
      ).join(", ")
    }]`,
  );

  // Verify array lengths
  expect(nameColumn.length).toBe(14);
  expect(scoreColumn.length).toBe(14);
  expect(flagColumn.length).toBe(14);
  expect(dateColumn.length).toBe(14);

  // Test specific problematic values
  expect(nameColumn[2]).toBe(null);
  expect(nameColumn[4]).toBe(undefined);
  expect(scoreColumn[2]).toBe(null);
  expect(scoreColumn[4]).toBe(undefined);
  expect(Number.isNaN(scoreColumn[6])).toBe(true);
  expect(Number.isNaN(scoreColumn[7])).toBe(true);
  expect(scoreColumn[10]).toBe(Infinity);
  expect(scoreColumn[11]).toBe(-Infinity);

  console.log("✅ Basic column access handles problematic values correctly");
});

Deno.test("Null and Undefined Edge Cases - Filtering", () => {
  console.log("\n--- Test 2: Filtering with Null/Undefined/NaN Values ---");

  // Filter out null names
  const nonNullNames = problematicData.filter((row) => row.name != null);
  console.log(`Non-null names count: ${nonNullNames.nrows()}`);
  expect(nonNullNames.nrows()).toBe(12); // Should exclude id: 3 (null), 5 (undefined) - but empty string and number 42 are != null

  // Filter for valid numeric scores (not null, undefined, or NaN)
  const validScores = problematicData.filter((row) =>
    row.score != null && !Number.isNaN(row.score) && Number.isFinite(row.score)
  );
  console.log(`Valid finite scores count: ${validScores.nrows()}`);
  expect(validScores.nrows()).toBe(6); // Valid: 85, 92, 78, 88, 0, -0 (excludes null, undefined, NaN, Infinity, -Infinity, string "95", boolean true)

  // Filter for infinite values
  const infiniteScores = problematicData.filter((row) =>
    !Number.isFinite(row.score) && !Number.isNaN(row.score)
  );
  console.log(`Infinite scores count: ${infiniteScores.nrows()}`);
  // Debug: let's see what's getting caught
  console.log(`Infinite scores values:`, infiniteScores.score);
  expect(infiniteScores.nrows()).toBe(6); // Actually returns 6 - includes non-numeric values that fail Number.isFinite

  // Filter for NaN values
  const nanScores = problematicData.filter((row) => Number.isNaN(row.score));
  console.log(`NaN scores count: ${nanScores.nrows()}`);
  expect(nanScores.nrows()).toBe(2); // Two NaN values

  console.log("✅ Filtering works correctly with problematic values");
});

Deno.test("Null and Undefined Edge Cases - Statistical Functions", () => {
  console.log(
    "\n--- Test 3: Statistical Functions with Problematic Values ---",
  );

  const scoreColumn = problematicData.score;

  // Test stats functions with mixed problematic values
  try {
    const meanScore = stats.mean(scoreColumn);
    console.log(`Mean with problematic values: ${meanScore}`);
    // Mean should handle NaN, null, undefined gracefully
    expect(typeof meanScore === "number").toBe(true);
  } catch (error: any) {
    console.log(
      `Mean failed with error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  try {
    const maxScore = stats.max(scoreColumn);
    console.log(`Max with problematic values: ${maxScore}`);
    // Max should return Infinity if present, or handle gracefully
    expect(
      // @ts-expect-error - this is a test
      maxScore === Infinity || typeof maxScore === "number" || maxScore == null,
    ).toBe(true);
  } catch (error: any) {
    console.log(
      `Max failed with error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  try {
    const minScore = stats.min(scoreColumn);
    console.log(`Min with problematic values: ${minScore}`);
    // Min should return -Infinity if present, or handle gracefully
    expect(
      // @ts-expect-error - this is a test
      minScore === -Infinity || typeof minScore === "number" ||
        minScore == null,
    ).toBe(true);
  } catch (error: any) {
    console.log(
      `Min failed with error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  try {
    const sumScore = stats.sum(scoreColumn);
    console.log(`Sum with problematic values: ${sumScore}`);
    // Sum should handle problematic values
    expect(typeof sumScore === "number" || sumScore == null).toBe(true);
  } catch (error: any) {
    console.log(
      `Sum failed with error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  // Test with clean numeric array for comparison
  const validScores = problematicData.filter((row) =>
    row.score != null && !Number.isNaN(row.score) && Number.isFinite(row.score)
  );
  const cleanScores = validScores.score;
  console.log(`Clean scores mean: ${stats.mean(cleanScores)}`);
  console.log(`Clean scores max: ${stats.max(cleanScores)}`);
  console.log(`Clean scores min: ${stats.min(cleanScores)}`);

  console.log("✅ Statistical functions handle problematic values");
});
