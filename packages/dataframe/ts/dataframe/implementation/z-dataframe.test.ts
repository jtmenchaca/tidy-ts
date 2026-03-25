import { expect } from "@std/expect";
import { z } from "zod";
import { createDataFrame } from "@tidy-ts/dataframe";
import { zDataFrame } from "./z-dataframe.ts";

Deno.test("zDataFrame - parse columnar data into DataFrame", () => {
  const Schema = zDataFrame({ x: z.number(), y: z.number() });

  const df = Schema.parse({ x: [1, 2], y: [10, 20] });

  expect(df.nrows()).toBe(2);
  expect(df.ncols()).toBe(2);
  expect(df[0].x).toBe(1);
  expect(df[1].y).toBe(20);
  expect(df.columns()).toEqual(["x", "y"]);
});

Deno.test("zDataFrame - passthrough existing DataFrame", () => {
  const Schema = zDataFrame({ x: z.number(), y: z.number() });

  const existing = createDataFrame({ columns: { x: [1, 2], y: [10, 20] } });
  const df = Schema.parse(existing);

  expect(df.nrows()).toBe(2);
  expect(df[0].x).toBe(1);
  expect(df).toBe(existing);
});

Deno.test("zDataFrame - rejects non-array column values", () => {
  const Schema = zDataFrame({ x: z.number(), y: z.string() });

  expect(() => Schema.parse({ x: 1, y: "a" })).toThrow();
});

Deno.test("zDataFrame - rejects wrong element types", () => {
  const Schema = zDataFrame({ x: z.number(), y: z.string() });

  expect(() => Schema.parse({ x: [1, 2], y: [10, 20] })).toThrow();
});

Deno.test("zDataFrame - rejects missing columns", () => {
  const Schema = zDataFrame({ x: z.number(), y: z.string() });

  expect(() => Schema.parse({ x: [1, 2] })).toThrow();
});

Deno.test("zDataFrame - works with string columns", () => {
  const Schema = zDataFrame({ name: z.string(), age: z.number() });

  const df = Schema.parse({ name: ["Alice", "Bob"], age: [30, 25] });

  expect(df.nrows()).toBe(2);
  expect(df[0].name).toBe("Alice");
  expect(df[1].age).toBe(25);
});

Deno.test("zDataFrame - nested DataFrame column", () => {
  const InnerSchema = zDataFrame({ x: z.number() });
  const OuterSchema = zDataFrame({ id: z.number(), data: InnerSchema });

  const result = OuterSchema.parse({
    id: [1, 2],
    data: [
      { x: [10, 20] },
      { x: [30] },
    ],
  });

  expect(result.nrows()).toBe(2);
  expect(result[0].id).toBe(1);
  expect(result[0].data.nrows()).toBe(2);
  expect(result[1].data.nrows()).toBe(1);
  expect(result[0].data[0].x).toBe(10);
});

Deno.test("zDataFrame - nested passthrough with existing DataFrame", () => {
  const InnerSchema = zDataFrame({ x: z.number() });
  const OuterSchema = zDataFrame({ id: z.number(), data: InnerSchema });

  const inner = createDataFrame({ columns: { x: [1, 2] } });
  const result = OuterSchema.parse({
    id: [1],
    data: [inner],
  });

  expect(result.nrows()).toBe(1);
  expect(result[0].data).toBe(inner);
  expect(result[0].data.nrows()).toBe(2);
});

Deno.test("zDataFrame - empty arrays produce empty DataFrame", () => {
  const Schema = zDataFrame({ x: z.number(), y: z.string() });

  const df = Schema.parse({ x: [], y: [] });

  expect(df.nrows()).toBe(0);
  expect(df.columns()).toEqual(["x", "y"]);
});

Deno.test("zDataFrame - works with boolean columns", () => {
  const Schema = zDataFrame({ flag: z.boolean(), value: z.number() });

  const df = Schema.parse({ flag: [true, false], value: [1, 0] });

  expect(df.nrows()).toBe(2);
  expect(df[0].flag).toBe(true);
  expect(df[1].flag).toBe(false);
});

Deno.test("zDataFrame - coercion via z.coerce", () => {
  const Schema = zDataFrame({ x: z.coerce.number() });

  const df = Schema.parse({ x: ["1", "2", "3"] });

  expect(df.nrows()).toBe(3);
  expect(df[0].x).toBe(1);
  expect(df[2].x).toBe(3);
});

Deno.test("zDataFrame - rejects completely invalid input", () => {
  const Schema = zDataFrame({ x: z.number() });

  expect(() => Schema.parse(null)).toThrow();
  expect(() => Schema.parse(42)).toThrow();
  expect(() => Schema.parse("hello")).toThrow();
});

Deno.test("zDataFrame - safeParse success", () => {
  const Schema = zDataFrame({ x: z.number() });

  const result = Schema.safeParse({ x: [1, 2, 3] });

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.nrows()).toBe(3);
    expect(result.data[0].x).toBe(1);
  }
});

Deno.test("zDataFrame - safeParse failure", () => {
  const Schema = zDataFrame({ x: z.number() });

  const result = Schema.safeParse({ x: ["not", "numbers"] });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error).toBeDefined();
  }
});

Deno.test("zDataFrame - parseAsync", async () => {
  const Schema = zDataFrame({ x: z.number() });

  const df = await Schema.parseAsync({ x: [1, 2] });

  expect(df.nrows()).toBe(2);
  expect(df[0].x).toBe(1);
});

Deno.test("zDataFrame - extra keys are stripped (default z.object behavior)", () => {
  const Schema = zDataFrame({ x: z.number() });

  const df = Schema.parse({ x: [1, 2], extra: ["a", "b"] });

  expect(df.columns()).toEqual(["x"]);
  expect(df.nrows()).toBe(2);
});

Deno.test("zDataFrame - nullable column elements", () => {
  const Schema = zDataFrame({ x: z.number().nullable() });

  const df = Schema.parse({ x: [1, null, 3] });

  expect(df.nrows()).toBe(3);
  expect(df[0].x).toBe(1);
  expect(df[1].x).toBe(null);
  expect(df[2].x).toBe(3);
});

Deno.test("zDataFrame - optional column elements with default", () => {
  const Schema = zDataFrame({ x: z.number().default(0) });

  const df = Schema.parse({ x: [1, undefined, 3] });

  expect(df.nrows()).toBe(3);
  expect(df[0].x).toBe(1);
  expect(df[1].x).toBe(0);
  expect(df[2].x).toBe(3);
});

Deno.test("zDataFrame - enum column", () => {
  const Schema = zDataFrame({ status: z.enum(["active", "inactive"]) });

  const df = Schema.parse({ status: ["active", "inactive", "active"] });

  expect(df.nrows()).toBe(3);
  expect(df[0].status).toBe("active");

  expect(() =>
    Schema.parse({ status: ["active", "unknown"] })
  ).toThrow();
});

Deno.test("zDataFrame - union column type", () => {
  const Schema = zDataFrame({ value: z.union([z.number(), z.string()]) });

  const df = Schema.parse({ value: [1, "two", 3] });

  expect(df.nrows()).toBe(3);
  expect(df[0].value).toBe(1);
  expect(df[1].value).toBe("two");
});

Deno.test("zDataFrame - single row", () => {
  const Schema = zDataFrame({ x: z.number(), y: z.string() });

  const df = Schema.parse({ x: [42], y: ["hello"] });

  expect(df.nrows()).toBe(1);
  expect(df[0].x).toBe(42);
  expect(df[0].y).toBe("hello");
});
