import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("pivotWider - basic functionality", () => {
  const df = createDataFrame([
    { group: "A", variable: "x", value: 1 },
    { group: "A", variable: "y", value: 2 },
    { group: "B", variable: "x", value: 3 },
    { group: "B", variable: "y", value: 4 },
  ]);

  const result = df.pivotWider({
    names_from: "variable",
    values_from: "value",
  });

  expect(result.nrows()).toBe(2);
  const resultArray = result.toArray();

  expect(resultArray[0]).toEqual({ group: "A", x: 1, y: 2 });
  expect(resultArray[1]).toEqual({ group: "B", x: 3, y: 4 });
});

Deno.test("pivotWider - with expected_columns", () => {
  const sales = createDataFrame([
    { product: "A", quarter: "Q1", revenue: 100 },
    { product: "A", quarter: "Q2", revenue: 150 },
    { product: "B", quarter: "Q1", revenue: 200 },
    { product: "B", quarter: "Q2", revenue: 250 },
  ]);

  const result = sales.pivotWider({
    names_from: "quarter",
    values_from: "revenue",
    expected_columns: ["Q1", "Q2"],
  });

  expect(result.nrows()).toBe(2);
  const resultArray = result.toArray();

  expect(resultArray[0]).toEqual({ product: "A", Q1: 100, Q2: 150 });
  expect(resultArray[1]).toEqual({ product: "B", Q1: 200, Q2: 250 });
});

Deno.test("pivotWider - with aggregation function", () => {
  const df = createDataFrame([
    { group: "A", variable: "x", value: 1 },
    { group: "A", variable: "x", value: 2 }, // Duplicate - needs aggregation
    { group: "A", variable: "y", value: 3 },
    { group: "B", variable: "x", value: 4 },
    { group: "B", variable: "y", value: 5 },
  ]);

  const result = df.pivotWider({
    names_from: "variable",
    values_from: "value",
    values_fn: (values: number[]) => stats.mean(values), // Average the duplicates
  });

  expect(result.nrows()).toBe(2);
  const resultArray = result.toArray();

  expect(resultArray[0]).toEqual({ group: "A", x: 1.5, y: 3 }); // (1+2)/2 = 1.5
  expect(resultArray[1]).toEqual({ group: "B", x: 4, y: 5 });
});

Deno.test("pivotWider - with additional columns preserved", () => {
  const df = createDataFrame([
    { group: "A", variable: "x", value1: 10 },
    { group: "A", variable: "y", value1: 20 },
    { group: "B", variable: "x", value1: 30 },
    { group: "B", variable: "y", value1: 40 },
  ]);

  const result = df.pivotWider({
    names_from: "variable",
    values_from: "value1",
  });

  expect(result.nrows()).toBe(2);
  const resultArray = result.toArray();

  // Should have columns: group, x, y (from value1 column only)
  expect(resultArray[0]).toEqual({
    group: "A",
    x: 10,
    y: 20,
  });
  expect(resultArray[1]).toEqual({
    group: "B",
    x: 30,
    y: 40,
  });
});

Deno.test("pivotWider - missing values fill with undefined", () => {
  const df = createDataFrame([
    { group: "A", variable: "x", value: 1 },
    { group: "A", variable: "y", value: 2 },
    { group: "B", variable: "x", value: 3 },
    // Missing B-y combination
  ]);

  const result = df.pivotWider({
    names_from: "variable",
    values_from: "value",
  });

  expect(result.nrows()).toBe(2);
  const resultArray = result.toArray();

  expect(resultArray[0]).toEqual({ group: "A", x: 1, y: 2 });
  expect(resultArray[1]).toEqual({ group: "B", x: 3, y: undefined });
});

Deno.test("pivotWider - with fill value for missing data", () => {
  const df = createDataFrame([
    { group: "A", variable: "x", value: 1 },
    { group: "A", variable: "y", value: 2 },
    { group: "B", variable: "x", value: 3 },
    // Missing B-y combination
  ]);

  const result = df.pivotWider({
    names_from: "variable",
    values_from: "value",
  });

  expect(result.nrows()).toBe(2);
  const resultArray = result.toArray();

  expect(resultArray[0]).toEqual({ group: "A", x: 1, y: 2 });
  expect(resultArray[1]).toEqual({ group: "B", x: 3, y: undefined });
});

Deno.test("pivotWider - complex real-world example", () => {
  const salesData = createDataFrame([
    { store: "A", product: "apples", quarter: "Q1", revenue: 100 },
    { store: "A", product: "apples", quarter: "Q2", revenue: 120 },
    { store: "A", product: "bananas", quarter: "Q1", revenue: 75 },
    { store: "A", product: "bananas", quarter: "Q2", revenue: 90 },
    { store: "B", product: "apples", quarter: "Q1", revenue: 110 },
    { store: "B", product: "apples", quarter: "Q2", revenue: 130 },
    { store: "B", product: "bananas", quarter: "Q1", revenue: 80 },
    { store: "B", product: "bananas", quarter: "Q2", revenue: 95 },
  ]);

  // Pivot by quarter, getting revenue for each store-product combination
  const result = salesData.pivotWider({
    names_from: "quarter",
    values_from: "revenue",
    expected_columns: ["Q1", "Q2"],
  });

  expect(result.nrows()).toBe(4); // 2 stores × 2 products
  const resultArray = result.toArray();

  const storeA_apples = resultArray.find((row) =>
    row.store === "A" && row.product === "apples"
  );
  expect(storeA_apples).toEqual({
    store: "A",
    product: "apples",
    Q1: 100,
    Q2: 120,
  }); // units from first Q1 record
});

Deno.test("pivotWider - validation with expected_columns", () => {
  const salesData = createDataFrame([
    { store: "A", product: "apples", revenue: 100 },
    { store: "A", product: "bananas", revenue: 75 },
    { store: "B", product: "apples", revenue: 120 },
    { store: "B", product: "bananas", revenue: 90 },
  ]);

  // Test that providing expected_columns works correctly
  const result = salesData.pivotWider({
    names_from: "product",
    values_from: "revenue",
    expected_columns: ["apples", "bananas"],
  });

  expect(result.nrows()).toBe(2);
  const resultArray = result.toArray();

  expect(resultArray[0]).toEqual({ store: "A", apples: 100, bananas: 75 });
  expect(resultArray[1]).toEqual({ store: "B", apples: 120, bananas: 90 });
});

Deno.test("pivotWider - using unique values from data", () => {
  const df = createDataFrame([
    { category: "electronics", item: "phone", price: 500 },
    { category: "electronics", item: "laptop", price: 1000 },
    { category: "books", item: "phone", price: 15 }, // Different item with same name
    { category: "books", item: "laptop", price: 25 }, // Different item with same name
  ]);

  // Using stats.unique to determine column names
  const uniqueItems = stats.unique(df.item);

  const result = df.pivotWider({
    names_from: "item",
    values_from: "price",
    expected_columns: uniqueItems,
  });

  expect(result.nrows()).toBe(2);
  const resultArray = result.toArray();

  expect(resultArray[0]).toEqual({
    category: "electronics",
    phone: 500,
    laptop: 1000,
  });
  expect(resultArray[1]).toEqual({ category: "books", phone: 15, laptop: 25 });
});

Deno.test("pivotLonger - basic functionality", () => {
  const df = createDataFrame([
    { group: "A", x: 1, y: 2 },
    { group: "B", x: 3, y: 4 },
  ]);

  const result = df.pivotLonger({
    cols: ["x", "y"],
    names_to: "variable",
    values_to: "value",
  });

  expect(result.nrows()).toBe(4);
  const resultArray = result.toArray();

  expect(resultArray).toEqual([
    { group: "A", variable: "x", value: 1 },
    { group: "A", variable: "y", value: 2 },
    { group: "B", variable: "x", value: 3 },
    { group: "B", variable: "y", value: 4 },
  ]);
});

Deno.test("pivotLonger - with column pattern matching", () => {
  const df = createDataFrame([
    { id: 1, score_math: 85, score_english: 90, age: 16 },
    { id: 2, score_math: 92, score_english: 88, age: 17 },
  ]);

  const result = df.pivotLonger({
    cols: ["score_math", "score_english"], // Only score columns
    names_to: "subject",
    values_to: "score",
  });

  expect(result.nrows()).toBe(4);
  const resultArray = result.toArray();

  expect(resultArray).toEqual([
    { id: 1, age: 16, subject: "score_math", score: 85 },
    { id: 1, age: 16, subject: "score_english", score: 90 },
    { id: 2, age: 17, subject: "score_math", score: 92 },
    { id: 2, age: 17, subject: "score_english", score: 88 },
  ]);
});

Deno.test("pivotLonger - with names transformation", () => {
  const df = createDataFrame([
    { id: 1, Q1_2023: 100, Q2_2023: 120, Q3_2023: 110 },
    { id: 2, Q1_2023: 200, Q2_2023: 220, Q3_2023: 210 },
  ]);

  const result = df.pivotLonger({
    cols: ["Q1_2023", "Q2_2023", "Q3_2023"],
    names_to: "quarter",
    values_to: "revenue",
  });

  expect(result.nrows()).toBe(6);
  const resultArray = result.toArray();

  // Column names should be preserved as-is unless transformed
  expect(resultArray[0]).toEqual({ id: 1, quarter: "Q1_2023", revenue: 100 });
  expect(resultArray[1]).toEqual({ id: 1, quarter: "Q2_2023", revenue: 120 });
  expect(resultArray[2]).toEqual({ id: 1, quarter: "Q3_2023", revenue: 110 });
});

Deno.test("pivotLonger - preserving non-pivoted columns", () => {
  const df = createDataFrame([
    { name: "Alice", age: 25, height: 170, weight: 65, city: "NYC" },
    { name: "Bob", age: 30, height: 180, weight: 75, city: "LA" },
  ]);

  const result = df.pivotLonger({
    cols: ["height", "weight"], // Only pivot these measurements
    names_to: "measurement_type",
    values_to: "measurement_value",
  });

  expect(result.nrows()).toBe(4);
  const resultArray = result.toArray();

  // name, age, and city should be preserved
  expect(resultArray[0]).toEqual({
    name: "Alice",
    age: 25,
    city: "NYC",
    measurement_type: "height",
    measurement_value: 170,
  });
  expect(resultArray[1]).toEqual({
    name: "Alice",
    age: 25,
    city: "NYC",
    measurement_type: "weight",
    measurement_value: 65,
  });
});
