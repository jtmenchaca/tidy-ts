import { expect } from "@std/expect";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

Deno.test("leftJoin - basic array API", () => {
  const employees = createDataFrame([
    { dept_id: 10, year: 2023, name: "Alice", salary: 50000 },
    { dept_id: 20, year: 2023, name: "Bob", salary: 60000 },
  ]);

  const budgets = createDataFrame([
    { dept_id: 10, year: 2023, budget: 100000 },
  ]);

  const result = employees.leftJoin(budgets, ["dept_id", "year"]);

  // Type check: left join should preserve all left columns and add right columns as possibly undefined
  const _typeCheck: DataFrame<{
    dept_id: number; // Key field (required)
    year: number; // Key field (required)
    name: string; // Left column (required)
    salary: number; // Left column (required)
    budget: number | undefined; // Right column (optional due to left join)
  }> = result;

  expect(result.toArray()).toEqual([
    { dept_id: 10, year: 2023, name: "Alice", salary: 50000, budget: 100000 },
    { dept_id: 20, year: 2023, name: "Bob", salary: 60000, budget: undefined },
  ]);
});

Deno.test("leftJoin - object API with same column names", () => {
  const sales = createDataFrame([
    { region: "North", product: "A", sales: 100 },
    { region: "South", product: "A", sales: 80 },
  ]);

  const inventory = createDataFrame([
    { region: "North", product: "A", stock: 50 },
  ]);

  const result = sales.leftJoin(inventory, {
    keys: ["region", "product"],
  });

  // Type check: object API with same column names
  const _objectAPITypeCheck: DataFrame<{
    region: string; // Key field (required)
    product: string; // Key field (required)
    sales: number; // Left column (required)
    stock: number | undefined; // Right column (optional due to left join)
  }> = result;

  expect(result.toArray()).toEqual([
    { region: "North", product: "A", sales: 100, stock: 50 },
    { region: "South", product: "A", sales: 80, stock: undefined },
  ]);
});

Deno.test("leftJoin - object API with different column names", () => {
  const employees = createDataFrame([
    { emp_id: 1, emp_dept: 10, name: "Alice" },
    { emp_id: 2, emp_dept: 20, name: "Bob" },
  ]);

  const departments = createDataFrame([
    { dept_id: 10, dept_name: "Engineering" },
  ]);

  const result = employees.leftJoin(departments, {
    keys: { left: "emp_dept", right: "dept_id" },
  });

  // Type check: object API with different column names - both key columns preserved
  const _differentColumnsTypeCheck: DataFrame<{
    emp_id: number; // Left column (required)
    emp_dept: number; // Left join key (required)
    name: string; // Left column (required)
    dept_id: number | undefined; // Right join key (optional due to left join)
    dept_name: string | undefined; // Right column (optional due to left join)
  }> = result;

  console.table(result);

  expect(result.toArray()).toEqual([
    {
      emp_id: 1,
      emp_dept: 10,
      name: "Alice",
      dept_id: 10,
      dept_name: "Engineering",
    },
    {
      emp_id: 2,
      emp_dept: 20,
      name: "Bob",
      dept_id: undefined,
      dept_name: undefined,
    },
  ]);
});

Deno.test("leftJoin - object API with suffixes", () => {
  const left = createDataFrame([
    { region: "North", product: "Gadget", quarter: "Q1" },
    { region: "South", product: "Gadget", quarter: "Q1" },
  ]);

  const right = createDataFrame([
    { region: "North", product: "Gadget", quarter: "Q2" },
  ]);

  const result = left.leftJoin(right, {
    keys: ["region", "product"],
    suffixes: { left: "_actual", right: "_target" },
  });

  // Type check: object API with suffixes for column collisions
  // Now with suffix-aware type system - should correctly infer transformed column names
  const _suffixesTypeCheck: DataFrame<{
    region: string; // Key field (required)
    product: string; // Key field (required)
    quarter_actual: string; // Left column with suffix (required)
    quarter_target: string | undefined; // Right column with suffix (optional due to left join)
  }> = result;

  expect(result.toArray()).toEqual([
    {
      region: "North",
      product: "Gadget",
      quarter_actual: "Q1",
      quarter_target: "Q2",
    },
    {
      region: "South",
      product: "Gadget",
      quarter_actual: "Q1",
      quarter_target: undefined,
    },
  ]);
});

Deno.test("leftJoin - object API with different multi-column names", () => {
  const orders = createDataFrame([
    { order_region: "North", order_product: "A", quantity: 10 },
    { order_region: "South", order_product: "B", quantity: 20 },
  ]);

  const inventory = createDataFrame([
    { inv_region: "North", inv_product: "A", stock: 100 },
  ]);

  const result = orders.leftJoin(inventory, {
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
    inv_region: string | undefined; // Right key column (optional due to left join)
    inv_product: string | undefined; // Right key column (optional due to left join)
    stock: number | undefined; // Right column (optional due to left join)
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
    {
      order_region: "South",
      order_product: "B",
      quantity: 20,
      inv_region: undefined,
      inv_product: undefined,
      stock: undefined,
    },
  ]);
});
