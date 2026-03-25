import { expect } from "@std/expect";
import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { Temporal as PolyfillTemporal } from "temporal-polyfill";

const NativeTemporal = Temporal;

// =============================================================================
// Instant — epoch-capable, should work
// =============================================================================

Deno.test("downsample - Instant with hourly to daily (native)", () => {
  const df = createDataFrame([
    {
      timestamp: NativeTemporal.Instant.from("2023-01-01T10:00:00Z"),
      price: 100,
    },
    {
      timestamp: NativeTemporal.Instant.from("2023-01-01T11:00:00Z"),
      price: 110,
    },
    {
      timestamp: NativeTemporal.Instant.from("2023-01-01T12:00:00Z"),
      price: 120,
    },
    {
      timestamp: NativeTemporal.Instant.from("2023-01-02T10:00:00Z"),
      price: 130,
    },
  ]);

  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      price: stats.mean,
    },
  });

  expect(result.nrows()).toBe(2);
  expect(result[0].price).toBe(110); // (100 + 110 + 120) / 3
  expect(result[1].price).toBe(130);
});

Deno.test("downsample - Instant (polyfill)", () => {
  const df = createDataFrame([
    {
      timestamp: PolyfillTemporal.Instant.from("2023-01-01T10:00:00Z"),
      price: 100,
    },
    {
      timestamp: PolyfillTemporal.Instant.from("2023-01-01T11:00:00Z"),
      price: 110,
    },
    {
      timestamp: PolyfillTemporal.Instant.from("2023-01-02T10:00:00Z"),
      price: 120,
    },
  ]);

  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      price: stats.mean,
    },
  });

  expect(result.nrows()).toBe(2);
});

// =============================================================================
// ZonedDateTime — epoch-capable, should work
// =============================================================================

Deno.test("downsample - ZonedDateTime (native)", () => {
  const df = createDataFrame([
    {
      timestamp: NativeTemporal.ZonedDateTime.from("2023-01-01T10:00:00[UTC]"),
      price: 100,
    },
    {
      timestamp: NativeTemporal.ZonedDateTime.from("2023-01-01T11:00:00[UTC]"),
      price: 110,
    },
    {
      timestamp: NativeTemporal.ZonedDateTime.from("2023-01-02T10:00:00[UTC]"),
      price: 120,
    },
  ]);

  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      price: stats.mean,
    },
  });

  expect(result.nrows()).toBe(2);
});

// =============================================================================
// PlainDate — calendar path
// =============================================================================

Deno.test("downsample - PlainDate daily (calendar path)", () => {
  const df = createDataFrame([
    { timestamp: NativeTemporal.PlainDate.from("2023-01-01"), price: 100 },
    { timestamp: NativeTemporal.PlainDate.from("2023-01-01"), price: 110 },
    { timestamp: NativeTemporal.PlainDate.from("2023-01-02"), price: 120 },
  ]);

  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: { price: stats.mean },
  });

  expect(result.nrows()).toBe(2);
  // Bucket keys are ISO strings
  expect(result[0].timestamp).toBe("2023-01-01");
  expect(result[0].price).toBe(105); // (100 + 110) / 2
  expect(result[1].timestamp).toBe("2023-01-02");
  expect(result[1].price).toBe(120);
});

Deno.test("downsample - PlainDate monthly (calendar path)", () => {
  const df = createDataFrame([
    { timestamp: NativeTemporal.PlainDate.from("2023-01-15"), price: 100 },
    { timestamp: NativeTemporal.PlainDate.from("2023-01-20"), price: 110 },
    { timestamp: NativeTemporal.PlainDate.from("2023-02-10"), price: 120 },
    { timestamp: NativeTemporal.PlainDate.from("2023-03-05"), price: 130 },
  ]);

  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1M",
    aggregations: { price: stats.mean },
  });

  expect(result.nrows()).toBe(3);
  expect(result[0].timestamp).toBe("2023-01-01");
  expect(result[0].price).toBe(105); // (100 + 110) / 2
  expect(result[1].timestamp).toBe("2023-02-01");
  expect(result[1].price).toBe(120);
  expect(result[2].timestamp).toBe("2023-03-01");
  expect(result[2].price).toBe(130);
});

Deno.test("downsample - PlainDate (polyfill)", () => {
  const df = createDataFrame([
    { timestamp: PolyfillTemporal.PlainDate.from("2023-01-01"), price: 100 },
    { timestamp: PolyfillTemporal.PlainDate.from("2023-01-02"), price: 110 },
  ]);

  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: { price: stats.mean },
  });

  expect(result.nrows()).toBe(2);
});

// =============================================================================
// PlainDateTime — calendar path
// =============================================================================

Deno.test("downsample - PlainDate (polyfill) monthly", () => {
  const df = createDataFrame([
    { timestamp: PolyfillTemporal.PlainDate.from("2023-01-15"), price: 100 },
    { timestamp: PolyfillTemporal.PlainDate.from("2023-02-10"), price: 120 },
  ]);

  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1M",
    aggregations: { price: stats.mean },
  });

  expect(result.nrows()).toBe(2);
  expect(result[0].timestamp).toBe("2023-01-01");
  expect(result[1].timestamp).toBe("2023-02-01");
});

Deno.test("downsample - PlainDateTime hourly (calendar path)", () => {
  const df = createDataFrame([
    {
      timestamp: NativeTemporal.PlainDateTime.from("2023-01-01T10:15:00"),
      price: 100,
    },
    {
      timestamp: NativeTemporal.PlainDateTime.from("2023-01-01T10:45:00"),
      price: 110,
    },
    {
      timestamp: NativeTemporal.PlainDateTime.from("2023-01-01T11:30:00"),
      price: 120,
    },
  ]);

  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1H",
    aggregations: { price: stats.mean },
  });

  expect(result.nrows()).toBe(2);
  expect(result[0].timestamp).toBe("2023-01-01T10:00:00");
  expect(result[0].price).toBe(105); // (100 + 110) / 2
  expect(result[1].timestamp).toBe("2023-01-01T11:00:00");
  expect(result[1].price).toBe(120);
});

Deno.test("downsample - PlainDateTime (polyfill)", () => {
  const df = createDataFrame([
    {
      timestamp: PolyfillTemporal.PlainDateTime.from("2023-01-01T10:15:00"),
      price: 100,
    },
    {
      timestamp: PolyfillTemporal.PlainDateTime.from("2023-01-01T10:45:00"),
      price: 110,
    },
    {
      timestamp: PolyfillTemporal.PlainDateTime.from("2023-01-01T11:30:00"),
      price: 120,
    },
  ]);

  const result = df.downsample({
    timeColumn: "timestamp",
    frequency: "1H",
    aggregations: { price: stats.mean },
  });

  expect(result.nrows()).toBe(2);
  expect(result[0].timestamp).toBe("2023-01-01T10:00:00");
  expect(result[0].price).toBe(105);
  expect(result[1].timestamp).toBe("2023-01-01T11:00:00");
  expect(result[1].price).toBe(120);
});

// =============================================================================
// PlainTime — should throw (no date component)
// =============================================================================

Deno.test("downsample - PlainTime throws", () => {
  const df = createDataFrame([
    { timestamp: NativeTemporal.PlainTime.from("10:00:00"), price: 100 },
    { timestamp: NativeTemporal.PlainTime.from("11:00:00"), price: 110 },
  ]);

  expect(() =>
    df.downsample({
      timeColumn: "timestamp",
      frequency: "1H",
      aggregations: { price: stats.mean },
    })
  ).toThrow("PlainTime");
});
