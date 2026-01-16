import { expect } from "@std/expect";
import { createDataFrame, stats } from "@tidy-ts/dataframe";

Deno.test("rolling() - rolling mean over last 3 rows", () => {
  const df = createDataFrame([
    { timestamp: 1, price: 100 },
    { timestamp: 2, price: 110 },
    { timestamp: 3, price: 120 },
    { timestamp: 4, price: 130 },
    { timestamp: 5, price: 140 },
  ]);

  const result = df.mutate({
    rolling_mean: stats.rolling({
      column: "price",
      windowSize: 3,
      fn: stats.mean,
    }),
  }).print();

  expect(result[0].rolling_mean).toBe(100); // single value
  expect(result[1].rolling_mean).toBe(105); // (100 + 110) / 2
  expect(result[2].rolling_mean).toBe(110); // (100 + 110 + 120) / 3
  expect(result[3].rolling_mean).toBe(120); // (110 + 120 + 130) / 3
  expect(result[4].rolling_mean).toBe(130); // (120 + 130 + 140) / 3
});

Deno.test("rolling() - rolling sum over last 2 rows", () => {
  const df = createDataFrame([
    { timestamp: 1, value: 10 },
    { timestamp: 2, value: 20 },
    { timestamp: 3, value: 30 },
    { timestamp: 4, value: 40 },
  ]);

  const result = df.mutate({
    rolling_sum: stats.rolling({
      column: "value",
      windowSize: 2,
      fn: stats.sum,
    }),
  }).print();

  expect(result[0].rolling_sum).toBe(10); // single value
  expect(result[1].rolling_sum).toBe(30); // 10 + 20
  expect(result[2].rolling_sum).toBe(50); // 20 + 30
  expect(result[3].rolling_sum).toBe(70); // 30 + 40
});

Deno.test("rolling() - array-based usage", () => {
  const values = [1, 2, 3, 4, 5];
  const result = stats.rolling({ values, windowSize: 3, fn: stats.mean });

  expect(result).toEqual([1, 1.5, 2, 3, 4]);
});

Deno.test("rolling() - with max function", () => {
  const df = createDataFrame([
    { value: 10 },
    { value: 30 },
    { value: 20 },
    { value: 40 },
  ]);

  const result = df.mutate({
    rolling_max: stats.rolling({
      column: "value",
      windowSize: 2,
      fn: stats.max,
    }),
  }).print();

  expect(result[0].rolling_max).toBe(10); // single value
  expect(result[1].rolling_max).toBe(30); // max(10, 30)
  expect(result[2].rolling_max).toBe(30); // max(30, 20)
  expect(result[3].rolling_max).toBe(40); // max(20, 40)
});
