// Grouping Verbs Examples - Compiler-tested examples for groupBy, summarise, ungroup
import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

/**
 * GroupBy Verb Documentation
 *
 * Group rows by one or more columns
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
 *   { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
 * ]);
 *
 * const grouped = people.groupBy("species");
 *
 * console.table(grouped);
 * ```
 */
function groupByExample() {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  ]);

  const grouped = people.groupBy("species");

  console.table(grouped);

  return { grouped };
}

/**
 * Summarise Verb Documentation
 *
 * Compute summary statistics for grouped data
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
 *   { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
 * ]);
 *
 * const summary = people
 *   .groupBy("species")
 *   .summarise({
 *     count: (df) => df.nrows(),
 *     avg_mass: (df) => stats.mean(df.mass)
 *   });
 *
 * console.table(summary);
 * ```
 */
function summariseExample() {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  ]);

  const summary = people
    .groupBy("species")
    .summarise({
      count: (df) => df.nrows(),
      avg_mass: (df) => stats.mean(df.mass),
      total_mass: (df) => stats.sum(df.mass),
    });

  console.table(summary);

  return { summary };
}

/**
 * Ungroup Verb Documentation
 *
 * Remove grouping structure from a DataFrame
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
 * ]);
 *
 * const grouped = people.groupBy("species");
 * const ungrouped = grouped.ungroup();
 *
 * console.table(ungrouped);
 * ```
 */
function ungroupExample() {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  ]);

  const grouped = people.groupBy("species");
  const ungrouped = grouped.ungroup();

  console.table(ungrouped);

  return { grouped, ungrouped };
}

Deno.test("GroupBy Verb Documentation", () => {
  const results = groupByExample();

  expect(results.grouped.__groups).toBeDefined();
  expect(results.grouped.__groups?.groupingColumns).toEqual(["species"]);
  expect(results.grouped.nrows()).toBe(3);
});

Deno.test("Summarise Verb Documentation", () => {
  const results = summariseExample();

  expect(results.summary.nrows()).toBe(2); // 2 species
  expect(results.summary.columns()).toContain("species");
  expect(results.summary.columns()).toContain("count");
  expect(results.summary.columns()).toContain("avg_mass");
  expect(results.summary.columns()).toContain("total_mass");
  expect(results.summary.extract("count")).toEqual([1, 2]); // 1 human, 2 droids
  expect(results.summary.extract("avg_mass")).toEqual([77, 53.5]); // 77, (75+32)/2
});

Deno.test("Ungroup Verb Documentation", () => {
  const results = ungroupExample();

  expect(results.grouped.__groups).toBeDefined();
  // @ts-expect-error - TypeScript correctly identifies ungrouped as ungrouped DataFrame
  expect(results.ungrouped.__groups).toBeUndefined();
  expect(results.ungrouped.nrows()).toBe(2);
  expect(results.ungrouped.columns()).toEqual(results.grouped.columns());
});
