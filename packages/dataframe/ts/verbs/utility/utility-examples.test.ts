// Utility Verbs Examples - Compiler-tested examples for extract and forEach operations
import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

/**
 * Utility Verbs Documentation
 *
 * Demonstrates extract and forEach operations
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
 *   { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
 * ]);
 *
 * // Extract operations - different ways to get values from columns
 * const allNames = people.extract("name"); // Get all values as array
 * const firstPerson = people.extractHead("name", 1); // Get first value (single)
 * const firstTwoNames = people.extractHead("name", 2); // Get first 2 values (array)
 * const lastPerson = people.extractTail("name", 1); // Get last value (single)
 * const lastTwoNames = people.extractTail("name", 2); // Get last 2 values (array)
 * const thirdPerson = people.extractNth("name", 2); // Get value at index 2
 * const randomSample = people.extractSample("name", 2); // Get 2 random values
 *
 * // ForEach operations - iterate over rows with side effects
 * const processedNames: string[] = [];
 * people.forEachRow((row, index) => {
 *   processedNames.push(`${index}: ${row.name} (${row.species})`);
 * });
 *
 * console.log("All names:", allNames);
 * console.log("First person:", firstPerson);
 * console.log("First two names:", firstTwoNames);
 * console.log("Last person:", lastPerson);
 * console.log("Last two names:", lastTwoNames);
 * console.log("Third person:", thirdPerson);
 * console.log("Random sample:", randomSample);
 * console.log("Processed names:", processedNames);
 * ```
 */
function utilityExample() {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  ]);

  // Extract operations - different ways to get values from columns
  const allNames = people.extract("name"); // Get all values as array
  const firstPerson = people.extractHead("name", 1); // Get first value (single)
  const firstTwoNames = people.extractHead("name", 2); // Get first 2 values (array)
  const lastPerson = people.extractTail("name", 1); // Get last value (single)
  const lastTwoNames = people.extractTail("name", 2); // Get last 2 values (array)
  const thirdPerson = people.extractNth("name", 2); // Get value at index 2
  const randomSample = people.extractSample("name", 2); // Get 2 random values

  // ForEach operations - iterate over rows with side effects
  const processedNames: string[] = [];
  people.forEachRow((row, index) => {
    processedNames.push(`${index}: ${row.name} (${row.species})`);
  });

  console.log("All names:", allNames);
  console.log("First person:", firstPerson);
  console.log("First two names:", firstTwoNames);
  console.log("Last person:", lastPerson);
  console.log("Last two names:", lastTwoNames);
  console.log("Third person:", thirdPerson);
  console.log("Random sample:", randomSample);
  console.log("Processed names:", processedNames);

  return {
    allNames,
    firstPerson,
    firstTwoNames,
    lastPerson,
    lastTwoNames,
    thirdPerson,
    randomSample,
    processedNames,
  };
}

Deno.test("Utility Verbs Documentation", () => {
  const results = utilityExample();

  // Test extract operations
  expect(Array.isArray(results.allNames)).toBe(true);
  expect(results.allNames).toHaveLength(3);
  expect(results.allNames).toEqual(["Luke", "C-3PO", "R2-D2"]);

  expect(typeof results.firstPerson).toBe("string");
  expect(results.firstPerson).toBe("Luke");

  expect(Array.isArray(results.firstTwoNames)).toBe(true);
  expect(results.firstTwoNames).toHaveLength(2);
  expect(results.firstTwoNames).toEqual(["Luke", "C-3PO"]);

  expect(typeof results.lastPerson).toBe("string");
  expect(results.lastPerson).toBe("R2-D2");

  expect(Array.isArray(results.lastTwoNames)).toBe(true);
  expect(results.lastTwoNames).toHaveLength(2);
  expect(results.lastTwoNames).toEqual(["C-3PO", "R2-D2"]);

  expect(typeof results.thirdPerson).toBe("string");
  expect(results.thirdPerson).toBe("R2-D2");

  expect(Array.isArray(results.randomSample)).toBe(true);
  expect(results.randomSample).toHaveLength(2);

  // Test forEach operations
  expect(Array.isArray(results.processedNames)).toBe(true);
  expect(results.processedNames).toHaveLength(3);
  expect(results.processedNames).toEqual([
    "0: Luke (Human)",
    "1: C-3PO (Droid)",
    "2: R2-D2 (Droid)",
  ]);
});
