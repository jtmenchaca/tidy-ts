import { expect } from "@std/expect";
import { Temporal as PolyfillTemporal } from "@tidy-ts/shims/temporal-polyfill";

import {
  getCalendarTemporalBucket,
  getTimeBucket,
} from "../../dataframe/ts/verbs/utility/time-bucket.ts";

const NativeTemporal = Temporal;
const ONE_DAY_MS = 86400000;
const ONE_HOUR_MS = 3600000;

// =============================================================================
// Instant — epoch-capable, should work with getTimeBucket
// =============================================================================

Deno.test("getTimeBucket - Instant daily bucket (native)", () => {
  const ts = NativeTemporal.Instant.from("2023-01-01T14:30:00Z");
  const bucket = getTimeBucket(ts, ONE_DAY_MS);
  expect(bucket).toBe(
    getTimeBucket(new Date("2023-01-01T00:00:00Z"), ONE_DAY_MS),
  );
});

Deno.test("getTimeBucket - Instant hourly bucket (native)", () => {
  const ts = NativeTemporal.Instant.from("2023-01-01T14:30:00Z");
  const bucket = getTimeBucket(ts, ONE_HOUR_MS);
  expect(bucket).toBe(
    getTimeBucket(new Date("2023-01-01T14:00:00Z"), ONE_HOUR_MS),
  );
});

Deno.test("getTimeBucket - Instant (polyfill)", () => {
  const ts = PolyfillTemporal.Instant.from("2023-01-01T14:30:00Z");
  const bucket = getTimeBucket(ts, ONE_DAY_MS);
  expect(bucket).toBe(
    getTimeBucket(new Date("2023-01-01T00:00:00Z"), ONE_DAY_MS),
  );
});

// =============================================================================
// ZonedDateTime — epoch-capable, should work with getTimeBucket
// =============================================================================

Deno.test("getTimeBucket - ZonedDateTime (native)", () => {
  const ts = NativeTemporal.ZonedDateTime.from("2023-01-01T14:30:00[UTC]");
  const bucket = getTimeBucket(ts, ONE_HOUR_MS);
  expect(bucket).toBe(
    getTimeBucket(new Date("2023-01-01T14:00:00Z"), ONE_HOUR_MS),
  );
});

// =============================================================================
// PlainDate — calendar path via getCalendarTemporalBucket
// =============================================================================

Deno.test("getCalendarTemporalBucket - PlainDate daily", () => {
  const ts = NativeTemporal.PlainDate.from("2023-06-15");
  const bucket = getCalendarTemporalBucket(ts, "1D");
  expect(bucket).toBe("2023-06-15");
});

Deno.test("getCalendarTemporalBucket - PlainDate monthly", () => {
  const ts = NativeTemporal.PlainDate.from("2023-06-15");
  const bucket = getCalendarTemporalBucket(ts, "1M");
  expect(bucket).toBe("2023-06-01");
});

Deno.test("getCalendarTemporalBucket - PlainDate quarterly (via 3M)", () => {
  const ts = NativeTemporal.PlainDate.from("2023-08-15");
  // Quarterly bucketing is expressed as 3-month bucketing. August (month 8)
  // falls in the bucket that started in July (month 7) when months are
  // grouped in threes starting at month 1.
  const bucket = getCalendarTemporalBucket(ts, "3M");
  expect(bucket).toBe("2023-07-01");
});

Deno.test("getCalendarTemporalBucket - PlainDate yearly", () => {
  const ts = NativeTemporal.PlainDate.from("2023-06-15");
  const bucket = getCalendarTemporalBucket(ts, "1Y");
  expect(bucket).toBe("2023-01-01");
});

Deno.test("getCalendarTemporalBucket - PlainDate weekly", () => {
  // 2023-06-15 is a Thursday (dayOfWeek=4), so Monday is 2023-06-12
  const ts = NativeTemporal.PlainDate.from("2023-06-15");
  const bucket = getCalendarTemporalBucket(ts, "1W");
  expect(bucket).toBe("2023-06-12");
});

Deno.test("getCalendarTemporalBucket - PlainDate (polyfill) monthly", () => {
  const ts = PolyfillTemporal.PlainDate.from("2023-06-15");
  const bucket = getCalendarTemporalBucket(ts, "1M");
  expect(bucket).toBe("2023-06-01");
});

// =============================================================================
// PlainDateTime — calendar path via getCalendarTemporalBucket
// =============================================================================

Deno.test("getCalendarTemporalBucket - PlainDateTime daily", () => {
  const ts = NativeTemporal.PlainDateTime.from("2023-06-15T14:30:00");
  const bucket = getCalendarTemporalBucket(ts, "1D");
  expect(bucket).toBe("2023-06-15T00:00:00");
});

Deno.test("getCalendarTemporalBucket - PlainDateTime hourly", () => {
  const ts = NativeTemporal.PlainDateTime.from("2023-06-15T14:30:00");
  const bucket = getCalendarTemporalBucket(ts, "1H");
  expect(bucket).toBe("2023-06-15T14:00:00");
});

Deno.test("getCalendarTemporalBucket - PlainDateTime monthly", () => {
  const ts = NativeTemporal.PlainDateTime.from("2023-06-15T14:30:00");
  const bucket = getCalendarTemporalBucket(ts, "1M");
  expect(bucket).toBe("2023-06-01T00:00:00");
});

Deno.test("getCalendarTemporalBucket - PlainDateTime (polyfill)", () => {
  const ts = PolyfillTemporal.PlainDateTime.from("2023-06-15T14:30:00");
  const bucket = getCalendarTemporalBucket(ts, "1D");
  expect(bucket).toBe("2023-06-15T00:00:00");
});

// =============================================================================
// PlainTime — should throw (no date component)
// =============================================================================

Deno.test("getCalendarTemporalBucket - PlainTime throws", () => {
  const ts = NativeTemporal.PlainTime.from("14:30:00");
  expect(() => getCalendarTemporalBucket(ts, "1H")).toThrow("PlainTime");
});

// =============================================================================
// getTimeBucket still throws for wall-clock types (they have no epoch)
// =============================================================================

Deno.test("getTimeBucket - PlainDate throws (no epoch value)", () => {
  const ts = NativeTemporal.PlainDate.from("2023-01-01");
  expect(() => getTimeBucket(ts, ONE_DAY_MS)).toThrow("Invalid timestamp");
});
