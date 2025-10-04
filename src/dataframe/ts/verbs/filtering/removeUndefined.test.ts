import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Test data with undefined values
const testData = createDataFrame([
  { id: 1, name: "Luke", homeworld: "Tatooine", species: "Human" },
  { id: 2, name: "Vader", homeworld: undefined, species: "Human" },
  { id: 3, name: "Leia", homeworld: "Alderaan", species: undefined },
  { id: 4, name: "Han", homeworld: undefined, species: undefined },
]);

Deno.test("removeUndefined removes only undefined values", () => {
  const result = testData.removeUndefined("homeworld");

  expect(result.nrows()).toBe(2);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine", species: "Human" },
    { id: 3, name: "Leia", homeworld: "Alderaan", species: undefined },
  ]);
});

Deno.test("removeUndefined type narrowing - removes only undefined from type", () => {
  const result = testData.removeUndefined("homeworld");

  // Type should be narrowed to exclude undefined
  const _typeCheck: DataFrame<{
    id: number;
    name: string;
    homeworld: string; // No undefined
    species: string | undefined;
  }> = result;

  expect(result.nrows()).toBe(2);
});

Deno.test("removeUndefined preserves null values", () => {
  const data = createDataFrame([
    { id: 1, value: "a" },
    { id: 2, value: null },
    { id: 3, value: undefined },
    { id: 4, value: "b" },
  ]);

  const result = data.removeUndefined("value");

  // Should keep null but remove undefined
  expect(result.nrows()).toBe(3);
  expect(result.toArray()).toEqual([
    { id: 1, value: "a" },
    { id: 2, value: null },
    { id: 4, value: "b" },
  ]);
});

Deno.test("removeUndefined on column with no undefined", () => {
  const data = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
  ]);

  const result = data.removeUndefined("name");

  expect(result.nrows()).toBe(2);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
  ]);
});

Deno.test("removeUndefined on column with all undefined", () => {
  const data = createDataFrame([
    { id: 1, value: undefined },
    { id: 2, value: undefined },
  ]);

  const result = data.removeUndefined("value");

  expect(result.nrows()).toBe(0);
  expect(result.toArray()).toEqual([]);
});

Deno.test("removeUndefined chaining", () => {
  const result = testData
    .removeUndefined("homeworld")
    .removeUndefined("species");

  expect(result.nrows()).toBe(1);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine", species: "Human" },
  ]);
});

Deno.test("removeUndefined with filter", () => {
  const result = testData
    .removeUndefined("homeworld")
    .filter((row) => row.species !== undefined);

  expect(result.nrows()).toBe(1);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine", species: "Human" },
  ]);
});

Deno.test("removeUndefined on empty DataFrame", () => {
  const data = createDataFrame<{ id: number; value: string | undefined }>([]);

  const result = data.removeUndefined("value");

  expect(result.nrows()).toBe(0);
  expect(result.toArray()).toEqual([]);
});

Deno.test("removeUndefined vs removeNull distinction", () => {
  const data = createDataFrame([
    { id: 1, value: "a" },
    { id: 2, value: null },
    { id: 3, value: undefined },
  ]);

  const resultUndefined = data.removeUndefined("value");
  const resultNull = data.removeNull("value");

  // removeUndefined keeps null
  expect(resultUndefined.nrows()).toBe(2);
  expect([...resultUndefined].some((r) => r.value === null)).toBe(true);

  // removeNull keeps undefined
  expect(resultNull.nrows()).toBe(2);
  expect([...resultNull].some((r) => r.value === undefined)).toBe(true);
});
