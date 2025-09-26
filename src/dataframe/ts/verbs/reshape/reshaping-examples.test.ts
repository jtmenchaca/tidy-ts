// Reshaping Verbs Examples - Compiler-tested examples for pivot and bind operations
import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

/**
 * PivotWider Verb Documentation
 *
 * Transform data from long to wide format by spreading values across columns
 *
 * @example
 * ```typescript
 * const sales = createDataFrame([
 *   { product: "A", quarter: "Q1", revenue: 100 },
 *   { product: "A", quarter: "Q2", revenue: 150 },
 *   { product: "B", quarter: "Q1", revenue: 200 },
 * ]);
 *
 * const wide = sales.pivotWider({
 *   namesFrom: "quarter",
 *   valuesFrom: "revenue",
 *   expectedColumns: ["Q1", "Q2"],
 * });
 *
 * console.table(wide);
 * ```
 */
function pivotWiderExample() {
  const sales = createDataFrame([
    { product: "A", quarter: "Q1", revenue: 100 },
    { product: "A", quarter: "Q2", revenue: 150 },
    { product: "B", quarter: "Q1", revenue: 200 },
    { product: "B", quarter: "Q2", revenue: 250 },
  ]);

  const wide = sales.pivotWider({
    namesFrom: "quarter",
    valuesFrom: "revenue",
    expectedColumns: ["Q1", "Q2"],
  });

  console.table(wide);

  return { wide };
}

/**
 * PivotLonger Verb Documentation
 *
 * Transform data from wide to long format by gathering columns into rows
 *
 * @example
 * ```typescript
 * const wide = createDataFrame([
 *   { product: "A", Q1: 100, Q2: 150, Q3: 200 },
 *   { product: "B", Q1: 200, Q2: 250, Q3: 300 },
 * ]);
 *
 * const long = wide.pivotLonger({
 *   cols: ["Q1", "Q2", "Q3"] as const,
 *   namesTo: "quarter",
 *   valuesTo: "revenue",
 * });
 *
 * console.table(long);
 * ```
 */
function pivotLongerExample() {
  const wide = createDataFrame([
    { product: "A", Q1: 100, Q2: 150, Q3: 200 },
    { product: "B", Q1: 200, Q2: 250, Q3: 300 },
  ]);

  const long = wide.pivotLonger({
    cols: ["Q1", "Q2", "Q3"] as const,
    namesTo: "quarter",
    valuesTo: "revenue",
  });

  console.table(long);

  return { long };
}

/**
 * BindRows Verb Documentation
 *
 * Combine DataFrames vertically by stacking rows
 *
 * @example
 * ```typescript
 * const df1 = createDataFrame([
 *   { id: 1, name: "Alice", age: 25 },
 *   { id: 2, name: "Bob", age: 30 },
 * ]);
 *
 * const df2 = createDataFrame([
 *   { id: 3, name: "Charlie", age: 35 },
 *   { id: 4, name: "Diana", age: 28 },
 * ]);
 *
 * const combined = df1.bindRows(df2);
 *
 * console.table(combined);
 * ```
 */
function bindRowsExample() {
  const df1 = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
  ]);

  const df2 = createDataFrame([
    { id: 3, name: "Charlie", age: 35 },
    { id: 4, name: "Diana", age: 28 },
  ]);

  const combined = df1.bindRows(df2);

  console.table(combined);

  return { combined };
}

/**
 * Append Verb Documentation
 *
 * Add rows to the end of a DataFrame
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Alice", age: 25 },
 *   { id: 2, name: "Bob", age: 30 },
 * ]);
 *
 * const newPerson = { id: 3, name: "Charlie", age: 35 }
 *
 * const appended = people.append(newPerson);
 *
 * console.table(appended);
 * ```
 */

Deno.test("Append Verb Documentation", () => {
  const people = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
  ]);

  // Add single row
  const newPerson = { id: 3, name: "Charlie", age: 35 };

  const appended = people.append(newPerson);

  // Add array of rows
  const appended2 = people.append([
    { id: 3, name: "Charlie", age: 35 },
    { id: 4, name: "Diana", age: 28 },
  ]);

  console.table(appended);
  console.table(appended2);
});

/**
 * Prepend Verb Documentation
 *
 * Add rows to the beginning of a DataFrame
 *
 * @example
 * ```typescript
 * const people = createDataFrame([
 *   { id: 2, name: "Bob", age: 30 },
 *   { id: 3, name: "Charlie", age: 35 },
 * ]);
 *
 * const newPerson = createDataFrame([
 *   { id: 1, name: "Alice", age: 25 },
 * ]);
 *
 * const prepended = people.prepend(newPerson);
 *
 * console.table(prepended);
 * ```
 */
Deno.test("Prepend Verb Documentation", () => {
  const people = createDataFrame([
    { id: 2, name: "Bob", age: 30 },
    { id: 3, name: "Charlie", age: 35 },
  ]);

  const newPerson = { id: 1, name: "Alice", age: 25 };
  const prepended = people.prepend(newPerson);

  console.table(prepended);
});

Deno.test("PivotWider Verb Documentation", () => {
  const results = pivotWiderExample();

  expect(results.wide.nrows()).toBe(2); // Two products
  expect(results.wide.columns()).toContain("product");
  expect(results.wide.columns()).toContain("Q1");
  expect(results.wide.columns()).toContain("Q2");
  expect(results.wide.extract("product")).toEqual(["A", "B"]);
});

Deno.test("PivotLonger Verb Documentation", () => {
  const results = pivotLongerExample();

  expect(results.long.nrows()).toBe(6); // 2 products × 3 quarters
  expect(results.long.columns()).toContain("product");
  expect(results.long.columns()).toContain("quarter");
  expect(results.long.columns()).toContain("revenue");
  expect(results.long.extract("quarter")).toEqual([
    "Q1",
    "Q2",
    "Q3",
    "Q1",
    "Q2",
    "Q3",
  ]);
});

Deno.test("BindRows Verb Documentation", () => {
  const results = bindRowsExample();

  expect(results.combined.nrows()).toBe(4); // 2 + 2 rows
  expect(results.combined.columns()).toContain("id");
  expect(results.combined.columns()).toContain("name");
  expect(results.combined.columns()).toContain("age");
  expect(results.combined.extract("name")).toEqual([
    "Alice",
    "Bob",
    "Charlie",
    "Diana",
  ]);
});

Deno.test("Append Verb Documentation", () => {
  const people = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
  ]);
  const newPerson = { id: 3, name: "Charlie", age: 35 };
  const appended = people.append(newPerson);
  expect(appended.nrows()).toBe(3); // 2 + 1 rows
  expect(appended.extract("name")).toEqual(["Alice", "Bob", "Charlie"]);
  expect(appended.extract("id")).toEqual([1, 2, 3]);
});

Deno.test("Prepend Verb Documentation", () => {
  const people = createDataFrame([
    { id: 2, name: "Bob", age: 30 },
    { id: 3, name: "Charlie", age: 35 },
  ]);
  const newPerson = { id: 1, name: "Alice", age: 25 };
  const prepended = people.prepend(newPerson);

  expect(prepended.nrows()).toBe(3); // 1 + 2 rows
  expect(prepended.extract("name")).toEqual(["Alice", "Bob", "Charlie"]);
  expect(prepended.extract("id")).toEqual([1, 2, 3]);
});
