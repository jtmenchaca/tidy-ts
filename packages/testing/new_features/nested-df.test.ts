import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

Deno.test("Nested DataFrame - basic nested structure", () => {
  const nested = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
  ]);

  const df = createDataFrame([
    { id: 1, nested },
    { id: 2, nested },
  ]);

  const dfJSON = df.toJSON();
  const parsed = JSON.parse(dfJSON);

  console.log(dfJSON);

  // Should have 2 rows
  expect(parsed.length).toBe(2);

  // Each row should have nested as an array, not an object
  expect(Array.isArray(parsed[0].nested)).toBe(true);
  expect(Array.isArray(parsed[1].nested)).toBe(true);

  // Nested array should have 2 rows
  expect(parsed[0].nested.length).toBe(2);
  expect(parsed[1].nested.length).toBe(2);

  // Check nested content
  expect(parsed[0].nested[0]).toEqual({ id: 1, name: "Alice", age: 25 });
  expect(parsed[0].nested[1]).toEqual({ id: 2, name: "Bob", age: 30 });

  // Both rows should have the same nested data
  expect(parsed[0].nested).toEqual(parsed[1].nested);
});

Deno.test("Nested DataFrame - different nested DataFrames per row", () => {
  const nested1 = createDataFrame([
    { value: 10 },
    { value: 20 },
  ]);

  const nested2 = createDataFrame([
    { value: 30 },
    { value: 40 },
    { value: 50 },
  ]);

  const df = createDataFrame([
    { id: 1, data: nested1 },
    { id: 2, data: nested2 },
  ]);

  const dfJSON = df.toJSON();
  const parsed = JSON.parse(dfJSON);

  expect(parsed.length).toBe(2);

  // First row has 2 nested items
  expect(parsed[0].data.length).toBe(2);
  expect(parsed[0].data[0]).toEqual({ value: 10 });
  expect(parsed[0].data[1]).toEqual({ value: 20 });

  // Second row has 3 nested items
  expect(parsed[1].data.length).toBe(3);
  expect(parsed[1].data[0]).toEqual({ value: 30 });
  expect(parsed[1].data[1]).toEqual({ value: 40 });
  expect(parsed[1].data[2]).toEqual({ value: 50 });
});

Deno.test("Nested DataFrame - deeply nested DataFrames", () => {
  const deeplyNested = createDataFrame([
    { x: 1 },
    { x: 2 },
  ]);

  const middleNested = createDataFrame([
    { y: 10, deep: deeplyNested },
    { y: 20, deep: deeplyNested },
  ]);

  const df = createDataFrame([
    { id: 1, middle: middleNested },
  ]);

  const dfJSON = df.toJSON();
  const parsed = JSON.parse(dfJSON);

  expect(parsed.length).toBe(1);
  expect(Array.isArray(parsed[0].middle)).toBe(true);
  expect(parsed[0].middle.length).toBe(2);

  // Check middle level
  expect(parsed[0].middle[0].y).toBe(10);
  expect(Array.isArray(parsed[0].middle[0].deep)).toBe(true);

  // Check deep level
  expect(parsed[0].middle[0].deep.length).toBe(2);
  expect(parsed[0].middle[0].deep[0]).toEqual({ x: 1 });
  expect(parsed[0].middle[0].deep[1]).toEqual({ x: 2 });
});

Deno.test("Nested DataFrame - empty nested DataFrame", () => {
  const emptyNested = createDataFrame([], {
    schema: z.object({ value: z.number() }),
  });

  const df = createDataFrame([
    { id: 1, data: emptyNested },
  ]);

  const dfJSON = df.toJSON();
  const parsed = JSON.parse(dfJSON);

  expect(parsed.length).toBe(1);
  expect(Array.isArray(parsed[0].data)).toBe(true);
  expect(parsed[0].data.length).toBe(0);
});
