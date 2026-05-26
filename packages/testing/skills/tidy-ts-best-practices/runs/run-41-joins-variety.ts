import { createDataFrame } from "@tidy-ts/dataframe";

// --- Source tables ---------------------------------------------------------

const employees = createDataFrame([
  { emp_id: 1, name: "Alice", dept_id: 10, start_year: 2020 },
  { emp_id: 2, name: "Bob", dept_id: 10, start_year: 2021 },
  { emp_id: 3, name: "Carol", dept_id: 20, start_year: 2019 },
  { emp_id: 4, name: "Dan", dept_id: 20, start_year: 2022 },
  { emp_id: 5, name: "Eve", dept_id: 30, start_year: 2023 },
]);

const departments = createDataFrame([
  { dept_id: 10, dept_name: "Engineering", manager_id: 1 },
  { dept_id: 20, dept_name: "Sales", manager_id: 3 },
  { dept_id: 30, dept_name: "Marketing", manager_id: 5 },
]);

const reviews = createDataFrame([
  { employee_id: 1, year: 2022, score: 4.2 },
  { employee_id: 1, year: 2023, score: 4.5 },
  { employee_id: 2, year: 2023, score: 3.9 },
  { employee_id: 3, year: 2022, score: 4.8 },
  { employee_id: 3, year: 2023, score: 4.7 },
  { employee_id: 4, year: 2023, score: 3.5 },
]);

// --- Task 1: employee + department, one row per employee -------------------

const task1 = employees
  .leftJoin(departments, "dept_id")
  .select("emp_id", "name", "dept_id", "dept_name", "manager_id");

task1.print("Task 1 — employees joined with departments:");

// --- Task 2: every employee x year (2022, 2023) ---------------------------

const years = createDataFrame([{ year: 2022 }, { year: 2023 }]);

const task2 = employees
  .crossJoin(years)
  .select("emp_id", "name", "year");

task2.print("Task 2 — employee x year cartesian (expect 10 rows):");

// --- Task 3: attach review scores (note emp_id vs employee_id) ------------

const task3 = task2.leftJoin(reviews, {
  keys: { left: ["emp_id", "year"], right: ["employee_id", "year"] },
});

task3.print("Task 3 — task2 + review scores (left join, missing = undefined):");

// --- Task 4: also attach dept_name ----------------------------------------

const task4 = task3
  .leftJoin(employees.select("emp_id", "dept_id"), "emp_id")
  .leftJoin(departments.select("dept_id", "dept_name"), "dept_id")
  .select("emp_id", "name", "year", "score", "dept_name");

task4.print("Task 4 — final table with dept_name attached:");
