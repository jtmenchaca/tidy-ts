/**
 * Test normalize with large arrays to ensure no stack overflow
 */

// deno-lint-ignore-file no-explicit-any
import { normalize } from "../../src/dataframe/ts/stats/transformation/normalize.ts";
import { expect } from "@std/expect";

Deno.test("normalize - large array should not stack overflow", () => {
  // Create array with 211k items (same size as DRG data)
  const largeArray = new Array(211755).fill(0).map((_, i) => i);

  // This should not cause stack overflow
  const result = normalize(largeArray, "minmax");

  expect(result.length).toBe(211755);
  expect(result[0]).toBe(0); // Min normalized to 0
  expect(result[result.length - 1]).toBe(1); // Max normalized to 1
  expect(result[Math.floor(result.length / 2)]).toBeCloseTo(0.5, 2); // Middle value ~0.5
});

Deno.test("normalize - large array with zscore should not stack overflow", () => {
  const largeArray = new Array(211755).fill(0).map((_, i) => i);

  const result = normalize(largeArray, "zscore");

  expect(result.length).toBe(211755);
  // Z-score should have mean ~0
  const validResults = result.filter((v): v is number => v !== null);
  const mean = validResults.reduce((sum, val) => sum + val, 0) /
    validResults.length;
  expect(mean).toBeCloseTo(0, 5);
});
