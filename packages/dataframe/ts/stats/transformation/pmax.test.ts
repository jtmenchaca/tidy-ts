import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// ── Scalar comparand ────────────────────────────────────────────────────────

Deno.test("pmax — clamp negative values to 0", () => {
  expect(s.pmax([-3, -1, 0, 2, 5], 0)).toEqual([0, 0, 0, 2, 5]);
});

Deno.test("pmax — scalar larger than all values", () => {
  expect(s.pmax([1, 2, 3], 10)).toEqual([10, 10, 10]);
});

Deno.test("pmax — scalar smaller than all values", () => {
  expect(s.pmax([10, 20, 30], 0)).toEqual([10, 20, 30]);
});

Deno.test("pmax — negative scalar", () => {
  expect(s.pmax([-5, -3, 1, 4], -2)).toEqual([-2, -2, 1, 4]);
});

Deno.test("pmax — empty array", () => {
  expect(s.pmax([], 5)).toEqual([]);
});

Deno.test("pmax — single element", () => {
  expect(s.pmax([3], 5)).toEqual([5]);
  expect(s.pmax([7], 5)).toEqual([7]);
});

// ── Array comparand ─────────────────────────────────────────────────────────

Deno.test("pmax — two arrays elementwise", () => {
  expect(s.pmax([1, 5, 3], [2, 3, 7])).toEqual([2, 5, 7]);
});

Deno.test("pmax — two arrays same values", () => {
  expect(s.pmax([4, 4, 4], [4, 4, 4])).toEqual([4, 4, 4]);
});

Deno.test("pmax — array length mismatch throws", () => {
  expect(() => s.pmax([1, 2], [1, 2, 3])).toThrow("same length");
});

// ── Null/undefined handling ─────────────────────────────────────────────────

Deno.test("pmax — null values pass through as null (scalar)", () => {
  const result = s.pmax([1, null, 3], 0);
  expect(result).toEqual([1, null, 3]);
});

Deno.test("pmax — undefined values pass through as null (scalar)", () => {
  const result = s.pmax([1, undefined, 3], 0);
  expect(result).toEqual([1, null, 3]);
});

Deno.test("pmax — null in both arrays", () => {
  const result = s.pmax([1, null, 3], [null, 2, 4]);
  expect(result).toEqual([null, null, 4]);
});

// ── NaN handling ────────────────────────────────────────────────────────────

Deno.test("pmax — NaN in values propagates", () => {
  const result = s.pmax([1, NaN, 3], 0);
  expect(result[0]).toBe(1);
  expect(Number.isNaN(result[1])).toBe(true);
  expect(result[2]).toBe(3);
});

Deno.test("pmax — NaN scalar produces NaN for all non-null", () => {
  const result = s.pmax([1, 2, 3], NaN);
  expect(result.every((v) => Number.isNaN(v as number))).toBe(true);
});

// ── Infinity ────────────────────────────────────────────────────────────────

Deno.test("pmax — Infinity as scalar", () => {
  expect(s.pmax([1, 2, 3], Infinity)).toEqual([Infinity, Infinity, Infinity]);
});

Deno.test("pmax — -Infinity as scalar", () => {
  expect(s.pmax([1, 2, 3], -Infinity)).toEqual([1, 2, 3]);
});

// ── PREVENT-style piecewise spline pattern ──────────────────────────────────

Deno.test("pmax — piecewise linear spline: max(SBP - 110, 0)", () => {
  const sbp = [90, 100, 110, 120, 140, 160];
  const spline = s.pmax(
    sbp.map((v) => v - 110),
    0,
  );
  expect(spline).toEqual([0, 0, 0, 10, 30, 50]);
});

// ── Integration with mutateOverGroup ────────────────────────────────────────

Deno.test("pmax — via mutateOverGroup per group", () => {
  const df = createDataFrame([
    { group: "A", value: -3 },
    { group: "A", value: 5 },
    { group: "B", value: -1 },
    { group: "B", value: 2 },
  ]);

  const result = df
    .groupBy("group")
    .mutateOverGroup({ clamped: (g) => s.pmax(g.extract("value"), 0) });

  const rows = result.toArray();
  const a = rows.filter((r) => r.group === "A");
  const b = rows.filter((r) => r.group === "B");

  expect(a.map((r) => r.clamped)).toEqual([0, 5]);
  expect(b.map((r) => r.clamped)).toEqual([0, 2]);
});
