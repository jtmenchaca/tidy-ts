import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("distinct - requires at least one column argument", () => {
  const data = createDataFrame([
    { name: "Alice", age: 25 },
    { name: "Bob", age: 30 },
  ]);

  // Should throw when called without arguments
  expect(() => {
    // @ts-expect-error - Testing runtime behavior when type checking is bypassed
    data.distinct();
  }).toThrow();
});

Deno.test("distinct - single column returns unique values", () => {
  const data = createDataFrame([
    { name: "Alice", age: 25, city: "NYC" },
    { name: "Bob", age: 30, city: "LA" },
    { name: "Alice", age: 26, city: "Boston" },
    { name: "Charlie", age: 25, city: "NYC" },
    { name: "Bob", age: 35, city: "NYC" },
  ]);

  const result = data.distinct("name");

  // Should return 3 unique names: Alice, Bob, Charlie
  expect(result.nrows()).toBe(3);

  // Should only have the 'name' column (SQL-like behavior)
  expect(result.columns()).toEqual(["name"]);

  const names = [...result].map((r) => r.name).sort();
  expect(names).toEqual(["Alice", "Bob", "Charlie"]);
});

Deno.test("distinct - multiple columns return unique combinations", () => {
  const data = createDataFrame([
    { region: "North", product: "Widget", quantity: 10 },
    { region: "North", product: "Widget", quantity: 20 },
    { region: "South", product: "Widget", quantity: 15 },
    { region: "North", product: "Gadget", quantity: 5 },
    { region: "South", product: "Widget", quantity: 25 },
  ]);

  const result = data.distinct("region", "product");

  // Should return 3 unique combinations: North+Widget, South+Widget, North+Gadget
  expect(result.nrows()).toBe(3);

  // Should only have the specified columns
  expect(result.columns()).toEqual(["region", "product"]);

  const combinations = [...result].map((r) => `${r.region}+${r.product}`)
    .sort();
  expect(combinations).toEqual([
    "North+Gadget",
    "North+Widget",
    "South+Widget",
  ]);
});

Deno.test("distinct - preserves first occurrence", () => {
  const data = createDataFrame([
    { category: "A", value: 100 },
    { category: "B", value: 200 },
    { category: "A", value: 300 }, // Second occurrence of 'A'
    { category: "C", value: 400 },
  ]);

  const result = data.distinct("category");

  expect(result.nrows()).toBe(3);

  // Should only return the category column
  expect(result.columns()).toEqual(["category"]);
});

Deno.test("distinct - empty dataframe", () => {
  const empty = createDataFrame([] as { name: string; age: number }[]);
  const result = empty.distinct("name");
  expect(result.nrows()).toBe(0);
});

Deno.test("distinct - handles null and undefined", () => {
  const data = createDataFrame([
    { id: 1, status: null },
    { id: 2, status: "active" },
    { id: 3, status: null },
    { id: 4, status: undefined },
    { id: 5, status: "active" },
    { id: 6, status: undefined },
  ]);

  const result = data.distinct("status");

  // Should return 3 unique status values: null, "active", undefined
  expect(result.nrows()).toBe(3);

  expect(result.columns()).toEqual(["status"]);
});

Deno.test("distinct - grouped data works within groups", () => {
  const data = createDataFrame([
    { year: 2023, product: "Widget", sales: 100 },
    { year: 2023, product: "Gadget", sales: 150 },
    { year: 2023, product: "Widget", sales: 200 }, // Duplicate product within 2023
    { year: 2024, product: "Widget", sales: 120 },
    { year: 2024, product: "Widget", sales: 180 }, // Duplicate product within 2024
  ]);

  const grouped = data.groupBy("year");
  const result = grouped.distinct("product");

  // Should have 3 rows: 2 from 2023 (Widget, Gadget), 1 from 2024 (Widget)
  expect(result.nrows()).toBe(3);

  // Should preserve grouping
  expect(result.__groups).toBeDefined();
  expect(result.__groups?.groupingColumns).toEqual(["year"]);

  // Should include both grouping column and selected column
  expect(result.columns()).toEqual(["year", "product"]);
});

Deno.test("distinct - all duplicates returns single row", () => {
  const data = createDataFrame([
    { status: "active", count: 1 },
    { status: "active", count: 2 },
    { status: "active", count: 3 },
    { status: "active", count: 4 },
  ]);

  const result = data.distinct("status");

  expect(result.nrows()).toBe(1);
  expect(result[0].status).toBe("active");

  expect(result.columns()).toEqual(["status"]);
});

Deno.test("distinct - works like SQL SELECT DISTINCT", () => {
  const data = createDataFrame([
    { customer: "Alice", product: "Book", price: 10 },
    { customer: "Bob", product: "Book", price: 10 },
    { customer: "Alice", product: "Pen", price: 2 },
    { customer: "Bob", product: "Book", price: 12 },
    { customer: "Alice", product: "Book", price: 10 },
  ]);

  // Get unique customers
  const customers = data.distinct("customer");
  expect(customers.nrows()).toBe(2); // Alice, Bob
  expect(customers.columns()).toEqual(["customer"]);

  // Get unique products
  const products = data.distinct("product");
  expect(products.nrows()).toBe(2); // Book, Pen
  expect(products.columns()).toEqual(["product"]);

  // Get unique customer+product combinations
  const customerProducts = data.distinct("customer", "product");
  expect(customerProducts.nrows()).toBe(3); // Alice+Book, Bob+Book, Alice+Pen
  expect(customerProducts.columns()).toEqual(["customer", "product"]);
});
