import { expect } from "@std/expect";
import { createDataFrame, stats } from "@tidy-ts/dataframe";

Deno.test("resample() - downsample hourly to daily", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), price: 100, volume: 10 },
    { timestamp: new Date("2023-01-01T11:00:00"), price: 110, volume: 20 },
    { timestamp: new Date("2023-01-01T12:00:00"), price: 120, volume: 30 },
    { timestamp: new Date("2023-01-02T10:00:00"), price: 130, volume: 40 },
  ]);

  const result = df.resample("timestamp", "1D", {
    price: stats.mean,
    volume: stats.sum,
  });

  expect(result.nrows()).toBe(2);
  expect(result[0].price).toBe(110); // (100 + 110 + 120) / 3
  expect(result[0].volume).toBe(60); // 10 + 20 + 30
  expect(result[1].price).toBe(130);
  expect(result[1].volume).toBe(40);
});

Deno.test("resample() - downsample with different aggregations (OHLC)", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), price: 100 },
    { timestamp: new Date("2023-01-01T11:00:00"), price: 150 },
    { timestamp: new Date("2023-01-01T12:00:00"), price: 120 },
  ]);

  const result = df.resample("timestamp", "1D", {
    open: stats.first, // First price
    high: stats.max, // Highest price
    low: stats.min, // Lowest price
    close: stats.last, // Last price
    mean: stats.mean, // Average price
  });

  expect(result.nrows()).toBe(1);
  expect(result[0].open).toBe(100);
  expect(result[0].high).toBe(150);
  expect(result[0].low).toBe(100);
  expect(result[0].close).toBe(120);
  expect(result[0].mean).toBe(123.33333333333333); // (100 + 150 + 120) / 3
});

Deno.test("resample() - downsample to weekly", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), sales: 100 },
    { timestamp: new Date("2023-01-02T10:00:00"), sales: 200 },
    { timestamp: new Date("2023-01-08T10:00:00"), sales: 300 },
    { timestamp: new Date("2023-01-09T10:00:00"), sales: 400 },
  ]);

  const result = df.resample("timestamp", "1W", {
    sales: stats.sum,
  });

  expect(result.nrows()).toBe(2);
  expect(result[0].sales).toBe(300); // 100 + 200
  expect(result[1].sales).toBe(700); // 300 + 400
});

Deno.test("resample() - downsample with custom aggregation function", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), value: 10 },
    { timestamp: new Date("2023-01-01T11:00:00"), value: 20 },
    { timestamp: new Date("2023-01-01T12:00:00"), value: 30 },
  ]);

  const result = df.resample("timestamp", "1D", {
    custom_sum: (values: unknown[]) => {
      return (values as number[]).reduce((a, b) => a + b, 0);
    },
  });

  expect(result.nrows()).toBe(1);
  expect(result[0].custom_sum).toBe(60); // 10 + 20 + 30
});

Deno.test("resample() - upsample with forward fill", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), value: 100 },
    { timestamp: new Date("2023-01-01T12:00:00"), value: 200 },
  ]);

  const result = df.resample("timestamp", "1H", {
    method: stats.forwardFill,
  });

  expect(result.nrows()).toBe(3); // 10:00, 11:00, 12:00
  expect(result[0].value).toBe(100);
  expect(result[1].value).toBe(100); // forward filled
  expect(result[2].value).toBe(200);
});

Deno.test("resample() - upsample with backward fill", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), value: 100 },
    { timestamp: new Date("2023-01-01T12:00:00"), value: 200 },
  ]);

  const result = df.resample("timestamp", "1H", {
    method: stats.backwardFill,
  });

  expect(result.nrows()).toBe(3); // 10:00, 11:00, 12:00
  expect(result[0].value).toBe(100);
  expect(result[1].value).toBe(200); // backward filled
  expect(result[2].value).toBe(200);
});

Deno.test("resample() - upsample with per-column fill methods", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), price: 100, volume: 10 },
    { timestamp: new Date("2023-01-01T12:00:00"), price: 200, volume: 20 },
  ]);

  const result = df.resample("timestamp", "1H", {
    price: stats.forwardFill,
    volume: stats.backwardFill,
  });

  expect(result.nrows()).toBe(3);
  expect(result[0].price).toBe(100);
  expect(result[1].price).toBe(100); // forward filled
  expect(result[2].price).toBe(200);
  expect(result[0].volume).toBe(10);
  expect(result[1].volume).toBe(20); // backward filled
  expect(result[2].volume).toBe(20);
});

Deno.test("resample() - downsample to 15-minute intervals", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), value: 10 },
    { timestamp: new Date("2023-01-01T10:05:00"), value: 20 },
    { timestamp: new Date("2023-01-01T10:10:00"), value: 30 },
    { timestamp: new Date("2023-01-01T10:20:00"), value: 40 },
  ]);

  const result = df.resample("timestamp", "15min", {
    value: stats.mean,
  });

  expect(result.nrows()).toBe(2);
  expect(result[0].value).toBe(20); // (10 + 20 + 30) / 3
  expect(result[1].value).toBe(40); // single value
});

Deno.test("resample() - handle empty DataFrame", () => {
  const df = createDataFrame([]);

  // @ts-expect-error - Cannot resample empty DataFrame
  const result = df.resample("timestamp", "1D", {
    value: stats.mean,
  });

  expect(result.nrows()).toBe(0);
});

Deno.test("resample() - handle single row", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), value: 100 },
  ]);

  const result = df.resample("timestamp", "1D", {
    value: stats.mean,
  });

  expect(result.nrows()).toBe(1);
  expect(result[0].value).toBe(100);
});

Deno.test("resample() - with grouped data", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), symbol: "AAPL", price: 150 },
    { timestamp: new Date("2023-01-01T11:00:00"), symbol: "AAPL", price: 151 },
    { timestamp: new Date("2023-01-01T10:00:00"), symbol: "MSFT", price: 300 },
    { timestamp: new Date("2023-01-01T11:00:00"), symbol: "MSFT", price: 301 },
  ]);

  const result = df.groupBy("symbol").resample("timestamp", "1D", {
    price: stats.mean,
  });

  expect(result.nrows()).toBe(2);
  expect(result[0].price).toBe(150.5); // (150 + 151) / 2
  expect(result[1].price).toBe(300.5); // (300 + 301) / 2
});

Deno.test("resample() - reject non-Date time columns", () => {
  // Test with string column
  const df1 = createDataFrame([
    { timestamp: "2023-01-01", price: 100 },
    { timestamp: "2023-01-02", price: 110 },
  ]);

  // @ts-expect-error - resample() requires a Date column for the time column
  const _result1 = df1.resample("timestamp", "1D", {
    price: stats.mean,
  });

  // Test with number column
  const df2 = createDataFrame([
    { timestamp: 1000, price: 100 },
    { timestamp: 2000, price: 110 },
  ]);

  // @ts-expect-error - resample() requires a Date column for the time column
  const _result2 = df2.resample("timestamp", "1D", {
    price: stats.mean,
  });
});
