import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Bug: Inner join row count issue", () => {
  console.log("=== Bug Report: Inner Join Row Count Issue ===\n");

  // Create test data
  const employees = createDataFrame([
    { emp_id: 1, name: "Alice", dept_id: 10, year: 2023, salary: 50000 },
    { emp_id: 2, name: "Bob", dept_id: 20, year: 2023, salary: 60000 },
    { emp_id: 3, name: "Charlie", dept_id: 10, year: 2024, salary: 55000 },
    { emp_id: 4, name: "Diana", dept_id: 30, year: 2023, salary: 70000 },
    { emp_id: 5, name: "Eve", dept_id: 20, year: 2024, salary: 65000 },
  ]);

  const departments = createDataFrame([
    { dept_id: 10, year: 2023, dept_name: "Engineering", manager: "John" },
    { dept_id: 20, year: 2023, dept_name: "Marketing", manager: "Jane" },
    { dept_id: 10, year: 2024, dept_name: "Engineering", manager: "Sarah" },
    { dept_id: 40, year: 2023, dept_name: "Sales", manager: "Mike" },
  ]);

  console.log("Employees DataFrame:");
  employees.print();
  console.log(`Employees row count: ${employees.nrows()}`);

  console.log("\nDepartments DataFrame:");
  departments.print();
  console.log(`Departments row count: ${departments.nrows()}`);

  // Test single key inner join
  const singleKeyInnerJoin = employees.innerJoin(departments, "dept_id");
  console.log("\nSingle key inner join (dept_id only):");
  singleKeyInnerJoin.print();
  console.log(`Single key inner join row count: ${singleKeyInnerJoin.nrows()}`);

  // Test multi-key inner join
  const multiKeyInnerJoin = employees.innerJoin(departments, [
    "dept_id",
    "year",
  ]);
  console.log("\nMulti-key inner join (dept_id + year):");
  multiKeyInnerJoin.print();
  console.log(`Multi-key inner join row count: ${multiKeyInnerJoin.nrows()}`);

  // Expected behavior:
  // - Single key inner join should match on dept_id only
  // - Multi-key inner join should match on both dept_id AND year

  console.log("\n=== Expected vs Actual ===");
  console.log(
    "Expected single key inner join rows: 6 (Alice matches 2 dept records, Bob matches 1, Charlie matches 2, Eve matches 1)",
  );
  console.log(
    "Expected multi-key inner join rows: 3 (Alice matches 1, Bob matches 1, Charlie matches 1)",
  );

  // The bug: Test expectation is wrong
  // The getting-started test expects single key inner join to have 4 rows, but it should have 6

  console.log("\n=== Bug Details ===");
  console.log(
    "Issue: Test expectation in getting-started.test.ts is incorrect",
  );
  console.log(
    "The test expects single key inner join to have 4 rows, but it should have 6",
  );
  console.log(
    "This is because single key joins can create multiple matches per employee",
  );
  console.log("when an employee's dept_id matches multiple department records");

  // Test assertions to demonstrate the correct behavior
  expect(employees.nrows()).toBe(5);
  expect(departments.nrows()).toBe(4);
  expect(singleKeyInnerJoin.nrows()).toBe(6); // Correct expectation
  expect(multiKeyInnerJoin.nrows()).toBe(3);
});
