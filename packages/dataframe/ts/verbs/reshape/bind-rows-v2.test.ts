import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("bindRows - Basic Functionality", () => {
  // Test data
  const df1 = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
  ]);

  const df2 = createDataFrame([
    { id: 3, name: "Charlie", age: 35 },
    { id: 4, name: "Diana", age: 28 },
  ]);

  // Test basic binding
  const combined = df1.bindRows(df2);

  expect(combined.nrows()).toBe(4);
  expect(combined.columns()).toEqual(["id", "name", "age"]); // Insertion order preserved
  expect(combined[0]).toEqual({ id: 1, name: "Alice", age: 25 });
  expect(combined[1]).toEqual({ id: 2, name: "Bob", age: 30 });
  expect(combined[2]).toEqual({ id: 3, name: "Charlie", age: 35 });
  expect(combined[3]).toEqual({ id: 4, name: "Diana", age: 28 });
});

Deno.test("bindRows - Different Column Sets", () => {
  const df1 = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
  ]);

  const df2 = createDataFrame([
    { id: 2, name: "Bob", city: "NYC" },
  ]);

  const combined = df1.bindRows(df2);

  expect(combined.nrows()).toBe(2);
  expect(combined.columns()).toEqual(["id", "name", "age", "city"]); // Insertion order preserved
  expect(combined[0]).toEqual({
    id: 1,
    name: "Alice",
    age: 25,
    city: undefined,
  });
  expect(combined[1]).toEqual({
    id: 2,
    name: "Bob",
    age: undefined,
    city: "NYC",
  });
});

Deno.test("bindRows - Multiple DataFrames", () => {
  const df1 = createDataFrame([{ id: 1, name: "Alice" }]);
  const df2 = createDataFrame([{ id: 2, name: "Bob" }]);
  const df3 = createDataFrame([{ id: 3, name: "Charlie" }]);

  const combined = df1.bindRows(df2, df3);

  expect(combined.nrows()).toBe(3);
  expect(combined.columns()).toEqual(["id", "name"]); // Insertion order preserved
  expect(combined[0].name).toBe("Alice");
  expect(combined[1].name).toBe("Bob");
  expect(combined[2].name).toBe("Charlie");
});

Deno.test("bindRows - Empty DataFrames", () => {
  const df1 = createDataFrame([{ id: 1, name: "Alice" }]);
  const emptyDf = createDataFrame({ columns: { id: [], name: [] } });

  // Binding with empty DataFrame
  const combined1 = df1.bindRows(emptyDf);
  expect(combined1.nrows()).toBe(1);
  expect(combined1[0]).toEqual({ id: 1, name: "Alice" });

  // Binding empty DataFrame with non-empty
  const combined2 = emptyDf.bindRows(df1);
  expect(combined2.nrows()).toBe(1);
  expect(combined2[0]).toEqual({ id: 1, name: "Alice" });

  // Binding multiple empty DataFrames
  const combined3 = emptyDf.bindRows(emptyDf, emptyDf);
  expect(combined3.nrows()).toBe(0);
});

Deno.test("bindRows - No Arguments", () => {
  const df = createDataFrame([{ id: 1, name: "Alice" }]);

  expect(() => df.bindRows()).toThrow(
    "bind_rows requires at least one DataFrame argument",
  );
});

Deno.test("bindRows - Type Safety with Optional Properties", () => {
  type Person = {
    id: number;
    name: string;
    age?: number;
    city?: string;
  };

  const df1 = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
  ]);

  const df2 = createDataFrame([
    { id: 2, name: "Bob", city: "NYC" },
  ]);

  const combined = df1.bindRows(df2);

  // TypeScript should allow access to optional properties
  expect(combined[0].age).toBe(25);
  expect(combined[0].city).toBeUndefined();
  expect(combined[1].age).toBeUndefined();
  expect(combined[1].city).toBe("NYC");
});

Deno.test("bindRows - Chaining with Other Operations", () => {
  const df1 = createDataFrame([
    { id: 1, name: "Alice", active: true },
    { id: 2, name: "Bob", active: false },
  ]);

  const df2 = createDataFrame([
    { id: 3, name: "Charlie", active: true },
    { id: 4, name: "Diana", active: true },
  ]);

  const result = df1
    .bindRows(df2)
    .filter((row) => row.active)
    .select("name", "active");

  expect(result.nrows()).toBe(3);
  expect(result.columns()).toEqual(["name", "active"]);
  expect(result[0].name).toBe("Alice");
  expect(result[1].name).toBe("Charlie");
  expect(result[2].name).toBe("Diana");
});

Deno.test("bindRows - Complex Data Types", () => {
  const df1 = createDataFrame([
    {
      id: 1,
      data: { x: 10, y: 20 },
      tags: ["tag1", "tag2"],
      metadata: { created: "2023-01-01" },
    },
  ]);

  const df2 = createDataFrame([
    {
      id: 2,
      data: { x: 15, y: 25 },
      tags: ["tag3"],
      metadata: { created: "2023-01-02", updated: "2023-01-03" },
    },
  ]);

  const combined = df1.bindRows(df2);

  expect(combined.nrows()).toBe(2);
  expect(combined.columns()).toEqual(["id", "data", "tags", "metadata"]);
  expect(combined[0].data).toEqual({ x: 10, y: 20 });
  expect(combined[1].data).toEqual({ x: 15, y: 25 });
  expect(combined[0].tags).toEqual(["tag1", "tag2"]);
  expect(combined[1].tags).toEqual(["tag3"]);
});

Deno.test("bindRows - Performance with Large DataFrames", () => {
  // Create larger DataFrames for performance testing
  const largeDf1 = createDataFrame(
    Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `User${i}`,
      value: Math.random(),
    })),
  );

  const largeDf2 = createDataFrame(
    Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1000,
      name: `User${i + 1000}`,
      value: Math.random(),
    })),
  );

  const start = performance.now();
  const combined = largeDf1.bindRows(largeDf2);
  const end = performance.now();

  expect(combined.nrows()).toBe(2000);
  expect(combined.columns()).toEqual(["id", "name", "value"]); // Insertion order preserved

  // Performance should be reasonable (less than 200ms for 2000 rows)
  expect(end - start).toBeLessThan(200);
});

Deno.test("bindRows - Edge Cases", () => {
  // DataFrame with null/undefined values
  const df1 = createDataFrame([
    { id: 1, name: "Alice", age: null, city: undefined },
  ]);

  const df2 = createDataFrame([
    { id: 2, name: "Bob", age: 30, city: "NYC" },
  ]);

  const combined = df1.bindRows(df2);

  expect(combined.nrows()).toBe(2);
  expect(combined[0]).toEqual({
    id: 1,
    name: "Alice",
    age: null,
    city: undefined,
  });
  expect(combined[1]).toEqual({ id: 2, name: "Bob", age: 30, city: "NYC" });

  // DataFrame with only one column
  const singleColDf1 = createDataFrame([{ name: "Alice" }]);
  const singleColDf2 = createDataFrame([{ name: "Bob" }]);

  const combinedSingle = singleColDf1.bindRows(singleColDf2);
  expect(combinedSingle.nrows()).toBe(2);
  expect(combinedSingle.columns()).toEqual(["name"]);
});

Deno.test("bindRows - Column Order Preservation", () => {
  const df1 = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
  ]);

  const df2 = createDataFrame([
    { age: 30, name: "Bob", id: 2 },
  ]);

  const combined = df1.bindRows(df2);

  // Columns should preserve insertion order for consistency
  expect(combined.columns()).toEqual(["id", "name", "age"]);
  expect(combined[0]).toEqual({ age: 25, id: 1, name: "Alice" });
  expect(combined[1]).toEqual({ age: 30, id: 2, name: "Bob" });
});
