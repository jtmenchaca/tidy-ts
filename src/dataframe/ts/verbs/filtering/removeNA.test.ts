import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Test data with null and undefined values
const testData = createDataFrame([
  { id: 1, name: "Luke", homeworld: "Tatooine", affiliation: "Rebel" },
  { id: 2, name: "Vader", homeworld: null, affiliation: "Empire" },
  { id: 3, name: "Leia", homeworld: undefined, affiliation: "Rebel" },
  { id: 4, name: "Han", homeworld: "Corellia", affiliation: null },
  { id: 5, name: "Yoda", homeworld: null, affiliation: undefined },
]);

Deno.test("removeNA removes both null and undefined", () => {
  const result = testData.removeNA("homeworld");

  expect(result.nrows()).toBe(2);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine", affiliation: "Rebel" },
    { id: 4, name: "Han", homeworld: "Corellia", affiliation: null },
  ]);
});

Deno.test("removeNA type narrowing - removes null and undefined from type", () => {
  const result = testData.removeNA("homeworld");

  // Type should be narrowed to exclude null and undefined
  const _typeCheck: DataFrame<{
    id: number;
    name: string;
    homeworld: string; // No null or undefined
    affiliation: string | null | undefined;
  }> = result;

  expect(result.nrows()).toBe(2);
});

Deno.test("removeNA on column with only valid values", () => {
  const data = createDataFrame([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
  ]);

  const result = data.removeNA("name");

  expect(result.nrows()).toBe(2);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke" },
    { id: 2, name: "Leia" },
  ]);
});

Deno.test("removeNA on column with all null/undefined", () => {
  const data = createDataFrame([
    { id: 1, value: null },
    { id: 2, value: undefined },
    { id: 3, value: null },
  ]);

  const result = data.removeNA("value");

  expect(result.nrows()).toBe(0);
  expect(result.toArray()).toEqual([]);
});

Deno.test("removeNA on empty DataFrame", () => {
  const data = createDataFrame<{ id: number; value: string | null }>([]);

  const result = data.removeNA("value");

  expect(result.nrows()).toBe(0);
  expect(result.toArray()).toEqual([]);
});

Deno.test("removeNA chaining with other operations", () => {
  const result = testData
    .removeNA("homeworld")
    .filter((row) => row.affiliation === "Rebel");

  expect(result.nrows()).toBe(1);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine", affiliation: "Rebel" },
  ]);
});

Deno.test("removeNA multiple columns in sequence", () => {
  const result = testData
    .removeNA("homeworld")
    .removeNA("affiliation");

  expect(result.nrows()).toBe(1);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine", affiliation: "Rebel" },
  ]);
});

Deno.test("removeNA with grouped data", () => {
  const grouped = testData
    .groupBy("affiliation")
    .removeNA("homeworld");

  const result = grouped.summarize({
    count: (g) => g.nrows(),
  });

  // After removeNA("homeworld"), we have:
  // - Luke (Rebel, Tatooine) ✓
  // - Han (null affiliation, Corellia) ✓
  // Grouped by affiliation gives us: Rebel, null, Empire, undefined (4 groups)
  expect(result.nrows()).toBe(4);
});

Deno.test("removeNA with multiple fields using rest params", () => {
  const result = testData.removeNA("homeworld", "affiliation");

  expect(result.nrows()).toBe(1);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine", affiliation: "Rebel" },
  ]);

  // Type should narrow both fields
  const _typeCheck: DataFrame<{
    id: number;
    name: string;
    homeworld: string;
    affiliation: string;
  }> = result;
});

Deno.test("removeNA with multiple fields using array", () => {
  const result = testData.removeNA(["homeworld", "affiliation"]);

  expect(result.nrows()).toBe(1);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine", affiliation: "Rebel" },
  ]);

  // Type should narrow both fields
  const _typeCheck: DataFrame<{
    id: number;
    name: string;
    homeworld: string;
    affiliation: string;
  }> = result;
});
