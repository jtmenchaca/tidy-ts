import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// ── Scalar comparand ────────────────────────────────────────────────────────

Deno.test("pmin — cap values at threshold", () => {
  expect(s.pmin([1, 5, 3, 8, 2], 4)).toEqual([1, 4, 3, 4, 2]);
});

Deno.test("pmin — scalar smaller than all values", () => {
  expect(s.pmin([10, 20, 30], 0)).toEqual([0, 0, 0]);
});

Deno.test("pmin — scalar larger than all values", () => {
  expect(s.pmin([1, 2, 3], 10)).toEqual([1, 2, 3]);
});

Deno.test("pmin — negative scalar", () => {
  expect(s.pmin([-5, -3, 1, 4], -2)).toEqual([-5, -3, -2, -2]);
});

Deno.test("pmin — empty array", () => {
  expect(s.pmin([], 5)).toEqual([]);
});

Deno.test("pmin — single element", () => {
  expect(s.pmin([3], 5)).toEqual([3]);
  expect(s.pmin([7], 5)).toEqual([5]);
});

// ── Array comparand ─────────────────────────────────────────────────────────

Deno.test("pmin — two arrays elementwise", () => {
  expect(s.pmin([1, 5, 3], [2, 3, 7])).toEqual([1, 3, 3]);
});

Deno.test("pmin — two arrays same values", () => {
  expect(s.pmin([4, 4, 4], [4, 4, 4])).toEqual([4, 4, 4]);
});

Deno.test("pmin — array length mismatch throws", () => {
  expect(() => s.pmin([1, 2], [1, 2, 3])).toThrow("same length");
});

// ── Null/undefined handling ─────────────────────────────────────────────────

Deno.test("pmin — null values pass through as null (scalar)", () => {
  const result = s.pmin([1, null, 3], 5);
  expect(result).toEqual([1, null, 3]);
});

Deno.test("pmin — undefined values pass through as null (scalar)", () => {
  const result = s.pmin([1, undefined, 3], 5);
  expect(result).toEqual([1, null, 3]);
});

Deno.test("pmin — null in both arrays", () => {
  const result = s.pmin([1, null, 3], [null, 2, 4]);
  expect(result).toEqual([null, null, 3]);
});

// ── NaN handling ────────────────────────────────────────────────────────────

Deno.test("pmin — NaN in values propagates", () => {
  const result = s.pmin([1, NaN, 3], 5);
  expect(result[0]).toBe(1);
  expect(Number.isNaN(result[1])).toBe(true);
  expect(result[2]).toBe(3);
});

Deno.test("pmin — NaN scalar produces NaN for all non-null", () => {
  const result = s.pmin([1, 2, 3], NaN);
  expect(result.every((v) => Number.isNaN(v as number))).toBe(true);
});

// ── Infinity ────────────────────────────────────────────────────────────────

Deno.test("pmin — Infinity as scalar", () => {
  expect(s.pmin([1, 2, 3], Infinity)).toEqual([1, 2, 3]);
});

Deno.test("pmin — -Infinity as scalar", () => {
  expect(s.pmin([1, 2, 3], -Infinity)).toEqual([
    -Infinity,
    -Infinity,
    -Infinity,
  ]);
});

// ── PREVENT-style piecewise spline pattern ──────────────────────────────────

Deno.test("pmin — piecewise linear spline: min(SBP, 110) for below-knot term", () => {
  const sbp = [90, 100, 110, 120, 140, 160];
  const below = s.pmin(sbp, 110);
  expect(below).toEqual([90, 100, 110, 110, 110, 110]);
});

// ── Integration with mutateOverGroup ────────────────────────────────────────

Deno.test("pmin — via mutateOverGroup per group", () => {
  const df = createDataFrame([
    { group: "A", value: 3 },
    { group: "A", value: 8 },
    { group: "B", value: 1 },
    { group: "B", value: 6 },
  ]);

  const result = df
    .groupBy("group")
    .mutateOverGroup({ capped: (g) => s.pmin(g.extract("value"), 5) });

  const rows = result.toArray();
  const a = rows.filter((r) => r.group === "A");
  const b = rows.filter((r) => r.group === "B");

  expect(a.map((r) => r.capped)).toEqual([3, 5]);
  expect(b.map((r) => r.capped)).toEqual([1, 5]);
});
