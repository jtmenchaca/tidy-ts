import { expect } from "@std/expect";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

Deno.test("innerJoin - basic array API", () => {
  const employees = createDataFrame([
    { dept_id: 10, year: 2023, name: "Alice", salary: 50000 },
    { dept_id: 20, year: 2023, name: "Bob", salary: 60000 },
  ]);

  const budgets = createDataFrame([
    { dept_id: 10, year: 2023, budget: 100000 },
  ]);

  const result = employees.innerJoin(budgets, ["dept_id", "year"]);

  // Type check: inner join should have all columns from both sides (no undefined)
  const _typeCheck: DataFrame<{
    dept_id: number; // Key field (required)
    year: number; // Key field (required)
    name: string; // Left column (required)
    salary: number; // Left column (required)
    budget: number; // Right column (required - inner join guarantees match)
  }> = result;

  expect(result.toArray()).toEqual([
    { dept_id: 10, year: 2023, name: "Alice", salary: 50000, budget: 100000 },
  ]);
});

Deno.test("innerJoin - object API with same column names", () => {
  const sales = createDataFrame([
    { region: "North", product: "A", sales: 100 },
    { region: "South", product: "A", sales: 80 },
  ]);

  const inventory = createDataFrame([
    { region: "North", product: "A", stock: 50 },
  ]);

  const result = sales.innerJoin(inventory, {
    keys: ["region", "product"],
  });

  // Type check: object API with same column names
  const _objectAPITypeCheck: DataFrame<{
    region: string; // Key field (required)
    product: string; // Key field (required)
    sales: number; // Left column (required)
    stock: number; // Right column (required - inner join guarantees match)
  }> = result;

  expect(result.toArray()).toEqual([
    { region: "North", product: "A", sales: 100, stock: 50 },
  ]);
});

Deno.test("innerJoin - object API with different column names", () => {
  const employees = createDataFrame([
    { emp_id: 1, emp_dept: 10, name: "Alice" },
    { emp_id: 2, emp_dept: 20, name: "Bob" },
  ]);

  const departments = createDataFrame([
    { dept_id: 10, dept_name: "Engineering" },
  ]);

  const result = employees.innerJoin(departments, {
    keys: { left: "emp_dept", right: "dept_id" },
  });

  // Type check: object API with different column names - both key columns preserved
  const _differentColumnsTypeCheck: DataFrame<{
    emp_id: number; // Left column (required)
    emp_dept: number; // Left join key (required)
    name: string; // Left column (required)
    dept_id: number; // Right join key (required - inner join guarantees match)
    dept_name: string; // Right column (required - inner join guarantees match)
  }> = result;

  expect(result.toArray()).toEqual([
    {
      emp_id: 1,
      emp_dept: 10,
      name: "Alice",
      dept_id: 10,
      dept_name: "Engineering",
    },
  ]);
});

Deno.test("innerJoin - object API with suffixes", () => {
  const left = createDataFrame([
    { region: "North", product: "Gadget", quarter: "Q1" },
    { region: "South", product: "Gadget", quarter: "Q1" },
  ]);

  const right = createDataFrame([
    { region: "North", product: "Gadget", quarter: "Q2" },
  ]);

  const result = left.innerJoin(right, {
    keys: ["region", "product"],
    suffixes: { left: "_actual", right: "_target" },
  });

  // Type check: inner join with suffixes for conflicting columns
  const _suffixesTypeCheck: DataFrame<{
    region: string; // Join key (required)
    product: string; // Join key (required)
    quarter_actual: string; // Left non-key field with suffix (required - inner join guarantees match)
    quarter_target: string; // Right non-key field with suffix (required - inner join guarantees match)
  }> = result;

  expect(result.toArray()).toEqual([
    {
      region: "North",
      product: "Gadget",
      quarter_actual: "Q1",
      quarter_target: "Q2",
    },
  ]);
});

Deno.test("innerJoin - object API with different multi-column names", () => {
  const orders = createDataFrame([
    { order_region: "North", order_product: "A", quantity: 10 },
    { order_region: "South", order_product: "B", quantity: 20 },
  ]);

  const inventory = createDataFrame([
    { inv_region: "North", inv_product: "A", stock: 100 },
  ]);

  const result = orders.innerJoin(inventory, {
    keys: {
      left: ["order_region", "order_product"],
      right: ["inv_region", "inv_product"],
    },
  });

  // Type check: object API with different multi-column names - both key columns preserved
  const _multiColumnTypeCheck: DataFrame<{
    order_region: string; // Left key column (required)
    order_product: string; // Left key column (required)
    quantity: number; // Left column (required)
    inv_region: string; // Right key column (required - inner join guarantees match)
    inv_product: string; // Right key column (required - inner join guarantees match)
    stock: number; // Right column (required - inner join guarantees match)
  }> = result;

  expect(result.toArray()).toEqual([
    {
      order_region: "North",
      order_product: "A",
      quantity: 10,
      inv_region: "North",
      inv_product: "A",
      stock: 100,
    },
  ]);
});
