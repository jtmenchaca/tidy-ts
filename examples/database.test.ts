// deno-lint-ignore-file no-import-prefix

import { createDataFrame } from "@tidy-ts/dataframe";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";
import { expect } from "@std/expect";
// deno-lint-ignore no-unversioned-import
import { drizzle } from "npm:drizzle-orm/libsql";
// deno-lint-ignore no-unversioned-import
import { createClient } from "npm:@libsql/client";
// deno-lint-ignore no-unversioned-import
import { desc, eq, gt, sql } from "npm:drizzle-orm";
// deno-lint-ignore no-unversioned-import
import { integer, real, sqliteTable, text } from "npm:drizzle-orm/sqlite-core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the database file
const dbPath = join(__dirname, "fixtures", "sample.db");

// Zod schemas for type validation
const EmployeeSchema = z.object({
  id: z.number(),
  name: z.string(),
  department: z.string(),
  salary: z.number(),
  hire_date: z.string(),
  is_active: z.number(),
});

const HighEarnerSchema = z.object({
  name: z.string(),
  department: z.string(),
  salary: z.number(),
});

const EmployeeWithDeptSchema = z.object({
  name: z.string(),
  salary: z.number(),
  department_name: z.string(),
  location: z.string(),
});

// Drizzle schema definitions
const employees = sqliteTable("employees", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  salary: real("salary").notNull(),
  hire_date: text("hire_date").notNull(),
  is_active: integer("is_active").notNull(),
});

const departments = sqliteTable("departments", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  budget: real("budget").notNull(),
  manager_id: integer("manager_id"),
  location: text("location").notNull(),
});

import { test } from "../tests/shims/test.ts";

test("Database Query and DataFrame Creation", () => {
  // Open the database
  const db = new DatabaseSync(dbPath);

  try {
    // Query all employees
    const employees = db.prepare("SELECT * FROM employees").all();
    // Create DataFrame from query results with schema validation
    const employeesDF = createDataFrame(employees, EmployeeSchema);

    console.log("Employees DataFrame:");
    employeesDF.print();

    // Validate employees data
    expect(employeesDF.nrows()).toBe(15);
    expect(employeesDF.columns()).toEqual([
      "id",
      "name",
      "department",
      "salary",
      "hire_date",
      "is_active",
    ]);
    expect(employeesDF.extractHead("name", 1)).toBe("Alice Johnson");

    // Query with a filter
    const highEarners = db.prepare(`
      SELECT name, department, salary 
      FROM employees 
      WHERE salary > 80000
    `).all();

    const highEarnersDF = createDataFrame(highEarners, HighEarnerSchema);

    console.log("\nHigh Earners DataFrame:");
    highEarnersDF.print();

    // Validate high earners data
    expect(highEarnersDF.nrows()).toBe(4);
    expect(highEarnersDF.columns()).toEqual(["name", "department", "salary"]);
    expect(highEarnersDF.extract("salary").every((salary) => salary > 80000))
      .toBe(true);

    // Join query
    const employeesWithDept = db.prepare(`
      SELECT e.name, e.salary, d.name as department_name, d.location
      FROM employees e
      JOIN departments d ON e.department = d.name
    `).all();

    const joinedDF = createDataFrame(employeesWithDept, EmployeeWithDeptSchema);

    console.log("\nEmployees with Department Info:");
    joinedDF.print();

    // Validate joined data
    expect(joinedDF.nrows()).toBe(15);
    expect(joinedDF.columns()).toEqual([
      "name",
      "salary",
      "department_name",
      "location",
    ]);
    expect(joinedDF.extract("department_name").includes("Engineering")).toBe(
      true,
    );

    // Use DataFrame operations on the data
    const analysis = joinedDF
      .mutate({
        salary_k: (row) => Math.round(row.salary / 1000),
      })
      .groupBy("department_name")
      .summarise({
        count: (group) => group.nrows(),
        avg_salary: (group) =>
          Math.round(group.salary.reduce((a, b) => a + b, 0) / group.nrows()),
      })
      .arrange("avg_salary", "desc");

    console.log("\nDepartment Analysis:");
    analysis.print();

    // Validate analysis results
    expect(analysis.nrows()).toBe(5); // 5 departments
    expect(analysis.columns()).toEqual([
      "department_name",
      "count",
      "avg_salary",
    ]);
    expect(analysis.extract("department_name").includes("Engineering")).toBe(
      true,
    );
    expect(analysis.extract("avg_salary").every((salary) => salary > 60000))
      .toBe(true);

    // Validate specific department data
    const engineeringDept = analysis.filter((row) =>
      row.department_name === "Engineering"
    );
    expect(engineeringDept.nrows()).toBe(1);
    expect(engineeringDept.extractHead("count", 1)).toBe(4);
    expect(engineeringDept.extractHead("avg_salary", 1)).toBe(90500);
  } finally {
    db.close();
  }
});

test("Drizzle ORM with DataFrame Integration", async () => {
  // Initialize Drizzle with libsql as per docs
  const client = createClient({ url: `file:${dbPath}` });
  const db = drizzle(client);

  try {
    // Query all employees using Drizzle ORM
    const allEmployees = await db.select().from(employees).all();
    const employeesDF = createDataFrame(allEmployees);

    console.log("Drizzle ORM - All Employees:");
    employeesDF.print();

    // Validate query results
    expect(employeesDF.nrows()).toBe(15);
    expect(employeesDF.columns()).toEqual([
      "id",
      "name",
      "department",
      "salary",
      "hire_date",
      "is_active",
    ]);

    // Query high earners using Drizzle ORM
    const highEarners = await db
      .select({
        name: employees.name,
        department: employees.department,
        salary: employees.salary,
      })
      .from(employees)
      .where(gt(employees.salary, 80000))
      .all();

    const highEarnersDF = createDataFrame(highEarners);

    console.log("\nDrizzle ORM - High Earners:");
    highEarnersDF.print();

    // Validate high earners
    expect(highEarnersDF.nrows()).toBe(4);
    expect(highEarnersDF.extract("salary").every((salary) => salary > 80000))
      .toBe(true);

    // Complex query with joins using Drizzle ORM
    const employeesWithDept = await db
      .select({
        name: employees.name,
        salary: employees.salary,
        department_name: departments.name,
        location: departments.location,
      })
      .from(employees)
      .innerJoin(departments, eq(employees.department, departments.name))
      .all();

    const joinedDF = createDataFrame(employeesWithDept);

    console.log("\nDrizzle ORM - Employees with Department Info:");
    joinedDF.print();

    // Validate joined data
    expect(joinedDF.nrows()).toBe(15);
    expect(joinedDF.columns()).toEqual([
      "name",
      "salary",
      "department_name",
      "location",
    ]);

    // Use Drizzle ORM for aggregation
    const deptStats = await db
      .select({
        department_name: departments.name,
        count: sql<number>`count(*)`.as("count"),
        avg_salary: sql<number>`round(avg(${employees.salary}))`.as(
          "avg_salary",
        ),
      })
      .from(employees)
      .innerJoin(departments, eq(employees.department, departments.name))
      .groupBy(departments.name)
      .orderBy(desc(sql`avg(${employees.salary})`))
      .all();

    const deptStatsDF = createDataFrame(deptStats);

    console.log("\nDrizzle ORM - Department Statistics:");
    deptStatsDF.print();

    // Validate department statistics
    expect(deptStatsDF.nrows()).toBe(5);
    expect(deptStatsDF.columns()).toEqual([
      "department_name",
      "count",
      "avg_salary",
    ]);

    // Additional DataFrame operations on results
    const analysis = deptStatsDF
      .mutate({
        salary_category: (row) => {
          if (row.avg_salary > 85000) return "High";
          if (row.avg_salary > 70000) return "Medium";
          return "Low";
        },
      })
      .arrange("avg_salary", "desc");

    console.log("\nDrizzle ORM + DataFrame - Enhanced Analysis:");
    analysis.print();

    // Validate enhanced analysis
    expect(analysis.nrows()).toBe(5);
    expect(analysis.columns()).toEqual([
      "department_name",
      "count",
      "avg_salary",
      "salary_category",
    ]);

    const highSalaryDepts = analysis.filter(
      (row) => row.salary_category === "High",
    );
    expect(highSalaryDepts.nrows()).toBe(1);
    expect(highSalaryDepts.extractHead("department_name", 1)).toBe(
      "Engineering",
    );
  } finally {
    client.close();
  }
});
