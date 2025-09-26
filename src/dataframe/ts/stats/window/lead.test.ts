import { expect } from "@std/expect";
import { lead } from "./lead.ts";

Deno.test("Lead Function - Basic Functionality", () => {
  console.log("=== Basic Functionality Tests ===");

  const basicArray = [1, 2, 3, 4, 5];

  // Test 1: Basic lead by 1
  const lead1 = lead(basicArray, 1);
  expect(lead1).toEqual([2, 3, 4, 5, undefined]);
  console.log("✓ Basic lead by 1");

  // Test 2: Basic lead by 2
  const lead2 = lead(basicArray, 2);
  expect(lead2).toEqual([3, 4, 5, undefined, undefined]);
  console.log("✓ Basic lead by 2");

  // Test 3: Lead by 0 (should return copy)
  const lead0 = lead(basicArray, 0);
  expect(lead0).toEqual([1, 2, 3, 4, 5]);
  expect(lead0).not.toBe(basicArray); // Should be a copy
  console.log("✓ Lead by 0 returns copy");

  // Test 4: Default value
  const lead1Default = lead(basicArray, 1, 0);
  expect(lead1Default).toEqual([2, 3, 4, 5, 0]);
  console.log("✓ Lead with default value");
});

Deno.test("Lead Function - Edge Cases Array Sizes", () => {
  console.log("=== Edge Cases - Array Sizes ===");

  // Test 1: Empty array
  const emptyLead = lead([], 1);
  expect(emptyLead).toEqual([]);
  console.log("✓ Empty array");

  // Test 2: Single element
  const singleLead = lead([42], 1);
  expect(singleLead).toEqual([undefined]);
  console.log("✓ Single element");

  // Test 3: Two elements
  const twoLead = lead([10, 20], 1);
  expect(twoLead).toEqual([20, undefined]);
  console.log("✓ Two elements");

  // Test 4: Lead equal to array length
  const basicArray = [1, 2, 3, 4, 5];
  const equalLead = lead(basicArray, 5);
  expect(equalLead).toEqual([
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  console.log("✓ Lead equal to array length");

  // Test 5: Lead greater than array length
  const greaterLead = lead(basicArray, 10);
  expect(greaterLead).toEqual([
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  console.log("✓ Lead greater than array length");
});

Deno.test("Lead Function - Data Types", () => {
  console.log("=== Data Type Tests ===");

  // Test 1: String array
  const stringArray = ["a", "b", "c", "d"];
  const stringLead = lead(stringArray, 1);
  expect(stringLead).toEqual(["b", "c", "d", undefined]);
  console.log("✓ String array");

  // Test 2: Mixed types
  const mixedArray = [1, "hello", true, null, undefined];
  const mixedLead = lead(mixedArray, 1);
  expect(mixedLead).toEqual(["hello", true, null, undefined, undefined]);
  console.log("✓ Mixed types");

  // Test 3: Object array
  const objectArray = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const objectLead = lead(objectArray, 1);
  expect(objectLead).toEqual([{ id: 2 }, { id: 3 }, undefined]);
  console.log("✓ Object array");

  // Test 4: Boolean array
  const boolArray = [true, false, true, false];
  const boolLead = lead(boolArray, 1);
  expect(boolLead).toEqual([false, true, false, undefined]);
  console.log("✓ Boolean array");
});

Deno.test("Lead Function - Null and Undefined Handling", () => {
  console.log("=== Null and Undefined Handling ===");

  // Test 1: Array with null values
  const nullArray = [1, null, 3, null, 5];
  const nullLead = lead(nullArray, 1);
  expect(nullLead).toEqual([null, 3, null, 5, undefined]);
  console.log("✓ Array with null values");

  // Test 2: Array with undefined values
  const undefinedArray = [1, undefined, 3, undefined, 5];
  const undefinedLead = lead(undefinedArray, 1);
  expect(undefinedLead).toEqual([undefined, 3, undefined, 5, undefined]);
  console.log("✓ Array with undefined values");

  // Test 3: Default value with null
  const nullDefaultLead = lead(nullArray, 1, 0);
  expect(nullDefaultLead).toEqual([null, 3, null, 5, 0]);
  console.log("✓ Default value with null array");
});

Deno.test("Lead Function - Error Handling", () => {
  console.log("=== Error Handling ===");

  const basicArray = [1, 2, 3, 4, 5];

  // Test 1: Negative lead should throw
  expect(() => lead(basicArray, -1)).toThrow("Lead k must be non-negative");
  console.log("✓ Negative lead throws error");

  // Test 2: Very negative lead
  expect(() => lead(basicArray, -100)).toThrow("Lead k must be non-negative");
  console.log("✓ Very negative lead throws error");
});

Deno.test("Lead Function - Performance and Large Arrays", () => {
  console.log("=== Performance and Large Arrays ===");

  // Test 1: Large array
  const largeArray = Array.from({ length: 1000 }, (_, i) => i);
  const largeLead = lead(largeArray, 100);
  expect(largeLead[0]).toBe(100);
  expect(largeLead[100]).toBe(200);
  expect(largeLead[899]).toBe(999);
  expect(largeLead[900]).toBe(undefined);
  console.log("✓ Large array (1000 elements)");

  // Test 2: Very large lead on small array
  const smallArray = [1, 2, 3];
  const veryLargeLead = lead(smallArray, 1000);
  expect(veryLargeLead).toEqual([undefined, undefined, undefined]);
  console.log("✓ Very large lead on small array");
});

Deno.test("Lead Function - Immutability", () => {
  console.log("=== Immutability Tests ===");

  const basicArray = [1, 2, 3, 4, 5];

  // Test 1: Original array should not be modified
  const originalArray = [1, 2, 3, 4, 5];
  const originalCopy = [...originalArray];
  lead(originalArray, 1);
  expect(originalArray).toEqual(originalCopy);
  console.log("✓ Original array not modified");

  // Test 2: Result should be independent
  const result1 = lead(basicArray, 1);
  const result2 = lead(basicArray, 2);
  expect(result1).not.toEqual(result2);
  console.log("✓ Results are independent");
});

Deno.test("Lead Function - Type Safety", () => {
  console.log("=== Type Safety Tests ===");

  // Test 1: TypeScript type preservation
  const typedArray: readonly number[] = [1, 2, 3, 4, 5];
  const typedLead = lead(typedArray, 1);
  // Should be (number | undefined)[]
  expect(typedLead[0]).toBe(2);
  expect(typedLead[4]).toBe(undefined);
  expect(typeof typedLead[0]).toBe("number");
  console.log("✓ Type preservation");

  // Test 2: Generic type handling
  const genericArray = [1, 2, 3] as const;
  const genericLead = lead(genericArray, 1);
  expect(genericLead).toEqual([2, 3, undefined]);
  console.log("✓ Generic type handling");
});

Deno.test("Lead Function - Real-world Usage", () => {
  console.log("=== Real-world Usage Scenarios ===");

  // Test 1: Time series data
  const timeSeries = [
    { date: "2023-01", value: 100 },
    { date: "2023-02", value: 150 },
    { date: "2023-03", value: 200 },
    { date: "2023-04", value: 120 },
    { date: "2023-05", value: 180 },
  ];
  const values = timeSeries.map((d) => d.value);
  const leadValues = lead(values, 1, 0);
  expect(leadValues).toEqual([150, 200, 120, 180, 0]);
  console.log("✓ Time series scenario");

  // Test 2: Financial data with gaps
  const financialData = [100, null, 150, 200, null, 180];
  const financialLead = lead(financialData, 1, 0);
  expect(financialLead).toEqual([null, 150, 200, null, 180, 0]);
  console.log("✓ Financial data with gaps");

  // Test 3: Stock price analysis
  const stockPrices = [100, 105, 110, 108, 115, 112];
  const nextDayPrices = lead(stockPrices, 1, null);
  const priceChanges = stockPrices.map((price, i) =>
    nextDayPrices[i] !== null ? nextDayPrices[i]! - price : null
  );
  expect(priceChanges).toEqual([5, 5, -2, 7, -3, null]);
  console.log("✓ Stock price analysis");
});

Deno.test("Lead Function - Boundary Conditions", () => {
  console.log("=== Boundary Condition Tests ===");

  const basicArray = [1, 2, 3, 4, 5];

  // Test 1: Lead by array length - 1
  const boundaryLead = lead(basicArray, 4);
  expect(boundaryLead).toEqual([5, undefined, undefined, undefined, undefined]);
  console.log("✓ Lead by array length - 1");

  // Test 2: Lead by array length
  const exactLead = lead(basicArray, 5);
  expect(exactLead).toEqual([
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  console.log("✓ Lead by exact array length");

  // Test 3: Lead by array length + 1
  const overLead = lead(basicArray, 6);
  expect(overLead).toEqual([
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  console.log("✓ Lead by array length + 1");
});
