import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create the database file
const dbPath = join(__dirname, "sample.db");
const db = new DatabaseSync(dbPath);

// Create tables and insert sample data
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    salary REAL NOT NULL,
    hire_date TEXT NOT NULL,
    is_active BOOLEAN NOT NULL
  );

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    budget REAL NOT NULL,
    manager_id INTEGER,
    location TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    budget REAL NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments (id)
  );
`);

// Insert sample data
const insertEmployee = db.prepare(`
  INSERT INTO employees (name, department, salary, hire_date, is_active)
  VALUES (?, ?, ?, ?, ?)
`);

const insertDepartment = db.prepare(`
  INSERT INTO departments (name, budget, manager_id, location)
  VALUES (?, ?, ?, ?)
`);

const insertProject = db.prepare(`
  INSERT INTO projects (name, department_id, start_date, end_date, budget, status)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// Insert departments
const departments = [
  ["Engineering", 500000, 1, "San Francisco"],
  ["Marketing", 200000, 2, "New York"],
  ["Sales", 300000, 3, "Chicago"],
  ["HR", 150000, 4, "Austin"],
  ["Finance", 250000, 5, "Boston"],
];

departments.forEach((dept) => insertDepartment.run(...dept));

// Insert employees
const employees = [
  ["Alice Johnson", "Engineering", 95000, "2020-01-15", 1],
  ["Bob Smith", "Engineering", 87000, "2021-03-22", 1],
  ["Carol Davis", "Marketing", 72000, "2019-11-08", 1],
  ["David Wilson", "Sales", 68000, "2022-06-14", 1],
  ["Eve Brown", "HR", 65000, "2020-09-30", 1],
  ["Frank Miller", "Finance", 78000, "2021-12-03", 1],
  ["Grace Lee", "Engineering", 92000, "2020-07-18", 1],
  ["Henry Taylor", "Marketing", 75000, "2022-01-25", 1],
  ["Ivy Chen", "Sales", 71000, "2021-08-12", 1],
  ["Jack Anderson", "HR", 62000, "2023-02-28", 1],
  ["Kate Rodriguez", "Finance", 80000, "2020-04-10", 1],
  ["Liam O'Connor", "Engineering", 88000, "2022-09-05", 1],
  ["Maya Patel", "Marketing", 69000, "2021-05-17", 1],
  ["Noah Kim", "Sales", 74000, "2020-12-01", 1],
  ["Olivia White", "HR", 67000, "2022-03-20", 1],
];

employees.forEach((emp) => insertEmployee.run(...emp));

// Insert projects
const projects = [
  ["Website Redesign", 1, "2023-01-01", "2023-06-30", 50000, "Completed"],
  ["Mobile App", 1, "2023-03-15", "2023-12-31", 100000, "In Progress"],
  ["Brand Campaign", 2, "2023-02-01", "2023-05-31", 75000, "Completed"],
  [
    "Social Media Strategy",
    2,
    "2023-06-01",
    "2023-12-31",
    30000,
    "In Progress",
  ],
  ["Q4 Sales Push", 3, "2023-10-01", "2023-12-31", 40000, "In Progress"],
  ["Customer Retention", 3, "2023-01-01", "2023-03-31", 25000, "Completed"],
  ["Employee Wellness", 4, "2023-04-01", "2023-12-31", 15000, "In Progress"],
  ["Diversity Initiative", 4, "2023-01-01", "2023-06-30", 20000, "Completed"],
  ["Financial Audit", 5, "2023-01-01", "2023-03-31", 35000, "Completed"],
  ["Budget Planning", 5, "2023-09-01", "2023-12-31", 25000, "In Progress"],
];

projects.forEach((proj) => insertProject.run(...proj));

console.log("Database created successfully with sample data!");
console.log("Database location:", dbPath);

db.close();
