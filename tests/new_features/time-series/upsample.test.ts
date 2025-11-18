import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { test } from "@tidy-ts/shims";

test("upsample() - upsample with forward fill", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00Z"), value: 100 },
    { timestamp: new Date("2023-01-01T12:00:00Z"), value: 200 },
  ]);

  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "forward",
  });

  expect(result.nrows()).toBe(3); // 10:00, 11:00, 12:00
  expect(result[0].value).toBe(100);
  expect(result[1].value).toBe(100); // forward filled
  expect(result[2].value).toBe(200);
});

test("upsample() - upsample with backward fill", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00Z"), value: 100 },
    { timestamp: new Date("2023-01-01T12:00:00Z"), value: 200 },
  ]);

  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "backward",
  });

  expect(result.nrows()).toBe(3); // 10:00, 11:00, 12:00
  expect(result[0].value).toBe(100);
  expect(result[1].value).toBe(200); // backward filled
  expect(result[2].value).toBe(200);
});

// ============================================================================
// Tests for startDate and endDate parameters
// ============================================================================

test("upsample() - upsample with startDate before first data point", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T12:00:00Z"), value: 100 },
    { timestamp: new Date("2023-01-01T14:00:00Z"), value: 200 },
  ]);

  // startDate before first data point - should start from startDate, forward fill from first value
  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "forward",
    startDate: new Date("2023-01-01T10:00:00Z"),
  });

  // Should start at 10:00 (startDate), forward filled with first value (100)
  expect(result.nrows()).toBe(5); // 10:00, 11:00, 12:00, 13:00, 14:00
  expect(result[0].timestamp.getTime()).toBe(
    new Date("2023-01-01T10:00:00Z").getTime(),
  );
  expect(result[0].value).toBe(100); // Forward filled from first actual value
  expect(result[1].value).toBe(100); // Forward filled
  expect(result[2].value).toBe(100); // Actual first value at 12:00
  expect(result[4].value).toBe(200); // Actual second value at 14:00
});

test("upsample() - upsample with startDate after first data point (truncate)", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00Z"), value: 100 },
    { timestamp: new Date("2023-01-01T11:00:00Z"), value: 110 },
    { timestamp: new Date("2023-01-01T12:00:00Z"), value: 120 },
    { timestamp: new Date("2023-01-01T13:00:00Z"), value: 130 },
  ]);

  // startDate is after first data point - should truncate earlier data
  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "forward",
    startDate: new Date("2023-01-01T12:00:00Z"),
  });

  // Should start at 12:00 (startDate), truncating 10:00 and 11:00
  expect(result.nrows()).toBeGreaterThanOrEqual(2);
  expect(result[0].timestamp.getTime()).toBe(
    new Date("2023-01-01T12:00:00Z").getTime(),
  );
  expect(result[0].value).toBe(120); // First value at startDate
  // Should not include 10:00 or 11:00
  const beforeStart = result.filter((row) =>
    row.timestamp.getTime() < new Date("2023-01-01T12:00:00Z").getTime()
  );
  expect(beforeStart.nrows()).toBe(0); // Truncated
});

test("upsample() - upsample with endDate after last data point", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00Z"), value: 100 },
    { timestamp: new Date("2023-01-01T12:00:00Z"), value: 200 },
  ]);

  // endDate after last data point - should extend to endDate, forward fill if needed
  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "forward",
    endDate: new Date("2023-01-01T15:00:00Z"),
  });

  // Should extend to 15:00, forward filled with last value (200)
  expect(result.nrows()).toBe(6); // 10:00, 11:00, 12:00, 13:00, 14:00, 15:00
  const lastRow = result[result.nrows() - 1];
  expect(lastRow.timestamp.getTime()).toBe(
    new Date("2023-01-01T15:00:00Z").getTime(),
  );
  expect(lastRow.value).toBe(200); // Forward filled from last actual value
});

test("upsample() - upsample with both startDate and endDate", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T12:00:00Z"), value: 100 },
    { timestamp: new Date("2023-01-01T13:00:00Z"), value: 200 },
  ]);

  // Both startDate and endDate - should create full range
  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "forward",
    startDate: new Date("2023-01-01T10:00:00Z"),
    endDate: new Date("2023-01-01T15:00:00Z"),
  });

  // Should have exactly 6 rows (10:00, 11:00, 12:00, 13:00, 14:00, 15:00)
  expect(result.nrows()).toBe(6);
  expect(result[0].timestamp.getTime()).toBe(
    new Date("2023-01-01T10:00:00Z").getTime(),
  );
  expect(result[0].value).toBe(100); // Forward filled
  expect(result[2].value).toBe(100); // Actual first value
  expect(result[3].value).toBe(200); // Actual second value
  expect(result[5].value).toBe(200); // Forward filled to end
});

test("upsample() - upsample with backward fill and endDate", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00Z"), value: 100 },
    { timestamp: new Date("2023-01-01T12:00:00Z"), value: 200 },
  ]);

  // Upsample with backward fill and endDate - should extend to endDate, backward fill if needed
  const result = df.upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "backward",
    endDate: new Date("2023-01-01T15:00:00Z"),
  });

  // Should extend to 15:00, backward filled with last value (200)
  expect(result.nrows()).toBe(6); // 10:00, 11:00, 12:00, 13:00, 14:00, 15:00
  const lastRow = result[result.nrows() - 1];
  expect(lastRow.timestamp.getTime()).toBe(
    new Date("2023-01-01T15:00:00Z").getTime(),
  );
  expect(lastRow.value).toBe(200); // Backward filled
  // Values before 12:00 should be backward filled from 12:00 value
  expect(result[1].value).toBe(200); // 11:00 backward filled
});

// ============================================================================
// Tests for grouped DataFrames
// ============================================================================

test("upsample() - with grouped data", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00Z"), symbol: "AAPL", price: 150 },
    { timestamp: new Date("2023-01-01T12:00:00Z"), symbol: "AAPL", price: 151 },
    { timestamp: new Date("2023-01-01T10:00:00Z"), symbol: "MSFT", price: 300 },
    { timestamp: new Date("2023-01-01T12:00:00Z"), symbol: "MSFT", price: 301 },
  ]);

  const result = df.groupBy("symbol").upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "forward",
  });

  // Should have 3 rows per symbol (10:00, 11:00, 12:00) = 6 total rows
  expect(result.nrows()).toBe(6);

  // Check AAPL group
  const aapl = result.filter((row) => row.symbol === "AAPL");
  expect(aapl.nrows()).toBe(3);
  expect(aapl[0].price).toBe(150); // 10:00
  expect(aapl[1].price).toBe(150); // 11:00 forward filled
  expect(aapl[2].price).toBe(151); // 12:00

  // Check MSFT group
  const msft = result.filter((row) => row.symbol === "MSFT");
  expect(msft.nrows()).toBe(3);
  expect(msft[0].price).toBe(300); // 10:00
  expect(msft[1].price).toBe(300); // 11:00 forward filled
  expect(msft[2].price).toBe(301); // 12:00
});

test("upsample() - with grouped data and startDate/endDate", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T12:00:00Z"), symbol: "AAPL", price: 150 },
    { timestamp: new Date("2023-01-01T13:00:00Z"), symbol: "AAPL", price: 151 },
    { timestamp: new Date("2023-01-01T12:00:00Z"), symbol: "MSFT", price: 300 },
    { timestamp: new Date("2023-01-01T13:00:00Z"), symbol: "MSFT", price: 301 },
  ]);

  const result = df.groupBy("symbol").upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "forward",
    startDate: new Date("2023-01-01T10:00:00Z"),
    endDate: new Date("2023-01-01T15:00:00Z"),
  });

  // Should have 6 rows per symbol (10:00-15:00) = 12 total rows
  expect(result.nrows()).toBe(12);

  // Check AAPL group
  const aapl = result.filter((row) => row.symbol === "AAPL");
  expect(aapl.nrows()).toBe(6);
  expect(aapl[0].timestamp.getTime()).toBe(
    new Date("2023-01-01T10:00:00Z").getTime(),
  );
  expect(aapl[0].price).toBe(150); // Forward filled from first value
  expect(aapl[2].price).toBe(150); // Actual first value at 12:00
  expect(aapl[3].price).toBe(151); // Actual second value at 13:00
  expect(aapl[5].price).toBe(151); // Forward filled to end

  // Check MSFT group
  const msft = result.filter((row) => row.symbol === "MSFT");
  expect(msft.nrows()).toBe(6);
  expect(msft[0].timestamp.getTime()).toBe(
    new Date("2023-01-01T10:00:00Z").getTime(),
  );
  expect(msft[0].price).toBe(300); // Forward filled from first value
  expect(msft[2].price).toBe(300); // Actual first value at 12:00
  expect(msft[3].price).toBe(301); // Actual second value at 13:00
  expect(msft[5].price).toBe(301); // Forward filled to end
});

test("upsample() - with grouped data and backward fill", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00Z"), symbol: "AAPL", price: 150 },
    { timestamp: new Date("2023-01-01T12:00:00Z"), symbol: "AAPL", price: 151 },
    { timestamp: new Date("2023-01-01T10:00:00Z"), symbol: "MSFT", price: 300 },
    { timestamp: new Date("2023-01-01T12:00:00Z"), symbol: "MSFT", price: 301 },
  ]);

  const result = df.groupBy("symbol").upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "backward",
    endDate: new Date("2023-01-01T15:00:00Z"),
  });

  // Should have 6 rows per symbol (10:00-15:00) = 12 total rows
  expect(result.nrows()).toBe(12);

  // Check AAPL group
  const aapl = result.filter((row) => row.symbol === "AAPL");
  expect(aapl.nrows()).toBe(6);
  expect(aapl[0].price).toBe(150); // 10:00 actual value
  expect(aapl[1].price).toBe(151); // 11:00 backward filled from 12:00
  expect(aapl[2].price).toBe(151); // 12:00 actual value
  expect(aapl[5].price).toBe(151); // 15:00 backward filled

  // Check MSFT group
  const msft = result.filter((row) => row.symbol === "MSFT");
  expect(msft.nrows()).toBe(6);
  expect(msft[0].price).toBe(300); // 10:00 actual value
  expect(msft[1].price).toBe(301); // 11:00 backward filled from 12:00
  expect(msft[2].price).toBe(301); // 12:00 actual value
  expect(msft[5].price).toBe(301); // 15:00 backward filled
});

test("upsample() - with multiple grouping columns", () => {
  const df = createDataFrame([
    {
      timestamp: new Date("2023-01-01T10:00:00Z"),
      region: "US",
      symbol: "AAPL",
      price: 150,
    },
    {
      timestamp: new Date("2023-01-01T12:00:00Z"),
      region: "US",
      symbol: "AAPL",
      price: 151,
    },
    {
      timestamp: new Date("2023-01-01T10:00:00Z"),
      region: "EU",
      symbol: "AAPL",
      price: 155,
    },
    {
      timestamp: new Date("2023-01-01T12:00:00Z"),
      region: "EU",
      symbol: "AAPL",
      price: 156,
    },
  ]);

  const result = df.groupBy("region", "symbol").upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "forward",
  });

  // Should have 3 rows per group (10:00, 11:00, 12:00) = 6 total rows
  expect(result.nrows()).toBe(6);

  // Check US-AAPL group
  const usAapl = result.filter(
    (row) => row.region === "US" && row.symbol === "AAPL",
  );
  expect(usAapl.nrows()).toBe(3);
  expect(usAapl[0].price).toBe(150);
  expect(usAapl[1].price).toBe(150); // forward filled
  expect(usAapl[2].price).toBe(151);

  // Check EU-AAPL group
  const euAapl = result.filter(
    (row) => row.region === "EU" && row.symbol === "AAPL",
  );
  expect(euAapl.nrows()).toBe(3);
  expect(euAapl[0].price).toBe(155);
  expect(euAapl[1].price).toBe(155); // forward filled
  expect(euAapl[2].price).toBe(156);
});
