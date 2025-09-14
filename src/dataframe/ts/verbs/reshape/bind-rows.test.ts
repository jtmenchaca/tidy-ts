import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("bindRows - basic functionality with multiple DataFrames", () => {
  const df1 = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const df2 = createDataFrame([
    { id: 3, name: "Charlie" },
  ]);

  const df3 = createDataFrame([
    { id: 4, name: "Diana" },
    { id: 5, name: "Eve" },
  ]);

  const result = df1.bindRows(df2, df3);

  expect(result.nrows()).toBe(5);
  const resultArray = result.toArray();

  expect(resultArray).toEqual([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
    { id: 4, name: "Diana" },
    { id: 5, name: "Eve" },
  ]);
});

Deno.test("bindRows - different column schemas", () => {
  const df1 = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
  ]);

  const df2 = createDataFrame([
    { id: 3, name: "Charlie", city: "NYC" }, // Missing age, has city
  ]);

  const df3 = createDataFrame([
    { id: 4, email: "diana@test.com" }, // Missing name and age, has email
  ]);

  const result = df1.bindRows(df2, df3);

  expect(result.nrows()).toBe(4);
  const resultArray = result.toArray();

  expect(resultArray).toEqual([
    { id: 1, name: "Alice", age: 25, city: undefined, email: undefined },
    { id: 2, name: "Bob", age: 30, city: undefined, email: undefined },
    { id: 3, name: "Charlie", age: undefined, city: "NYC", email: undefined },
    {
      id: 4,
      name: undefined,
      age: undefined,
      city: undefined,
      email: "diana@test.com",
    },
  ]);
});

Deno.test("bindRows - with id column for source tracking", () => {
  const sales2022 = createDataFrame([
    { month: "Jan", revenue: 1000 },
    { month: "Feb", revenue: 1200 },
  ]);

  const sales2023 = createDataFrame([
    { month: "Jan", revenue: 1100 },
    { month: "Feb", revenue: 1300 },
  ]);

  const result = sales2022.bindRows(sales2023);
  expect(result.nrows()).toBe(4);
  const resultArray = result.toArray();

  expect(resultArray).toEqual([
    { month: "Jan", revenue: 1000 }, // Basic bind_rows without tracking
    { month: "Feb", revenue: 1200 },
    { month: "Jan", revenue: 1100 }, // Basic bind_rows without tracking
    { month: "Feb", revenue: 1300 },
  ]);
});

Deno.test("bindRows - with custom id values", () => {
  const q1Data = createDataFrame([
    { month: "Jan", sales: 100 },
    { month: "Feb", sales: 120 },
    { month: "Mar", sales: 110 },
  ]);

  const q2Data = createDataFrame([
    { month: "Apr", sales: 130 },
    { month: "May", sales: 140 },
    { month: "Jun", sales: 125 },
  ]);

  const result = q1Data.bindRows(q2Data);

  expect(result.nrows()).toBe(6);
  const resultArray = result.toArray();

  expect(resultArray).toEqual([
    { month: "Jan", sales: 100 }, // Basic bind_rows without tracking
    { month: "Feb", sales: 120 },
    { month: "Mar", sales: 110 },
    { month: "Apr", sales: 130 }, // Basic bind_rows without tracking
    { month: "May", sales: 140 },
    { month: "Jun", sales: 125 },
  ]);
});

Deno.test("bindRows - empty DataFrames", () => {
  const df1 = createDataFrame([{ id: 1, name: "Alice" }]);
  const empty1 = createDataFrame<{ id: number; name: string }>([]);
  const empty2 = createDataFrame<{ id: number; name: string }>([]);

  const result = df1.bindRows(empty1, empty2);

  expect(result.nrows()).toBe(1);
  expect(result.toArray()).toEqual([{ id: 1, name: "Alice" }]);
});

Deno.test("bindRows - all empty DataFrames", () => {
  const empty1 = createDataFrame<{ id: number; name: string }>([]);
  const empty2 = createDataFrame<{ id: number; name: string }>([]);
  const empty3 = createDataFrame<{ id: number; name: string }>([]);

  const result = empty1.bindRows(empty2, empty3);

  expect(result.nrows()).toBe(0);
  expect(result.toArray()).toEqual([]);
});

Deno.test("bindRows - single DataFrame in array", () => {
  const df1 = createDataFrame([{ id: 1, name: "Alice" }]);
  const df2 = createDataFrame([{ id: 2, name: "Bob" }]);

  const result = df1.bindRows(df2);

  expect(result.nrows()).toBe(2);
  expect(result.toArray()).toEqual([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);
});

Deno.test("bindRows - mixed data types preservation", () => {
  const df1 = createDataFrame([
    { id: 1, active: true, score: 95.5, tags: ["student"] },
  ]);

  const df2 = createDataFrame([
    { id: 2, active: false, score: 87.2, count: 42 },
  ]);

  const result = df1.bindRows(df2);

  expect(result.nrows()).toBe(2);
  const resultArray = result.toArray();

  expect(resultArray).toEqual([
    { id: 1, active: true, score: 95.5, tags: ["student"], count: undefined },
    { id: 2, active: false, score: 87.2, tags: undefined, count: 42 },
  ]);
});

Deno.test("bindRows - real-world example - combining survey data", () => {
  const survey2022 = createDataFrame([
    { respondent_id: 1, age: 25, satisfaction: 4 },
    { respondent_id: 2, age: 34, satisfaction: 5 },
  ]);

  const survey2023 = createDataFrame([
    { respondent_id: 3, age: 29, satisfaction: 3, net_promoter_score: 8 },
    { respondent_id: 4, age: 42, satisfaction: 4, net_promoter_score: 9 },
  ]);

  const survey2024 = createDataFrame([
    {
      respondent_id: 5,
      age: 31,
      satisfaction: 5,
      net_promoter_score: 10,
      source: "email",
    },
  ]);

  const combined = survey2022.bindRows(survey2023, survey2024);

  expect(combined.nrows()).toBe(5);
  const resultArray = combined.toArray();

  // Check that all columns are present with appropriate undefined values
  expect(resultArray[0]).toEqual({
    respondent_id: 1,
    age: 25,
    satisfaction: 4,
    net_promoter_score: undefined,
    source: undefined,
  });

  expect(resultArray[4]).toEqual({
    respondent_id: 5,
    age: 31,
    satisfaction: 5,
    net_promoter_score: 10,
    source: "email",
  });
});

Deno.test("bindRows - performance with large datasets", () => {
  const df1 = createDataFrame(
    Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      value: `Value${i}`,
      category: i % 3 === 0 ? "A" : i % 3 === 1 ? "B" : "C",
    })),
  );

  const df2 = createDataFrame(
    Array.from({ length: 500 }, (_, i) => ({
      id: i + 1000,
      value: `Value${i + 1000}`,
      category: i % 2 === 0 ? "D" : "E",
    })),
  );

  const df3 = createDataFrame(
    Array.from({ length: 250 }, (_, i) => ({
      id: i + 1500,
      value: `Value${i + 1500}`,
      priority: i % 5,
    })),
  );

  const result = df1.bindRows(df2, df3);

  expect(result.nrows()).toBe(1750);

  // Spot check data integrity
  const resultArray = result.toArray();
  expect(resultArray[0]).toEqual({
    id: 0,
    value: "Value0",
    category: "A",
    priority: undefined,
  });
  expect(resultArray[999]).toEqual({
    id: 999,
    value: "Value999",
    category: "A",
    priority: undefined,
  });
  expect(resultArray[1000]).toEqual({
    id: 1000,
    value: "Value1000",
    category: "D",
    priority: undefined,
  });
  expect(resultArray[1749]).toEqual({
    id: 1749,
    value: "Value1749",
    category: undefined,
    priority: 4,
  });
});

Deno.test("bindRows - column order preservation", () => {
  const df1 = createDataFrame([
    { first: 1, second: 2, third: 3 },
  ]);

  const df2 = createDataFrame([
    { third: 6, first: 4, second: 5 }, // Different column order
  ]);

  const result = df1.bindRows(df2);

  expect(result.nrows()).toBe(2);
  const resultArray = result.toArray();

  // Should preserve the structure from each original DataFrame
  expect(resultArray).toEqual([
    { first: 1, second: 2, third: 3 },
    { third: 6, first: 4, second: 5 },
  ]);
});
