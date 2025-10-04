import { s } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Min and Max comprehensive test - numbers and dates", () => {
  console.log("\n=== COMPREHENSIVE MIN/MAX TEST ===");

  // Test numbers (existing functionality)
  const numbers = [1, 2, 3, 4, 5];
  const mixedNumbers = [1, null, 3, undefined, 5];

  const minNum = s.min(numbers);
  const maxNum = s.max(numbers);
  const minMixedNum = s.min(mixedNumbers, true);
  const maxMixedNum = s.max(mixedNumbers, true);

  console.log("Number results:");
  console.log("Min numbers:", minNum);
  console.log("Max numbers:", maxNum);
  console.log("Min mixed numbers (removeNA):", minMixedNum);
  console.log("Max mixed numbers (removeNA):", maxMixedNum);

  // Test dates (new functionality)
  const dates = [
    new Date("2024-01-01"),
    new Date("2024-01-02"),
    new Date("2024-01-03"),
  ];
  const mixedDates = [
    new Date("2024-01-01"),
    null,
    new Date("2024-01-03"),
  ];

  const minDate = s.min(dates);
  const maxDate = s.max(dates);
  const minMixedDate = s.min(mixedDates, true);
  const maxMixedDate = s.max(mixedDates, true);

  console.log("\nDate results:");
  console.log("Min dates:", minDate);
  console.log("Max dates:", maxDate);
  console.log("Min mixed dates (removeNA):", minMixedDate);
  console.log("Max mixed dates (removeNA):", maxMixedDate);

  // Test single values
  const singleNum = s.min(42);
  const singleDate = s.min(new Date("2024-01-01"));

  console.log("\nSingle value results:");
  console.log("Single number:", singleNum);
  console.log("Single date:", singleDate);

  // Expectations
  expect(minNum).toBe(1);
  expect(maxNum).toBe(5);
  expect(minMixedNum).toBe(1);
  expect(maxMixedNum).toBe(5);

  expect(minDate).toEqual(new Date("2024-01-01"));
  expect(maxDate).toEqual(new Date("2024-01-03"));
  expect(minMixedDate).toEqual(new Date("2024-01-01"));
  expect(maxMixedDate).toEqual(new Date("2024-01-03"));

  expect(singleNum).toBe(42);
  expect(singleDate).toEqual(new Date("2024-01-01"));

  console.log("\n✓ All tests passed!");
});
