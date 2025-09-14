/**
 * Tests for descriptive statistical functions
 */

import { expect } from "@std/expect";
import { stats } from "@tidy-ts/dataframe";
import {
  assertApproximatelyEqual,
  assertIsNaN,
} from "../utilities/test-utils/helpers.ts";

Deno.test("mean function", () => {
  const values = [1, 2, 3, 4, 5];
  const result = stats.mean(values);
  expect(result).toBe(3);
});

Deno.test("mean with single value", () => {
  const result = stats.mean(42);
  expect(result).toBe(42);
});

Deno.test("mean with null values", () => {
  const values = [1, 2, null, 4, 5];
  const result = stats.mean(values, true);
  expect(result).toBe(3); // (1+2+4+5)/4 = 3
});

Deno.test("mean with Infinity", () => {
  const values = [1, 2, Infinity, -Infinity, 3];
  const result = stats.mean(values);
  assertIsNaN(result); // (1+2+Inf-Inf+3)/5 = NaN
});

Deno.test("median function", () => {
  const values = [1, 2, 3, 4, 5];
  const result = stats.median(values);
  expect(result).toBe(3);
});

Deno.test("median with even number of values", () => {
  const values = [1, 2, 3, 4];
  const result = stats.median(values);
  expect(result).toBe(2.5);
});

Deno.test("median with Infinity", () => {
  const values = [1, 2, -Infinity, Infinity, 3];
  const result = stats.median(values);
  expect(result).toBe(2); // median of [1, 2, -Infinity, Infinity, 3] sorted = 2
});

Deno.test("min function", () => {
  const values = [5, 2, 8, 1, 9];
  const result = stats.min(values);
  expect(result).toBe(1);
});

Deno.test("min with Infinity", () => {
  const values = [1, 2, -Infinity, Infinity, 3];
  const result = stats.min(values);
  expect(result).toBe(-Infinity);
});

Deno.test("max function", () => {
  const values = [5, 2, 8, 1, 9];
  const result = stats.max(values);
  expect(result).toBe(9);
});

Deno.test("max with Infinity", () => {
  const values = [1, 2, -Infinity, Infinity, 3];
  const result = stats.max(values);
  expect(result).toBe(Infinity);
});

Deno.test("sum function", () => {
  const values = [1, 2, 3, 4, 5];
  const result = stats.sum(values);
  expect(result).toBe(15);
});

Deno.test("sum with Infinity", () => {
  const values = [1, 2, Infinity, -Infinity, 3];
  const result = stats.sum(values);
  assertIsNaN(result); // 1+2+Inf-Inf+3 = NaN
});

Deno.test("product function", () => {
  const values = [1, 2, 3, 4];
  const result = stats.product(values);
  expect(result).toBe(24);
});

Deno.test("product with Infinity", () => {
  const values = [1, 2, Infinity, -Infinity, 3];
  const result = stats.product(values);
  expect(result).toBe(-Infinity); // 1*2*Inf*(-Inf)*3 = -Infinity
});

Deno.test("variance function", () => {
  const values = [1, 2, 3, 4, 5];
  const result = stats.variance(values);
  expect(result).toBe(2.5); // Sample variance
});

Deno.test("variance with single value", () => {
  const result = stats.variance(42);
  expect(result).toBe(0);
});

Deno.test("variance with Infinity", () => {
  const values = [1, 2, Infinity, -Infinity, 3];
  const result = stats.variance(values);
  assertIsNaN(result); // variance is NaN when mean is NaN
});

Deno.test("standard deviation function", () => {
  const values = [1, 2, 3, 4, 5];
  const result = stats.stdev(values);
  assertApproximatelyEqual(result, Math.sqrt(2.5), 1e-10);
});

Deno.test("standard deviation with Infinity", () => {
  const values = [1, 2, Infinity, -Infinity, 3];
  const result = stats.stdev(values);
  assertIsNaN(result); // sqrt(NaN) = NaN
});

Deno.test("mode function", () => {
  const values = [1, 1, 2, 3, 3, 3];
  const result = stats.mode(values);
  expect(result).toBe(3);
});

Deno.test("mode with Infinity", () => {
  const values = [1, 2, -Infinity, Infinity, 3];
  const result = stats.mode(values);
  expect(result).toBe(1); // 1 is the first mode (all values appear once)
});

Deno.test("range function", () => {
  const values = [1, 5, 3, 9, 2];
  const result = stats.range(values);
  expect(result).toBe(8); // 9 - 1
});

Deno.test("range with Infinity", () => {
  const values = [1, 2, -Infinity, Infinity, 3];
  const result = stats.range(values);
  expect(result).toBe(Infinity); // Infinity - (-Infinity) = Infinity
});

Deno.test("quantile function", () => {
  const values = [1, 2, 3, 4, 5];
  const result = stats.quantile(values, 0.5);
  expect(result).toBe(3);
});

Deno.test("quantile with multiple probabilities", () => {
  const values = [1, 2, 3, 4, 5];
  const result = stats.quantile(values, [0.25, 0.75]);
  expect(result).toEqual([2, 4]);
});

Deno.test("IQR function", () => {
  const values = [1, 2, 3, 4, 5];
  const result = stats.iqr(values);
  expect(result).toBe(2); // Q75 - Q25 = 4 - 2 = 2
});

Deno.test("IQR with Infinity", () => {
  const values = [1, 2, -Infinity, Infinity, 3];
  const result = stats.iqr(values);
  expect(result).toBe(1); // IQR of [1, 2, -Infinity, Infinity, 3] sorted = 1
});

Deno.test("descriptive functions with empty arrays", () => {
  const empty: number[] = [];

  expect(stats.mean(empty)).toBeNull();
  expect(stats.median(empty)).toBeNull();
  expect(stats.min(empty)).toBeNull();
  expect(stats.max(empty)).toBeNull();
  expect(stats.sum(empty)).toBeNull();
  expect(stats.product(empty)).toBeNull();
  expect(stats.variance(empty)).toBeNull();
  expect(stats.stdev(empty)).toBeNull();
  expect(stats.mode(empty)).toBeNull();
  expect(stats.range(empty)).toBeNull();
  expect(stats.iqr(empty)).toBeNull();
});

Deno.test("descriptive functions with only null/undefined/NaN", () => {
  const onlyInvalid = [null, undefined, NaN, null];

  // Should throw errors when remove_na=true
  expect(() => stats.mean(onlyInvalid, true)).toThrow(
    "No valid numeric values found to calculate mean",
  );
  expect(() => stats.max(onlyInvalid, true)).toThrow(
    "No valid numeric values found to calculate max",
  );
  expect(() => stats.min(onlyInvalid, true)).toThrow(
    "No valid numeric values found to calculate min",
  );
  expect(() => stats.sum(onlyInvalid, true)).toThrow(
    "No valid values found to calculate sum",
  );
  expect(() => stats.product(onlyInvalid, true)).toThrow(
    "No valid values found to calculate product",
  );
  expect(() => stats.median(onlyInvalid, true)).toThrow(
    "No valid numeric values found to calculate median",
  );
  expect(() => stats.variance(onlyInvalid, true)).toThrow(
    "No valid values found to calculate variance",
  );
  expect(() => stats.stdev(onlyInvalid, true)).toThrow(
    "No valid values found to calculate variance",
  );
  expect(() => stats.mode(onlyInvalid, true)).toThrow(
    "No valid numeric values found to calculate mode",
  );
});
