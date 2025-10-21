import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Combining - Basic BindRows", () => {
  const df1 = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
  ]);

  const df2 = createDataFrame([
    { id: 3, name: "Charlie", age: 35 },
    { id: 4, name: "Diana", age: 28 },
  ]);

  const combined = df1.bindRows(df2);

  expect(combined.nrows()).toBe(4);
  expect(combined[0].name).toBe("Alice");
  expect(combined[3].name).toBe("Diana");
});

Deno.test("Combining - Multiple DataFrames", () => {
  const df1 = createDataFrame([{ id: 1, name: "Alice" }]);
  const df2 = createDataFrame([{ id: 2, name: "Bob" }]);
  const df3 = createDataFrame([{ id: 3, name: "Charlie" }]);

  const combined = df1.bindRows(df2, df3);

  expect(combined.nrows()).toBe(3);
  expect(combined[2].name).toBe("Charlie");
});

Deno.test("Combining - Different Columns", () => {
  const df1 = createDataFrame([{ id: 1, name: "Alice", age: 25 }]);

  const df2 = createDataFrame([
    { id: 2, name: "Bob", age: 30, salary: 50000 },
  ]);

  const combined = df1.bindRows(df2);

  expect(combined.nrows()).toBe(2);
  expect(combined.columns()).toContain("salary");
  expect(combined[0].salary).toBe(undefined);
});

Deno.test("Combining - Spread Operator", () => {
  const df1 = createDataFrame([{ id: 1, name: "Alice" }]);
  const df2 = createDataFrame([{ id: 2, name: "Bob" }]);

  const combined = createDataFrame([...df1, ...df2]);

  expect(combined.nrows()).toBe(2);
  expect(combined[0].name).toBe("Alice");
  expect(combined[1].name).toBe("Bob");
});
