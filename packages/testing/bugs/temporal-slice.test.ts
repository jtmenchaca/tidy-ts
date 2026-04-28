import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { Temporal as PolyfillTemporal } from "@tidy-ts/shims/temporal-polyfill";

const NativeTemporal = Temporal;

// =============================================================================
// sliceMin
// =============================================================================

Deno.test("sliceMin - PlainDate n=1 (native)", () => {
  const df = createDataFrame([
    { date: NativeTemporal.PlainDate.from("2024-03-15"), value: 3 },
    { date: NativeTemporal.PlainDate.from("2024-01-01"), value: 1 },
    { date: NativeTemporal.PlainDate.from("2024-06-30"), value: 2 },
  ]);

  const result = df.sliceMin("date", 1);
  expect(result.nrows()).toBe(1);
  expect(result[0].value).toBe(1);
});

Deno.test("sliceMin - PlainDate n=2 (native)", () => {
  const df = createDataFrame([
    { date: NativeTemporal.PlainDate.from("2024-03-15"), value: 3 },
    { date: NativeTemporal.PlainDate.from("2024-01-01"), value: 1 },
    { date: NativeTemporal.PlainDate.from("2024-06-30"), value: 2 },
  ]);

  const result = df.sliceMin("date", 2);
  expect(result.nrows()).toBe(2);
  const values = [result[0].value, result[1].value].sort();
  expect(values).toEqual([1, 3]);
});

Deno.test("sliceMin - PlainDate (polyfill)", () => {
  const df = createDataFrame([
    { date: PolyfillTemporal.PlainDate.from("2024-03-15"), value: 3 },
    { date: PolyfillTemporal.PlainDate.from("2024-01-01"), value: 1 },
    { date: PolyfillTemporal.PlainDate.from("2024-06-30"), value: 2 },
  ]);

  const result = df.sliceMin("date", 1);
  expect(result.nrows()).toBe(1);
  expect(result[0].value).toBe(1);
});

Deno.test("sliceMin - PlainDateTime n=2 (native)", () => {
  const df = createDataFrame([
    { dt: NativeTemporal.PlainDateTime.from("2024-01-01T16:00:00"), value: 2 },
    { dt: NativeTemporal.PlainDateTime.from("2024-01-01T08:00:00"), value: 1 },
    { dt: NativeTemporal.PlainDateTime.from("2024-01-01T23:59:59"), value: 3 },
  ]);

  const result = df.sliceMin("dt", 2);
  expect(result.nrows()).toBe(2);
  const values = [result[0].value, result[1].value].sort();
  expect(values).toEqual([1, 2]);
});

Deno.test("sliceMin - Instant (native)", () => {
  const df = createDataFrame([
    { ts: NativeTemporal.Instant.from("2024-06-15T00:00:00Z"), value: 2 },
    { ts: NativeTemporal.Instant.from("2024-01-01T00:00:00Z"), value: 1 },
    { ts: NativeTemporal.Instant.from("2024-12-31T00:00:00Z"), value: 3 },
  ]);

  const result = df.sliceMin("ts", 1);
  expect(result.nrows()).toBe(1);
  expect(result[0].value).toBe(1);
});

// =============================================================================
// sliceMax
// =============================================================================

Deno.test("sliceMax - PlainDate n=1 (native)", () => {
  const df = createDataFrame([
    { date: NativeTemporal.PlainDate.from("2024-03-15"), value: 3 },
    { date: NativeTemporal.PlainDate.from("2024-01-01"), value: 1 },
    { date: NativeTemporal.PlainDate.from("2024-06-30"), value: 2 },
  ]);

  const result = df.sliceMax("date", 1);
  expect(result.nrows()).toBe(1);
  expect(result[0].value).toBe(2);
});

Deno.test("sliceMax - Instant n=2 (native)", () => {
  const df = createDataFrame([
    { ts: NativeTemporal.Instant.from("2024-06-15T00:00:00Z"), value: 2 },
    { ts: NativeTemporal.Instant.from("2024-01-01T00:00:00Z"), value: 1 },
    { ts: NativeTemporal.Instant.from("2024-12-31T00:00:00Z"), value: 3 },
  ]);

  const result = df.sliceMax("ts", 2);
  expect(result.nrows()).toBe(2);
  const values = [result[0].value, result[1].value].sort();
  expect(values).toEqual([2, 3]);
});

Deno.test("sliceMax - PlainDate (polyfill)", () => {
  const df = createDataFrame([
    { date: PolyfillTemporal.PlainDate.from("2024-03-15"), value: 3 },
    { date: PolyfillTemporal.PlainDate.from("2024-01-01"), value: 1 },
    { date: PolyfillTemporal.PlainDate.from("2024-06-30"), value: 2 },
  ]);

  const result = df.sliceMax("date", 1);
  expect(result.nrows()).toBe(1);
  expect(result[0].value).toBe(2);
});

Deno.test("sliceMax - ZonedDateTime (native)", () => {
  const df = createDataFrame([
    {
      ts: NativeTemporal.ZonedDateTime.from("2024-06-15T00:00:00[UTC]"),
      value: 2,
    },
    {
      ts: NativeTemporal.ZonedDateTime.from("2024-01-01T00:00:00[UTC]"),
      value: 1,
    },
    {
      ts: NativeTemporal.ZonedDateTime.from("2024-12-31T00:00:00[UTC]"),
      value: 3,
    },
  ]);

  const result = df.sliceMax("ts", 1);
  expect(result.nrows()).toBe(1);
  expect(result[0].value).toBe(3);
});
