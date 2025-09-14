/**
 * Tests for cumulative statistical functions
 */

import { expect } from "@std/expect";
import { stats } from "@tidy-ts/dataframe";
import { timeSeriesData } from "../utilities/test-utils/test-data.ts";

Deno.test("cumsum function", () => {
  const values = [1, 2, 3, 4, 5];
  const result = stats.cumsum(values);
  expect(result).toEqual([1, 3, 6, 10, 15]);
});

Deno.test("cumsum with null values", () => {
  const values = [1, null, 3, 4, 5];
  // @ts-expect-error - null values are not allowed
  const result = stats.cumsum(values);
  expect(result).toEqual([null, null, null, null, null]); // null propagates through cumulative sum
  const result2 = stats.cumsum(values, true);
  expect(result2).toEqual([1, 1, 4, 8, 13]); // null values removed
});

Deno.test("cumsum with undefined values", () => {
  const values = [1, undefined, 3, 4, 5];
  // @ts-expect-error - undefined values are not allowed
  const result = stats.cumsum(values);
  expect(result).toEqual([null, null, null, null, null]); // undefined treated as 0
  const result2 = stats.cumsum(values, true);
  expect(result2).toEqual([1, 1, 4, 8, 13]); // undefined values removed
});

Deno.test("cumsum with NaN values", () => {
  const values = [1, NaN, 3, 4, 5];
  const result = stats.cumsum(values);
  expect(result).toEqual([1, NaN, NaN, NaN, NaN]); // NaN propagates through cumulative sum
  const result2 = stats.cumsum(values, true);
  expect(result2).toEqual([1, 1, 4, 8, 13]); // NaN values removed
});

Deno.test("cumsum with Infinity", () => {
  const values = [1, 2, Infinity, 4, 5];
  const result = stats.cumsum(values);
  expect(result).toEqual([1, 3, Infinity, Infinity, Infinity]);
});

Deno.test("cumsum with negative Infinity", () => {
  const values = [1, 2, -Infinity, 4, 5];
  const result = stats.cumsum(values);
  expect(result).toEqual([1, 3, -Infinity, -Infinity, -Infinity]);
});

Deno.test("cummax function", () => {
  const values = [3, 1, 4, 1, 5];
  const result = stats.cummax(values);
  expect(result).toEqual([3, 3, 4, 4, 5]);
});

Deno.test("cummax with null values", () => {
  const values = [3, null, 4, 1, 5];
  // @ts-expect-error - null values are not allowed
  const result = stats.cummax(values);
  expect(result).toEqual([null, null, null, null, null]); // null propagates through cumulative max
  const result2 = stats.cummax(values, true);
  expect(result2).toEqual([3, 3, 4, 4, 5]); // null values removed
});

Deno.test("cummax with undefined values", () => {
  const values = [3, undefined, 4, 1, 5];
  // @ts-expect-error - undefined values are not allowed
  const result = stats.cummax(values);
  expect(result).toEqual([null, null, null, null, null]); // undefined treated as null
  const result2 = stats.cummax(values, true);
  expect(result2).toEqual([3, 3, 4, 4, 5]); // undefined values removed
});

Deno.test("cummax with NaN values", () => {
  const values = [3, NaN, 4, 1, 5];
  const result = stats.cummax(values);
  expect(result).toEqual([3, NaN, NaN, NaN, NaN]); // NaN propagates through cumulative max
  const result2 = stats.cummax(values, true);
  expect(result2).toEqual([3, 3, 4, 4, 5]); // NaN values removed
});

Deno.test("cummax with Infinity", () => {
  const values = [3, 1, Infinity, 1, 5];
  const result = stats.cummax(values);
  expect(result).toEqual([3, 3, Infinity, Infinity, Infinity]);
});

Deno.test("cummin function", () => {
  const values = [3, 1, 4, 1, 5];
  const result = stats.cummin(values);
  expect(result).toEqual([3, 1, 1, 1, 1]);
});

Deno.test("cummin with null values", () => {
  const values = [3, null, 4, 1, 5];
  // @ts-expect-error - null values are not allowed
  const result = stats.cummin(values);
  expect(result).toEqual([null, null, null, null, null]); // null propagates through cumulative min
  const result2 = stats.cummin(values, true);
  expect(result2).toEqual([3, 3, 3, 1, 1]); // null values removed
});

Deno.test("cummin with undefined values", () => {
  const values = [3, undefined, 4, 1, 5];
  // @ts-expect-error - undefined values are not allowed
  const result = stats.cummin(values);
  expect(result).toEqual([null, null, null, null, null]); // undefined treated as null
  const result2 = stats.cummin(values, true);
  expect(result2).toEqual([3, 3, 3, 1, 1]); // undefined values removed
});

Deno.test("cummin with NaN values", () => {
  const values = [3, NaN, 4, 1, 5];
  const result = stats.cummin(values);
  expect(result).toEqual([3, NaN, NaN, NaN, NaN]); // NaN propagates through cumulative min
  const result2 = stats.cummin(values, true);
  expect(result2).toEqual([3, 3, 3, 1, 1]); // NaN values removed
});

Deno.test("cummin with negative Infinity", () => {
  const values = [3, 1, -Infinity, 1, 5];
  const result = stats.cummin(values);
  expect(result).toEqual([3, 1, -Infinity, -Infinity, -Infinity]);
});

Deno.test("cumprod function", () => {
  const values = [1, 2, 3, 4];
  const result = stats.cumprod(values);
  expect(result).toEqual([1, 2, 6, 24]);
});

Deno.test("cumprod with null values", () => {
  const values = [1, null, 3, 4];
  // @ts-expect-error - null values are not allowed
  const result = stats.cumprod(values);
  expect(result).toEqual([null, null, null, null]); // null propagates through cumulative product
  const result2 = stats.cumprod(values, true);
  expect(result2).toEqual([1, 1, 3, 12]); // null values removed
});

Deno.test("cumprod with undefined values", () => {
  const values = [1, undefined, 3, 4];
  // @ts-expect-error - undefined values are not allowed
  const result = stats.cumprod(values);
  expect(result).toEqual([null, null, null, null]); // undefined treated as null
  const result2 = stats.cumprod(values, true);
  expect(result2).toEqual([1, 1, 3, 12]); // undefined values removed
});

Deno.test("cumprod with NaN values", () => {
  const values = [1, NaN, 3, 4];
  const result = stats.cumprod(values);
  expect(result).toEqual([1, NaN, NaN, NaN]); // NaN propagates through cumulative product
  const result2 = stats.cumprod(values, true);
  expect(result2).toEqual([1, 1, 3, 12]); // NaN values removed
});

Deno.test("cumprod with zero", () => {
  const values = [1, 2, 0, 4];
  const result = stats.cumprod(values);
  expect(result).toEqual([1, 2, 0, 0]);
});

Deno.test("cumprod with Infinity", () => {
  const values = [1, 2, Infinity, 4];
  const result = stats.cumprod(values);
  expect(result).toEqual([1, 2, Infinity, Infinity]);
});

Deno.test("cumulative mean function", () => {
  const values = [1, 2, 3, 4, 5];
  const result = stats.cummean(values);
  expect(result).toEqual([1, 1.5, 2, 2.5, 3]);
});

Deno.test("cumulative mean with null values", () => {
  const values = [1, null, 3, 4, 5];
  // @ts-expect-error - null values are not allowed
  const result = stats.cummean(values);
  expect(result).toEqual([null, null, null, null, null]); // null propagates through cumulative mean
  const result2 = stats.cummean(values, true);
  expect(result2).toEqual([1, 1, 2, 8 / 3, 13 / 4]); // null values removed, mean calculated from valid values
});

Deno.test("cumulative mean with single value", () => {
  const values = [42];
  const result = stats.cummean(values);
  expect(result).toEqual([42]);
});

Deno.test("cumulative mean with empty array", () => {
  const values: number[] = [];
  const result = stats.cummean(values);
  expect(result).toEqual([]);
});

Deno.test("cumulative functions preserve array length", () => {
  const values = [1, 2, 3, 4, 5];

  expect(stats.cumsum(values).length).toBe(5);
  expect(stats.cummax(values).length).toBe(5);
  expect(stats.cummin(values).length).toBe(5);
  expect(stats.cumprod(values).length).toBe(5);
  expect(stats.cummean(values).length).toBe(5);
});

Deno.test("cumulative functions with time series data", () => {
  const sales = timeSeriesData.extract("sales");

  const cumsum = stats.cumsum(sales);
  const cummax = stats.cummax(sales);
  const cummin = stats.cummin(sales);

  expect(cumsum).toEqual([100, 250, 450, 570, 750]);
  expect(cummax).toEqual([100, 150, 200, 200, 200]);
  expect(cummin).toEqual([100, 100, 100, 100, 100]);
});

Deno.test("cumulative functions with mixed data types", () => {
  const values = [1, "2", 3, null, 5];
  // @ts-expect-error - mixed data types are not allowed
  const result = stats.cumsum(values, true);
  expect(result).toEqual([1, 1, 4, 4, 9]); // "2" converted to 2, null treated as 0
});

Deno.test("cummax with mixed data types", () => {
  const values = [3, "4", 1, null, 5];
  // @ts-expect-error - mixed data types are not allowed
  const result = stats.cummax(values, true);
  expect(result).toEqual([3, 3, 3, 3, 5]); // "4" converted to 4, null treated as 0
});

Deno.test("cummin with mixed data types", () => {
  const values = [3, "1", 4, null, 5];
  // @ts-expect-error - mixed data types are not allowed
  const result = stats.cummin(values, true);
  expect(result).toEqual([3, 3, 3, 3, 3]); // "1" converted to 1, null treated as 0
});

Deno.test("cumprod with mixed data types", () => {
  const values = [2, "3", 1, null, 4];
  // @ts-expect-error - mixed data types are not allowed
  const result = stats.cumprod(values, true);
  expect(result).toEqual([2, 2, 2, 2, 8]); // "3" converted to 3, null treated as 1
});
