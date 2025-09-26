/**
 * DataFrame descriptive types and statistical function tests
 */

import { expect } from "@std/expect";
import { stats } from "@tidy-ts/dataframe";

Deno.test("descriptive functions handle mixed types correctly", () => {
  // Test data with mixed types: should return null when removeNA is false (default)
  const mixedTypes = [1, 2, "3", true, null, undefined, NaN, 4, "5", false];

  // Calculate all results and consolidate into an object
  const results = {
    // @ts-ignore -- this is a test
    mean: stats.mean(mixedTypes),
    // @ts-ignore -- this is a test
    max: stats.max(mixedTypes),
    // @ts-ignore -- this is a test
    min: stats.min(mixedTypes),
    // @ts-ignore -- this is a test
    sum: stats.sum(mixedTypes),
    // @ts-ignore -- this is a test
    product: stats.product(mixedTypes),
    // @ts-ignore -- this is a test
    median: stats.median(mixedTypes),
    // @ts-ignore -- this is a test
    variance: stats.variance(mixedTypes),
    // @ts-ignore -- this is a test
    stdev: stats.stdev(mixedTypes),
    // @ts-ignore -- this is a test
    mode: stats.mode(mixedTypes),
  };

  console.log("Mixed types results:", results);

  // Should return null for mixed types when removeNA is false (default)
  expect(results.mean).toBeNull();
  expect(results.max).toBeNull();
  expect(results.min).toBeNull();
  expect(results.sum).toBeNull();
  expect(results.product).toBeNull();
  expect(results.median).toBeNull();
  expect(results.variance).toBeNull();
  expect(results.stdev).toBeNull();
  expect(results.mode).toBeNull();
});

Deno.test("descriptive functions return null for string-only arrays", () => {
  const stringOnly = ["1", "2", "3"];

  // Calculate all results and consolidate into an object
  const results = {
    // @ts-ignore -- this is a test
    mean: stats.mean(stringOnly),
    // @ts-ignore -- this is a test
    max: stats.max(stringOnly),
    // @ts-ignore -- this is a test
    min: stats.min(stringOnly),
    // @ts-ignore -- this is a test
    sum: stats.sum(stringOnly),
    // @ts-ignore -- this is a test
    product: stats.product(stringOnly),
    // @ts-ignore -- this is a test
    median: stats.median(stringOnly),
    // @ts-ignore -- this is a test
    variance: stats.variance(stringOnly),
    // @ts-ignore -- this is a test
    sd: stats.stdev(stringOnly),
    // @ts-ignore -- this is a test
    mode: stats.mode(stringOnly),
  };

  console.log("String-only results:", results);

  // Should return null since no actual numbers are present
  expect(results.mean).toBeNull();
  expect(results.max).toBeNull();
  expect(results.min).toBeNull();
  expect(results.sum).toBeNull();
  expect(results.product).toBeNull();
  expect(results.median).toBeNull();
  expect(results.variance).toBeNull();
  expect(results.sd).toBeNull();
  expect(results.mode).toBeNull();
});

Deno.test("descriptive functions return null for boolean-only arrays", () => {
  const booleanOnly = [true, false, true];

  // Calculate all results and consolidate into an object
  const results = {
    // @ts-ignore -- this is a test
    mean: stats.mean(booleanOnly),
    // @ts-ignore -- this is a test
    max: stats.max(booleanOnly),
    // @ts-ignore -- this is a test
    min: stats.min(booleanOnly),
    // @ts-ignore -- this is a test
    sum: stats.sum(booleanOnly),
    // @ts-ignore -- this is a test
    product: stats.product(booleanOnly),
    // @ts-ignore -- this is a test
    median: stats.median(booleanOnly),
    // @ts-ignore -- this is a test
    variance: stats.variance(booleanOnly),
    // @ts-ignore -- this is a test
    sd: stats.stdev(booleanOnly),
    // @ts-ignore -- this is a test
    mode: stats.mode(booleanOnly),
  };

  console.log("Boolean-only results:", results);

  // Should return null since no actual numbers are present
  expect(results.mean).toBeNull();
  expect(results.max).toBeNull();
  expect(results.min).toBeNull();
  expect(results.sum).toBeNull();
  expect(results.product).toBeNull();
  expect(results.median).toBeNull();
  expect(results.variance).toBeNull();
  expect(results.sd).toBeNull();
  expect(results.mode).toBeNull();
});

Deno.test("descriptive functions handle Infinity correctly", () => {
  const withInfinity: number[] = [1, 2, Infinity, -Infinity, 3];

  // Calculate all results and consolidate into an object
  const results = {
    mean: stats.mean(withInfinity),
    max: stats.max(withInfinity),
    min: stats.min(withInfinity),
    sum: stats.sum(withInfinity),
    product: stats.product(withInfinity),
    median: stats.median(withInfinity),
    variance: stats.variance(withInfinity),
    sd: stats.stdev(withInfinity),
    mode: stats.mode(withInfinity),
  };

  console.log("Infinity results:", results);

  // All functions now correctly include Infinity values
  expect(results.mean).toBe(NaN); // (1+2+Inf-Inf+3)/5 = NaN
  expect(results.median).toBe(2); // median of [1, 2, -Infinity, Infinity, 3] sorted = 2
  expect(results.variance).toBe(NaN); // variance is NaN when mean is NaN
  expect(results.product).toBe(-Infinity); // 1*2*Inf*(-Inf)*3 = -Infinity
  expect(results.max).toBe(Infinity);
  expect(results.min).toBe(-Infinity);
  expect(results.sum).toBe(NaN); // 1+2+Inf-Inf+3 = NaN
  expect(results.sd).toBe(NaN); // sqrt(NaN) = NaN
  expect(results.mode).toBe(1); // 1 is the first mode (all values appear once)
});

Deno.test("descriptive functions handle empty arrays", () => {
  const empty: unknown[] = [];

  // Calculate all results and consolidate into an object
  const results = {
    // @ts-ignore -- this is a runtime test
    mean: stats.mean(empty),
    // @ts-ignore -- this is a runtime test
    max: stats.max(empty),
    // @ts-ignore -- this is a runtime test
    min: stats.min(empty),
    // @ts-ignore -- this is a runtime  test
    sum: stats.sum(empty),
    // @ts-ignore -- this is a runtime test
    product: stats.product(empty),
    // @ts-ignore -- this is a runtime test
    median: stats.median(empty),
    // @ts-ignore -- this is a runtime test
    variance: stats.variance(empty),
    // @ts-ignore -- this is a runtime test
    sd: stats.stdev(empty),
    // @ts-ignore -- this is a runtime test
    mode: stats.mode(empty),
  };

  console.log("Empty array results:", results);

  // Should return null for empty arrays
  expect(results.mean).toBeNull();
  expect(results.max).toBeNull();
  expect(results.min).toBeNull();
  expect(results.sum).toBeNull();
  expect(results.product).toBeNull();
  expect(results.median).toBeNull();
  expect(results.variance).toBeNull();
  expect(results.sd).toBeNull();
  expect(results.mode).toBeNull();
});

Deno.test("descriptive functions work correctly with clean numeric arrays", () => {
  const cleanNumbers = [1, 2, 3, 4, 5];

  // Calculate all results and consolidate into an object
  const results = {
    mean: stats.mean(cleanNumbers),
    max: stats.max(cleanNumbers),
    min: stats.min(cleanNumbers),
    sum: stats.sum(cleanNumbers),
    product: stats.product(cleanNumbers),
    median: stats.median(cleanNumbers),
    variance: stats.variance(cleanNumbers),
    stdev: stats.stdev(cleanNumbers),
    mode: stats.mode(cleanNumbers),
  };

  console.log("Clean numbers results:", results);

  // Should work exactly as before for clean numeric data
  expect(results.mean).toBe(3);
  expect(results.max).toBe(5);
  expect(results.min).toBe(1);
  expect(results.sum).toBe(15);
  expect(results.product).toBe(120);
  expect(results.median).toBe(3);
  expect(results.variance).toBe(2.5); // Sample variance
  expect(results.stdev).toBeCloseTo(1.5811388300841898, 10);
  expect(results.mode).toBe(1); // First number when no repeats
});

Deno.test("descriptive functions with removeNA=true extract valid numbers", () => {
  // Test data: [1, 2, "3", true, null, undefined, NaN, 4, "5", false]
  // Valid numbers: [1, 2, 4]
  const mixedTypes = [1, 2, "3", true, null, undefined, NaN, 4, "5", false];

  // Calculate all results with removeNA=true
  const results = {
    // @ts-ignore -- this is a test
    mean: stats.mean(mixedTypes, true),
    // @ts-ignore -- this is a test
    max: stats.max(mixedTypes, true),
    // @ts-ignore -- this is a test
    min: stats.min(mixedTypes, true),
    // @ts-ignore -- this is a test
    sum: stats.sum(mixedTypes, true),
    // @ts-ignore -- this is a test
    product: stats.product(mixedTypes, true),
    // @ts-ignore -- this is a test
    median: stats.median(mixedTypes, true),
    // @ts-ignore -- this is a test
    variance: stats.variance(mixedTypes, true),
    // @ts-ignore -- this is a test
    sd: stats.stdev(mixedTypes, true),
    // @ts-ignore -- this is a test
    mode: stats.mode(mixedTypes, true),
  };

  console.log("removeNA=true results:", results);

  // Should process only valid numbers [1, 2, 4]
  expect(results.mean).toBeCloseTo(2.3333333333333335, 10); // (1+2+4)/3
  expect(results.max).toBe(4);
  expect(results.min).toBe(1);
  expect(results.sum).toBe(7); // 1+2+4
  expect(results.product).toBe(8); // 1*2*4
  expect(results.median).toBe(2); // median of [1,2,4]
  expect(results.variance).toBeCloseTo(2.3333333333333335, 10); // sample variance of [1,2,4]
  expect(results.sd).toBeCloseTo(1.5275252316519465, 10); // sqrt(variance)
  expect(results.mode).toBe(1); // first number when no repeats
});
