import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Getting Started - Quick Tutorial", () => {
  const sales = createDataFrame([
    { region: "North", product: "Widget", quantity: 10, price: 100 },
    { region: "South", product: "Widget", quantity: 20, price: 100 },
    { region: "East", product: "Widget", quantity: 8, price: 100 },
  ]);

  const analysis = sales
    .mutate({
      revenue: (r) => r.quantity * r.price,
      totalTax: (r) => {
        const taxRate = 0.08;
        const taxPerItem = taxRate * r.price;
        const totalTax = taxPerItem * r.quantity;
        return totalTax;
      },
      row_number: (_row, index) => index,
      moreQuantityThanAvg: (row, _index, df) =>
        row.quantity > s.mean(df.quantity),
    })
    .groupBy("region")
    .summarize({
      total_revenue: (group) => s.sum(group.revenue),
      avg_quantity: (group) => s.mean(group.quantity),
      product_count: (group) => group.nrows(),
    })
    .arrange("total_revenue", "desc");

  analysis.print("Sales Analysis by Region:");

  expect(analysis.nrows()).toBe(3);
  expect(analysis.columns()).toEqual([
    "region",
    "total_revenue",
    "avg_quantity",
    "product_count",
  ]);
});

Deno.test("Getting Started - Creating DataFrames from Rows", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
    { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
    { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
    { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
  ]);

  expect(people.nrows()).toBe(5);
  expect(people.ncols()).toBe(5);
});

Deno.test("Getting Started - Creating DataFrames from Columns", () => {
  const salesFromColumns = createDataFrame({
    columns: {
      region: ["North", "South", "East"],
      product: ["Widget", "Widget", "Widget"],
      quantity: [10, 20, 8],
      price: [100, 100, 100],
    },
  });

  expect(salesFromColumns.nrows()).toBe(3);
  expect(salesFromColumns.ncols()).toBe(4);
});

Deno.test("Getting Started - Adding Columns with Mutate", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  ]);

  const example = people.mutate({
    bmi: (r) => r.mass / Math.pow(r.height / 100, 2),
    is_heavy: (r) => r.mass > 100,
    row_number: (_r, idx) => idx + 1,
    cumulative_mass: (_r, _idx, df) => s.sum(df.mass),
    constant: () => "fixed_value",
  });

  example.print("DataFrame with Added Columns:");

  expect(example.nrows()).toBe(2);
  expect(example.columns()).toContain("bmi");
  expect(example.columns()).toContain("is_heavy");
});

Deno.test("Getting Started - DataFrame Properties", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  ]);

  expect(people.nrows()).toBe(2);
  expect(people[0].name).toBe("Luke");
  expect(people[people.nrows() - 1].name).toBe("C-3PO");
});

Deno.test("Getting Started - Column Access", () => {
  const people = createDataFrame([
    { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
    { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  ]);

  const names = people.name;
  const masses = people.mass;
  const species = people.species;

  expect(names).toEqual(["Luke", "C-3PO"]);
  expect(masses).toEqual([77, 75]);
  expect(s.unique(species)).toEqual(["Human", "Droid"]);
});

Deno.test("Getting Started - Empty DataFrame", () => {
  const emptyDf = createDataFrame([]);
  expect(emptyDf.isEmpty()).toBe(true);
  expect(emptyDf.nrows()).toBe(0);
});

Deno.test("Getting Started - Single Row DataFrame", () => {
  const singleRow = createDataFrame([{ id: 1, name: "Test", value: 42 }]);
  expect(singleRow.nrows()).toBe(1);
  expect(singleRow[0].name).toBe("Test");
});

Deno.test("Getting Started - Chaining Operations", () => {
  const data = createDataFrame([
    { id: 1, name: "A", value: 10 },
    { id: 2, name: "B", value: 20 },
    { id: 3, name: "A", value: 30 },
    { id: 4, name: "B", value: 40 },
  ]);

  const result = data
    .filter((r) => r.value > 15)
    .mutate({ doubled: (r) => r.value * 2 })
    .groupBy("name")
    .summarize({
      count: (group) => group.nrows(),
      total: (group) => s.sum(group.doubled),
    });

  result.print("Chained Operations Result:");

  expect(result.nrows()).toBe(2);
  expect(result.columns()).toEqual(["name", "count", "total"]);
});
