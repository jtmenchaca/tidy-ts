import { expect } from "@std/expect";
import { lag } from "./lag.ts";

Deno.test("Lag Function - Basic Functionality", () => {
  console.log("=== Basic Functionality Tests ===");

  const basicArray = [1, 2, 3, 4, 5];

  // Test 1: Basic lag by 1
  const lag1 = lag(basicArray, 1);
  expect(lag1).toEqual([undefined, 1, 2, 3, 4]);
  console.log("✓ Basic lag by 1");

  // Test 2: Basic lag by 2
  const lag2 = lag(basicArray, 2);
  expect(lag2).toEqual([undefined, undefined, 1, 2, 3]);
  console.log("✓ Basic lag by 2");

  // Test 3: Lag by 0 (should return copy)
  const lag0 = lag(basicArray, 0);
  expect(lag0).toEqual([1, 2, 3, 4, 5]);
  expect(lag0).not.toBe(basicArray); // Should be a copy
  console.log("✓ Lag by 0 returns copy");

  // Test 4: Default value
  const lag1Default = lag(basicArray, 1, 0);
  expect(lag1Default).toEqual([0, 1, 2, 3, 4]);
  console.log("✓ Lag with default value");
});

Deno.test("Lag Function - Edge Cases Array Sizes", () => {
  console.log("=== Edge Cases - Array Sizes ===");

  // Test 1: Empty array
  const emptyLag = lag([], 1);
  expect(emptyLag).toEqual([]);
  console.log("✓ Empty array");

  // Test 2: Single element
  const singleLag = lag([42], 1);
  expect(singleLag).toEqual([undefined]);
  console.log("✓ Single element");

  // Test 3: Two elements
  const twoLag = lag([10, 20], 1);
  expect(twoLag).toEqual([undefined, 10]);
  console.log("✓ Two elements");

  // Test 4: Lag equal to array length
  const basicArray = [1, 2, 3, 4, 5];
  const equalLag = lag(basicArray, 5);
  expect(equalLag).toEqual([
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  console.log("✓ Lag equal to array length");

  // Test 5: Lag greater than array length
  const greaterLag = lag(basicArray, 10);
  expect(greaterLag).toEqual([
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  console.log("✓ Lag greater than array length");
});

Deno.test("Lag Function - Data Types", () => {
  console.log("=== Data Type Tests ===");

  // Test 1: String array
  const stringArray = ["a", "b", "c", "d"];
  const stringLag = lag(stringArray, 1);
  expect(stringLag).toEqual([undefined, "a", "b", "c"]);
  console.log("✓ String array");

  // Test 2: Mixed types
  const mixedArray = [1, "hello", true, null, undefined];
  const mixedLag = lag(mixedArray, 1);
  expect(mixedLag).toEqual([undefined, 1, "hello", true, null]);
  console.log("✓ Mixed types");

  // Test 3: Object array
  const objectArray = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const objectLag = lag(objectArray, 1);
  expect(objectLag).toEqual([undefined, { id: 1 }, { id: 2 }]);
  console.log("✓ Object array");

  // Test 4: Boolean array
  const boolArray = [true, false, true, false];
  const boolLag = lag(boolArray, 1);
  expect(boolLag).toEqual([undefined, true, false, true]);
  console.log("✓ Boolean array");
});

Deno.test("Lag Function - Null and Undefined Handling", () => {
  console.log("=== Null and Undefined Handling ===");

  // Test 1: Array with null values
  const nullArray = [1, null, 3, null, 5];
  const nullLag = lag(nullArray, 1);
  expect(nullLag).toEqual([undefined, 1, null, 3, null]);
  console.log("✓ Array with null values");

  // Test 2: Array with undefined values
  const undefinedArray = [1, undefined, 3, undefined, 5];
  const undefinedLag = lag(undefinedArray, 1);
  expect(undefinedLag).toEqual([undefined, 1, undefined, 3, undefined]);
  console.log("✓ Array with undefined values");

  // Test 3: Default value with null
  const nullDefaultLag = lag(nullArray, 1, 0);
  expect(nullDefaultLag).toEqual([0, 1, null, 3, null]);
  console.log("✓ Default value with null array");
});

Deno.test("Lag Function - Error Handling", () => {
  console.log("=== Error Handling ===");

  const basicArray = [1, 2, 3, 4, 5];

  // Test 1: Negative lag should throw
  expect(() => lag(basicArray, -1)).toThrow("Lag k must be non-negative");
  console.log("✓ Negative lag throws error");

  // Test 2: Very negative lag
  expect(() => lag(basicArray, -100)).toThrow("Lag k must be non-negative");
  console.log("✓ Very negative lag throws error");
});

Deno.test("Lag Function - Performance and Large Arrays", () => {
  console.log("=== Performance and Large Arrays ===");

  // Test 1: Large array
  const largeArray = Array.from({ length: 1000 }, (_, i) => i);
  const largeLag = lag(largeArray, 100);
  expect(largeLag[0]).toBe(undefined);
  expect(largeLag[100]).toBe(0);
  expect(largeLag[999]).toBe(899);
  console.log("✓ Large array (1000 elements)");

  // Test 2: Very large lag on small array
  const smallArray = [1, 2, 3];
  const veryLargeLag = lag(smallArray, 1000);
  expect(veryLargeLag).toEqual([undefined, undefined, undefined]);
  console.log("✓ Very large lag on small array");
});

Deno.test("Lag Function - Immutability", () => {
  console.log("=== Immutability Tests ===");

  const basicArray = [1, 2, 3, 4, 5];

  // Test 1: Original array should not be modified
  const originalArray = [1, 2, 3, 4, 5];
  const originalCopy = [...originalArray];
  lag(originalArray, 1);
  expect(originalArray).toEqual(originalCopy);
  console.log("✓ Original array not modified");

  // Test 2: Result should be independent
  const result1 = lag(basicArray, 1);
  const result2 = lag(basicArray, 2);
  expect(result1).not.toEqual(result2);
  console.log("✓ Results are independent");
});

Deno.test("Lag Function - Type Safety", () => {
  console.log("=== Type Safety Tests ===");

  // Test 1: TypeScript type preservation
  const typedArray: readonly number[] = [1, 2, 3, 4, 5];
  const typedLag = lag(typedArray, 1);
  // Should be (number | undefined)[]
  expect(typedLag[0]).toBe(undefined);
  expect(typeof typedLag[1]).toBe("number");
  console.log("✓ Type preservation");

  // Test 2: Generic type handling
  const genericArray = [1, 2, 3] as const;
  const genericLag = lag(genericArray, 1);
  expect(genericLag).toEqual([undefined, 1, 2]);
  console.log("✓ Generic type handling");
});

Deno.test("Lag Function - Real-world Usage", () => {
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
  const laggedValues = lag(values, 1, 0);
  expect(laggedValues).toEqual([0, 100, 150, 200, 120]);
  console.log("✓ Time series scenario");

  // Test 2: Financial data with gaps
  const financialData = [100, null, 150, 200, null, 180];
  const financialLag = lag(financialData, 1, 0);
  expect(financialLag).toEqual([0, 100, null, 150, 200, null]);
  console.log("✓ Financial data with gaps");
});
