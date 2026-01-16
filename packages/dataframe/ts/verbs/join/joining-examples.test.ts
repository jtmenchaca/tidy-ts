// Joining Verbs Examples - Compiler-tested examples for all join types
import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

/**
 * InnerJoin Verb Documentation
 *
 * Keep only rows that have matching keys in both DataFrames
 *
 * @example
 * ```typescript
 * const employees = createDataFrame([
 *   { emp_id: 1, name: "Alice", dept_id: 10, salary: 50000 },
 *   { emp_id: 2, name: "Bob", dept_id: 20, salary: 60000 },
 * ]);
 *
 * const departments = createDataFrame([
 *   { dept_id: 10, dept_name: "Engineering", manager: "Eve" },
 *   { dept_id: 20, dept_name: "Marketing", manager: "Frank" },
 * ]);
 *
 * const inner = employees.innerJoin(departments, "dept_id");
 *
 * console.table(inner);
 * ```
 */
function innerJoinExample() {
  const employees = createDataFrame([
    { emp_id: 1, name: "Alice", dept_id: 10, salary: 50000 },
    { emp_id: 2, name: "Bob", dept_id: 20, salary: 60000 },
    { emp_id: 3, name: "Charlie", dept_id: 10, salary: 55000 },
  ]);

  const departments = createDataFrame([
    { dept_id: 10, dept_name: "Engineering", manager: "Eve" },
    { dept_id: 20, dept_name: "Marketing", manager: "Frank" },
  ]);

  const inner = employees.innerJoin(departments, "dept_id");

  console.table(inner);

  return { inner };
}

/**
 * LeftJoin Verb Documentation
 *
 * Keep all rows from left DataFrame, add matching rows from right
 *
 * @example
 * ```typescript
 * const employees = createDataFrame([
 *   { emp_id: 1, name: "Alice", dept_id: 10, salary: 50000 },
 *   { emp_id: 2, name: "Bob", dept_id: 30, salary: 60000 }, // No matching department
 * ]);
 *
 * const departments = createDataFrame([
 *   { dept_id: 10, dept_name: "Engineering", manager: "Eve" },
 * ]);
 *
 * const left = employees.leftJoin(departments, "dept_id");
 *
 * console.table(left);
 * ```
 */
function leftJoinExample() {
  const employees = createDataFrame([
    { emp_id: 1, name: "Alice", dept_id: 10, salary: 50000 },
    { emp_id: 2, name: "Bob", dept_id: 30, salary: 60000 }, // No matching department
  ]);

  const departments = createDataFrame([
    { dept_id: 10, dept_name: "Engineering", manager: "Eve" },
  ]);

  const left = employees.leftJoin(departments, "dept_id");

  console.table(left);

  return { left };
}

/**
 * RightJoin Verb Documentation
 *
 * Keep all rows from right DataFrame, add matching rows from left
 *
 * @example
 * ```typescript
 * const employees = createDataFrame([
 *   { emp_id: 1, name: "Alice", dept_id: 10, salary: 50000 },
 * ]);
 *
 * const departments = createDataFrame([
 *   { dept_id: 10, dept_name: "Engineering", manager: "Eve" },
 *   { dept_id: 20, dept_name: "Marketing", manager: "Frank" }, // No matching employee
 * ]);
 *
 * const right = employees.rightJoin(departments, "dept_id");
 *
 * console.table(right);
 * ```
 */
function rightJoinExample() {
  const employees = createDataFrame([
    { emp_id: 1, name: "Alice", dept_id: 10, salary: 50000 },
  ]);

  const departments = createDataFrame([
    { dept_id: 10, dept_name: "Engineering", manager: "Eve" },
    { dept_id: 20, dept_name: "Marketing", manager: "Frank" }, // No matching employee
  ]);

  const right = employees.rightJoin(departments, "dept_id");

  console.table(right);

  return { right };
}

/**
 * OuterJoin Verb Documentation
 *
 * Keep all rows from both DataFrames, filling with undefined where no match
 *
 * @example
 * ```typescript
 * const employees = createDataFrame([
 *   { emp_id: 1, name: "Alice", dept_id: 10, salary: 50000 },
 *   { emp_id: 2, name: "Bob", dept_id: 30, salary: 60000 }, // No matching department
 * ]);
 *
 * const departments = createDataFrame([
 *   { dept_id: 10, dept_name: "Engineering", manager: "Eve" },
 *   { dept_id: 20, dept_name: "Marketing", manager: "Frank" }, // No matching employee
 * ]);
 *
 * const full = employees.outerJoin(departments, "dept_id");
 *
 * console.table(full);
 * ```
 */
function outerJoinExample() {
  const employees = createDataFrame([
    { emp_id: 1, name: "Alice", dept_id: 10, salary: 50000 },
    { emp_id: 2, name: "Bob", dept_id: 30, salary: 60000 }, // No matching department
  ]);

  const departments = createDataFrame([
    { dept_id: 10, dept_name: "Engineering", manager: "Eve" },
    { dept_id: 20, dept_name: "Marketing", manager: "Frank" }, // No matching employee
  ]);

  const full = employees.outerJoin(departments, "dept_id");

  console.table(full);

  return { full };
}

Deno.test("InnerJoin Verb Documentation", () => {
  const results = innerJoinExample();

  expect(results.inner.nrows()).toBe(3); // Alice, Bob, Charlie
  expect(results.inner.columns()).toContain("emp_id");
  expect(results.inner.columns()).toContain("dept_name");
  expect(results.inner.extract("name")).toEqual(["Alice", "Bob", "Charlie"]);
});

Deno.test("LeftJoin Verb Documentation", () => {
  const results = leftJoinExample();

  expect(results.left.nrows()).toBe(2); // Alice, Bob
  expect(results.left.extract("name")).toEqual(["Alice", "Bob"]);
  expect(results.left.extract("dept_name")).toEqual(["Engineering", undefined]);
});

Deno.test("RightJoin Verb Documentation", () => {
  const results = rightJoinExample();

  expect(results.right.nrows()).toBe(2); // Engineering, Marketing
  expect(results.right.extract("dept_name")).toEqual([
    "Engineering",
    "Marketing",
  ]);
  expect(results.right.extract("name")).toEqual(["Alice", undefined]);
});

Deno.test("OuterJoin Verb Documentation", () => {
  const results = outerJoinExample();

  expect(results.full.nrows()).toBe(3); // Alice, Bob, Marketing
  expect(results.full.extract("name")).toEqual(["Alice", "Bob", undefined]);
  expect(results.full.extract("dept_name")).toEqual([
    "Engineering",
    undefined,
    "Marketing",
  ]);
});
