/**
 * Tests for replaceNA verb - replacing null/undefined values with defaults
 */

import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("replaceNA - basic functionality", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", age: 25, score: 85 },
    { id: 2, name: null, age: 30, score: null },
    { id: 3, name: "Charlie", age: null, score: 92 },
    { id: 4, name: "David", age: 28, score: null },
  ]);

  const cleaned = df.replaceNA({
    name: "Unknown",
    age: 0,
    score: -1,
  });

  expect(cleaned.nrows()).toBe(4);
  expect(cleaned[0].name).toBe("Alice"); // unchanged
  expect(cleaned[0].age).toBe(25); // unchanged
  expect(cleaned[0].score).toBe(85); // unchanged

  expect(cleaned[1].name).toBe("Unknown"); // null replaced
  expect(cleaned[1].age).toBe(30); // unchanged
  expect(cleaned[1].score).toBe(-1); // null replaced

  expect(cleaned[2].name).toBe("Charlie"); // unchanged
  expect(cleaned[2].age).toBe(0); // null replaced
  expect(cleaned[2].score).toBe(92); // unchanged

  expect(cleaned[3].name).toBe("David"); // unchanged
  expect(cleaned[3].age).toBe(28); // unchanged
  expect(cleaned[3].score).toBe(-1); // null replaced
});

Deno.test("replaceNA - partial replacement", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", age: 25, score: null },
    { id: 2, name: null, age: 30, score: 90 },
    { id: 3, name: "Charlie", age: null, score: null },
  ]);

  // Only replace name, leave age and score as-is
  const cleaned = df.replaceNA({
    name: "Missing",
  });

  expect(cleaned.nrows()).toBe(3);
  expect(cleaned[0].name).toBe("Alice"); // unchanged
  expect(cleaned[0].age).toBe(25); // unchanged
  expect(cleaned[0].score).toBe(null); // unchanged (not in mapping)

  expect(cleaned[1].name).toBe("Missing"); // null replaced
  expect(cleaned[1].age).toBe(30); // unchanged
  expect(cleaned[1].score).toBe(90); // unchanged

  expect(cleaned[2].name).toBe("Charlie"); // unchanged
  expect(cleaned[2].age).toBe(null); // unchanged (not in mapping)
  expect(cleaned[2].score).toBe(null); // unchanged (not in mapping)
});

Deno.test("replaceNA - preserves falsy values", () => {
  const df = createDataFrame([
    { id: 1, name: "", age: 0, score: false, active: null },
    { id: 2, name: null, age: null, score: null, active: null },
  ]);

  const cleaned = df.replaceNA({
    name: "Unknown",
    age: -1,
    score: true,
  });

  expect(cleaned.nrows()).toBe(2);

  // First row - falsy values should be preserved
  expect(cleaned[0].name).toBe(""); // empty string preserved
  expect(cleaned[0].age).toBe(0); // zero preserved
  expect(cleaned[0].score).toBe(false); // false preserved
  expect(cleaned[0].active).toBe(null); // null preserved (no replacement specified)

  // Second row - null values should be replaced
  expect(cleaned[1].name).toBe("Unknown"); // null replaced
  expect(cleaned[1].age).toBe(-1); // null replaced
  expect(cleaned[1].score).toBe(true); // null replaced
  expect(cleaned[1].active).toBe(null); // null preserved (no replacement specified)
});

Deno.test("replaceNA - different data types", () => {
  const df = createDataFrame([
    { id: 1, text: null, number: null, flag: null, date: null },
    {
      id: 2,
      text: "test",
      number: 42,
      flag: true,
      date: new Date("2023-01-01"),
    },
  ]);

  const cleaned = df.replaceNA({
    text: "default",
    number: 0,
    flag: false,
    date: new Date("1900-01-01"),
  });

  expect(cleaned.nrows()).toBe(2);

  // First row - all nulls replaced
  expect(cleaned[0].text).toBe("default");
  expect(cleaned[0].number).toBe(0);
  expect(cleaned[0].flag).toBe(false);
  expect(cleaned[0].date).toEqual(new Date("1900-01-01"));

  // Second row - all unchanged
  expect(cleaned[1].text).toBe("test");
  expect(cleaned[1].number).toBe(42);
  expect(cleaned[1].flag).toBe(true);
  expect(cleaned[1].date).toEqual(new Date("2023-01-01"));
});

Deno.test("replaceNA - empty mapping", () => {
  const df = createDataFrame([
    { id: 1, name: null, age: null },
    { id: 2, name: "Alice", age: 25 },
  ]);

  const cleaned = df.replaceNA({});

  expect(cleaned.nrows()).toBe(2);
  expect(cleaned[0].name).toBe(null); // unchanged
  expect(cleaned[0].age).toBe(null); // unchanged
  expect(cleaned[1].name).toBe("Alice"); // unchanged
  expect(cleaned[1].age).toBe(25); // unchanged
});

Deno.test("replaceNA - chaining with other operations", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", age: 25, score: null },
    { id: 2, name: null, age: 30, score: 90 },
    { id: 3, name: "Charlie", age: null, score: null },
  ]);

  const result = df
    .replaceNA({ name: "Unknown", age: 0, score: -1 })
    .filter((row) => row.age > 0)
    .select("name", "age");

  expect(result.nrows()).toBe(2);
  expect(result[0].name).toBe("Alice");
  expect(result[0].age).toBe(25);
  expect(result[1].name).toBe("Unknown");
  expect(result[1].age).toBe(30);
});
