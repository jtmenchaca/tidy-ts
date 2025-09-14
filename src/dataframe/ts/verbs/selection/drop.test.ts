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
]);

Deno.test("drop single column", () => {
  const result = testData.drop("mass");
  console.log("Drop single column result:", result);

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", species: "Human", homeworld: "Tatooine" },
    { id: 2, name: "Chewbacca", species: "Wookiee", homeworld: "Kashyyyk" },
  ]);
});

Deno.test("drop multiple columns", () => {
  const result = testData.drop("mass", "homeworld");
  console.log("Drop multiple columns result:", result);

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", species: "Human" },
    { id: 2, name: "Chewbacca", species: "Wookiee" },
  ]);
});

Deno.test("drop non-existent column (should be silently ignored)", () => {
  // @ts-expect-error - non-existent column
  const result = testData.drop("nonexistent", "alsomissing");
  console.log("Drop non-existent columns result:", result);

  // Should return data unchanged
  expect(result.toArray()).toEqual(testData.toArray());
});

Deno.test("drop mixed existing and non-existent columns", () => {
  // @ts-expect-error - non-existent column
  const result = testData.drop("mass", "nonexistent", "species");
  console.log("Drop mixed columns result:", result);

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", homeworld: "Tatooine" },
    { id: 2, name: "Chewbacca", homeworld: "Kashyyyk" },
  ]);
});

Deno.test("drop all columns", () => {
  const result = testData.drop("id", "name", "mass", "species", "homeworld");
  console.log("Drop all columns result:", result);

  expect(result.toArray()).toEqual([{}, {}]);
});

Deno.test("drop from empty data", () => {
  // @ts-expect-error - empty dataframe
  const result = createDataFrame([]).drop("mass", "name");
  console.log("Drop from empty data result:", result);

  expect(result.toArray()).toEqual([]);
});
