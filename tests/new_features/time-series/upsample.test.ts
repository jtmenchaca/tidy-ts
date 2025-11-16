import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("upsample() - upsample with forward fill", () => {
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

Deno.test("upsample() - upsample with backward fill", () => {
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

Deno.test("upsample() - upsample with startDate before first data point", () => {
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

Deno.test("upsample() - upsample with startDate after first data point (truncate)", () => {
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

Deno.test("upsample() - upsample with endDate after last data point", () => {
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

Deno.test("upsample() - upsample with both startDate and endDate", () => {
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

Deno.test("upsample() - upsample with backward fill and endDate", () => {
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
