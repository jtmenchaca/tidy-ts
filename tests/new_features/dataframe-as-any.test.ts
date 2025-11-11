/**
 * Tests for createDataFrame with no_types option
 *
 * When to use no_types: true:
 * ============================
 *
 * 1. **Dynamic/Unknown Schema**: When working with data where the structure
 *    is not known at compile time (e.g., user-provided data, API responses
 *    with varying structures, CSV files without predefined schemas).
 *
 * 2. **Rapid Prototyping**: During exploratory data analysis or quick
 *    prototyping where type safety adds friction without clear benefit.  This should always be followed by a typed implementation.
 *
 * 5. **Generic Data Processing**: Building generic utilities or functions
 *    that need to work with arbitrary DataFrame structures.
 *
 * ⚠️ **Trade-offs**:
 * - Lose compile-time type safety and autocomplete
 * - Runtime errors may occur if accessing non-existent properties
 * - Code becomes harder to maintain and refactor
 * - Less self-documenting code
 *
 * 💡 **Best Practice**: Prefer typed DataFrames when possible. Use no_types
 *    only when the benefits outweigh the loss of type safety.
 */

import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("createDataFrame with no_types option - basic operations", () => {
  const df = createDataFrame([{ a: 1, b: "x" }, { a: 2, b: "y" }], {
    no_types: true,
  });

  expect(df.nrows()).toBe(2);
  expect(df.ncols()).toBe(2);

  const filtered = df.filter((row) => row.a > 1);
  expect(filtered.nrows()).toBe(1);

  const mutated = df.mutate({ c: (row) => row.a * 2 });
  expect(mutated.nrows()).toBe(2);
  expect(mutated.toArray()[0].c).toBe(2);

  const selected = df.select("a");
  expect(selected.ncols()).toBe(1);
});

Deno.test("no_types - empty DataFrame", () => {
  const df = createDataFrame([], { no_types: true });
  expect(df.nrows()).toBe(0);
  expect(df.ncols()).toBe(0);
  expect(df.isEmpty()).toBe(true);
});

Deno.test("no_types - column-based creation", () => {
  const df = createDataFrame(
    { columns: { a: [1, 2, 3], b: ["x", "y", "z"] } },
    { no_types: true },
  );
  expect(df.nrows()).toBe(3);
  expect(df.ncols()).toBe(2);
  expect(df.toArray()[0].a).toBe(1);
});

Deno.test("no_types - grouping and aggregation", () => {
  const df = createDataFrame(
    [
      { category: "A", value: 10 },
      { category: "A", value: 20 },
      { category: "B", value: 30 },
    ],
    { no_types: true },
  );

  const grouped = df.groupBy("category");
  const summarized = grouped.summarize({
    total: (g) => stats.sum(g.value),
    count: (g) => g.nrows(),
  });

  expect(summarized.nrows()).toBe(2);
  const result = summarized.toArray();
  // deno-lint-ignore no-explicit-any
  expect(result.find((r: any) => r.category === "A")?.total).toBe(30);
});

Deno.test("no_types - joins", () => {
  const df1 = createDataFrame(
    [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }],
    { no_types: true },
  );
  const df2 = createDataFrame(
    [{ id: 1, score: 100 }, { id: 3, score: 200 }],
    { no_types: true },
  );

  const joined = df1.leftJoin(df2, "id");
  expect(joined.nrows()).toBe(2);
  expect(joined.ncols()).toBe(3);
  expect(joined.toArray()[0].score).toBe(100);
});

Deno.test("no_types - sorting and arranging", () => {
  const df = createDataFrame(
    [{ a: 3 }, { a: 1 }, { a: 2 }],
    { no_types: true },
  );

  const arranged = df.arrange("a");
  expect(arranged.toArray()[0].a).toBe(1);
  expect(arranged.toArray()[2].a).toBe(3);

  const sortedDesc = df.arrange("a", "desc");
  expect(sortedDesc.toArray()[0].a).toBe(3);
});

Deno.test("no_types - row operations (slice, head, tail)", () => {
  const df = createDataFrame(
    [{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }, { a: 5 }],
    { no_types: true },
  );

  const sliced = df.slice(1, 3);
  expect(sliced.nrows()).toBe(2);
  expect(sliced.toArray()[0].a).toBe(2);

  const head = df.head(2);
  expect(head.nrows()).toBe(2);
  expect(head.toArray()[0].a).toBe(1);

  const tail = df.tail(2);
  expect(tail.nrows()).toBe(2);
  expect(tail.toArray()[0].a).toBe(4);
});

Deno.test("no_types - column operations (drop, rename, reorder)", () => {
  const df = createDataFrame(
    [{ a: 1, b: 2, c: 3 }],
    { no_types: true },
  );

  const dropped = df.drop("b");
  expect(dropped.ncols()).toBe(2);
  expect(dropped.columns()).toEqual(["a", "c"]);

  const renamed = df.rename({ a: "x", b: "y" });
  expect(renamed.columns()).toContain("x");
  expect(renamed.columns()).toContain("y");

  const reordered = df.reorder(["c", "a", "b"]);
  expect(reordered.columns()[0]).toBe("c");
});

Deno.test("no_types - distinct and count", () => {
  const df = createDataFrame(
    [
      { category: "A", value: 1 },
      { category: "A", value: 2 },
      { category: "B", value: 3 },
    ],
    { no_types: true },
  );

  const distinct = df.distinct("category");
  expect(distinct.nrows()).toBe(2);

  const counted = df.count("category");
  expect(counted.nrows()).toBe(2);
  // deno-lint-ignore no-explicit-any
  expect(counted.toArray().find((r: any) => r.category === "A")?.count).toBe(
    2,
  );
});

Deno.test("no_types - chaining multiple operations", () => {
  const df = createDataFrame(
    [
      { a: 1, b: "x", c: 10 },
      { a: 2, b: "y", c: 20 },
      { a: 3, b: "x", c: 30 },
    ],
    { no_types: true },
  );

  const result = df
    .filter((row) => row.a > 1)
    .mutate({ d: (row) => row.c * 2 })
    .select("a", "b", "d")
    .arrange("d", "desc");

  expect(result.nrows()).toBe(2);
  expect(result.ncols()).toBe(3);
  expect(result.toArray()[0].d).toBe(60);
});

Deno.test("no_types - extract methods", () => {
  const df = createDataFrame(
    [{ a: 1 }, { a: 2 }, { a: 3 }],
    { no_types: true },
  );

  const extracted = df.extract("a");
  expect(extracted).toEqual([1, 2, 3]);

  const headExtracted = df.extractHead("a", 2);
  expect(headExtracted).toEqual([1, 2]);

  const uniqueExtracted = df.extractUnique("a");
  expect(uniqueExtracted.length).toBe(3);
});

Deno.test("no_types - mixed data types", () => {
  const df = createDataFrame(
    [
      { num: 1, str: "a", bool: true, date: new Date("2024-01-01") },
      { num: 2, str: "b", bool: false, date: new Date("2024-01-02") },
    ],
    { no_types: true },
  );

  expect(df.nrows()).toBe(2);
  expect(df.ncols()).toBe(4);
  expect(typeof df.toArray()[0].num).toBe("number");
  expect(typeof df.toArray()[0].str).toBe("string");
  expect(typeof df.toArray()[0].bool).toBe("boolean");
  expect(df.toArray()[0].date instanceof Date).toBe(true);
});
