import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("crossJoin - basic Cartesian product", () => {
  const colors = createDataFrame([
    { color: "red" },
    { color: "blue" },
  ]);

  const sizes = createDataFrame([
    { size: "S" },
    { size: "M" },
    { size: "L" },
  ]);

  const result = colors.crossJoin(sizes);

  expect(result.toArray()).toEqual([
    { color: "red", size: "S" },
    { color: "red", size: "M" },
    { color: "red", size: "L" },
    { color: "blue", size: "S" },
    { color: "blue", size: "M" },
    { color: "blue", size: "L" },
  ]);
  expect(result.nrows()).toBe(6); // 2 × 3
});

Deno.test("crossJoin - with overlapping column names", () => {
  const left = createDataFrame([
    { id: 1, value: "A" },
    { id: 2, value: "B" },
  ]);

  const right = createDataFrame([
    { id: 10, value: "X" },
    { id: 20, value: "Y" },
  ]);

  const result = left.crossJoin(right);

  // Note: The right columns override left columns with same name
  expect(result.toArray()).toEqual([
    { id: 10, value: "X" },
    { id: 20, value: "Y" },
    { id: 10, value: "X" },
    { id: 20, value: "Y" },
  ]);
});

Deno.test("crossJoin - with numeric data", () => {
  const prices = createDataFrame([
    { price: 10 },
    { price: 20 },
  ]);

  const quantities = createDataFrame([
    { quantity: 1 },
    { quantity: 2 },
    { quantity: 3 },
  ]);

  const result = prices.crossJoin(quantities);

  expect(result.toArray()).toEqual([
    { price: 10, quantity: 1 },
    { price: 10, quantity: 2 },
    { price: 10, quantity: 3 },
    { price: 20, quantity: 1 },
    { price: 20, quantity: 2 },
    { price: 20, quantity: 3 },
  ]);
});

Deno.test("crossJoin - empty left dataframe", () => {
  const emptyData: { fake_id: number; homeworld: string }[] = [];

  const empty = createDataFrame(emptyData);
  const sizes = createDataFrame([
    { size: "S" },
    { size: "M" },
  ]);

  const result = empty.crossJoin(sizes);

  expect(result.toArray()).toEqual([]);
});

Deno.test("crossJoin - empty right dataframe", () => {
  const colors = createDataFrame([
    { color: "red" },
    { color: "blue" },
  ]);
  const emptyData: { fake_id: number; homeworld: string }[] = [];
  const empty = createDataFrame(emptyData);

  const result = colors.crossJoin(empty);

  expect(result.toArray()).toEqual([]);
});

Deno.test("crossJoin - both dataframes empty", () => {
  const emptyData: { fake_id: number; homeworld: string }[] = [];
  const empty1 = createDataFrame(emptyData);
  const empty2 = createDataFrame(emptyData);

  const result = empty1.crossJoin(empty2);

  expect(result.toArray()).toEqual([]);
});

Deno.test("crossJoin - single row each", () => {
  const left = createDataFrame([
    { name: "Luke" },
  ]);

  const right = createDataFrame([
    { planet: "Tatooine" },
  ]);

  const result = left.crossJoin(right);

  expect(result.toArray()).toEqual([
    { name: "Luke", planet: "Tatooine" },
  ]);
  expect(result.nrows()).toBe(1); // 1 × 1
});

Deno.test("crossJoin - larger dataset", () => {
  const departments = createDataFrame([
    { dept: "Sales" },
    { dept: "Engineering" },
    { dept: "Marketing" },
    { dept: "HR" },
  ]);

  const years = createDataFrame([
    { year: 2022 },
    { year: 2023 },
    { year: 2024 },
  ]);

  const result = departments.crossJoin(years);

  expect(result.nrows()).toBe(12); // 4 × 3

  // Check first few and last few combinations
  expect(result[0]).toEqual({ dept: "Sales", year: 2022 });
  expect(result[1]).toEqual({ dept: "Sales", year: 2023 });
  expect(result[2]).toEqual({ dept: "Sales", year: 2024 });
  expect(result[9]).toEqual({ dept: "HR", year: 2022 });
  expect(result[10]).toEqual({ dept: "HR", year: 2023 });
  expect(result[11]).toEqual({ dept: "HR", year: 2024 });
});

Deno.test("crossJoin - complex objects", () => {
  const products = createDataFrame([
    { id: 1, name: "Widget", price: 10.99 },
    { id: 2, name: "Gadget", price: 24.99 },
  ]);

  const stores = createDataFrame([
    { store_id: "A", location: "Downtown", tax_rate: 0.08 },
    { store_id: "B", location: "Mall", tax_rate: 0.09 },
  ]);

  const result = products.crossJoin(stores);

  expect(result.toArray()).toEqual([
    {
      id: 1,
      name: "Widget",
      price: 10.99,
      store_id: "A",
      location: "Downtown",
      tax_rate: 0.08,
    },
    {
      id: 1,
      name: "Widget",
      price: 10.99,
      store_id: "B",
      location: "Mall",
      tax_rate: 0.09,
    },
    {
      id: 2,
      name: "Gadget",
      price: 24.99,
      store_id: "A",
      location: "Downtown",
      tax_rate: 0.08,
    },
    {
      id: 2,
      name: "Gadget",
      price: 24.99,
      store_id: "B",
      location: "Mall",
      tax_rate: 0.09,
    },
  ]);
});

Deno.test("crossJoin - with maxRows limit", () => {
  const left = createDataFrame([
    { id: 1, name: "A" },
    { id: 2, name: "B" },
    { id: 3, name: "C" },
  ]);

  const right = createDataFrame([
    { x: 10, y: "X" },
    { x: 20, y: "Y" },
    { x: 30, z: "Z" },
  ]);

  // maxRows parameter limits the result to 4 rows
  const result = left.crossJoin(right, 4);

  expect(result.nrows()).toBe(4); // Limited to maxRows
  // Should get first 4 combinations
  expect(result.toArray()[0]).toEqual({
    id: 1,
    name: "A",
    x: 10,
    y: "X",
    z: undefined,
  });
  expect(result.toArray()[1]).toEqual({
    id: 1,
    name: "A",
    x: 20,
    y: "Y",
    z: undefined,
  });
  expect(result.toArray()[2]).toEqual({
    id: 1,
    name: "A",
    x: 30,
    y: undefined,
    z: "Z",
  });
  expect(result.toArray()[3]).toEqual({
    id: 2,
    name: "B",
    x: 10,
    y: "X",
    z: undefined,
  });
});

Deno.test("crossJoin - maxRows smaller than left size", () => {
  const left = createDataFrame([
    { id: 1, name: "A" },
    { id: 2, name: "B" },
  ]);

  const right = createDataFrame([
    { x: 10, y: "X" },
    { x: 20, y: "Y" },
  ]);

  // maxRows parameter limits the result to 2 rows
  const result = left.crossJoin(right, 2);

  expect(result.nrows()).toBe(2); // Limited to maxRows
  expect(result.toArray()[0]).toEqual({ id: 1, name: "A", x: 10, y: "X" });
  expect(result.toArray()[1]).toEqual({ id: 1, name: "A", x: 20, y: "Y" });
});

Deno.test("crossJoin - maxRows larger than total combinations", () => {
  const left = createDataFrame([
    { id: 1, name: "A" },
    { id: 2, name: "B" },
  ]);

  const right = createDataFrame([
    { x: 10, y: "X" },
    { x: 20, y: "Y" },
  ]);

  // Limit larger than total combinations (4)
  const result = left.crossJoin(right, 10);

  expect(result.nrows()).toBe(4); // Should get all combinations
  expect(result[0]).toEqual({ id: 1, name: "A", x: 10, y: "X" });
  expect(result[1]).toEqual({ id: 1, name: "A", x: 20, y: "Y" });
  expect(result[2]).toEqual({ id: 2, name: "B", x: 10, y: "X" });
  expect(result[3]).toEqual({ id: 2, name: "B", x: 20, y: "Y" });
});
