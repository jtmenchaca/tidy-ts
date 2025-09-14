import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("distinct - remove exact duplicates", () => {
  const data = createDataFrame([
    { name: "Alice", age: 25, city: "NYC", score: 85 },
    { name: "Bob", age: 30, city: "LA", score: 90 },
    { name: "Alice", age: 25, city: "NYC", score: 85 }, // Exact duplicate
    { name: "Charlie", age: 25, city: "NYC", score: 88 },
    { name: "Bob", age: 30, city: "LA", score: 92 }, // Different score - NOT duplicate
    { name: "Alice", age: 26, city: "NYC", score: 85 }, // Different age - NOT duplicate
  ]);

  const result = data.distinct();
  expect(result.nrows()).toBe(5); // 6 original - 1 exact duplicate = 5

  // Should remove the exact duplicate of Alice (25, NYC, 85)
  const rows = [...result];
  const aliceRows = rows.filter((r) => r.name === "Alice");
  expect(aliceRows).toHaveLength(2); // Alice(25) and Alice(26)
});

Deno.test("distinct - empty dataframe", () => {
  const empty = createDataFrame([] as { name: string; age: number }[]);
  const result = empty.distinct();
  expect(result.nrows()).toBe(0);
});

Deno.test("distinct - no duplicates", () => {
  const data = createDataFrame([
    { id: 1, value: "a" },
    { id: 2, value: "b" },
    { id: 3, value: "c" },
  ]);

  const result = data.distinct();
  expect(result.nrows()).toBe(3); // No change
});

Deno.test("distinct - all duplicates", () => {
  const data = createDataFrame([
    { name: "Alice", age: 25 },
    { name: "Alice", age: 25 }, // Duplicate
    { name: "Alice", age: 25 }, // Duplicate
    { name: "Alice", age: 25 }, // Duplicate
  ]);

  const result = data.distinct();
  expect(result.nrows()).toBe(1); // Only one unique row
  expect(result[0].name).toBe("Alice");
  expect(result[0].age).toBe(25);
});

Deno.test("distinct - preserves first occurrence", () => {
  const data = createDataFrame([
    { id: 1, extra: "same" },
    { id: 2, extra: "unique" },
    { id: 1, extra: "same" }, // Exact duplicate
  ]);

  const result = data.distinct();
  expect(result.nrows()).toBe(2); // Remove the exact duplicate

  // Should keep the first occurrence of the duplicated row
  const rows = [...result];
  const duplicatedRows = rows.filter((r) => r.id === 1);
  expect(duplicatedRows).toHaveLength(1);
  expect(duplicatedRows[0].extra).toBe("same");
});

Deno.test("distinct - handles null and undefined", () => {
  const data = createDataFrame([
    { id: 1, value: null },
    { id: 2, value: undefined },
    { id: 1, value: null }, // Duplicate
    { id: 3, value: "test" },
  ]);

  const result = data.distinct();
  expect(result.nrows()).toBe(3); // null, undefined, and "test" are all distinct
});

Deno.test("distinct - grouped data", () => {
  const data = createDataFrame([
    { city: "NYC", name: "Alice", age: 25 },
    { city: "NYC", name: "Bob", age: 30 },
    { city: "NYC", name: "Alice", age: 25 }, // Duplicate within NYC
    { city: "LA", name: "Alice", age: 25 }, // Same as NYC Alice, but different group
    { city: "LA", name: "Charlie", age: 35 },
  ]);

  const grouped = data.groupBy("city");
  const result = grouped.distinct();

  expect(result.nrows()).toBe(4); // 5 original - 1 duplicate within NYC = 4

  // Should preserve grouping
  expect(result.__groups).toBeDefined();
  expect(result.__groups?.groupingColumns).toEqual(["city"]);
});

Deno.test("distinct - mixed data types", () => {
  const data = createDataFrame([
    { id: 1, value: "10" }, // String
    { id: 2, value: 10 }, // Number
    { id: 3, value: true }, // Boolean
    { id: 1, value: "10" }, // Duplicate
    { id: 4, value: null }, // null
    { id: 5, value: undefined }, // undefined
  ]);

  const result = data.distinct();
  expect(result.nrows()).toBe(5); // String "10" ≠ Number 10 ≠ Boolean true ≠ null ≠ undefined
});

Deno.test("distinct - object values", () => {
  const data = createDataFrame([
    { id: 1, config: { x: 1, y: 2 } },
    { id: 2, config: { y: 2, x: 1 } }, // Same values, different key order
    { id: 1, config: { x: 1, y: 2 } }, // Exact duplicate
    { id: 3, config: { x: 3, y: 4 } },
  ]);

  const result = data.distinct();
  // Objects with same structure but different key order should be treated as distinct
  // Only the exact duplicate (id: 1, config: {x: 1, y: 2}) should be removed
  expect(result.nrows()).toBe(3);
});
