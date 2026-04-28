import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { Temporal as PolyfillTemporal } from "@tidy-ts/shims/temporal-polyfill";

const NativeTemporal = Temporal;

// =============================================================================
// Instant — epoch-capable, should work as x-column
// =============================================================================

Deno.test("interpolate - Instant as x-column (native)", () => {
  const df = createDataFrame([
    {
      timestamp: NativeTemporal.Instant.from("2023-01-01T00:00:00Z"),
      value: 100 as number | null,
    },
    {
      timestamp: NativeTemporal.Instant.from("2023-01-02T00:00:00Z"),
      value: null,
    },
    {
      timestamp: NativeTemporal.Instant.from("2023-01-03T00:00:00Z"),
      value: null,
    },
    {
      timestamp: NativeTemporal.Instant.from("2023-01-04T00:00:00Z"),
      value: 200 as number | null,
    },
  ]);

  const result = df.interpolate("value", "timestamp", "linear");
  expect(result[0].value).toBe(100);
  expect(result[1].value).toBeCloseTo(133.33, 1);
  expect(result[2].value).toBeCloseTo(166.67, 1);
  expect(result[3].value).toBe(200);
});

Deno.test("interpolate - Instant as x-column (polyfill)", () => {
  const df = createDataFrame([
    {
      timestamp: PolyfillTemporal.Instant.from("2023-01-01T00:00:00Z"),
      value: 100 as number | null,
    },
    {
      timestamp: PolyfillTemporal.Instant.from("2023-01-02T00:00:00Z"),
      value: null,
    },
    {
      timestamp: PolyfillTemporal.Instant.from("2023-01-03T00:00:00Z"),
      value: 200 as number | null,
    },
  ]);

  const result = df.interpolate("value", "timestamp", "linear");
  expect(result[0].value).toBe(100);
  expect(result[1].value).toBe(150);
  expect(result[2].value).toBe(200);
});

// =============================================================================
// PlainDate — calendar path using until().total() for x-spacing
// =============================================================================

Deno.test("interpolate - PlainDate as x-column (calendar path)", () => {
  const df = createDataFrame([
    {
      timestamp: NativeTemporal.PlainDate.from("2023-01-01"),
      value: 100 as number | null,
    },
    { timestamp: NativeTemporal.PlainDate.from("2023-01-02"), value: null },
    { timestamp: NativeTemporal.PlainDate.from("2023-01-03"), value: null },
    {
      timestamp: NativeTemporal.PlainDate.from("2023-01-04"),
      value: 200 as number | null,
    },
  ]);

  const result = df.interpolate("value", "timestamp", "linear");
  expect(result[0].value).toBe(100);
  expect(result[1].value).toBeCloseTo(133.33, 1);
  expect(result[2].value).toBeCloseTo(166.67, 1);
  expect(result[3].value).toBe(200);
});

Deno.test("interpolate - PlainDate (polyfill)", () => {
  const df = createDataFrame([
    {
      timestamp: PolyfillTemporal.PlainDate.from("2023-01-01"),
      value: 100 as number | null,
    },
    { timestamp: PolyfillTemporal.PlainDate.from("2023-01-02"), value: null },
    {
      timestamp: PolyfillTemporal.PlainDate.from("2023-01-03"),
      value: 200 as number | null,
    },
  ]);

  const result = df.interpolate("value", "timestamp", "linear");
  expect(result[0].value).toBe(100);
  expect(result[1].value).toBe(150);
  expect(result[2].value).toBe(200);
});

// =============================================================================
// PlainDateTime — calendar path
// =============================================================================

Deno.test("interpolate - PlainDateTime as x-column (calendar path)", () => {
  const df = createDataFrame([
    {
      timestamp: NativeTemporal.PlainDateTime.from("2023-01-01T00:00:00"),
      value: 100 as number | null,
    },
    {
      timestamp: NativeTemporal.PlainDateTime.from("2023-01-02T00:00:00"),
      value: null,
    },
    {
      timestamp: NativeTemporal.PlainDateTime.from("2023-01-03T00:00:00"),
      value: 200 as number | null,
    },
  ]);

  const result = df.interpolate("value", "timestamp", "linear");
  expect(result[0].value).toBe(100);
  expect(result[1].value).toBe(150);
  expect(result[2].value).toBe(200);
});

Deno.test("interpolate - PlainDateTime (polyfill)", () => {
  const df = createDataFrame([
    {
      timestamp: PolyfillTemporal.PlainDateTime.from("2023-01-01T00:00:00"),
      value: 100 as number | null,
    },
    {
      timestamp: PolyfillTemporal.PlainDateTime.from("2023-01-02T00:00:00"),
      value: null,
    },
    {
      timestamp: PolyfillTemporal.PlainDateTime.from("2023-01-03T00:00:00"),
      value: 200 as number | null,
    },
  ]);

  const result = df.interpolate("value", "timestamp", "linear");
  expect(result[0].value).toBe(100);
  expect(result[1].value).toBe(150);
  expect(result[2].value).toBe(200);
});

// =============================================================================
// PlainTime — should throw (no date component)
// =============================================================================

Deno.test("interpolate - PlainTime as x-column throws", () => {
  const df = createDataFrame([
    {
      timestamp: NativeTemporal.PlainTime.from("08:00:00"),
      value: 100 as number | null,
    },
    { timestamp: NativeTemporal.PlainTime.from("12:00:00"), value: null },
    {
      timestamp: NativeTemporal.PlainTime.from("16:00:00"),
      value: 200 as number | null,
    },
  ]);

  expect(() => df.interpolate("value", "timestamp", "linear")).toThrow(
    "PlainTime",
  );
});
