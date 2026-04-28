import { stats as s } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { Temporal } from "@tidy-ts/shims/temporal-polyfill";

// --- PlainDate ---

Deno.test("min - PlainDate clean array", () => {
  const dates = [
    Temporal.PlainDate.from("2024-03-15"),
    Temporal.PlainDate.from("2024-01-01"),
    Temporal.PlainDate.from("2024-06-30"),
  ];
  const result = s.min(dates);
  expect(
    Temporal.PlainDate.compare(result, Temporal.PlainDate.from("2024-01-01")),
  ).toBe(0);
});

Deno.test("max - PlainDate clean array", () => {
  const dates = [
    Temporal.PlainDate.from("2024-03-15"),
    Temporal.PlainDate.from("2024-01-01"),
    Temporal.PlainDate.from("2024-06-30"),
  ];
  const result = s.max(dates);
  expect(
    Temporal.PlainDate.compare(result, Temporal.PlainDate.from("2024-06-30")),
  ).toBe(0);
});

Deno.test("min - PlainDate single value", () => {
  const d = Temporal.PlainDate.from("2024-05-01");
  const result = s.min(d);
  expect(Temporal.PlainDate.compare(result, d)).toBe(0);
});

Deno.test("max - PlainDate single value", () => {
  const d = Temporal.PlainDate.from("2024-05-01");
  const result = s.max(d);
  expect(Temporal.PlainDate.compare(result, d)).toBe(0);
});

Deno.test("min - PlainDate with null returns null", () => {
  const dates: (Temporal.PlainDate | null)[] = [
    Temporal.PlainDate.from("2024-03-15"),
    null,
    Temporal.PlainDate.from("2024-01-01"),
  ];
  const result = s.min(dates);
  expect(result).toBe(null);
});

Deno.test("max - PlainDate with null returns null", () => {
  const dates: (Temporal.PlainDate | null)[] = [
    Temporal.PlainDate.from("2024-03-15"),
    null,
    Temporal.PlainDate.from("2024-06-30"),
  ];
  const result = s.max(dates);
  expect(result).toBe(null);
});

Deno.test("min - PlainDate with null removed", () => {
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

Deno.test("max - PlainDate with null removed", () => {
  const dates: (Temporal.PlainDate | null)[] = [
    Temporal.PlainDate.from("2024-03-15"),
    null,
    Temporal.PlainDate.from("2024-06-30"),
  ];
  const result = s.max(dates, { removeNull: true });
  expect(
    Temporal.PlainDate.compare(result, Temporal.PlainDate.from("2024-06-30")),
  ).toBe(0);
});

Deno.test("min - PlainDate with undefined returns null", () => {
  const dates: (Temporal.PlainDate | undefined)[] = [
    Temporal.PlainDate.from("2024-03-15"),
    undefined,
    Temporal.PlainDate.from("2024-01-01"),
  ];
  const result = s.min(dates);
  expect(result).toBe(null);
});

Deno.test("min - PlainDate with undefined removed", () => {
  const dates: (Temporal.PlainDate | undefined)[] = [
    Temporal.PlainDate.from("2024-03-15"),
    undefined,
    Temporal.PlainDate.from("2024-01-01"),
  ];
  const result = s.min(dates, { removeUndefined: true });
  expect(
    Temporal.PlainDate.compare(result, Temporal.PlainDate.from("2024-01-01")),
  ).toBe(0);
});

Deno.test("min - PlainDate with null and undefined removed", () => {
  const dates: (Temporal.PlainDate | null | undefined)[] = [
    null,
    Temporal.PlainDate.from("2024-03-15"),
    undefined,
    Temporal.PlainDate.from("2024-01-01"),
  ];
  const result = s.min(dates, { removeNull: true, removeUndefined: true });
  expect(
    Temporal.PlainDate.compare(result, Temporal.PlainDate.from("2024-01-01")),
  ).toBe(0);
});

Deno.test("min - PlainDate empty array returns null", () => {
  const result = s.min([] as Temporal.PlainDate[]);
  expect(result).toBe(null);
});

// --- PlainDateTime ---

Deno.test("min - PlainDateTime clean array", () => {
  const dts = [
    Temporal.PlainDateTime.from("2024-01-01T12:00:00"),
    Temporal.PlainDateTime.from("2024-01-01T08:00:00"),
    Temporal.PlainDateTime.from("2024-01-01T16:00:00"),
  ];
  const result = s.min(dts);
  expect(
    Temporal.PlainDateTime.compare(
      result,
      Temporal.PlainDateTime.from("2024-01-01T08:00:00"),
    ),
  ).toBe(0);
});

Deno.test("max - PlainDateTime clean array", () => {
  const dts = [
    Temporal.PlainDateTime.from("2024-01-01T12:00:00"),
    Temporal.PlainDateTime.from("2024-01-01T08:00:00"),
    Temporal.PlainDateTime.from("2024-01-01T16:00:00"),
  ];
  const result = s.max(dts);
  expect(
    Temporal.PlainDateTime.compare(
      result,
      Temporal.PlainDateTime.from("2024-01-01T16:00:00"),
    ),
  ).toBe(0);
});

// --- Instant ---

Deno.test("min - Instant clean array", () => {
  const instants = [
    Temporal.Instant.from("2024-06-01T00:00:00Z"),
    Temporal.Instant.from("2024-01-01T00:00:00Z"),
    Temporal.Instant.from("2024-12-01T00:00:00Z"),
  ];
  const result = s.min(instants);
  expect(
    Temporal.Instant.compare(
      result,
      Temporal.Instant.from("2024-01-01T00:00:00Z"),
    ),
  ).toBe(0);
});

Deno.test("max - Instant clean array", () => {
  const instants = [
    Temporal.Instant.from("2024-06-01T00:00:00Z"),
    Temporal.Instant.from("2024-01-01T00:00:00Z"),
    Temporal.Instant.from("2024-12-01T00:00:00Z"),
  ];
  const result = s.max(instants);
  expect(
    Temporal.Instant.compare(
      result,
      Temporal.Instant.from("2024-12-01T00:00:00Z"),
    ),
  ).toBe(0);
});

// --- Existing Date behavior still works ---

Deno.test("min - Date still works (regression)", () => {
  const dates = [
    new Date("2024-01-01"),
    new Date("2024-06-15"),
    new Date("2024-03-10"),
  ];
  expect(s.min(dates)).toEqual(new Date("2024-01-01"));
  expect(s.max(dates)).toEqual(new Date("2024-06-15"));
});

Deno.test("min/max - numbers still work (regression)", () => {
  expect(s.min([3, 1, 2])).toBe(1);
  expect(s.max([3, 1, 2])).toBe(3);
  expect(s.min(42)).toBe(42);
  expect(s.max(42)).toBe(42);
});
