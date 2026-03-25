import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { Temporal as PolyfillTemporal } from "temporal-polyfill";

const NativeTemporal = Temporal;

// =============================================================================
// PlainDate
// =============================================================================

Deno.test("arrange - PlainDate ascending (native)", () => {
  const df = createDataFrame([
    { date: NativeTemporal.PlainDate.from("2024-03-15"), value: 3 },
    { date: NativeTemporal.PlainDate.from("2024-01-01"), value: 1 },
    { date: NativeTemporal.PlainDate.from("2024-06-30"), value: 2 },
  ]);

  const sorted = df.arrange("date");
  expect(sorted[0].value).toBe(1);
  expect(sorted[1].value).toBe(3);
  expect(sorted[2].value).toBe(2);
});

Deno.test("arrange - PlainDate descending (native)", () => {
  const df = createDataFrame([
    { date: NativeTemporal.PlainDate.from("2024-03-15"), value: 3 },
    { date: NativeTemporal.PlainDate.from("2024-01-01"), value: 1 },
    { date: NativeTemporal.PlainDate.from("2024-06-30"), value: 2 },
  ]);

  const sorted = df.arrange("date", "desc");
  expect(sorted[0].value).toBe(2);
  expect(sorted[1].value).toBe(3);
  expect(sorted[2].value).toBe(1);
});

Deno.test("arrange - PlainDate ascending (polyfill)", () => {
  const df = createDataFrame([
    { date: PolyfillTemporal.PlainDate.from("2024-03-15"), value: 3 },
    { date: PolyfillTemporal.PlainDate.from("2024-01-01"), value: 1 },
    { date: PolyfillTemporal.PlainDate.from("2024-06-30"), value: 2 },
  ]);

  const sorted = df.arrange("date");
  expect(sorted[0].value).toBe(1);
  expect(sorted[1].value).toBe(3);
  expect(sorted[2].value).toBe(2);
});

// =============================================================================
// PlainDateTime
// =============================================================================

Deno.test("arrange - PlainDateTime ascending (native)", () => {
  const df = createDataFrame([
    { dt: NativeTemporal.PlainDateTime.from("2024-01-01T16:00:00"), value: 2 },
    { dt: NativeTemporal.PlainDateTime.from("2024-01-01T08:00:00"), value: 1 },
    { dt: NativeTemporal.PlainDateTime.from("2024-01-01T23:59:59"), value: 3 },
  ]);

  const sorted = df.arrange("dt");
  expect(sorted[0].value).toBe(1);
  expect(sorted[1].value).toBe(2);
  expect(sorted[2].value).toBe(3);
});

// =============================================================================
// PlainTime
// =============================================================================

Deno.test("arrange - PlainTime ascending (native)", () => {
  const df = createDataFrame([
    { time: NativeTemporal.PlainTime.from("16:00:00"), value: 2 },
    { time: NativeTemporal.PlainTime.from("08:00:00"), value: 1 },
    { time: NativeTemporal.PlainTime.from("23:59:59"), value: 3 },
  ]);

  const sorted = df.arrange("time");
  expect(sorted[0].value).toBe(1);
  expect(sorted[1].value).toBe(2);
  expect(sorted[2].value).toBe(3);
});

// =============================================================================
// Instant
// =============================================================================

Deno.test("arrange - Instant ascending (native)", () => {
  const df = createDataFrame([
    { ts: NativeTemporal.Instant.from("2024-06-15T00:00:00Z"), value: 2 },
    { ts: NativeTemporal.Instant.from("2024-01-01T00:00:00Z"), value: 1 },
    { ts: NativeTemporal.Instant.from("2024-12-31T00:00:00Z"), value: 3 },
  ]);

  const sorted = df.arrange("ts");
  expect(sorted[0].value).toBe(1);
  expect(sorted[1].value).toBe(2);
  expect(sorted[2].value).toBe(3);
});

// =============================================================================
// ZonedDateTime
// =============================================================================

Deno.test("arrange - ZonedDateTime ascending (native)", () => {
  const df = createDataFrame([
    {
      ts: NativeTemporal.ZonedDateTime.from(
        "2024-06-15T00:00:00[America/New_York]",
      ),
      value: 2,
    },
    {
      ts: NativeTemporal.ZonedDateTime.from(
        "2024-01-01T00:00:00[America/New_York]",
      ),
      value: 1,
    },
    {
      ts: NativeTemporal.ZonedDateTime.from(
        "2024-12-31T00:00:00[America/New_York]",
      ),
      value: 3,
    },
  ]);

  const sorted = df.arrange("ts");
  expect(sorted[0].value).toBe(1);
  expect(sorted[1].value).toBe(2);
  expect(sorted[2].value).toBe(3);
});

// =============================================================================
// Grouped arrange
// =============================================================================

Deno.test("arrange - PlainDate within groups (native)", () => {
  const df = createDataFrame([
    {
      category: "B",
      date: NativeTemporal.PlainDate.from("2024-03-01"),
      value: 1,
    },
    {
      category: "A",
      date: NativeTemporal.PlainDate.from("2024-02-01"),
      value: 2,
    },
    {
      category: "A",
      date: NativeTemporal.PlainDate.from("2024-01-01"),
      value: 3,
    },
    {
      category: "B",
      date: NativeTemporal.PlainDate.from("2024-01-01"),
      value: 4,
    },
  ]);

  const sorted = df.groupBy("category").arrange("date");
  const rows = sorted.toArray();

  const groupA = rows.filter((r) => r.category === "A");
  expect(groupA[0].value).toBe(3);
  expect(groupA[1].value).toBe(2);

  const groupB = rows.filter((r) => r.category === "B");
  expect(groupB[0].value).toBe(4);
  expect(groupB[1].value).toBe(1);
});
