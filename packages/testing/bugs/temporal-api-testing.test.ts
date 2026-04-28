import { expect } from "@std/expect";
import { Temporal as PolyfillTemporal } from "@tidy-ts/shims/temporal-polyfill";

// Native Deno Temporal is available as globalThis.Temporal
const NativeTemporal = Temporal;

// =============================================================================
// PlainDate
// =============================================================================

Deno.test("PlainDate - static compare returns -1, 0, 1", () => {
  const a = NativeTemporal.PlainDate.from("2024-01-01");
  const b = NativeTemporal.PlainDate.from("2024-06-15");
  const c = NativeTemporal.PlainDate.from("2024-01-01");

  expect(NativeTemporal.PlainDate.compare(a, b)).toBe(-1);
  expect(NativeTemporal.PlainDate.compare(b, a)).toBe(1);
  expect(NativeTemporal.PlainDate.compare(a, c)).toBe(0);
});

Deno.test("PlainDate - constructor.compare works via duck typing", () => {
  const a = NativeTemporal.PlainDate.from("2024-01-01");
  const b = NativeTemporal.PlainDate.from("2024-06-15");

  // This is how isComparable + comparableMinMax work at runtime
  const compare = (a as unknown as {
    constructor: { compare: (a: unknown, b: unknown) => number };
  }).constructor.compare;
  expect(typeof compare).toBe("function");
  expect(compare(a, b)).toBe(-1);
  expect(compare(b, a)).toBe(1);
});

Deno.test("PlainDate - has no epochMilliseconds", () => {
  const d = NativeTemporal.PlainDate.from("2024-01-01");
  expect("epochMilliseconds" in d).toBe(false);
});

Deno.test("PlainDate - has no epochNanoseconds", () => {
  const d = NativeTemporal.PlainDate.from("2024-01-01");
  expect("epochNanoseconds" in d).toBe(false);
});

Deno.test("PlainDate - toString gives ISO string", () => {
  const d = NativeTemporal.PlainDate.from("2024-03-25");
  expect(d.toString()).toBe("2024-03-25");
});

Deno.test("PlainDate - has Symbol.toStringTag", () => {
  const d = NativeTemporal.PlainDate.from("2024-01-01");
  expect(d[Symbol.toStringTag]).toBe("Temporal.PlainDate");
});

Deno.test("PlainDate - has toJSON", () => {
  const d = NativeTemporal.PlainDate.from("2024-01-01");
  expect(typeof d.toJSON).toBe("function");
  expect(d.toJSON()).toBe("2024-01-01");
});

Deno.test("PlainDate - properties: year, month, day", () => {
  const d = NativeTemporal.PlainDate.from("2024-03-25");
  expect(d.year).toBe(2024);
  expect(d.month).toBe(3);
  expect(d.day).toBe(25);
});

Deno.test("PlainDate - since/until return Duration", () => {
  const a = NativeTemporal.PlainDate.from("2024-01-01");
  const b = NativeTemporal.PlainDate.from("2024-01-15");
  const dur = a.until(b);
  expect(dur.days).toBe(14);

  const dur2 = b.since(a);
  expect(dur2.days).toBe(14);
});

// =============================================================================
// PlainDateTime
// =============================================================================

Deno.test("PlainDateTime - static compare", () => {
  const a = NativeTemporal.PlainDateTime.from("2024-01-01T08:00:00");
  const b = NativeTemporal.PlainDateTime.from("2024-01-01T16:00:00");

  expect(NativeTemporal.PlainDateTime.compare(a, b)).toBe(-1);
  expect(NativeTemporal.PlainDateTime.compare(b, a)).toBe(1);
  expect(NativeTemporal.PlainDateTime.compare(a, a)).toBe(0);
});

Deno.test("PlainDateTime - constructor.compare duck typing", () => {
  const a = NativeTemporal.PlainDateTime.from("2024-01-01T08:00:00");
  const b = NativeTemporal.PlainDateTime.from("2024-01-01T16:00:00");
  const compare = (a as unknown as {
    constructor: { compare: (a: unknown, b: unknown) => number };
  }).constructor.compare;
  expect(compare(a, b)).toBe(-1);
});

Deno.test("PlainDateTime - has no epochMilliseconds", () => {
  const d = NativeTemporal.PlainDateTime.from("2024-01-01T12:00:00");
  expect("epochMilliseconds" in d).toBe(false);
});

Deno.test("PlainDateTime - toString gives ISO string", () => {
  const d = NativeTemporal.PlainDateTime.from("2024-03-25T14:30:00");
  expect(d.toString()).toBe("2024-03-25T14:30:00");
});

Deno.test("PlainDateTime - has Symbol.toStringTag", () => {
  const d = NativeTemporal.PlainDateTime.from("2024-01-01T00:00:00");
  expect(d[Symbol.toStringTag]).toBe("Temporal.PlainDateTime");
});

Deno.test("PlainDateTime - properties: year, month, day, hour, minute, second", () => {
  const d = NativeTemporal.PlainDateTime.from("2024-03-25T14:30:45");
  expect(d.year).toBe(2024);
  expect(d.month).toBe(3);
  expect(d.day).toBe(25);
  expect(d.hour).toBe(14);
  expect(d.minute).toBe(30);
  expect(d.second).toBe(45);
});

// =============================================================================
// PlainTime
// =============================================================================

Deno.test("PlainTime - static compare", () => {
  const a = NativeTemporal.PlainTime.from("08:00:00");
  const b = NativeTemporal.PlainTime.from("16:00:00");

  expect(NativeTemporal.PlainTime.compare(a, b)).toBe(-1);
  expect(NativeTemporal.PlainTime.compare(b, a)).toBe(1);
  expect(NativeTemporal.PlainTime.compare(a, a)).toBe(0);
});

Deno.test("PlainTime - constructor.compare duck typing", () => {
  const a = NativeTemporal.PlainTime.from("08:00:00");
  const b = NativeTemporal.PlainTime.from("16:00:00");
  const compare = (a as unknown as {
    constructor: { compare: (a: unknown, b: unknown) => number };
  }).constructor.compare;
  expect(compare(a, b)).toBe(-1);
});

Deno.test("PlainTime - has no epochMilliseconds", () => {
  const t = NativeTemporal.PlainTime.from("12:00:00");
  expect("epochMilliseconds" in t).toBe(false);
});

Deno.test("PlainTime - has Symbol.toStringTag", () => {
  const t = NativeTemporal.PlainTime.from("08:00:00");
  expect(t[Symbol.toStringTag]).toBe("Temporal.PlainTime");
});

Deno.test("PlainTime - properties: hour, minute, second", () => {
  const t = NativeTemporal.PlainTime.from("14:30:45");
  expect(t.hour).toBe(14);
  expect(t.minute).toBe(30);
  expect(t.second).toBe(45);
});

// =============================================================================
// Instant
// =============================================================================

Deno.test("Instant - static compare", () => {
  const a = NativeTemporal.Instant.from("2024-01-01T00:00:00Z");
  const b = NativeTemporal.Instant.from("2024-06-15T00:00:00Z");

  expect(NativeTemporal.Instant.compare(a, b)).toBe(-1);
  expect(NativeTemporal.Instant.compare(b, a)).toBe(1);
  expect(NativeTemporal.Instant.compare(a, a)).toBe(0);
});

Deno.test("Instant - constructor.compare duck typing", () => {
  const a = NativeTemporal.Instant.from("2024-01-01T00:00:00Z");
  const b = NativeTemporal.Instant.from("2024-06-15T00:00:00Z");
  const compare = (a as unknown as {
    constructor: { compare: (a: unknown, b: unknown) => number };
  }).constructor.compare;
  expect(compare(a, b)).toBe(-1);
});

Deno.test("Instant - HAS epochMilliseconds", () => {
  const i = NativeTemporal.Instant.from("2024-01-01T00:00:00Z");
  expect("epochMilliseconds" in i).toBe(true);
  expect(typeof i.epochMilliseconds).toBe("number");
  // 2024-01-01T00:00:00Z in ms
  expect(i.epochMilliseconds).toBe(1704067200000);
});

Deno.test("Instant - HAS epochNanoseconds", () => {
  const i = NativeTemporal.Instant.from("2024-01-01T00:00:00Z");
  expect("epochNanoseconds" in i).toBe(true);
  expect(typeof i.epochNanoseconds).toBe("bigint");
});

Deno.test("Instant - has Symbol.toStringTag", () => {
  const i = NativeTemporal.Instant.from("2024-01-01T00:00:00Z");
  expect(i[Symbol.toStringTag]).toBe("Temporal.Instant");
});

Deno.test("Instant - toString gives ISO with Z", () => {
  const i = NativeTemporal.Instant.from("2024-01-01T00:00:00Z");
  expect(i.toString()).toBe("2024-01-01T00:00:00Z");
});

Deno.test("Instant - since/until return Duration", () => {
  const a = NativeTemporal.Instant.from("2024-01-01T00:00:00Z");
  const b = NativeTemporal.Instant.from("2024-01-01T01:00:00Z");
  const dur = a.until(b);
  expect(dur.seconds).toBe(3600);
});

// =============================================================================
// ZonedDateTime
// =============================================================================

Deno.test("ZonedDateTime - static compare", () => {
  const a = NativeTemporal.ZonedDateTime.from(
    "2024-01-01T00:00:00[America/New_York]",
  );
  const b = NativeTemporal.ZonedDateTime.from(
    "2024-06-15T00:00:00[America/New_York]",
  );

  expect(NativeTemporal.ZonedDateTime.compare(a, b)).toBe(-1);
  expect(NativeTemporal.ZonedDateTime.compare(b, a)).toBe(1);
  expect(NativeTemporal.ZonedDateTime.compare(a, a)).toBe(0);
});

Deno.test("ZonedDateTime - constructor.compare duck typing", () => {
  const a = NativeTemporal.ZonedDateTime.from(
    "2024-01-01T00:00:00[America/New_York]",
  );
  const b = NativeTemporal.ZonedDateTime.from(
    "2024-06-15T00:00:00[America/New_York]",
  );
  const compare = (a as unknown as {
    constructor: { compare: (a: unknown, b: unknown) => number };
  }).constructor.compare;
  expect(compare(a, b)).toBe(-1);
});

Deno.test("ZonedDateTime - HAS epochMilliseconds", () => {
  const z = NativeTemporal.ZonedDateTime.from("2024-01-01T00:00:00[UTC]");
  expect("epochMilliseconds" in z).toBe(true);
  expect(typeof z.epochMilliseconds).toBe("number");
  expect(z.epochMilliseconds).toBe(1704067200000);
});

Deno.test("ZonedDateTime - HAS epochNanoseconds", () => {
  const z = NativeTemporal.ZonedDateTime.from("2024-01-01T00:00:00[UTC]");
  expect("epochNanoseconds" in z).toBe(true);
  expect(typeof z.epochNanoseconds).toBe("bigint");
});

Deno.test("ZonedDateTime - has Symbol.toStringTag", () => {
  const z = NativeTemporal.ZonedDateTime.from("2024-01-01T00:00:00[UTC]");
  expect(z[Symbol.toStringTag]).toBe("Temporal.ZonedDateTime");
});

Deno.test("ZonedDateTime - has timeZoneId", () => {
  const z = NativeTemporal.ZonedDateTime.from(
    "2024-01-01T00:00:00[America/New_York]",
  );
  expect(z.timeZoneId).toBe("America/New_York");
});

// =============================================================================
// Duration
// =============================================================================

Deno.test("Duration - total converts to a single unit", () => {
  const d = NativeTemporal.Duration.from({ hours: 2, minutes: 30 });
  expect(d.total({ unit: "minutes" })).toBe(150);
  expect(d.total({ unit: "seconds" })).toBe(9000);
});

Deno.test("Duration - has Symbol.toStringTag", () => {
  const d = NativeTemporal.Duration.from({ hours: 1 });
  expect(d[Symbol.toStringTag]).toBe("Temporal.Duration");
});

Deno.test("Duration - static compare", () => {
  const a = NativeTemporal.Duration.from({ hours: 1 });
  const b = NativeTemporal.Duration.from({ hours: 2 });
  expect(NativeTemporal.Duration.compare(a, b)).toBe(-1);
  expect(NativeTemporal.Duration.compare(b, a)).toBe(1);
  expect(NativeTemporal.Duration.compare(a, a)).toBe(0);
});

// =============================================================================
// Cross-type: polyfill has same duck-typing surface
// =============================================================================

Deno.test("Polyfill PlainDate - constructor.compare duck typing", () => {
  const a = PolyfillTemporal.PlainDate.from("2024-01-01");
  const b = PolyfillTemporal.PlainDate.from("2024-06-15");
  const compare = (a as unknown as {
    constructor: { compare: (a: unknown, b: unknown) => number };
  }).constructor.compare;
  expect(typeof compare).toBe("function");
  expect(compare(a, b)).toBe(-1);
});

Deno.test("Polyfill Instant - HAS epochMilliseconds", () => {
  const i = PolyfillTemporal.Instant.from("2024-01-01T00:00:00Z");
  expect("epochMilliseconds" in i).toBe(true);
  expect(typeof i.epochMilliseconds).toBe("number");
  expect(i.epochMilliseconds).toBe(1704067200000);
});

Deno.test("Polyfill PlainDate - has no epochMilliseconds", () => {
  const d = PolyfillTemporal.PlainDate.from("2024-01-01");
  expect("epochMilliseconds" in d).toBe(false);
});

Deno.test("Polyfill PlainDate - has Symbol.toStringTag", () => {
  const d = PolyfillTemporal.PlainDate.from("2024-01-01");
  expect(d[Symbol.toStringTag]).toBe("Temporal.PlainDate");
});

Deno.test("Polyfill ZonedDateTime - HAS epochMilliseconds", () => {
  const z = PolyfillTemporal.ZonedDateTime.from("2024-01-01T00:00:00[UTC]");
  expect("epochMilliseconds" in z).toBe(true);
  expect(typeof z.epochMilliseconds).toBe("number");
});

// =============================================================================
// Key distinction: epoch-capable vs wall-clock types
// =============================================================================

Deno.test("epoch-capable types have epochMilliseconds, wall-clock types do not", () => {
  const instant = NativeTemporal.Instant.from("2024-01-01T00:00:00Z");
  const zdt = NativeTemporal.ZonedDateTime.from("2024-01-01T00:00:00[UTC]");
  const plainDate = NativeTemporal.PlainDate.from("2024-01-01");
  const plainDateTime = NativeTemporal.PlainDateTime.from(
    "2024-01-01T00:00:00",
  );
  const plainTime = NativeTemporal.PlainTime.from("12:00:00");

  // Exact time types — have epoch
  expect("epochMilliseconds" in instant).toBe(true);
  expect("epochMilliseconds" in zdt).toBe(true);

  // Wall-clock types — no epoch
  expect("epochMilliseconds" in plainDate).toBe(false);
  expect("epochMilliseconds" in plainDateTime).toBe(false);
  expect("epochMilliseconds" in plainTime).toBe(false);
});

Deno.test("all 5 types have constructor.compare", () => {
  const values = [
    NativeTemporal.Instant.from("2024-01-01T00:00:00Z"),
    NativeTemporal.ZonedDateTime.from("2024-01-01T00:00:00[UTC]"),
    NativeTemporal.PlainDate.from("2024-01-01"),
    NativeTemporal.PlainDateTime.from("2024-01-01T00:00:00"),
    NativeTemporal.PlainTime.from("12:00:00"),
  ];

  for (const v of values) {
    const ctor =
      (v as unknown as { constructor: { compare: unknown } }).constructor;
    expect(typeof ctor.compare).toBe("function");
  }
});

// =============================================================================
// Runtime type detection via Symbol.toStringTag
// =============================================================================

Deno.test("Symbol.toStringTag distinguishes Temporal types from Date and primitives", () => {
  const pd = NativeTemporal.PlainDate.from("2024-01-01");
  const d = new Date("2024-01-01");

  // Temporal has toStringTag
  expect(pd[Symbol.toStringTag]).toBe("Temporal.PlainDate");

  // Date does NOT have Symbol.toStringTag
  expect((d as unknown as Record<symbol, unknown>)[Symbol.toStringTag])
    .toBeUndefined();
});

Deno.test("detecting epoch-capable at runtime via 'epochMilliseconds' in obj", () => {
  const instant = NativeTemporal.Instant.from("2024-01-01T00:00:00Z");
  const zdt = NativeTemporal.ZonedDateTime.from("2024-01-01T00:00:00[UTC]");
  const pd = NativeTemporal.PlainDate.from("2024-01-01");

  function hasEpoch(v: unknown): boolean {
    return v != null && typeof v === "object" && "epochMilliseconds" in v;
  }

  expect(hasEpoch(instant)).toBe(true);
  expect(hasEpoch(zdt)).toBe(true);
  expect(hasEpoch(pd)).toBe(false);
  expect(hasEpoch(new Date())).toBe(false);
  expect(hasEpoch(42)).toBe(false);
});
