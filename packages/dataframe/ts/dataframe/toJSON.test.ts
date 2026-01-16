import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("toJSON() - basic DataFrame", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
  ]);

  const json = df.toJSON();
  const parsed = JSON.parse(json);

  expect(parsed).toEqual([
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
  ]);
});

Deno.test("toJSON() - with formatting", () => {
  const df = createDataFrame([
    { id: 1, value: 100 },
  ]);

  const json = df.toJSON({ space: 2 });

  // Should be formatted with 2 spaces
  expect(json).toContain("\n");
  expect(json).toContain("  ");

  const parsed = JSON.parse(json);
  expect(parsed).toEqual([{ id: 1, value: 100 }]);
});

Deno.test("toJSON() - nested DataFrame", () => {
  const nested = createDataFrame([
    { x: 1, y: 10 },
    { x: 2, y: 20 },
  ]);

  const df = createDataFrame([
    { id: 1, data: nested },
    { id: 2, data: nested },
  ]);

  const json = df.toJSON();
  const parsed = JSON.parse(json);

  expect(parsed.length).toBe(2);
  expect(Array.isArray(parsed[0].data)).toBe(true);
  expect(parsed[0].data).toEqual([
    { x: 1, y: 10 },
    { x: 2, y: 20 },
  ]);
});

Deno.test("toJSON() - empty DataFrame", () => {
  const df = createDataFrame([]);

  const json = df.toJSON();
  const parsed = JSON.parse(json);

  expect(parsed).toEqual([]);
});

Deno.test("toJSON() - single row", () => {
  const df = createDataFrame([
    { name: "Alice" },
  ]);

  const json = df.toJSON();
  const parsed = JSON.parse(json);

  expect(parsed).toEqual([{ name: "Alice" }]);
});

Deno.test("toJSON() - deeply nested DataFrames", () => {
  const deeplyNested = createDataFrame([
    { value: 1 },
    { value: 2 },
  ]);

  const middleNested = createDataFrame([
    { level: 1, deep: deeplyNested },
  ]);

  const df = createDataFrame([
    { id: 1, middle: middleNested },
  ]);

  const json = df.toJSON();
  const parsed = JSON.parse(json);

  expect(parsed[0].middle[0].deep).toEqual([
    { value: 1 },
    { value: 2 },
  ]);
});

Deno.test("toJSON() - after operations", () => {
  const df = createDataFrame([
    { category: "A", value: 10 },
    { category: "B", value: 20 },
    { category: "A", value: 30 },
  ]);

  const filtered = df.filter((row) => row.category === "A");
  const json = filtered.toJSON();
  const parsed = JSON.parse(json);

  expect(parsed).toEqual([
    { category: "A", value: 10 },
    { category: "A", value: 30 },
  ]);
});
