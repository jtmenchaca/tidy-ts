import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("prepend - basic functionality", () => {
  const original = createDataFrame([
    { id: 3, name: "Charlie" },
    { id: 4, name: "Diana" },
  ]);

  const toPrepend = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const result = original.prepend(toPrepend);

  expect(result.nrows()).toBe(4);
  const resultArray = result.toArray();

  expect(resultArray).toEqual([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
    { id: 4, name: "Diana" },
  ]);
});

Deno.test("prepend - different column order", () => {
  const df1 = createDataFrame([
    { name: "Charlie", age: 35, city: "Chicago" },
    { name: "Diana", age: 28, city: "Miami" },
  ]);

  const df2 = createDataFrame([
    { city: "NYC", name: "Alice", age: 25 }, // Different column order
    { age: 30, city: "LA", name: "Bob" },
  ]);

  const result = df1.prepend(df2);

  expect(result.nrows()).toBe(4);
  const resultArray = result.toArray();

  expect(resultArray).toEqual([
    { city: "NYC", name: "Alice", age: 25 },
    { age: 30, city: "LA", name: "Bob" },
    { name: "Charlie", age: 35, city: "Chicago" },
    { name: "Diana", age: 28, city: "Miami" },
  ]);
});

Deno.test("prepend - missing columns fill with undefined", () => {
  const df1 = createDataFrame([
    { id: 3, name: "Charlie", age: 35 },
    { id: 4, name: "Diana", age: 28 },
  ]);

  const df2 = createDataFrame([
    { id: 1, name: "Alice" }, // Missing age column
    { id: 2, name: "Bob", email: "bob@test.com" }, // Missing age, extra email
  ]);

  const result = df1.prepend(df2);

  expect(result.nrows()).toBe(4);
  const resultArray = result.toArray();

  expect(resultArray).toEqual([
    { id: 1, name: "Alice", age: undefined, email: undefined },
    { id: 2, name: "Bob", age: undefined, email: "bob@test.com" },
    { id: 3, name: "Charlie", age: 35, email: undefined },
    { id: 4, name: "Diana", age: 28, email: undefined },
  ]);
});

Deno.test("prepend - empty DataFrames", () => {
  const df1 = createDataFrame([
    { id: 1, name: "Alice" },
  ]);

  const empty = createDataFrame({ columns: { id: [], name: [] } });

  const result1 = df1.prepend(empty);
  expect(result1.nrows()).toBe(1);
  expect(result1.toArray()).toEqual([{ id: 1, name: "Alice" }]);

  const result2 = empty.prepend(df1);
  expect(result2.nrows()).toBe(1);
  expect(result2.toArray()).toEqual([{ id: 1, name: "Alice" }]);
});

Deno.test("prepend - multiple prepends chained", () => {
  const df1 = createDataFrame([{ id: 3, value: "C" }]);
  const df2 = createDataFrame([{ id: 2, value: "B" }]);
  const df3 = createDataFrame([{ id: 1, value: "A" }]);

  const result = df1.prepend(df2).prepend(df3);

  expect(result.nrows()).toBe(3);
  expect(result.toArray()).toEqual([
    { id: 1, value: "A" },
    { id: 2, value: "B" },
    { id: 3, value: "C" },
  ]);
});

Deno.test("prepend - contrast with append", () => {
  const base = createDataFrame([{ id: 2, name: "Base" }]);
  const addition = createDataFrame([{ id: 1, name: "Addition" }]);

  const appended = base.append(addition);
  const prepended = base.prepend(addition);

  expect(appended.toArray()).toEqual([
    { id: 2, name: "Base" },
    { id: 1, name: "Addition" },
  ]);

  expect(prepended.toArray()).toEqual([
    { id: 1, name: "Addition" },
    { id: 2, name: "Base" },
  ]);
});

Deno.test("prepend - mixed data types", () => {
  const df1 = createDataFrame([
    { id: 2, active: false, score: 87.2 },
    { id: 3, active: true, score: 92.1 },
  ]);

  const df2 = createDataFrame([
    { id: 1, active: true, score: 95.5 },
  ]);

  const result = df1.prepend(df2);

  expect(result.nrows()).toBe(3);
  expect(result.toArray()).toEqual([
    { id: 1, active: true, score: 95.5 },
    { id: 2, active: false, score: 87.2 },
    { id: 3, active: true, score: 92.1 },
  ]);
});

Deno.test("prepend - with undefined and null values", () => {
  const df1 = createDataFrame([
    { id: 2, name: undefined, value: 42 },
  ]);

  const df2 = createDataFrame([
    { id: 1, name: "Alice", value: null },
  ]);

  const result = df1.prepend(df2);

  expect(result.nrows()).toBe(2);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Alice", value: null },
    { id: 2, name: undefined, value: 42 },
  ]);
});

Deno.test("prepend - time series data example", () => {
  // Common use case: prepending newer data to existing time series
  const existingData = createDataFrame([
    { timestamp: "2023-01-03", value: 300, metric: "sales" },
    { timestamp: "2023-01-04", value: 400, metric: "sales" },
  ]);

  const newData = createDataFrame([
    { timestamp: "2023-01-01", value: 100, metric: "sales" },
    { timestamp: "2023-01-02", value: 200, metric: "sales" },
  ]);

  const result = existingData.prepend(newData);

  expect(result.nrows()).toBe(4);
  expect(result.toArray()).toEqual([
    { timestamp: "2023-01-01", value: 100, metric: "sales" },
    { timestamp: "2023-01-02", value: 200, metric: "sales" },
    { timestamp: "2023-01-03", value: 300, metric: "sales" },
    { timestamp: "2023-01-04", value: 400, metric: "sales" },
  ]);
});

Deno.test("prepend - single row prepend", () => {
  const df = createDataFrame([
    { id: 2, name: "Second" },
    { id: 3, name: "Third" },
  ]);

  const single = createDataFrame([
    { id: 1, name: "First" },
  ]);

  const result = df.prepend(single);

  expect(result.nrows()).toBe(3);
  expect(result.toArray()).toEqual([
    { id: 1, name: "First" },
    { id: 2, name: "Second" },
    { id: 3, name: "Third" },
  ]);
});
