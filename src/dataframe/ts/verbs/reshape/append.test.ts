import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("append - basic functionality", () => {
  const original = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const toAppend = createDataFrame([
    { id: 3, name: "Charlie" },
    { id: 4, name: "Diana" },
  ]);

  const result = original.append(toAppend);

  expect(result.nrows()).toBe(4);
  const resultArray = result.toArray();

  expect(resultArray).toEqual([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
    { id: 4, name: "Diana" },
  ]);
});

Deno.test("append - different column order", () => {
  const df1 = createDataFrame([
    { name: "Alice", age: 25, city: "NYC" },
    { name: "Bob", age: 30, city: "LA" },
  ]);

  const df2 = createDataFrame([
    { city: "Chicago", name: "Charlie", age: 35 }, // Different column order
    { age: 28, city: "Miami", name: "Diana" },
  ]);

  const result = df1.append(df2);

  expect(result.nrows()).toBe(4);
  const resultArray = result.toArray();

  expect(resultArray).toEqual([
    { name: "Alice", age: 25, city: "NYC" },
    { name: "Bob", age: 30, city: "LA" },
    { city: "Chicago", name: "Charlie", age: 35 },
    { age: 28, city: "Miami", name: "Diana" },
  ]);
});

Deno.test("append - missing columns fill with undefined", () => {
  const df1 = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
  ]);

  const df2 = createDataFrame([
    { id: 3, name: "Charlie" }, // Missing age column
    { id: 4, name: "Diana", email: "diana@test.com" }, // Missing age, extra email
  ]);

  const result = df1.append(df2);

  expect(result.nrows()).toBe(4);
  const resultArray = result.toArray();

  expect(resultArray).toEqual([
    { id: 1, name: "Alice", age: 25, email: undefined },
    { id: 2, name: "Bob", age: 30, email: undefined },
    { id: 3, name: "Charlie", age: undefined, email: undefined },
    { id: 4, name: "Diana", age: undefined, email: "diana@test.com" },
  ]);
});

Deno.test("append - empty DataFrames", () => {
  const df1 = createDataFrame([
    { id: 1, name: "Alice" },
  ]);

  const empty = createDataFrame<{ id: number; name: string }>([]);

  const result1 = df1.append(empty);
  expect(result1.nrows()).toBe(1);
  expect(result1.toArray()).toEqual([{ id: 1, name: "Alice" }]);

  const result2 = empty.append(df1);
  expect(result2.nrows()).toBe(1);
  expect(result2.toArray()).toEqual([{ id: 1, name: "Alice" }]);
});

Deno.test("append - multiple appends chained", () => {
  const df1 = createDataFrame([{ id: 1, value: "A" }]);
  const df2 = createDataFrame([{ id: 2, value: "B" }]);
  const df3 = createDataFrame([{ id: 3, value: "C" }]);

  const result = df1.append(df2).append(df3);

  expect(result.nrows()).toBe(3);
  expect(result.toArray()).toEqual([
    { id: 1, value: "A" },
    { id: 2, value: "B" },
    { id: 3, value: "C" },
  ]);
});

Deno.test("append - mixed data types", () => {
  const df1 = createDataFrame([
    { id: 1, active: true, score: 95.5 },
  ]);

  const df2 = createDataFrame([
    { id: 2, active: false, score: 87.2 },
    { id: 3, active: true, score: 92.1 },
  ]);

  const result = df1.append(df2);

  expect(result.nrows()).toBe(3);
  expect(result.toArray()).toEqual([
    { id: 1, active: true, score: 95.5 },
    { id: 2, active: false, score: 87.2 },
    { id: 3, active: true, score: 92.1 },
  ]);
});

Deno.test("append - with undefined and null values", () => {
  const df1 = createDataFrame([
    { id: 1, name: "Alice", value: null },
  ]);

  const df2 = createDataFrame([
    { id: 2, name: undefined, value: 42 },
  ]);

  const result = df1.append(df2);

  expect(result.nrows()).toBe(2);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Alice", value: null },
    { id: 2, name: undefined, value: 42 },
  ]);
});

Deno.test("append - large dataset performance", () => {
  // Create larger datasets to test performance
  const df1 = createDataFrame(
    Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `User${i}`,
      value: i * 2,
    })),
  );

  const df2 = createDataFrame(
    Array.from({ length: 500 }, (_, i) => ({
      id: i + 1000,
      name: `User${i + 1000}`,
      value: (i + 1000) * 2,
    })),
  );

  const result = df1.append(df2);

  expect(result.nrows()).toBe(1500);

  // Spot check first and last rows
  const resultArray = result.toArray();
  expect(resultArray[0]).toEqual({ id: 0, name: "User0", value: 0 });
  expect(resultArray[999]).toEqual({ id: 999, name: "User999", value: 1998 });
  expect(resultArray[1000]).toEqual({
    id: 1000,
    name: "User1000",
    value: 2000,
  });
  expect(resultArray[1499]).toEqual({
    id: 1499,
    name: "User1499",
    value: 2998,
  });
});
