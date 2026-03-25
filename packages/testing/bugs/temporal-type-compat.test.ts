import { stats as s } from "@tidy-ts/dataframe";
import { Temporal as PolyTemporal } from "temporal-polyfill";
import { expect } from "@std/expect";

/**
 * Investigating type compatibility between:
 * 1. Deno native Temporal (global `Temporal`)
 * 2. temporal-polyfill's Temporal (`import { Temporal } from "temporal-polyfill"`)
 * 3. Our min/max overloads (currently import types from temporal-polyfill)
 *
 * The consumer error shows:
 *   Temporal.PlainDate (from temporal-spec in clarity/node_modules)
 *   ≠ Temporal.PlainDate (from temporal-polyfill's temporal-spec)
 *
 * This file tests what works and what doesn't at the type level.
 */

// --- Are native and polyfill types the same at the type level? ---

Deno.test("type compat - native Temporal.PlainDate assignable to polyfill", () => {
  const native: Temporal.PlainDate = Temporal.PlainDate.from("2024-01-01");
  // Try assigning native to polyfill type
  const poly: PolyTemporal.PlainDate = native;
  expect(poly.toString()).toBe("2024-01-01");
});

Deno.test("type compat - polyfill Temporal.PlainDate assignable to native", () => {
  const poly: PolyTemporal.PlainDate = PolyTemporal.PlainDate.from(
    "2024-01-01",
  );
  // Try assigning polyfill to native type
  const native: Temporal.PlainDate = poly;
  expect(native.toString()).toBe("2024-01-01");
});

// --- Do our min/max overloads work with native Temporal? ---

Deno.test("min/max with native Temporal.PlainDate", () => {
  const dates = [
    Temporal.PlainDate.from("2024-03-15"),
    Temporal.PlainDate.from("2024-01-01"),
    Temporal.PlainDate.from("2024-06-30"),
  ];
  const minResult = s.min(dates);
  const maxResult = s.max(dates);
  expect(
    Temporal.PlainDate.compare(
      minResult,
      Temporal.PlainDate.from("2024-01-01"),
    ),
  ).toBe(0);
  expect(
    Temporal.PlainDate.compare(
      maxResult,
      Temporal.PlainDate.from("2024-06-30"),
    ),
  ).toBe(0);
});

// --- Do our min/max overloads work with polyfill Temporal? ---

Deno.test("min/max with polyfill Temporal.PlainDate", () => {
  const dates = [
    PolyTemporal.PlainDate.from("2024-03-15"),
    PolyTemporal.PlainDate.from("2024-01-01"),
    PolyTemporal.PlainDate.from("2024-06-30"),
  ];
  const minResult = s.min(dates);
  const maxResult = s.max(dates);
  expect(
    PolyTemporal.PlainDate.compare(
      minResult,
      PolyTemporal.PlainDate.from("2024-01-01"),
    ),
  ).toBe(0);
  expect(
    PolyTemporal.PlainDate.compare(
      maxResult,
      PolyTemporal.PlainDate.from("2024-06-30"),
    ),
  ).toBe(0);
});

// --- Nullable variants ---

Deno.test("min with native Temporal.PlainDate nullable + removeNull", () => {
  const dates: (Temporal.PlainDate | null)[] = [
    Temporal.PlainDate.from("2024-03-15"),
    null,
    Temporal.PlainDate.from("2024-01-01"),
  ];
  const result = s.min(dates, { removeNull: true });
  expect(
    Temporal.PlainDate.compare(result, Temporal.PlainDate.from("2024-01-01")),
  ).toBe(0);
});

Deno.test("min with polyfill Temporal.PlainDate nullable + removeNull", () => {
  const dates: (PolyTemporal.PlainDate | null)[] = [
    PolyTemporal.PlainDate.from("2024-03-15"),
    null,
    PolyTemporal.PlainDate.from("2024-01-01"),
  ];
  const result = s.min(dates, { removeNull: true });
  expect(
    PolyTemporal.PlainDate.compare(
      result,
      PolyTemporal.PlainDate.from("2024-01-01"),
    ),
  ).toBe(0);
});

// --- PlainDateTime ---

Deno.test("min/max with native Temporal.PlainDateTime", () => {
  const dts = [
    Temporal.PlainDateTime.from("2024-01-01T12:00"),
    Temporal.PlainDateTime.from("2024-01-01T08:00"),
    Temporal.PlainDateTime.from("2024-01-01T16:00"),
  ];
  const minResult = s.min(dts);
  const maxResult = s.max(dts);
  expect(
    Temporal.PlainDateTime.compare(
      minResult,
      Temporal.PlainDateTime.from("2024-01-01T08:00"),
    ),
  ).toBe(0);
  expect(
    Temporal.PlainDateTime.compare(
      maxResult,
      Temporal.PlainDateTime.from("2024-01-01T16:00"),
    ),
  ).toBe(0);
});

// --- Instant ---

Deno.test("min/max with native Temporal.Instant", () => {
  const instants = [
    Temporal.Instant.from("2024-06-01T00:00:00Z"),
    Temporal.Instant.from("2024-01-01T00:00:00Z"),
    Temporal.Instant.from("2024-12-01T00:00:00Z"),
  ];
  const minResult = s.min(instants);
  const maxResult = s.max(instants);
  expect(
    Temporal.Instant.compare(
      minResult,
      Temporal.Instant.from("2024-01-01T00:00:00Z"),
    ),
  ).toBe(0);
  expect(
    Temporal.Instant.compare(
      maxResult,
      Temporal.Instant.from("2024-12-01T00:00:00Z"),
    ),
  ).toBe(0);
});

// --- Cross: native values through polyfill-typed overloads ---

Deno.test("cross compat - native PlainDate values, compare result with polyfill", () => {
  const dates = [
    Temporal.PlainDate.from("2024-03-15"),
    Temporal.PlainDate.from("2024-01-01"),
  ];
  const result = s.min(dates);
  // Can we use PolyTemporal.PlainDate.compare on a native result?
  expect(
    PolyTemporal.PlainDate.compare(
      result,
      PolyTemporal.PlainDate.from("2024-01-01"),
    ),
  ).toBe(0);
});
