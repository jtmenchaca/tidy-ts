import { expect } from "@std/expect";
import { Temporal as PolyTemporal } from "temporal-polyfill";

/**
 * Test: can we define a structural type that matches BOTH native and polyfill
 * Temporal types without triggering deep type incompatibilities?
 */

// Minimal structural type — only shallow properties
interface TemporalComparable {
  readonly [Symbol.toStringTag]: string;
  toString(): string;
  toJSON(): string;
}

// Test: does native Temporal.PlainDate satisfy this?
function acceptComparable<T extends TemporalComparable>(
  values: readonly T[],
): T {
  return values[0];
}

Deno.test("structural type - native PlainDate satisfies TemporalComparable", () => {
  const dates = [
    Temporal.PlainDate.from("2024-03-15"),
    Temporal.PlainDate.from("2024-01-01"),
  ];
  const result = acceptComparable(dates);
  expect(result.toString()).toBe("2024-03-15");
});

Deno.test("structural type - polyfill PlainDate satisfies TemporalComparable", () => {
  const dates = [
    PolyTemporal.PlainDate.from("2024-03-15"),
    PolyTemporal.PlainDate.from("2024-01-01"),
  ];
  const result = acceptComparable(dates);
  expect(result.toString()).toBe("2024-03-15");
});

Deno.test("structural type - native PlainDateTime satisfies TemporalComparable", () => {
  const dts = [
    Temporal.PlainDateTime.from("2024-01-01T12:00"),
    Temporal.PlainDateTime.from("2024-01-01T08:00"),
  ];
  const result = acceptComparable(dts);
  expect(result.toString()).toBe("2024-01-01T12:00:00");
});

Deno.test("structural type - native Instant satisfies TemporalComparable", () => {
  const instants = [
    Temporal.Instant.from("2024-01-01T00:00:00Z"),
    Temporal.Instant.from("2024-06-01T00:00:00Z"),
  ];
  const result = acceptComparable(instants);
  expect(result.toString()).toBe("2024-01-01T00:00:00Z");
});

Deno.test("structural type - native ZonedDateTime satisfies TemporalComparable", () => {
  const zdts = [
    Temporal.ZonedDateTime.from("2024-01-01T00:00[UTC]"),
    Temporal.ZonedDateTime.from("2024-06-01T00:00[UTC]"),
  ];
  const result = acceptComparable(zdts);
  expect(result.toString()).toBe("2024-01-01T00:00:00+00:00[UTC]");
});

Deno.test("structural type - native PlainTime satisfies TemporalComparable", () => {
  const times = [
    Temporal.PlainTime.from("12:00"),
    Temporal.PlainTime.from("08:00"),
  ];
  const result = acceptComparable(times);
  expect(result.toString()).toBe("12:00:00");
});

// Verify Date does NOT satisfy TemporalComparable (no Symbol.toStringTag)
// This is a compile-time check — uncomment to see error:
// const dates: Date[] = [new Date()];
// acceptComparable(dates); // Should fail: Date has no [Symbol.toStringTag]

// Verify the return type preserves the specific Temporal type
Deno.test("structural type - return type preserved as PlainDate, not TemporalComparable", () => {
  const dates = [
    Temporal.PlainDate.from("2024-03-15"),
    Temporal.PlainDate.from("2024-01-01"),
  ];
  const result = acceptComparable(dates);
  // result should be typed as Temporal.PlainDate, not just TemporalComparable
  const _check: Temporal.PlainDate = result;
  expect(_check.year).toBe(2024);
});

// Nullable arrays
Deno.test("structural type - nullable array works", () => {
  const dates: (Temporal.PlainDate | null)[] = [
    Temporal.PlainDate.from("2024-03-15"),
    null,
  ];
  // This should work with T extending TemporalComparable
  function acceptNullable<T extends TemporalComparable>(
    values: readonly (T | null)[],
  ): T | null {
    return values.find((v) => v !== null) ?? null;
  }
  const result = acceptNullable(dates);
  expect(result?.toString()).toBe("2024-03-15");
});
