import { expect } from "@std/expect";
import { rowNumber } from "./row-number.ts";

Deno.test("rowNumber — from explicit length", () => {
  expect(rowNumber(0)).toEqual([]);
  expect(rowNumber(1)).toEqual([1]);
  expect(rowNumber(5)).toEqual([1, 2, 3, 4, 5]);
});

Deno.test("rowNumber — from array", () => {
  expect(rowNumber([])).toEqual([]);
  expect(rowNumber([10, 20, 30])).toEqual([1, 2, 3]);
  expect(rowNumber(["a", "b", "c", "d"])).toEqual([1, 2, 3, 4]);
});

Deno.test("rowNumber — from iterable without length", () => {
  function* gen() {
    yield "x";
    yield "y";
    yield "z";
  }
  expect(rowNumber(gen())).toEqual([1, 2, 3]);
});

Deno.test("rowNumber — from typed array (ArrayLike)", () => {
  expect(rowNumber(new Uint32Array([7, 8, 9, 10]))).toEqual([1, 2, 3, 4]);
});

Deno.test("rowNumber — rejects negative or non-integer length", () => {
  expect(() => rowNumber(-1)).toThrow();
  expect(() => rowNumber(1.5)).toThrow();
  expect(() => rowNumber(NaN)).toThrow();
});

Deno.test("rowNumber — composes with mutateOverGroup pattern", async () => {
  const { createDataFrame, stats: s } = await import("@tidy-ts/dataframe");
  const df = createDataFrame([
    { species: "A", mass: 10 },
    { species: "A", mass: 20 },
    { species: "B", mass: 5 },
    { species: "A", mass: 30 },
    { species: "B", mass: 15 },
  ]);
  // For each species, walk through rows in row order and assign a 1-based position.
  const out = df
    .groupBy("species")
    .mutateOverGroup({ position: (g) => s.rowNumber(g.nrows()) });
  // A appears 3 times (rows 0, 1, 3) → positions 1, 2, 3
  // B appears 2 times (rows 2, 4) → positions 1, 2
  expect(out.toRows()).toEqual([
    { species: "A", mass: 10, position: 1 },
    { species: "A", mass: 20, position: 2 },
    { species: "B", mass: 5, position: 1 },
    { species: "A", mass: 30, position: 3 },
    { species: "B", mass: 15, position: 2 },
  ]);
});
