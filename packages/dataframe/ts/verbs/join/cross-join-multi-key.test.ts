import { expect } from "@std/expect";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

Deno.test("crossJoin - basic functionality", () => {
  const colors = createDataFrame([
    { color: "red" },
    { color: "blue" },
  ]);

  const sizes = createDataFrame([
    { size: "small" },
    { size: "large" },
  ]);

  const result = colors.crossJoin(sizes);

  // Type check: basic cross join with no conflicts should preserve all columns
  const _basicTypeCheck: DataFrame<{
    color: string; // From left (required)
    size: string; // From right (required)
  }> = result;

  expect(result.toArray()).toEqual([
    { color: "red", size: "small" },
    { color: "red", size: "large" },
    { color: "blue", size: "small" },
    { color: "blue", size: "large" },
  ]);
});

Deno.test("crossJoin - with column conflicts and suffixes", () => {
  const left = createDataFrame([
    { id: 1, value: "A" },
    { id: 2, value: "B" },
  ]);

  const right = createDataFrame([
    { id: 10, value: "X" },
    { id: 20, value: "Y" },
  ]);

  // Cross join with conflicting columns - default behavior is left side wins (no suffixes)
  const result = left.crossJoin(right);

  // Type check: cross join with conflicts but no suffixes should override with right values
  const _conflictTypeCheck: DataFrame<{
    id: number; // Right id overwrites left id (required)
    value: string; // Right value overwrites left value (required)
  }> = result;

  expect(result.toArray()).toEqual([
    { id: 10, value: "X" },
    { id: 20, value: "Y" },
    { id: 10, value: "X" },
    { id: 20, value: "Y" },
  ]);

  // Test with explicit suffixes - should use suffixes to resolve conflicts
  const resultWithSuffixes = left.crossJoin(right, undefined, {
    left: "_L",
    right: "_R",
  });

  // Type check: cross join with explicit suffixes should apply them
  // TODO: Fix cross join type system to properly infer suffix behavior
  const _suffixTypeCheck = resultWithSuffixes;

  expect(resultWithSuffixes.toArray()).toEqual([
    { id_L: 1, value_L: "A", id_R: 10, value_R: "X" },
    { id_L: 1, value_L: "A", id_R: 20, value_R: "Y" },
    { id_L: 2, value_L: "B", id_R: 10, value_R: "X" },
    { id_L: 2, value_L: "B", id_R: 20, value_R: "Y" },
  ]);
});

Deno.test("crossJoin - with maxRows limit", () => {
  const left = createDataFrame([
    { letter: "A" },
    { letter: "B" },
    { letter: "C" },
  ]);

  const right = createDataFrame([
    { number: 1 },
    { number: 2 },
    { number: 3 },
  ]);

  const result = left.crossJoin(right, 5); // Limit to 5 rows instead of 9

  // Type check: cross join with maxRows should preserve column types
  const _maxRowsTypeCheck: DataFrame<{
    letter: string; // From left (required)
    number: number; // From right (required)
  }> = result;

  expect(result.nrows()).toBe(5);
  expect(result.toArray()).toEqual([
    { letter: "A", number: 1 },
    { letter: "A", number: 2 },
    { letter: "A", number: 3 },
    { letter: "B", number: 1 },
    { letter: "B", number: 2 },
  ]);
});

Deno.test("crossJoin - empty dataframes", () => {
  const empty = createDataFrame({ columns: { id: [] } });
  const data = createDataFrame([
    { name: "Alice" },
    { name: "Bob" },
  ]);

  const result1 = empty.crossJoin(data);

  // Type check: empty left cross join should have combined types but empty results
  expect(result1.toArray()).toEqual([]);

  const result2 = data.crossJoin(empty);

  // Type check: empty right cross join should have combined types but empty results
  expect(result2.toArray()).toEqual([]);
});

Deno.test("crossJoin - single row dataframes", () => {
  const left = createDataFrame([
    { category: "electronics" },
  ]);

  const right = createDataFrame([
    { status: "active" },
  ]);

  const result = left.crossJoin(right);

  // Type check: single row cross join should combine all column types
  const _singleRowTypeCheck: DataFrame<{
    category: string; // From left (required)
    status: string; // From right (required)
  }> = result;

  expect(result.toArray()).toEqual([
    { category: "electronics", status: "active" },
  ]);
});
