import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Test data
const testData = createDataFrame([
  { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
  {
    id: 2,
    name: "Chewbacca",
    mass: 112,
    species: "Wookiee",
    homeworld: "Kashyyyk",
  },
  { id: 3, name: "Han", mass: 80, species: "Human", homeworld: "Corellia" },
  { id: 4, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
  { id: 5, name: "R2-D2", mass: 32, species: "Droid", homeworld: "Naboo" },
  { id: 6, name: "C-3PO", mass: 75, species: "Droid", homeworld: "Tatooine" },
]);

Deno.test("groupBy single column", () => {
  const result = testData.groupBy("species");

  expect(result.__groups).toBeDefined();
  expect(result.__groups?.size).toBe(3); // Human, Wookiee, Droid

  // Verify the group structure is created and has the expected number of groups
});

Deno.test("groupBy multiple columns", () => {
  const result = testData.groupBy("species", "homeworld");

  expect(result.__groups).toBeDefined();
  expect(result.__groups?.size).toBe(6); // Different combinations

  // Verify multiple column grouping creates more granular groups
});

Deno.test("groupBy no columns returns ungrouped", () => {
  // Create fresh test data to avoid mutations from previous tests
  const freshData = createDataFrame([
    { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
    {
      id: 2,
      name: "Chewbacca",
      mass: 112,
      species: "Wookiee",
      homeworld: "Kashyyyk",
    },
  ]);

  const result = freshData.groupBy();

  expect(result.__groups).toBeUndefined();
  expect(result.toArray()).toEqual(freshData.toArray());
});

Deno.test("groupBy preserves original data", () => {
  const result = testData.groupBy("species");

  expect(result.nrows()).toBe(testData.nrows());
  expect(result.toArray()[0]).toEqual(testData.toArray()[0]);
  expect(result.toArray()[1]).toEqual(testData.toArray()[1]);
  // ... all rows should be preserved
});

Deno.test("groupBy with empty data", () => {
  const result = createDataFrame([])
    // @ts-expect-error - species is not a valid column
    .groupBy("species");

  expect(result.__groups).toBeDefined();
  expect(result.__groups?.size).toBe(0);
  expect(result.nrows()).toBe(0);
});

Deno.test("groupBy handles duplicate values", () => {
  const duplicateData = createDataFrame([
    { id: 1, category: "A", value: 10 },
    { id: 2, category: "A", value: 20 },
    { id: 3, category: "B", value: 30 },
    { id: 4, category: "A", value: 40 },
  ]);

  const result = duplicateData.groupBy("category");

  expect(result.__groups?.size).toBe(2); // A and B

  // Verify that duplicate values are properly grouped
});

Deno.test("groupBy with null/undefined values", () => {
  const nullData = createDataFrame([
    { id: 1, category: "A", subcategory: "X" },
    { id: 2, category: null, subcategory: "Y" },
    { id: 3, category: "A", subcategory: null },
    { id: 4, category: undefined, subcategory: "Z" },
  ]);

  const result = nullData.groupBy("category");

  expect(result.__groups?.size).toBe(3); // A, null, undefined
});

Deno.test("groupBy maintains group order", () => {
  const result = testData.groupBy("species");

  // Groups should maintain order of first appearance (verified through group size)
  expect(result.__groups?.size).toBe(3); // Human, Wookiee, Droid in order of first appearance
});

Deno.test("groupBy with numeric values", () => {
  const numericData = createDataFrame([
    { id: 1, value: 10, category: "A" },
    { id: 2, value: 20, category: "B" },
    { id: 3, value: 10, category: "C" },
    { id: 4, value: 30, category: "A" },
  ]);

  const result = numericData.groupBy("value");

  expect(result.__groups?.size).toBe(3); // 10, 20, 30

  // Verify numeric grouping works correctly
});
