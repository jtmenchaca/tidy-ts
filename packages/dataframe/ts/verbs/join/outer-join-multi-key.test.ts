import { expect } from "@std/expect";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

Deno.test("outerJoin - basic array API", () => {
  const employees = createDataFrame([
    { dept_id: 10, year: 2023, name: "Alice", salary: 50000 },
    { dept_id: 30, year: 2023, name: "Charlie", salary: 45000 },
  ]);

  const budgets = createDataFrame([
    { dept_id: 10, year: 2023, budget: 100000 },
    { dept_id: 20, year: 2023, budget: 80000 },
  ]);

  const result = employees.outerJoin(budgets, ["dept_id", "year"]);

  // Type check: outer join array API with same column names
  const _basicArrayTypeCheck: DataFrame<{
    dept_id: number; // Join key (required)
    year: number; // Join key (required)
    name: string | undefined; // Left non-key field (undefined for unmatched)
    salary: number | undefined; // Left non-key field (undefined for unmatched)
    budget: number | undefined; // Right non-key field (undefined for unmatched)
  }> = result;

  expect(result.toArray()).toEqual([
    { dept_id: 10, year: 2023, name: "Alice", salary: 50000, budget: 100000 },
    {
      dept_id: 30,
      year: 2023,
      name: "Charlie",
      salary: 45000,
      budget: undefined,
    },
    {
      dept_id: 20,
      year: 2023,
      name: undefined,
      salary: undefined,
      budget: 80000,
    },
  ]);
});

Deno.test("outerJoin - object API with same column names", () => {
  const sales = createDataFrame([
    { region: "North", product: "A", sales: 100 },
    { region: "West", product: "A", sales: 90 },
  ]);

  const inventory = createDataFrame([
    { region: "North", product: "A", stock: 50 },
    { region: "South", product: "A", stock: 30 },
  ]);

  const result = sales.outerJoin(inventory, {
    keys: ["region", "product"],
  });

  // Type check: outer join object API with same column names
  const _sameNamesTypeCheck: DataFrame<{
    region: string; // Join key (required)
    product: string; // Join key (required)
    sales: number | undefined; // Left non-key field (undefined for unmatched)
    stock: number | undefined; // Right non-key field (undefined for unmatched)
  }> = result;

  expect(result.toArray()).toEqual([
    { region: "North", product: "A", sales: 100, stock: 50 },
    { region: "West", product: "A", sales: 90, stock: undefined },
    { region: "South", product: "A", sales: undefined, stock: 30 },
  ]);
});

Deno.test("outerJoin - object API with different column names", () => {
  const employees = createDataFrame([
    { emp_id: 1, emp_dept: 10, name: "Alice" },
    { emp_id: 3, emp_dept: 30, name: "Charlie" },
  ]);

  const departments = createDataFrame([
    { dept_id: 10, dept_name: "Engineering" },
    { dept_id: 20, dept_name: "Marketing" },
  ]);

  const result = employees.outerJoin(departments, {
    keys: { left: "emp_dept", right: "dept_id" },
  });

  // Type check: outer join with different column names preserves both key columns
  const _diffNamesTypeCheck: DataFrame<{
    emp_id: number | undefined; // Left non-key field (undefined for unmatched)
    emp_dept: number | undefined; // Left join key (undefined for unmatched)
    name: string | undefined; // Left non-key field (undefined for unmatched)
    dept_id: number | undefined; // Right join key (undefined for unmatched)
    dept_name: string | undefined; // Right non-key field (undefined for unmatched)
  }> = result;

  expect(result.toArray()).toEqual([
    {
      emp_id: 1,
      emp_dept: 10,
      name: "Alice",
      dept_id: 10,
      dept_name: "Engineering",
    },
    {
      emp_id: 3,
      emp_dept: 30,
      name: "Charlie",
      dept_id: undefined,
      dept_name: undefined,
    },
    {
      emp_id: undefined,
      emp_dept: undefined,
      name: undefined,
      dept_id: 20,
      dept_name: "Marketing",
    },
  ]);
});

Deno.test("outerJoin - object API with suffixes", () => {
  const left = createDataFrame([
    { region: "North", product: "Gadget", quarter: "Q1" },
    { region: "West", product: "Gadget", quarter: "Q1" },
  ]);

  const right = createDataFrame([
    { region: "North", product: "Gadget", quarter: "Q2" },
    { region: "South", product: "Gadget", quarter: "Q2" },
  ]);

  const result = left.outerJoin(right, {
    keys: ["region", "product"],
    suffixes: { left: "_actual", right: "_target" },
  });

  // Type check: outer join with suffixes for conflicting columns
  const _suffixesTypeCheck: DataFrame<{
    region: string; // Join key (required)
    product: string; // Join key (required)
    quarter_actual: string | undefined; // Left non-key field with suffix (undefined for unmatched)
    quarter_target: string | undefined; // Right non-key field with suffix (undefined for unmatched)
  }> = result;

  expect(result.toArray()).toEqual([
    {
      region: "North",
      product: "Gadget",
      quarter_actual: "Q1",
      quarter_target: "Q2",
    },
    {
      region: "West",
      product: "Gadget",
      quarter_actual: "Q1",
      quarter_target: undefined,
    },
    {
      region: "South",
      product: "Gadget",
      quarter_actual: undefined,
      quarter_target: "Q2",
    },
  ]);
});

Deno.test("outerJoin - object API with different multi-column names", () => {
  const orders = createDataFrame([
    { order_region: "North", order_product: "A", quantity: 10 },
    { order_region: "West", order_product: "C", quantity: 5 },
  ]);

  const inventory = createDataFrame([
    { inv_region: "North", inv_product: "A", stock: 100 },
    { inv_region: "South", inv_product: "B", stock: 50 },
  ]);

  const result = orders.outerJoin(inventory, {
    keys: {
      left: ["order_region", "order_product"],
      right: ["inv_region", "inv_product"],
    },
  });

  // Type check: outer join with different multi-column names
  // TODO: Fix outer join type system to properly infer multi-column different names
  const _multiColNamesTypeCheck = result;

  expect(result.toArray()).toEqual([
    {
      order_region: "North",
      order_product: "A",
      quantity: 10,
      inv_region: "North",
      inv_product: "A",
      stock: 100,
    },
    {
      order_region: "West",
      order_product: "C",
      quantity: 5,
      inv_region: undefined,
      inv_product: undefined,
      stock: undefined,
    },
    {
      order_region: undefined,
      order_product: undefined,
      quantity: undefined,
      inv_region: "South",
      inv_product: "B",
      stock: 50,
    },
  ]);
});
