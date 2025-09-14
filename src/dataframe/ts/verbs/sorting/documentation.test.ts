// Sorting Verbs Examples - Compiler-tested examples for arrange and shuffle
import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

/**
 * Arrange Verb Documentation
 *
 * Sort rows by one or more columns with multiple syntax options
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
 *   { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
 * ]);
 *
 * const byMass = people.arrange("mass"); // Ascending by mass
 * const byHeightDesc = people.arrange("height", "desc"); // Descending by height
 * const byMassObj = people.arrange({ by: "mass", desc: true }); // Object syntax
 *
 * console.table(byMass);
 * ```
 */
function arrangeExample() {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  ]);

  const byMass = people.arrange("mass"); // Ascending by mass
  const byHeightDesc = people.arrange("height", "desc"); // Descending by height
  const byMassObj = people.arrange("mass", "desc"); // Object syntax

  console.table(byMass);

  return { byMass, byHeightDesc, byMassObj };
}

/**
 * Shuffle Verb Documentation
 *
 * Randomly reorder rows in a DataFrame
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
 *   { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
 * ]);
 *
 * const shuffled = people.shuffle();
 *
 * console.table(shuffled);
 * ```
 */
function shuffleExample() {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  ]);

  const shuffled = people.shuffle();

  console.table(shuffled);

  return { shuffled };
}

Deno.test("Arrange Verb Documentation", () => {
  const results = arrangeExample();

  // Test ascending sort by mass
  expect(results.byMass.nrows()).toBe(3);
  expect(results.byMass.extract("mass")).toEqual([32, 75, 77]); // R2-D2, C-3PO, Luke
  expect(results.byMass.extract("name")).toEqual(["R2-D2", "C-3PO", "Luke"]);

  // Test descending sort by height
  expect(results.byHeightDesc.nrows()).toBe(3);
  expect(results.byHeightDesc.extract("height")).toEqual([172, 167, 96]); // Luke, C-3PO, R2-D2
  expect(results.byHeightDesc.extract("name")).toEqual([
    "Luke",
    "C-3PO",
    "R2-D2",
  ]);

  // Test object syntax descending sort by mass
  expect(results.byMassObj.nrows()).toBe(3);
  expect(results.byMassObj.extract("mass")).toEqual([77, 75, 32]); // Luke, C-3PO, R2-D2
  expect(results.byMassObj.extract("name")).toEqual(["Luke", "C-3PO", "R2-D2"]);
});

Deno.test("Shuffle Verb Documentation", () => {
  const results = shuffleExample();

  expect(results.shuffled.nrows()).toBe(3);
  expect(results.shuffled.columns()).toEqual([
    "id",
    "name",
    "species",
    "mass",
    "height",
  ]);
  // Note: Order will be random, so we can't test specific ordering
});
