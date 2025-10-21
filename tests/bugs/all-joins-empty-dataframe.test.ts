/**
 * Test all join types with empty DataFrames to ensure column schema is preserved
 */

import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("leftJoin - empty right DataFrame preserves columns", () => {
  const left = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const right = createDataFrame({
    columns: {
      id: [] as number[],
      value: [] as string[],
    },
  });

  const result = left.leftJoin(right, "id");

  expect(result.columns()).toContain("value");
  expect(result.nrows()).toBe(2);
  expect(result.at(0)?.value).toBe(undefined);
});

Deno.test("rightJoin - empty right DataFrame preserves columns", () => {
  const left = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const right = createDataFrame({
    columns: {
      id: [] as number[],
      value: [] as string[],
    },
  });

  const result = left.rightJoin(right, "id");

  expect(result.columns()).toContain("value");
  expect(result.nrows()).toBe(0); // Right join with empty right = 0 rows
});

Deno.test("innerJoin - empty right DataFrame preserves columns", () => {
  const left = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const right = createDataFrame({
    columns: {
      id: [] as number[],
      value: [] as string[],
    },
  });

  const result = left.innerJoin(right, "id");

  // Inner join with empty right = 0 rows
  expect(result.nrows()).toBe(0);
  // But should still have the schema
  expect(result.columns()).toContain("value");
});

Deno.test("outerJoin - empty right DataFrame preserves columns", () => {
  const left = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const right = createDataFrame({
    columns: {
      id: [] as number[],
      value: [] as string[],
    },
  });

  const result = left.outerJoin(right, "id");

  expect(result.columns()).toContain("value");
  expect(result.nrows()).toBe(2); // All left rows preserved
  expect(result.at(0)?.value).toBe(undefined);
});

Deno.test("leftJoin - empty left DataFrame preserves columns", () => {
  const left = createDataFrame({
    columns: {
      id: [] as number[],
      name: [] as string[],
    },
  });

  const right = createDataFrame([
    { id: 1, value: "A" },
    { id: 2, value: "B" },
  ]);

  const result = left.leftJoin(right, "id");

  expect(result.columns()).toContain("name");
  expect(result.columns()).toContain("value");
  expect(result.nrows()).toBe(0); // Left is empty
});

Deno.test("rightJoin - empty left DataFrame preserves columns", () => {
  const left = createDataFrame({
    columns: {
      id: [] as number[],
      name: [] as string[],
    },
  });

  const right = createDataFrame([
    { id: 1, value: "A" },
    { id: 2, value: "B" },
  ]);

  const result = left.rightJoin(right, "id");

  expect(result.columns()).toContain("name");
  expect(result.columns()).toContain("value");
  expect(result.nrows()).toBe(2); // All right rows preserved
  expect(result.at(0)?.name).toBe(undefined);
});

Deno.test("outerJoin - both empty DataFrames preserve columns", () => {
  const left = createDataFrame({
    columns: {
      id: [] as number[],
      name: [] as string[],
    },
  });

  const right = createDataFrame({
    columns: {
      id: [] as number[],
      value: [] as string[],
    },
  });

  const result = left.outerJoin(right, "id");

  expect(result.columns()).toContain("name");
  expect(result.columns()).toContain("value");
  expect(result.nrows()).toBe(0);
});
