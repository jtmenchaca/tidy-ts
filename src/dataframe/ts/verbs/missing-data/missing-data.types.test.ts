/**
 * Type tests for missing-data verbs
 */

import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("replaceNA - type preservation", () => {
  interface Person {
    id: number;
    name: string | null;
    age: number | null;
    score: number | null;
  }

  const testData: Person[] = [
    { id: 1, name: "Alice", age: 25, score: 85 },
    { id: 2, name: null, age: 30, score: null },
  ];

  const df = createDataFrame(testData);

  const cleaned = df.replaceNA({
    name: "Unknown",
    age: 0,
    score: -1,
  });

  // Type should be preserved
  expect(cleaned.nrows()).toBe(2);
  expect(typeof cleaned[0].id).toBe("number");
  expect(typeof cleaned[0].name).toBe("string");
  expect(typeof cleaned[0].age).toBe("number");
  expect(typeof cleaned[0].score).toBe("number");
});

Deno.test("removeRowsWithNA - type preservation", () => {
  interface Employee {
    id: number;
    name: string;
    department: string | null;
    salary: number;
  }

  const _df = createDataFrame([
    { id: 1, name: "Alice", department: "Engineering", salary: 90000 },
    { id: 2, name: "Bob", department: null, salary: 85000 },
    { id: 3, name: "Charlie", department: "Marketing", salary: 80000 },
  ]);
});

Deno.test("chaining - type flow through operations", () => {
  interface Data {
    id: number;
    name: string | null;
    value: number | null;
    category: string | null;
  }

  const df = createDataFrame([
    { id: 1, name: "Alice", value: 100, category: "A" },
    { id: 2, name: null, value: 200, category: "B" },
    { id: 3, name: "Charlie", value: null, category: "A" },
    { id: 4, name: "David", value: 400, category: null },
  ]);

  const result = df
    .replaceNA({ value: 0, category: "Unknown" })
    .filter((row) => row.category === "A")
    .select("name", "value");

  // Type should be preserved through the chain
  expect(result.nrows()).toBe(2);
  expect(typeof result[0].name).toBe("string");
  expect(typeof result[0].value).toBe("number");
  expect(typeof result[1].name).toBe("string");
  expect(typeof result[1].value).toBe("number");
});
