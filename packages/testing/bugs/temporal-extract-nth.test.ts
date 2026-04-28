import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { Temporal as PolyfillTemporal } from "@tidy-ts/shims/temporal-polyfill";

const NativeTemporal = Temporal;

Deno.test("extractNthWhereSorted - PlainDate asc returns min value (native)", () => {
  const df = createDataFrame([
    { date: NativeTemporal.PlainDate.from("2024-03-15"), value: 30 },
    { date: NativeTemporal.PlainDate.from("2024-01-01"), value: 10 },
    { date: NativeTemporal.PlainDate.from("2024-06-30"), value: 20 },
  ]);

  const result = df.extractNthWhereSorted("value", "date", "asc");
  expect(result).toBe(10); // value from the row with earliest date
});

Deno.test("extractNthWhereSorted - PlainDate desc returns max value (native)", () => {
  const df = createDataFrame([
    { date: NativeTemporal.PlainDate.from("2024-03-15"), value: 30 },
    { date: NativeTemporal.PlainDate.from("2024-01-01"), value: 10 },
    { date: NativeTemporal.PlainDate.from("2024-06-30"), value: 20 },
  ]);

  const result = df.extractNthWhereSorted("value", "date", "desc");
  expect(result).toBe(20); // value from the row with latest date
});

Deno.test("extractNthWhereSorted - PlainDate (polyfill)", () => {
  const df = createDataFrame([
    { date: PolyfillTemporal.PlainDate.from("2024-03-15"), value: 30 },
    { date: PolyfillTemporal.PlainDate.from("2024-01-01"), value: 10 },
    { date: PolyfillTemporal.PlainDate.from("2024-06-30"), value: 20 },
  ]);

  const result = df.extractNthWhereSorted("value", "date", "asc");
  expect(result).toBe(10);
});

Deno.test("extractNthWhereSorted - Instant asc (native)", () => {
  const df = createDataFrame([
    { ts: NativeTemporal.Instant.from("2024-06-15T00:00:00Z"), value: 20 },
    { ts: NativeTemporal.Instant.from("2024-01-01T00:00:00Z"), value: 10 },
    { ts: NativeTemporal.Instant.from("2024-12-31T00:00:00Z"), value: 30 },
  ]);

  const result = df.extractNthWhereSorted("value", "ts", "asc");
  expect(result).toBe(10);
});

Deno.test("extractNthWhereSorted - PlainDateTime desc (native)", () => {
  const df = createDataFrame([
    { dt: NativeTemporal.PlainDateTime.from("2024-01-01T16:00:00"), value: 20 },
    { dt: NativeTemporal.PlainDateTime.from("2024-01-01T08:00:00"), value: 10 },
    { dt: NativeTemporal.PlainDateTime.from("2024-01-01T23:59:59"), value: 30 },
  ]);

  const result = df.extractNthWhereSorted("value", "dt", "desc");
  expect(result).toBe(30);
});

Deno.test("extractNthWhereSorted - PlainTime asc (native)", () => {
  const df = createDataFrame([
    { time: NativeTemporal.PlainTime.from("16:00:00"), value: 20 },
    { time: NativeTemporal.PlainTime.from("08:00:00"), value: 10 },
    { time: NativeTemporal.PlainTime.from("23:59:59"), value: 30 },
  ]);

  const result = df.extractNthWhereSorted("value", "time", "asc");
  expect(result).toBe(10);
});
