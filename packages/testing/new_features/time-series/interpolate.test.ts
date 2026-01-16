import { expect } from "@std/expect";
import { createDataFrame, type DataFrame, stats } from "@tidy-ts/dataframe";

Deno.test("interpolate() - linear interpolation for missing values", () => {
  const data: { timestamp: number; value: number | null }[] = [
    { timestamp: 1, value: 100 },
    { timestamp: 2, value: null },
    { timestamp: 3, value: null },
    { timestamp: 4, value: 200 },
  ];

  const df = createDataFrame(data);

  const result = df.interpolate("value", "timestamp", "linear");

  const _typeCheck: DataFrame<{
    timestamp: number;
    value: number | null;
  }> = result;

  expect(result[0].value).toBe(100);
  expect(result[1].value).toBeCloseTo(133.33, 1); // interpolated
  expect(result[2].value).toBeCloseTo(166.67, 1); // interpolated
  expect(result[3].value).toBe(200);
});

Deno.test("interpolate() - spline interpolation", () => {
  const df = createDataFrame([
    { timestamp: 1, value: 100 },
    { timestamp: 2, value: null },
    { timestamp: 3, value: null },
    { timestamp: 4, value: 200 },
    { timestamp: 5, value: 150 },
    { timestamp: 6, value: 180 },
  ]);

  const result = df.interpolate("value", "timestamp", "spline").print();

  expect(result[0].value).toBe(100);
  expect(result[1].value).toBeGreaterThan(100); // interpolated with spline (should be different from linear)
  expect(result[1].value).not.toBeNull();
  expect(result[2].value).toBeGreaterThan(result[1].value!); // interpolated with spline
  expect(result[3].value).toBe(200);
  expect(result[4].value).toBe(150);
  expect(result[5].value).toBe(180);
});

Deno.test("interpolate() - handle edge cases", () => {
  const df = createDataFrame([
    { timestamp: 1, value: null },
    { timestamp: 2, value: 100 },
    { timestamp: 3, value: null },
  ]);

  // Leading nulls can't be interpolated
  const result = df.interpolate("value", "timestamp", "linear").print();
  expect(result[0].value).toBeNull(); // can't interpolate without previous value
  expect(result[1].value).toBe(100);
  expect(result[2].value).toBeNull(); // can't interpolate without next value
});

Deno.test("interpolate() - with Date x-axis", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01"), value: 100 },
    { timestamp: new Date("2023-01-02"), value: null },
    { timestamp: new Date("2023-01-03"), value: null },
    { timestamp: new Date("2023-01-04"), value: 200 },
  ]);

  const result = df.interpolate("value", "timestamp", "linear").print();

  expect(result[0].value).toBe(100);
  expect(result[1].value).toBeCloseTo(133.33, 1);
  expect(result[2].value).toBeCloseTo(166.67, 1);
  expect(result[3].value).toBe(200);
});

Deno.test("interpolate() - spline falls back to linear with < 4 points", () => {
  const df = createDataFrame([
    { timestamp: 1, value: 100 },
    { timestamp: 2, value: null },
    { timestamp: 3, value: 200 },
  ]);

  // Only 2 non-null points, spline should fall back to linear
  const result = df.interpolate("value", "timestamp", "spline").print();
  expect(result[0].value).toBe(100);
  expect(result[1].value).toBeCloseTo(150, 1); // linear interpolation
  expect(result[2].value).toBe(200);
});

Deno.test("stats.interpolate() - array-based usage", () => {
  const values = [100, null, null, 200];
  const xValues = [1, 2, 3, 4];

  const result = stats.interpolate(values, xValues, "linear");

  expect(result).toEqual([100, 133.33333333333331, 166.66666666666666, 200]);
});

Deno.test("stats.interpolate() - with Date values", () => {
  const dates = [
    new Date("2023-01-01"),
    null,
    null,
    new Date("2023-01-04"),
  ];
  const xValues = [1, 2, 3, 4];

  const result = stats.interpolate(dates, xValues, "linear");

  console.log(result);

  expect(result[0]?.getTime()).toBe(new Date("2023-01-01").getTime());
  expect(result[1]?.getTime()).toBe(new Date("2023-01-02").getTime());
  expect(result[2]?.getTime()).toBe(new Date("2023-01-03").getTime());
  expect(result[3]?.getTime()).toBe(new Date("2023-01-04").getTime());
});
