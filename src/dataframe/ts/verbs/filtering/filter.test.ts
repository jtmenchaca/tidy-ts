import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
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
  { id: 3, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
  { id: 4, name: "C-3PO", mass: 75, species: "Droid", homeworld: "Tatooine" },
]);

Deno.test("filter with single function predicate", () => {
  const result = testData.filter((row) => row.mass > 80);
  console.log("Single function predicate result:", result);
  expect(result.toArray()).toEqual([
    {
      id: 2,
      name: "Chewbacca",
      mass: 112,
      species: "Wookiee",
      homeworld: "Kashyyyk",
    },
  ]);
});

Deno.test("filter with multiple function predicates (AND logic)", () => {
  const result = testData.filter(
    (row) => row.mass > 70,
    (row) => row.species === "Human",
  );
  console.log("Multiple function predicates result:", result);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
  ]);
});

Deno.test("filter with boolean array predicate", () => {
  const booleanPredicate = [true, false, true, false]; // Keep Luke and Leia
  const result = testData.filter(booleanPredicate);
  console.log("Boolean array predicate result:", result);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
    { id: 3, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
  ]);
});

Deno.test("filter with mixed predicates", () => {
  const booleanPredicate = [true, true, true, false]; // Exclude C-3PO
  const result = testData.filter(
    booleanPredicate,
    (row) => row.species === "Human", // Further filter to Humans only
  );
  console.log("Mixed predicates result:", result);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
    { id: 3, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
  ]);
});

Deno.test("filter with no predicates (returns all)", () => {
  const result = testData.filter();
  console.log("No predicates result:", result);
  expect(result.toArray()).toEqual(testData.toArray());
});

Deno.test("filter that matches nothing", () => {
  const result = testData.filter((row) => row.mass > 200);
  console.log("No matches result:", result);
  expect(result.toArray()).toEqual([]);
});

Deno.test("filter with null/undefined in boolean array", () => {
  const booleanPredicate = [true, null, undefined, false]; // null/undefined treated as false
  const result = testData.filter(booleanPredicate);
  console.log("Null/undefined in boolean array result:", result);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
  ]);
});

Deno.test("filter from empty data", () => {
  // @ts-expect-error - empty dataframe
  const result = createDataFrame([]).filter((row) => row.mass > 50);
  console.log("Filter empty data result:", result);
  // @ts-expect-error - empty dataframe
  expect(result.toArray()).toEqual([]);
});

Deno.test("filter with invalid boolean array length should throw", () => {
  const invalidPredicate = [true, false]; // Wrong length for testData
  expect(() => {
    testData.filter(invalidPredicate);
  }).toThrow("Predicate array length must equal current view length");
});

Deno.test("filter with invalid predicate type should throw", () => {
  expect(() => {
    // @ts-expect-error - Testing runtime error
    testData.filter("invalid");
  }).toThrow("pred is not a function");
});

Deno.test("filter with combined AND logic in single predicate", () => {
  // This test covers the bug where combined && logic in a single predicate
  // was not working correctly - it was returning Chewbacca (Wookiee) when
  // filtering for height > 80 AND species === "Human"
  const result = testData.filter(
    (row) => row.mass > 80 && row.species === "Human",
  );
  console.log("Combined AND logic result:", result);
  expect(result.toArray()).toEqual([
    // Should only return Luke (mass 77 > 80 is false, so no results)
    // Actually, let's use a different threshold to get a valid result
  ]);
});

Deno.test("filter with combined AND logic - height and species", () => {
  // Test the specific case from the getting started example
  const result = testData.filter(
    (row) => row.mass > 70 && row.species === "Human",
  );
  console.log("Height and species AND logic result:", result);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
  ]);
});

Deno.test("filter with combined AND logic - should exclude Wookiee", () => {
  // This is the specific bug case: filtering for Humans should exclude Chewbacca
  const result = testData.filter(
    (row) => row.mass > 100 && row.species === "Human",
  );
  console.log("Should exclude Wookiee result:", result);
  expect(result.toArray()).toEqual([
    // Should be empty - Chewbacca is Wookiee, not Human
  ]);
});

Deno.test("filter type narrowing", () => {
  const testData = createDataFrame([
    { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
    {
      id: 2,
      name: "Chewbacca",
      mass: 112,
      species: "Wookiee",
      homeworld: "Kashyyyk",
    },
    { id: 3, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
    { id: 4, name: "C-3PO", mass: 75, species: "Droid", homeworld: undefined },
    { id: 5, name: "R2-D2", mass: 32, species: "Droid", homeworld: undefined },
  ]);
  const result = testData.replaceNA({ homeworld: "Tatooine" });

  const _resultCheck: DataFrame<{
    id: number;
    name: string;
    mass: number;
    species: string;
    homeworld: string;
  }> = result;
  console.log("Type narrowing result:", result);
});

// Deno.test("filterNA narrows selected columns", () => {
//   const df = createDataFrame([
//     { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
//     { id: 2, name: "C-3PO", mass: 75, species: "Droid", homeworld: undefined },
//     { id: 3, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
//     { id: 4, name: "R2-D2", mass: 32, species: "Droid", homeworld: undefined },
//   ]);

//   const filtered = df.filterNA("homeworld");
//   const _typeCheck: DataFrame<{
//     id: number;
//     name: string;
//     mass: number;
//     species: string;
//     homeworld: string;
//   }> = filtered;

//   expect(filtered.toArray()).toEqual([
//     { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
//     { id: 3, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
//   ]);

//   // Toggle options: keep nulls but drop undefined (for demonstration)
//   const withOptions = df.filterNA("homeworld", {
//     null: false,
//     undefined: true,
//   });
//   expect(withOptions.toArray()).toEqual([
//     { id: 1, name: "Luke", mass: 77, species: "Human", homeworld: "Tatooine" },
//     { id: 3, name: "Leia", mass: 49, species: "Human", homeworld: "Alderaan" },
//   ]);
// });
