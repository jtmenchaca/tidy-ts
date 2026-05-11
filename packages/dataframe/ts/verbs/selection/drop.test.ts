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

Deno.test("drop multiple columns (sequential arguments)", () => {
  const result = testData.drop("mass", "homeworld");
  console.log("Drop multiple columns result:", result);

  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", species: "Human" },
    { id: 2, name: "Chewbacca", species: "Wookiee" },
  ]);
});

Deno.test("drop non-existent columns throws", () => {
  expect(() => {
    // @ts-expect-error - non-existent column
    testData.drop("nonexistent", "alsomissing");
  }).toThrow('Columns [nonexistent, alsomissing] not found. Available columns: [id, name, mass, species, homeworld]');
});

Deno.test("drop mixed existing and non-existent columns throws", () => {
  expect(() => {
    // @ts-expect-error - non-existent column
    testData.drop("mass", "nonexistent", "species");
  }).toThrow('Column "nonexistent" not found. Available columns: [id, name, mass, species, homeworld]');
});

Deno.test("drop all columns", () => {
  const result = testData.drop("id", "name", "mass", "species", "homeworld");
  console.log("Drop all columns result:", result);

  expect(result.toArray()).toEqual([{}, {}]);
});

Deno.test("drop from empty data", () => {
  const result = createDataFrame([]).drop("mass", "name");
  console.log("Drop from empty data result:", result);

  expect(result.toArray()).toEqual([]);
});

Deno.test("drop with undefined (no arguments)", () => {
  const result = testData.drop();
  console.log("Drop with no arguments result:", result);

  // Should return data unchanged
  expect(result.toArray()).toEqual(testData.toArray());
});
