import { expect } from "@std/expect";
import {
  frequencyToMs,
  getTimeBucket,
} from "../../../src/dataframe/ts/verbs/utility/time-bucket.ts";

// ============================================================================
// frequencyToMs() Tests
// ============================================================================

Deno.test("frequencyToMs() - converts number (milliseconds) directly", () => {
  expect(frequencyToMs(5000)).toBe(5000);
  expect(frequencyToMs(1)).toBe(1);
  expect(frequencyToMs(86400000)).toBe(86400000);
});

Deno.test("frequencyToMs() - converts object format with seconds", () => {
  expect(frequencyToMs({ value: 1, unit: "s" })).toBe(1000);
  expect(frequencyToMs({ value: 30, unit: "s" })).toBe(30000);
});

Deno.test("frequencyToMs() - converts object format with minutes", () => {
  expect(frequencyToMs({ value: 1, unit: "min" })).toBe(60 * 1000);
  expect(frequencyToMs({ value: 15, unit: "min" })).toBe(15 * 60 * 1000);
});

Deno.test("frequencyToMs() - converts object format with hours", () => {
  expect(frequencyToMs({ value: 1, unit: "h" })).toBe(60 * 60 * 1000);
  expect(frequencyToMs({ value: 2, unit: "h" })).toBe(2 * 60 * 60 * 1000);
});

Deno.test("frequencyToMs() - converts object format with days", () => {
  expect(frequencyToMs({ value: 1, unit: "d" })).toBe(24 * 60 * 60 * 1000);
  expect(frequencyToMs({ value: 7, unit: "d" })).toBe(7 * 24 * 60 * 60 * 1000);
});

Deno.test("frequencyToMs() - converts object format with weeks", () => {
  expect(frequencyToMs({ value: 1, unit: "w" })).toBe(
    7 * 24 * 60 * 60 * 1000,
  );
  expect(frequencyToMs({ value: 2, unit: "w" })).toBe(
    14 * 24 * 60 * 60 * 1000,
  );
});

Deno.test("frequencyToMs() - converts object format with months (approximate)", () => {
  expect(frequencyToMs({ value: 1, unit: "M" })).toBe(
    30 * 24 * 60 * 60 * 1000,
  );
  expect(frequencyToMs({ value: 3, unit: "M" })).toBe(
    90 * 24 * 60 * 60 * 1000,
  );
});

Deno.test("frequencyToMs() - converts object format with quarters (approximate)", () => {
  expect(frequencyToMs({ value: 1, unit: "Q" })).toBe(
    90 * 24 * 60 * 60 * 1000,
  );
});

Deno.test("frequencyToMs() - converts object format with years (approximate)", () => {
  expect(frequencyToMs({ value: 1, unit: "Y" })).toBe(
    365 * 24 * 60 * 60 * 1000,
  );
});

Deno.test("frequencyToMs() - converts string format with seconds", () => {
  expect(frequencyToMs("1S")).toBe(1000);
  expect(frequencyToMs("5S")).toBe(5000);
  expect(frequencyToMs("15S")).toBe(15000);
  expect(frequencyToMs("30S")).toBe(30000);
});

Deno.test("frequencyToMs() - converts string format with minutes", () => {
  expect(frequencyToMs("1min")).toBe(60 * 1000);
  expect(frequencyToMs("5min")).toBe(5 * 60 * 1000);
  expect(frequencyToMs("15min")).toBe(15 * 60 * 1000);
  expect(frequencyToMs("30min")).toBe(30 * 60 * 1000);
});

Deno.test("frequencyToMs() - converts string format with hours", () => {
  expect(frequencyToMs("1H")).toBe(60 * 60 * 1000);
  expect(frequencyToMs("2H")).toBe(2 * 60 * 60 * 1000);
  expect(frequencyToMs("24H")).toBe(24 * 60 * 60 * 1000);
});

Deno.test("frequencyToMs() - converts string format with days", () => {
  expect(frequencyToMs("1D")).toBe(24 * 60 * 60 * 1000);
  expect(frequencyToMs("7D")).toBe(7 * 24 * 60 * 60 * 1000);
});

Deno.test("frequencyToMs() - converts string format with weeks", () => {
  expect(frequencyToMs("1W")).toBe(7 * 24 * 60 * 60 * 1000);
  expect(frequencyToMs("2W")).toBe(14 * 24 * 60 * 60 * 1000);
});

Deno.test("frequencyToMs() - converts string format with months (approximate)", () => {
  expect(frequencyToMs("1M")).toBe(30 * 24 * 60 * 60 * 1000);
  expect(frequencyToMs("3M")).toBe(90 * 24 * 60 * 60 * 1000);
});

Deno.test("frequencyToMs() - converts string format with quarters (approximate)", () => {
  expect(frequencyToMs("1Q")).toBe(90 * 24 * 60 * 60 * 1000);
  expect(frequencyToMs("2Q")).toBe(180 * 24 * 60 * 60 * 1000);
});

Deno.test("frequencyToMs() - converts string format with years (approximate)", () => {
  expect(frequencyToMs("1Y")).toBe(365 * 24 * 60 * 60 * 1000);
  expect(frequencyToMs("2Y")).toBe(730 * 24 * 60 * 60 * 1000);
});

Deno.test("frequencyToMs() - throws error on invalid string format", () => {
  // deno-lint-ignore no-explicit-any
  expect(() => frequencyToMs("invalid" as any)).toThrow(
    "Invalid frequency format: invalid",
  );
  // deno-lint-ignore no-explicit-any
  expect(() => frequencyToMs("1" as any)).toThrow(
    "Invalid frequency format: 1",
  );
  // deno-lint-ignore no-explicit-any
  expect(() => frequencyToMs("D" as any)).toThrow(
    "Invalid frequency format: D",
  );
});

Deno.test("frequencyToMs() - throws error on unknown unit", () => {
  // deno-lint-ignore no-explicit-any
  expect(() => frequencyToMs("1X" as any)).toThrow("Unknown frequency unit: X");
  // deno-lint-ignore no-explicit-any
  expect(() => frequencyToMs("5Z" as any)).toThrow("Unknown frequency unit: Z");
});

// ============================================================================
// getTimeBucket() Tests
// ============================================================================

Deno.test("getTimeBucket() - rounds Date to bucket boundary (1 hour)", () => {
  const hourMs = 60 * 60 * 1000;
  const timestamp = new Date("2023-01-01T14:30:00Z");
  const bucket = getTimeBucket(timestamp, hourMs);

  // Should round down to 14:00:00
  expect(bucket).toBe(new Date("2023-01-01T14:00:00Z").getTime());
});

Deno.test("getTimeBucket() - rounds Date to bucket boundary (1 day)", () => {
  const dayMs = 24 * 60 * 60 * 1000;
  const timestamp = new Date("2023-01-01T14:30:00Z");
  const bucket = getTimeBucket(timestamp, dayMs);

  // Should round down to 00:00:00
  expect(bucket).toBe(new Date("2023-01-01T00:00:00Z").getTime());
});

Deno.test("getTimeBucket() - rounds string timestamp to bucket boundary", () => {
  const hourMs = 60 * 60 * 1000;
  const bucket = getTimeBucket("2023-01-01T14:45:30Z", hourMs);

  // Should round down to 14:00:00
  expect(bucket).toBe(new Date("2023-01-01T14:00:00Z").getTime());
});

Deno.test("getTimeBucket() - rounds number timestamp to bucket boundary", () => {
  const hourMs = 60 * 60 * 1000;
  const timestamp = new Date("2023-01-01T14:45:30Z").getTime();
  const bucket = getTimeBucket(timestamp, hourMs);

  // Should round down to 14:00:00
  expect(bucket).toBe(new Date("2023-01-01T14:00:00Z").getTime());
});

Deno.test("getTimeBucket() - handles 15-minute intervals", () => {
  const interval15Min = 15 * 60 * 1000;

  // 10:00:00 → 10:00:00
  expect(getTimeBucket(new Date("2023-01-01T10:00:00Z"), interval15Min)).toBe(
    new Date("2023-01-01T10:00:00Z").getTime(),
  );

  // 10:07:30 → 10:00:00
  expect(getTimeBucket(new Date("2023-01-01T10:07:30Z"), interval15Min)).toBe(
    new Date("2023-01-01T10:00:00Z").getTime(),
  );

  // 10:15:00 → 10:15:00
  expect(getTimeBucket(new Date("2023-01-01T10:15:00Z"), interval15Min)).toBe(
    new Date("2023-01-01T10:15:00Z").getTime(),
  );

  // 10:22:45 → 10:15:00
  expect(getTimeBucket(new Date("2023-01-01T10:22:45Z"), interval15Min)).toBe(
    new Date("2023-01-01T10:15:00Z").getTime(),
  );
});

Deno.test("getTimeBucket() - handles 5-second intervals", () => {
  const interval5Sec = 5 * 1000;

  // 10:00:00 → 10:00:00
  expect(getTimeBucket(new Date("2023-01-01T10:00:00Z"), interval5Sec)).toBe(
    new Date("2023-01-01T10:00:00Z").getTime(),
  );

  // 10:00:03 → 10:00:00
  expect(getTimeBucket(new Date("2023-01-01T10:00:03Z"), interval5Sec)).toBe(
    new Date("2023-01-01T10:00:00Z").getTime(),
  );

  // 10:00:05 → 10:00:05
  expect(getTimeBucket(new Date("2023-01-01T10:00:05Z"), interval5Sec)).toBe(
    new Date("2023-01-01T10:00:05Z").getTime(),
  );

  // 10:00:07 → 10:00:05
  expect(getTimeBucket(new Date("2023-01-01T10:00:07Z"), interval5Sec)).toBe(
    new Date("2023-01-01T10:00:05Z").getTime(),
  );
});

Deno.test("getTimeBucket() - handles weekly intervals", () => {
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  // Unix epoch (1970-01-01) is Thursday
  // Week 0 starts at 1970-01-01T00:00:00Z
  const epoch = new Date("1970-01-01T00:00:00Z").getTime();

  // 2023-01-01 (Sunday) should round to previous Thursday
  const jan1_2023 = new Date("2023-01-01T00:00:00Z").getTime();
  const bucket = getTimeBucket(jan1_2023, weekMs);

  // Calculate expected bucket
  const weeksSinceEpoch = Math.floor((jan1_2023 - epoch) / weekMs);
  const expectedBucket = epoch + weeksSinceEpoch * weekMs;

  expect(bucket).toBe(expectedBucket);
});

Deno.test("getTimeBucket() - bucket boundary is idempotent", () => {
  const hourMs = 60 * 60 * 1000;
  const timestamp = new Date("2023-01-01T14:00:00Z");
  const bucket = getTimeBucket(timestamp, hourMs);

  // Bucketing a bucket boundary should return the same value
  expect(getTimeBucket(bucket, hourMs)).toBe(bucket);
});

Deno.test("getTimeBucket() - throws error on invalid timestamp", () => {
  const hourMs = 60 * 60 * 1000;

  expect(() => getTimeBucket("invalid-date", hourMs)).toThrow(
    "Invalid timestamp: invalid-date",
  );
  expect(() => getTimeBucket(NaN, hourMs)).toThrow("Invalid timestamp: NaN");
});

Deno.test("getTimeBucket() - handles edge case with very small frequency", () => {
  const timestamp = new Date("2023-01-01T10:00:00.123Z");
  const bucket = getTimeBucket(timestamp, 1); // 1ms frequency

  // Should round down to nearest millisecond (no change since we're already at ms precision)
  expect(bucket).toBe(timestamp.getTime());
});

Deno.test("getTimeBucket() - handles edge case with very large frequency", () => {
  const timestamp = new Date("2023-06-15T12:00:00Z");
  const yearMs = 365 * 24 * 60 * 60 * 1000;
  const bucket = getTimeBucket(timestamp, yearMs);

  // Should round down to nearest year boundary from epoch
  const epoch = new Date("1970-01-01T00:00:00Z").getTime();
  const yearsSinceEpoch = Math.floor(
    (timestamp.getTime() - epoch) / yearMs,
  );
  const expectedBucket = epoch + yearsSinceEpoch * yearMs;

  expect(bucket).toBe(expectedBucket);
});

// ============================================================================
// Integration Tests: frequencyToMs + getTimeBucket
// ============================================================================

Deno.test("Integration - frequency string to bucket (daily)", () => {
  const frequency = "1D";
  const frequencyMs = frequencyToMs(frequency);
  const timestamp = new Date("2023-01-15T14:30:00Z");
  const bucket = getTimeBucket(timestamp, frequencyMs);

  expect(bucket).toBe(new Date("2023-01-15T00:00:00Z").getTime());
});

Deno.test("Integration - frequency string to bucket (15 minutes)", () => {
  const frequency = "15min";
  const frequencyMs = frequencyToMs(frequency);
  const timestamp = new Date("2023-01-01T10:22:45Z");
  const bucket = getTimeBucket(timestamp, frequencyMs);

  expect(bucket).toBe(new Date("2023-01-01T10:15:00Z").getTime());
});

Deno.test("Integration - frequency object to bucket (2 hours)", () => {
  const frequency = { value: 2, unit: "h" as const };
  const frequencyMs = frequencyToMs(frequency);
  const timestamp = new Date("2023-01-01T15:45:00Z");
  const bucket = getTimeBucket(timestamp, frequencyMs);

  // 2-hour buckets: 00:00, 02:00, 04:00, ..., 14:00, 16:00
  // 15:45 should round down to 14:00
  expect(bucket).toBe(new Date("2023-01-01T14:00:00Z").getTime());
});

Deno.test("Integration - frequency number to bucket (custom 45 minutes)", () => {
  const frequency = 45 * 60 * 1000; // 45 minutes in milliseconds
  const timestamp = new Date("2023-01-01T10:52:30Z");
  const bucket = getTimeBucket(timestamp, frequency);

  // 45-minute buckets from epoch
  // Calculate expected bucket
  const epoch = new Date("1970-01-01T00:00:00Z").getTime();
  const timestampMs = timestamp.getTime();
  const bucketsSinceEpoch = Math.floor((timestampMs - epoch) / frequency);
  const expectedBucket = epoch + bucketsSinceEpoch * frequency;

  expect(bucket).toBe(expectedBucket);
});
