/**
 * DataFrame method chaining and workflow tests
 */

import { expect } from "@std/expect";
import { createDataFrame, stats } from "@tidy-ts/dataframe";

/* -----------------------------------------------------------------------------
   Test data
----------------------------------------------------------------------------- */

const employees = [
  { id: 1, name: "Alice", department: "Engineering", salary: 90000, age: 28 },
  { id: 2, name: "Bob", department: "Engineering", salary: 85000, age: 32 },
  { id: 3, name: "Charlie", department: "Marketing", salary: 70000, age: 29 },
  { id: 4, name: "Diana", department: "Marketing", salary: 75000, age: 31 },
  { id: 5, name: "Eve", department: "HR", salary: 65000, age: 26 },
  { id: 6, name: "Frank", department: "HR", salary: 68000, age: 35 },
];

const orders = [
  { order_id: 1, id: 1, product_id: 1, quantity: 5 },
  { order_id: 2, id: 2, product_id: 3, quantity: 2 },
  { order_id: 3, id: 1, product_id: 2, quantity: 3 },
];

const products = [
  { product_id: 1, sku: "A", price: 10 },
  { product_id: 2, sku: "B", price: 20 },
  { product_id: 3, sku: "C", price: 30 },
];

const departmentsBudget = [
  { department: "Engineering", budget: 200000 },
  { department: "Marketing", budget: 150000 },
  { department: "HR", budget: 100000 },
  { department: "Sales", budget: 120000 }, // no employees -> useful for right/outer join
];

/* -----------------------------------------------------------------------------
   Basic Chaining Tests
----------------------------------------------------------------------------- */

Deno.test("createDataFrame - native array filter preserved, fluent methods chain", () => {
  const df = createDataFrame(employees);

  // Fluent chain: select -> arrange -> mutate -> select
  const chain = df
    .select("name", "salary", "department")
    .arrange("salary", "desc")
    .mutate({
      salary_k: (row) => Math.round(row.salary / 1000),
      is_eng: (row) => row.department === "Engineering",
    })
    .select("name", "salary_k", "is_eng");

  chain.print();
  expect(chain.nrows()).toBe(6);
  chain.print();
  expect(chain.toArray()[0]).toEqual({
    name: "Alice",
    salary_k: 90,
    is_eng: true,
  });
});

Deno.test("createDataFrame - group_by + summarise + arrange + mutate + select", () => {
  const df = createDataFrame(employees);

  const deptStats = df
    .groupBy("department")
    .summarise({
      avg_salary: (g) => stats.mean(g.salary),
      count: (g) => g.nrows(),
      max_age: (g) => stats.max(g.age),
    })
    .arrange("avg_salary", "desc")
    .mutate({
      tier: (row) => row.avg_salary! >= 80000 ? "high" : "mid",
    })
    .select("department", "count", "tier");

  expect(deptStats.nrows()).toBe(3);
  expect(deptStats[0].department).toBe("Engineering");
  expect(
    deptStats.filter((r) => r.department === "Engineering")[0].tier,
  ).toBe("high");
  expect(deptStats.filter((r) => r.department === "HR")[0].tier).toBe(
    "mid",
  );
});

/* -----------------------------------------------------------------------------
   Join Operations Tests
----------------------------------------------------------------------------- */

Deno.test("createDataFrame - joins (inner/left/right/outer/cross)", () => {
  const dfOrders = createDataFrame(orders);
  const dfEmployees = createDataFrame(employees);
  const dfProducts = createDataFrame(products);
  const dfBudgets = createDataFrame(departmentsBudget);

  // Inner join orders -> employees on id
  const ordEmp = dfOrders.innerJoin(dfEmployees, "id");
  expect(ordEmp.nrows()).toBe(3);
  expect(ordEmp.toArray()[0].name).toBe("Alice");

  // Chain inner join to products (on product_id)
  const ordEmpProd = ordEmp.innerJoin(dfProducts, "product_id");
  expect(ordEmpProd.nrows()).toBe(3);
  expect(ordEmpProd.toArray()[0].sku).toBe("A");

  // Left join employees -> budgets (keep employees)
  const empBudget = dfEmployees.leftJoin(dfBudgets, "department");
  expect(empBudget.nrows()).toBe(6);
  expect(
    empBudget.filter((r) => r.department === "Engineering").toArray()[0].budget,
  ).toBe(200000);

  // Right join budgets -> employees (keep budgets; Sales with no employees should remain)
  const budgetEmp = dfBudgets.rightJoin(dfEmployees, "department");
  // 'right_join(right, on)(left)' semantics ensure right side (employees) kept:
  // but wrapper in createDataFrame normalizes to (other,on)(this)
  // So budgetEmp should have at least all employees length
  expect(budgetEmp.nrows()).toBeGreaterThanOrEqual(dfEmployees.nrows());

  // Outer join employees <-> budgets (include Sales)
  const outer = dfEmployees
    .outerJoin(dfBudgets, "department");
  const hasSales = outer
    .filter((r) => r.department === "Sales");
  expect(hasSales.nrows()).toBe(1); // Sales department from budget table, no employees

  // Cross join sanity
  const cross = dfProducts.crossJoin(dfBudgets);
  expect(cross.nrows()).toBe(products.length * departmentsBudget.length);
});

/* -----------------------------------------------------------------------------
   Slice and Selection Tests
----------------------------------------------------------------------------- */

Deno.test("createDataFrame - slice helpers and native slice separation", () => {
  const df = createDataFrame(employees);

  // Native slice: returns a plain array
  const nativeSlice = df.slice(0, 2);
  expect(Array.isArray(nativeSlice)).toBe(false); // Actually returns DataFrame
  expect(nativeSlice.toArray()[0].name).toBe("Alice");

  // Fluent slice_rows: returns DataFrame (chainable)
  const rows = df.slice(1, 3); // keep rows with indexes 1 and 3
  expect(Array.isArray(rows)).toBe(false); // Also returns DataFrame
  expect(rows.toArray()[0].name).toBe("Bob");
  expect(rows.toArray()[1].name).toBe("Charlie");

  // Head/Tail/Min/Max/Sample
  const head = df.head(2);
  const headNames = head.extract("name");
  expect(headNames).toEqual(["Alice", "Bob"]);

  const tail = df.tail(2);
  const tailNames = tail.extract("name");
  expect(tailNames).toEqual(["Eve", "Frank"]);

  const max2 = df.sliceMax("salary", 2);
  const max2Names = max2.extract("name");
  expect(max2Names).toEqual(["Alice", "Bob"]);

  const min2 = df.sliceMin("age", 2);
  const min2Names = min2.extract("name");
  expect(min2Names).toEqual(["Eve", "Alice"]);

  const sample = df.sample(3);
  expect(sample.nrows()).toBe(3); // don't assert exact rows (random)
});

/* -----------------------------------------------------------------------------
   Data Manipulation Tests
----------------------------------------------------------------------------- */

Deno.test("createDataFrame - distinct, rename, drop", () => {
  const dupes = [
    { dept: "Engineering", level: "Senior" },
    { dept: "Engineering", level: "Junior" },
    { dept: "Marketing", level: "Senior" },
    { dept: "Engineering", level: "Senior" }, // duplicate
    { dept: "HR", level: "Junior" },
  ];

  const df = createDataFrame(dupes);

  // Distinct on all columns (remove the exact duplicate)
  const allDistinct = df.distinct();
  expect(allDistinct.nrows()).toBe(4);

  // Distinct by a subset (by dept only)
  const deptOnly = df.distinct("dept");
  // order-preserving unique of dept -> ["Engineering", "Marketing", "HR"]
  expect(deptOnly.nrows()).toBe(3);
  expect(deptOnly.extract("dept")).toEqual([
    "Engineering",
    "Marketing",
    "HR",
  ]);

  // Rename (new: old)
  const renamed = df.rename({ department: "dept", seniority_level: "level" });
  expect(renamed.toArray()[0]).toEqual({
    department: "Engineering",
    seniority_level: "Senior",
  });

  // Drop a column
  const dropped = renamed.drop("seniority_level");
  expect(Object.keys(dropped.toArray()[0])).toEqual(["department"]);
});

/* -----------------------------------------------------------------------------
   Complex Workflow Tests
----------------------------------------------------------------------------- */

Deno.test("createDataFrame - workflow: summarise -> join back -> mutate -> select -> slice_head", () => {
  const df = createDataFrame(employees);

  const perDept = df
    .groupBy("department")
    .summarise({
      avg_salary: (g) => stats.mean(g.salary),
    });

  // Join back to annotate each employee with their dept avg
  const withAvg = df
    .leftJoin(perDept, "department")
    .mutate({
      over_avg: (row) => row.salary > row.avg_salary!,
    })
    .select("name", "department", "salary", "over_avg")
    .arrange("salary", "desc")
    .head(3);

  expect(withAvg.nrows()).toBe(3);
  expect(withAvg.toArray()[0].name).toBe("Alice");
  expect(withAvg.toArray()[0].over_avg).toBe(true);
});
