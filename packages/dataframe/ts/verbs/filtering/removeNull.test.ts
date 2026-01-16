import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Test data with null values
const testData = createDataFrame([
  { id: 1, name: "Luke", homeworld: "Tatooine", mass: 77 },
  { id: 2, name: "Vader", homeworld: null, mass: 89 },
  { id: 3, name: "Leia", homeworld: "Alderaan", mass: null },
  { id: 4, name: "Han", homeworld: null, mass: null },
]);

Deno.test("removeNull removes only null values", () => {
  const result = testData.removeNull("homeworld");

  expect(result.nrows()).toBe(2);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine", mass: 77 },
    { id: 3, name: "Leia", homeworld: "Alderaan", mass: null },
  ]);
});

Deno.test("removeNull type narrowing - removes only null from type", () => {
  const result = testData.removeNull("homeworld");

  // Type should be narrowed to exclude null
  const _typeCheck: DataFrame<{
    id: number;
    name: string;
    homeworld: string; // No null
    mass: number | null;
  }> = result;

  expect(result.nrows()).toBe(2);
});

Deno.test("removeNull preserves undefined values", () => {
  const data = createDataFrame([
    { id: 1, value: "a" },
    { id: 2, value: null },
    { id: 3, value: undefined },
    { id: 4, value: "b" },
  ]);

  const result = data.removeNull("value");

  // Should keep undefined but remove null
  expect(result.nrows()).toBe(3);
  expect(result.toArray()).toEqual([
    { id: 1, value: "a" },
    { id: 3, value: undefined },
    { id: 4, value: "b" },
  ]);
});

Deno.test("removeNull on column with no nulls", () => {
  const data = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
  ]);

  const result = data.removeNull("name");

  expect(result.nrows()).toBe(2);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
  ]);
});

Deno.test("removeNull on column with all nulls", () => {
  const data = createDataFrame([
    { id: 1, value: null },
    { id: 2, value: null },
  ]);

  const result = data.removeNull("value");

  expect(result.nrows()).toBe(0);
  expect(result.toArray()).toEqual([]);
});

Deno.test("removeNull chaining", () => {
  const result = testData
    .removeNull("homeworld")
    .removeNull("mass");

  expect(result.nrows()).toBe(1);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine", mass: 77 },
  ]);
});

Deno.test("removeNull with filter", () => {
  const result = testData
    .removeNull("homeworld")
    .filter((row) => row.mass !== null);

  expect(result.nrows()).toBe(1);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine", mass: 77 },
  ]);
});

Deno.test("removeNull on empty DataFrame", () => {
  const data = createDataFrame({ columns: { id: [], value: [] } });

  const result = data.removeNull("value");

  expect(result.nrows()).toBe(0);
  expect(result.toArray()).toEqual([]);
});
