// Bug Report: distinct() not removing duplicate rows
// Expected: distinct() should remove duplicate rows
// Actual: distinct() returns all rows including duplicates

import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("distinct() should remove duplicate rows", () => {
  // Create DataFrame with duplicate rows
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 }, // Exact duplicate of first row
  ]);

  console.log("Original DataFrame:");
  console.table(people);
  console.log("Original row count:", people.nrows());

  const unique = people.distinct();

  console.log("After distinct():");
  console.table(unique);
  console.log("Unique row count:", unique.nrows());

  // Expected: 3 unique rows (exact duplicate should be removed)
  // Actual: 4 rows (duplicate not removed)
  expect(unique.nrows()).toBe(3);
  expect(unique.name).toEqual(["Luke", "C-3PO", "R2-D2"]);
});
