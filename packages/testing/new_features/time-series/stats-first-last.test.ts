import { expect } from "@std/expect";
import { createDataFrame, stats } from "@tidy-ts/dataframe";

Deno.test("stats.first() - basic usage", () => {
  expect(stats.first([1, 2, 3, 4, 5])).toBe(1);
  expect(stats.first([10, 20, 30])).toBe(10);
});

Deno.test("stats.first() - with nulls (removeNA=false)", () => {
  expect(stats.first([null, 2, 3], false)).toBe(null);
  expect(stats.first([1, null, 3], false)).toBe(1);
});

Deno.test("stats.first() - with nulls (removeNA=true)", () => {
  expect(stats.first([null, 2, 3], true)).toBe(2);
  expect(stats.first([null, null, 3], true)).toBe(3);
});

Deno.test("stats.first() - single value", () => {
  expect(stats.first(42)).toBe(42);
  expect(stats.first(new Date("2023-01-01"))).toBeInstanceOf(Date);
});

Deno.test("stats.first() - dates", () => {
  const dates = [
    new Date("2023-01-01"),
    new Date("2023-01-02"),
    new Date("2023-01-03"),
  ];
  expect(stats.first(dates)).toEqual(new Date("2023-01-01"));
});

Deno.test("stats.first() - empty array", () => {
  expect(stats.first([])).toBe(null);
});

Deno.test("stats.last() - basic usage", () => {
  expect(stats.last([1, 2, 3, 4, 5])).toBe(5);
  expect(stats.last([10, 20, 30])).toBe(30);
});

Deno.test("stats.last() - with nulls (removeNA=false)", () => {
  expect(stats.last([1, 2, null], false)).toBe(null);
  expect(stats.last([1, null, 3], false)).toBe(3);
});

Deno.test("stats.last() - with nulls (removeNA=true)", () => {
  expect(stats.last([1, 2, null], true)).toBe(2);
  expect(stats.last([null, 2, null], true)).toBe(2);
});

Deno.test("stats.last() - single value", () => {
  expect(stats.last(42)).toBe(42);
  expect(stats.last(new Date("2023-01-01"))).toBeInstanceOf(Date);
});

Deno.test("stats.last() - dates", () => {
  const dates = [
    new Date("2023-01-01"),
    new Date("2023-01-02"),
    new Date("2023-01-03"),
  ];
  expect(stats.last(dates)).toEqual(new Date("2023-01-03"));
});

Deno.test("stats.last() - empty array", () => {
  expect(stats.last([])).toBe(null);
});

Deno.test("stats.first() and stats.last() - in DataFrame operations", () => {
  const df = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), price: 100 },
    { timestamp: new Date("2023-01-01T11:00:00"), price: 110 },
    { timestamp: new Date("2023-01-01T12:00:00"), price: 120 },
  ]);

  const result = df.summarize({
    first_price: (df) => stats.first(df.price),
    last_price: (df) => stats.last(df.price),
  });

  expect(result[0].first_price).toBe(100);
  expect(result[0].last_price).toBe(120);
});
