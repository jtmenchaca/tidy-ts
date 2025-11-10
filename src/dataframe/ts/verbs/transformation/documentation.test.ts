// Transformation Verbs Examples - Compiler-tested examples for each transformation verb
import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

/**
 * Mutate Verb Documentation
 *
 * Add new columns or modify existing ones using expressions
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
 * ]);
 *
 * const withBMI = people.mutate({
 *   bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
 *   is_heavy: (row) => row.mass > 70
 * });
 *
 * console.table(withBMI);
 * ```
 */
function mutateExample() {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  ]);

  const withBMI = people.mutate({
    bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
    is_heavy: (row) => row.mass > 70,
  });

  console.table(withBMI);
  return { withBMI };
}

/**
 * Rename Verb Documentation
 *
 * Rename columns using a mapping object
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
 * ]);
 *
 * const renamed = people.rename({
 *   mass: "weight",
 *   height: "tallness"
 * });
 *
 * console.table(renamed);
 * ```
 */
function renameExample() {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  ]);

  const renamed = people.rename({
    mass: "weight",
    height: "tallness",
  });

  console.table(renamed);
  return { renamed };
}

/**
 * Reorder Verb Documentation
 *
 * Reorder columns in a DataFrame
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
 * ]);
 *
 * const reordered = people.reorder(["name", "species", "mass", "height", "id"]);
 *
 * console.table(reordered);
 * ```
 */
function reorderExample() {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  ]);

  const reordered = people.reorder(["name", "species", "mass", "height", "id"]);

  console.table(reordered);
  return { reordered };
}

Deno.test("Mutate Verb Documentation", () => {
  const results = mutateExample();

  expect(results.withBMI.nrows()).toBe(2);
  expect(results.withBMI.columns()).toContain("bmi");
  expect(results.withBMI.columns()).toContain("is_heavy");
  expect(results.withBMI.extract("is_heavy")).toEqual([true, true]);
});

Deno.test("Rename Verb Documentation", () => {
  const results = renameExample();

  expect(results.renamed.nrows()).toBe(2);
  expect(results.renamed.columns()).toContain("weight");
  expect(results.renamed.columns()).toContain("tallness");
  expect(results.renamed.columns()).not.toContain("mass");
  expect(results.renamed.columns()).not.toContain("height");
  expect(results.renamed.extract("weight")).toEqual([77, 75]);
});

Deno.test("Reorder Verb Documentation", () => {
  const results = reorderExample();

  expect(results.reordered.nrows()).toBe(2);
  expect(results.reordered.columns()).toEqual([
    "name",
    "species",
    "mass",
    "height",
    "id",
  ]);
});
