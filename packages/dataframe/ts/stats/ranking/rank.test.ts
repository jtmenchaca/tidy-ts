import { expect } from "@std/expect";
import { rank } from "./rank.ts";

Deno.test("rank — average ties (default)", () => {
  expect(rank([3, 1, 4, 1, 5])).toEqual([3, 1.5, 4, 1.5, 5]);
  expect(rank([3, 1, 4, 1, 5], { ties: "average" })).toEqual([3, 1.5, 4, 1.5, 5]);
});

Deno.test("rank — min ties", () => {
  expect(rank([3, 1, 4, 1, 5], { ties: "min" })).toEqual([3, 1, 4, 1, 5]);
  // Triple tie: 10, 10, 10, 20 → ranks 1, 1, 1, 4
  expect(rank([10, 10, 10, 20], { ties: "min" })).toEqual([1, 1, 1, 4]);
});

Deno.test("rank — max ties", () => {
  expect(rank([3, 1, 4, 1, 5], { ties: "max" })).toEqual([3, 2, 4, 2, 5]);
  expect(rank([10, 10, 10, 20], { ties: "max" })).toEqual([3, 3, 3, 4]);
});

Deno.test("rank — dense ties", () => {
  // No gap after ties: 10, 10, 20, 30 → ranks 1, 1, 2, 3
  expect(rank([10, 10, 20, 30], { ties: "dense" })).toEqual([1, 1, 2, 3]);
  // Compare to "min" which would skip: 1, 1, 3, 4
  expect(rank([10, 10, 20, 30], { ties: "min" })).toEqual([1, 1, 3, 4]);
});

Deno.test("rank — first ties (strictly unique 1..n; encounter order)", () => {
  // Two 1s, first encounter wins lower rank
  expect(rank([3, 1, 4, 1, 5], { ties: "first" })).toEqual([3, 1, 4, 2, 5]);
  // All tied: 10, 10, 10, 10 → 1, 2, 3, 4 in encounter order
  expect(rank([10, 10, 10, 10], { ties: "first" })).toEqual([1, 2, 3, 4]);
  // No ties: behaves identically to other tie-break methods.
  // Ascending: 1(idx1)=1, 3(idx0)=2, 4(idx2)=3, 5(idx3)=4 → ranks in input order [2,1,3,4]
  expect(rank([3, 1, 4, 5], { ties: "first" })).toEqual([2, 1, 3, 4]);
});

Deno.test("rank — first ties produces strictly unique 1..n", () => {
  const values = [50, 20, 30, 50, 10, 30, 50];
  const ranks = rank(values, { ties: "first" });
  // Every output is unique, all in [1..n], partitioned correctly.
  expect(new Set(ranks).size).toBe(values.length);
  expect(Math.min(...(ranks as number[]))).toBe(1);
  expect(Math.max(...(ranks as number[]))).toBe(values.length);
  // Specifically: sorted ascending is [10(idx4), 20(idx1), 30(idx2), 30(idx5), 50(idx0), 50(idx3), 50(idx6)]
  // so encounter-order ranks are:
  //   idx 0 (50, first 50): 5
  //   idx 1 (20):           2
  //   idx 2 (30, first 30): 3
  //   idx 3 (50, 2nd):      6
  //   idx 4 (10):           1
  //   idx 5 (30, 2nd):      4
  //   idx 6 (50, 3rd):      7
  expect(ranks).toEqual([5, 2, 3, 6, 1, 4, 7]);
});

Deno.test("rank — first ties descending", () => {
  // Descending: highest first. Tied values still broken by encounter order.
  expect(rank([3, 1, 4, 1, 5], { ties: "first", desc: true })).toEqual([3, 4, 2, 5, 1]);
});

Deno.test("rank — null/undefined map to null in any tie mode", () => {
  for (const ties of ["average", "min", "max", "dense", "first"] as const) {
    const r = rank([3, null, 1, undefined, 2], { ties });
    expect(r[1]).toBe(null);
    expect(r[3]).toBe(null);
  }
});

Deno.test("rank — descending order", () => {
  expect(rank([3, 1, 4, 1, 5], { ties: "average", desc: true })).toEqual([3, 4.5, 2, 4.5, 1]);
  expect(rank([3, 1, 4, 1, 5], { ties: "min", desc: true })).toEqual([3, 4, 2, 4, 1]);
});

Deno.test("rank — target lookup (positional)", () => {
  expect(rank([3, 1, 4, 1, 5], 3)).toBe(3);
  expect(rank([3, 1, 4, 1, 5], 1)).toBe(1);
  expect(rank([3, 1, 4, 1, 5], 5)).toBe(5);
});

Deno.test("rank — empty + single-element arrays", () => {
  expect(rank([], { ties: "first" })).toEqual([]);
  expect(rank([42], { ties: "first" })).toEqual([1]);
});
