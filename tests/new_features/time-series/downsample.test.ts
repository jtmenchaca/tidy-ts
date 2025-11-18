import { expect } from "@std/expect";
import { createDataFrame, type DataFrame, stats } from "@tidy-ts/dataframe";

Deno.test("downsample() - downsample hourly to daily", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00Z"), price: 100, volume: 10 },
    { timestamp: new Date("2023-01-01T11:00:00Z"), price: 110, volume: 20 },
    { timestamp: new Date("2023-01-01T12:00:00Z"), price: 120, volume: 30 },
    { timestamp: new Date("2023-01-02T10:00:00Z"), price: 130, volume: 40 },
  ]);

  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      price: stats.mean,
      volume: stats.sum,
    },
  });

  const _typeCheck: DataFrame<{
    timestamp: Date;
    price: number;
    volume: number;
  }> = result;

  expect(result.nrows()).toBe(2);
  expect(result[0].price).toBe(110); // (100 + 110 + 120) / 3
  expect(result[0].volume).toBe(60); // 10 + 20 + 30
  expect(result[1].price).toBe(130);
  expect(result[1].volume).toBe(40);
});

Deno.test("downsample() - downsample with different aggregations (OHLC)", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00Z"), price: 100 },
    { timestamp: new Date("2023-01-01T11:00:00Z"), price: 150 },
    { timestamp: new Date("2023-01-01T12:00:00Z"), price: 120 },
  ]);

  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      open: stats.first, // First price
      high: stats.max, // Highest price
      low: stats.min, // Lowest price
      close: stats.last, // Last price
      mean: stats.mean, // Average price
    },
  });

  expect(result.nrows()).toBe(1);
  expect(result[0].open).toBe(100);
  expect(result[0].high).toBe(150);
  expect(result[0].low).toBe(100);
  expect(result[0].close).toBe(120);
  expect(result[0].mean).toBe(123.33333333333333); // (100 + 150 + 120) / 3
});

Deno.test("downsample() - downsample to weekly", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00Z"), sales: 100 },
    { timestamp: new Date("2023-01-02T10:00:00Z"), sales: 200 },
    { timestamp: new Date("2023-01-08T10:00:00Z"), sales: 300 },
    { timestamp: new Date("2023-01-09T10:00:00Z"), sales: 400 },
  ]);

  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1W",
    aggregations: {
      sales: stats.sum,
    },
  });

  expect(result.nrows()).toBe(2);
  expect(result[0].sales).toBe(300); // 100 + 200
  expect(result[1].sales).toBe(700); // 300 + 400
});

Deno.test("downsample() - downsample to 15-minute intervals", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00Z"), value: 10 },
    { timestamp: new Date("2023-01-01T10:05:00Z"), value: 20 },
    { timestamp: new Date("2023-01-01T10:10:00Z"), value: 30 },
    { timestamp: new Date("2023-01-01T10:20:00Z"), value: 40 },
  ]);

  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "15min",
    aggregations: {
      value: stats.mean,
    },
  });

  expect(result.nrows()).toBe(2);
  expect(result[0].value).toBe(20); // (10 + 20 + 30) / 3
  expect(result[1].value).toBe(40); // single value
});

Deno.test("downsample() - handle empty DataFrame", () => {
  const df = createDataFrame([]);
  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      value: stats.mean,
    },
  });

  expect(result.nrows()).toBe(0);
});

Deno.test("downsample() - handle single row", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00Z"), value: 100 },
  ]);

  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      value: stats.mean,
    },
  });

  expect(result.nrows()).toBe(1);
  expect(result[0].value).toBe(100);
});

Deno.test("downsample() - with grouped data", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00Z"), symbol: "AAPL", price: 150 },
    { timestamp: new Date("2023-01-01T11:00:00Z"), symbol: "AAPL", price: 151 },
    { timestamp: new Date("2023-01-01T10:00:00Z"), symbol: "MSFT", price: 300 },
    { timestamp: new Date("2023-01-01T11:00:00Z"), symbol: "MSFT", price: 301 },
  ]);

  const result = df.groupBy("symbol").downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      price: stats.mean,
      timestamp: stats.first,
    },
  });

  expect(result.nrows()).toBe(2);
  expect(result[0].price).toBe(150.5); // (150 + 151) / 2
  expect(result[1].price).toBe(300.5); // (300 + 301) / 2
});

// ============================================================================
// Tests for startDate and endDate parameters
// ============================================================================

Deno.test("downsample() - downsample with startDate before first data point", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-05T10:00:00Z"), price: 100, volume: 10 },
    { timestamp: new Date("2023-01-05T11:00:00Z"), price: 110, volume: 20 },
    { timestamp: new Date("2023-01-06T10:00:00Z"), price: 130, volume: 40 },
  ]);

  // startDate is before first data point - should start from startDate, include empty buckets
  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      price: stats.mean,
      volume: stats.sum,
    },
    startDate: new Date("2023-01-01T00:00:00Z"),
  });

  // Should have buckets from 2023-01-01 to 2023-01-06 (6 days)
  expect(result.nrows()).toBe(6);
  // First bucket should be Jan 1 (empty, but included) - bucketed to UTC midnight
  const expectedStartBucket = Math.floor(
    new Date("2023-01-01T00:00:00Z").getTime() / (24 * 60 * 60 * 1000),
  ) * (24 * 60 * 60 * 1000);
  expect(result[0].timestamp.getTime()).toBe(expectedStartBucket);
  // Find the bucket for 2023-01-05 - bucketed to UTC midnight
  const expectedJan5Bucket = Math.floor(
    new Date("2023-01-05T00:00:00Z").getTime() / (24 * 60 * 60 * 1000),
  ) * (24 * 60 * 60 * 1000);
  const jan5 = result.filter((row) =>
    row.timestamp.getTime() === expectedJan5Bucket
  );
  expect(jan5.nrows()).toBe(1);
  expect(jan5[0].price).toBe(105); // (100 + 110) / 2
  expect(jan5[0].volume).toBe(30); // 10 + 20
});

Deno.test("downsample() - downsample with startDate after first data point (truncate)", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00Z"), price: 100, volume: 10 },
    { timestamp: new Date("2023-01-02T10:00:00Z"), price: 110, volume: 20 },
    { timestamp: new Date("2023-01-03T10:00:00Z"), price: 120, volume: 30 },
    { timestamp: new Date("2023-01-04T10:00:00Z"), price: 130, volume: 40 },
  ]);

  // startDate is after first data point - should truncate earlier data
  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      price: stats.mean,
      volume: stats.sum,
    },
    startDate: new Date("2023-01-03T00:00:00Z"),
  });

  // Should only have buckets from Jan 3 onwards (truncated)
  expect(result.nrows()).toBeGreaterThanOrEqual(2);
  // First bucket should be Jan 3 (startDate) - bucketed to UTC midnight
  const expectedStartBucket = Math.floor(
    new Date("2023-01-03T00:00:00Z").getTime() / (24 * 60 * 60 * 1000),
  ) * (24 * 60 * 60 * 1000);
  expect(result[0].timestamp.getTime()).toBe(expectedStartBucket);
  expect(result[0].price).toBe(120); // Only Jan 3 data
  expect(result[0].volume).toBe(30);
  // Should not include Jan 1 or Jan 2 data
  const jan1 = result.filter((row) =>
    row.timestamp.getTime() === new Date("2023-01-01T00:00:00Z").getTime()
  );
  expect(jan1.nrows()).toBe(0); // Truncated
});

Deno.test("downsample() - downsample with endDate after last data point", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00Z"), price: 100, volume: 10 },
    { timestamp: new Date("2023-01-01T11:00:00Z"), price: 110, volume: 20 },
    { timestamp: new Date("2023-01-02T10:00:00Z"), price: 130, volume: 40 },
  ]);

  // endDate is after last data point - should extend to endDate, include empty buckets
  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      price: stats.mean,
      volume: stats.sum,
    },
    endDate: new Date("2023-01-05T23:59:59Z"),
  });

  // Should have buckets from 2023-01-01 to 2023-01-05 (5 days)
  expect(result.nrows()).toBe(5);
  // Last bucket should be 2023-01-05 (empty, but included) - bucketed to UTC midnight
  const lastBucket = result[result.nrows() - 1];
  const expectedEndBucket = Math.floor(
    new Date("2023-01-05T00:00:00Z").getTime() / (24 * 60 * 60 * 1000),
  ) * (24 * 60 * 60 * 1000);
  expect(lastBucket.timestamp.getTime()).toBe(expectedEndBucket);
});

Deno.test("downsample() - downsample with both startDate and endDate", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-03T10:00:00Z"), price: 100, volume: 10 },
    { timestamp: new Date("2023-01-03T11:00:00Z"), price: 110, volume: 20 },
    { timestamp: new Date("2023-01-04T10:00:00Z"), price: 130, volume: 40 },
  ]);

  // Both startDate and endDate specified - should create range
  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      price: stats.mean,
      volume: stats.sum,
    },
    startDate: new Date("2023-01-01T00:00:00Z"),
    endDate: new Date("2023-01-05T23:59:59Z"),
  });

  // Should have exactly 5 buckets (Jan 1-5)
  expect(result.nrows()).toBe(5);
  // First bucket should be Jan 1 (empty) - bucketed to UTC midnight
  const expectedStartBucket = Math.floor(
    new Date("2023-01-01T00:00:00Z").getTime() / (24 * 60 * 60 * 1000),
  ) * (24 * 60 * 60 * 1000);
  expect(result[0].timestamp.getTime()).toBe(expectedStartBucket);
  // Last bucket should be Jan 5 (empty) - bucketed to UTC midnight
  const expectedEndBucket = Math.floor(
    new Date("2023-01-05T00:00:00Z").getTime() / (24 * 60 * 60 * 1000),
  ) * (24 * 60 * 60 * 1000);
  expect(result[4].timestamp.getTime()).toBe(expectedEndBucket);
  // Jan 3 bucket should have aggregated data - bucketed to UTC midnight
  const expectedJan3Bucket = Math.floor(
    new Date("2023-01-03T00:00:00Z").getTime() / (24 * 60 * 60 * 1000),
  ) * (24 * 60 * 60 * 1000);
  const jan3 = result.filter((row) =>
    row.timestamp.getTime() === expectedJan3Bucket
  );
  expect(jan3.nrows()).toBe(1);
  expect(jan3[0].price).toBe(105); // (100 + 110) / 2
  expect(jan3[0].volume).toBe(30); // 10 + 20
});

Deno.test("downsample() - downsample with only startDate (use last data point as end)", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-05T10:00:00Z"), price: 100 },
    { timestamp: new Date("2023-01-05T11:00:00Z"), price: 110 },
    { timestamp: new Date("2023-01-07T10:00:00Z"), price: 130 },
  ]);

  // Only startDate - should start from startDate, end at last data point (Jan 7)
  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      price: stats.mean,
    },
    startDate: new Date("2023-01-01T00:00:00Z"),
  });

  // Should start at startDate, end at last data point (Jan 7)
  expect(result.nrows()).toBe(7); // Jan 1-7
  expect(result[0].timestamp.getTime()).toBe(
    new Date("2023-01-01T00:00:00Z").getTime(),
  );
  // Last bucket should be Jan 7 (last data point)
  const lastBucket = result[result.nrows() - 1];
  expect(lastBucket.timestamp.getTime()).toBe(
    new Date("2023-01-07T00:00:00Z").getTime(),
  );
  expect(lastBucket.price).toBe(130);
});

Deno.test("downsample() - downsample with only endDate (use first data point as start)", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-03T10:00:00Z"), price: 100 },
    { timestamp: new Date("2023-01-03T11:00:00Z"), price: 110 },
    { timestamp: new Date("2023-01-04T10:00:00Z"), price: 130 },
  ]);

  // Only endDate - should start at first data point, extend to endDate
  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      price: stats.mean,
    },
    endDate: new Date("2023-01-05T23:59:59Z"),
  });

  // Should start at first data point (Jan 3), end at endDate (Jan 5)
  expect(result.nrows()).toBe(3); // Jan 3, 4, 5
  expect(result[0].timestamp.getTime()).toBe(
    new Date("2023-01-03T00:00:00Z").getTime(),
  );
  // Last bucket should be endDate (Jan 5) - empty but included
  const lastBucket = result[result.nrows() - 1];
  expect(lastBucket.timestamp.getTime()).toBe(
    new Date("2023-01-05T00:00:00Z").getTime(),
  );
});

Deno.test("downsample() - with grouped data and startDate/endDate", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-03T10:00:00Z"), symbol: "AAPL", price: 150 },
    { timestamp: new Date("2023-01-03T11:00:00Z"), symbol: "AAPL", price: 151 },
    { timestamp: new Date("2023-01-04T10:00:00Z"), symbol: "AAPL", price: 152 },
    { timestamp: new Date("2023-01-03T10:00:00Z"), symbol: "MSFT", price: 300 },
    { timestamp: new Date("2023-01-03T11:00:00Z"), symbol: "MSFT", price: 301 },
    { timestamp: new Date("2023-01-04T10:00:00Z"), symbol: "MSFT", price: 302 },
  ]);

  // Grouped data with startDate/endDate - should apply per group
  const result = df.groupBy("symbol").downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      price: stats.mean,
    },
    startDate: new Date("2023-01-01T00:00:00Z"),
    endDate: new Date("2023-01-05T23:59:59Z"),
  });

  // Should have consistent date ranges for both groups
  // Each group should have 5 buckets (Jan 1-5)
  // Total rows = 5 buckets * 2 groups = 10 rows
  expect(result.nrows()).toBe(10);

  // Verify AAPL group has correct range
  const aapl = result.filter((row) => (row.symbol === "AAPL"));
  expect(aapl.nrows()).toBe(5);
  expect(aapl[0].timestamp.getTime()).toBe(
    new Date("2023-01-01T00:00:00Z").getTime(),
  );
  expect(aapl[4].timestamp.getTime()).toBe(
    new Date("2023-01-05T00:00:00Z").getTime(),
  );

  // Verify MSFT group has correct range
  const msft = result.filter((row) => (row.symbol === "MSFT"));
  expect(msft.nrows()).toBe(5);
  expect(msft[0].timestamp.getTime()).toBe(
    new Date("2023-01-01T00:00:00Z").getTime(),
  );
  expect(msft[4].timestamp.getTime()).toBe(
    new Date("2023-01-05T00:00:00Z").getTime(),
  );
});

Deno.test("downsample() - downsample aligns to fiscal year boundaries", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-04-15T10:00:00Z"), sales: 100 },
    { timestamp: new Date("2023-05-15T10:00:00Z"), sales: 200 },
    { timestamp: new Date("2023-06-15T10:00:00Z"), sales: 300 },
  ]);

  // Fiscal year Q2: April 1 - June 30
  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1M",
    aggregations: {
      sales: stats.sum,
    },
    startDate: new Date("2023-04-01T00:00:00Z"),
    endDate: new Date("2023-06-30T23:59:59Z"),
  });

  // Should have exactly 3 months (April, May, June)
  expect(result.nrows()).toBe(3);
  expect(result[0].timestamp.getTime()).toBe(
    new Date("2023-04-01T00:00:00Z").getTime(),
  );
  expect(result[2].timestamp.getTime()).toBe(
    new Date("2023-06-01T00:00:00Z").getTime(),
  );
});
