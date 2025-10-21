import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Joining - Inner Join", () => {
  const employees = createDataFrame([
    { emp_id: 1, name: "Alice", dept_id: 10 },
    { emp_id: 2, name: "Bob", dept_id: 20 },
    { emp_id: 3, name: "Charlie", dept_id: 10 },
  ]);

  const departments = createDataFrame([
    { dept_id: 10, dept_name: "Engineering" },
    { dept_id: 20, dept_name: "Marketing" },
  ]);

  const joined = employees.innerJoin(departments, "dept_id");

  joined.print("Inner Join Result:");

  expect(joined.nrows()).toBe(3);
  expect(joined.columns()).toContain("emp_id");
  expect(joined.columns()).toContain("name");
  expect(joined.columns()).toContain("dept_name");
});

Deno.test("Joining - Left Join", () => {
  const employees = createDataFrame([
    { emp_id: 1, name: "Alice", dept_id: 10 },
    { emp_id: 2, name: "Bob", dept_id: 20 },
    { emp_id: 3, name: "Charlie", dept_id: 30 },
  ]);

  const departments = createDataFrame([
    { dept_id: 10, dept_name: "Engineering" },
    { dept_id: 20, dept_name: "Marketing" },
  ]);

  const joined = employees.leftJoin(departments, "dept_id");

  expect(joined.nrows()).toBe(3);
  expect(joined[2].dept_name).toBe(undefined);
});

Deno.test("Joining - Multi Key Join", () => {
  const sales = createDataFrame([
    { year: 2023, quarter: "Q1", product: "Widget A", sales: 1000 },
    { year: 2023, quarter: "Q2", product: "Widget B", sales: 1500 },
  ]);

  const targets = createDataFrame([
    { year: 2023, quarter: "Q1", product: "Widget A", target: 1200 },
    { year: 2023, quarter: "Q2", product: "Widget B", target: 1400 },
  ]);

  const joined = sales.innerJoin(targets, ["year", "quarter", "product"]);

  expect(joined.nrows()).toBe(2);
  expect(joined.columns()).toContain("sales");
  expect(joined.columns()).toContain("target");
});

Deno.test("Joining - Different Column Names", () => {
  const orders = createDataFrame([
    { order_id: 1, order_region: "North", order_product: "A", quantity: 10 },
    { order_id: 2, order_region: "South", order_product: "B", quantity: 20 },
  ]);

  const inventory = createDataFrame([
    { inv_region: "North", inv_product: "A", stock: 100 },
    { inv_region: "South", inv_product: "B", stock: 200 },
  ]);

  const joined = orders.innerJoin(inventory, {
    keys: {
      left: ["order_region", "order_product"],
      right: ["inv_region", "inv_product"],
    },
  });

  expect(joined.nrows()).toBe(2);
  expect(joined.columns()).toContain("order_id");
  expect(joined.columns()).toContain("stock");
});
