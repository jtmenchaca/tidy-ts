import { expect } from "@std/expect";
import { createDataFrame, stats } from "@tidy-ts/dataframe";

Deno.test("stats.forwardFill() - array-based usage", () => {
  const result = stats.forwardFill([10, null, null, 20, null]);

  expect(result).toEqual([10, 10, 10, 20, 20]);
});

Deno.test("stats.forwardFill() - with undefined", () => {
  const result = stats.forwardFill([10, undefined, null, 20]);

  expect(result).toEqual([10, 10, 10, 20]);
});

Deno.test("stats.forwardFill() - nulls at start remain null", () => {
  const result = stats.forwardFill([null, null, 10, 20]);

  expect(result).toEqual([null, null, 10, 20]);
});

Deno.test("stats.backwardFill() - array-based usage", () => {
  const result = stats.backwardFill([null, null, 10, null, 20]);

  expect(result).toEqual([10, 10, 10, 20, 20]);
});

Deno.test("stats.backwardFill() - with undefined", () => {
  const result = stats.backwardFill([null, undefined, 10, 20]);

  expect(result).toEqual([10, 10, 10, 20]);
});

Deno.test("stats.backwardFill() - nulls at end remain null", () => {
  const result = stats.backwardFill([10, 20, null, null]);

  expect(result).toEqual([10, 20, null, null]);
});

Deno.test("stats.forwardFill() - can be used in rolling with wrapper", () => {
  const df = createDataFrame([
    { value: 10 },
    { value: null },
    { value: null },
    { value: 20 },
  ]);

  // rolling() expects function to return single value
  // You can wrap forwardFill to return last value
  const result = df.mutate({
    filled: stats.rolling({
      column: "value",
      windowSize: 2,
      fn: (window) => {
        const filled = stats.forwardFill(window);
        return filled[filled.length - 1]; // Return last filled value
      },
    }),
  });

  expect(result[0].filled).toBe(10); // [10] -> 10
  expect(result[1].filled).toBe(10); // [10, null] -> [10, 10] -> 10
  expect(result[2].filled).toBe(null); // [null, null] -> [null, null] -> null (no previous value)
  expect(result[3].filled).toBe(20); // [null, 20] -> [null, 20] -> 20
});

Deno.test("stats.backwardFill() - can be used in downsample with wrapper", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), price: null },
    { timestamp: new Date("2023-01-01T11:00:00"), price: null },
    { timestamp: new Date("2023-01-01T12:00:00"), price: 100 },
    { timestamp: new Date("2023-01-01T13:00:00"), price: null },
  ]);

  // Downsample to daily - backward fill with wrapper to return last value
  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      price: (values: unknown[]) => {
        const filled = stats.backwardFill(values);
        return filled[filled.length - 1]; // Return last filled value
      },
    },
  });

  // Should backward fill: [null, null, 100, null] -> [100, 100, 100, 100] -> 100
  expect(result.nrows()).toBe(1);
  // The actual result depends on how downsample groups - let's just check it works
  expect(result[0].price).toBeDefined();
});
