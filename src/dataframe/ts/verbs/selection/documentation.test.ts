// Selection Verbs Examples - Compiler-tested examples for each selection verb
import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

/**
 * Filter Verb Documentation
 *
 * Filter rows based on conditions
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
 *   { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
 * ]);
 *
 * const humans = people.filter((row) => row.species === "Human");
 * const heavy = people.filter((row) => row.mass > 70);
 *
 * console.table(humans);
 * console.table(heavy);
 * ```
 */
function filterExample() {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  ]);

  const humans = people.filter((row) => row.species === "Human");
  const heavy = people.filter((row) => row.mass > 70);

  console.table(humans);
  console.table(heavy);

  return { humans, heavy };
}

/**
 * Select Verb Documentation
 *
 * Keep only specified columns
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
 * ]);
 *
 * const selected = people.select("name", "species");
 *
 * console.table(selected);
 * ```
 */
function selectExample() {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  ]);

  const selected = people.select("name", "species");

  console.table(selected);

  return { selected };
}

/**
 * Drop Verb Documentation
 *
 * Remove specified columns
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
 * ]);
 *
 * const dropped = people.drop("id", "height");
 *
 * console.table(dropped);
 * ```
 */
function dropExample() {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  ]);

  const dropped = people.drop("id", "height");

  console.table(dropped);

  return { dropped };
}

/**
 * Distinct Verb Documentation
 *
 * Remove duplicate rows
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
 *   { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 }, // Exact duplicate
 * ]);
 *
 * const unique = people.distinct();
 *
 * console.table(unique);
 * ```
 */
function distinctExample() {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 }, // Exact duplicate
  ]);

  const unique = people.distinct();

  console.table(unique);

  return { unique };
}

/**
 * Slice Verb Documentation
 *
 * Select rows by position (head, tail)
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
 *   { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
 * ]);
 *
 * const firstTwo = people.head(2);
 * const lastTwo = people.tail(2);
 *
 * console.table(firstTwo);
 * console.table(lastTwo);
 * ```
 */
function sliceExample() {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  ]);

  const firstTwo = people.head(2);
  const lastTwo = people.tail(2);

  console.table(firstTwo);
  console.table(lastTwo);

  return { firstTwo, lastTwo };
}

Deno.test("Filter Verb Documentation", () => {
  const results = filterExample();

  expect(results.humans.nrows()).toBe(1);
  expect(results.humans.extract("species")).toEqual(["Human"]);

  expect(results.heavy.nrows()).toBe(2);
  expect(results.heavy.extract("name")).toEqual(["Luke", "C-3PO"]);
});

Deno.test("Select Verb Documentation", () => {
  const results = selectExample();

  expect(results.selected.nrows()).toBe(2);
  expect(results.selected.columns()).toEqual(["name", "species"]);
  expect(results.selected.columns()).not.toContain("id");
  expect(results.selected.columns()).not.toContain("mass");
});

Deno.test("Drop Verb Documentation", () => {
  const results = dropExample();

  expect(results.dropped.nrows()).toBe(2);
  expect(results.dropped.columns()).toEqual(["name", "species", "mass"]);
  expect(results.dropped.columns()).not.toContain("id");
  expect(results.dropped.columns()).not.toContain("height");
});

Deno.test("Distinct Verb Documentation", () => {
  const results = distinctExample();

  expect(results.unique.nrows()).toBe(2); // Exact duplicate removed
  expect(results.unique.extract("name")).toEqual(["Luke", "C-3PO"]);
});

Deno.test("Slice Verb Documentation", () => {
  const results = sliceExample();

  expect(results.firstTwo.nrows()).toBe(2);
  expect(results.firstTwo.extract("name")).toEqual(["Luke", "C-3PO"]);

  expect(results.lastTwo.nrows()).toBe(2);
  expect(results.lastTwo.extract("name")).toEqual(["C-3PO", "R2-D2"]);
});
