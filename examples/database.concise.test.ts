import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";
import { drizzle } from "npm:drizzle-orm/libsql";
import { createClient } from "npm:@libsql/client";
import { integer, real, sqliteTable, text } from "npm:drizzle-orm/sqlite-core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, "fixtures", "sample.db");

// Zod schemas for raw SQL
const EmployeeSchema = z.object({
  id: z.number(),
  name: z.string(),
  department: z.string(),
  salary: z.number(),
  hire_date: z.string(),
  is_active: z.number(),
});

// Drizzle schema
const employees = sqliteTable("employees", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  salary: real("salary").notNull(),
  hire_date: text("hire_date").notNull(),
  is_active: integer("is_active").notNull(),
});

Deno.test("Raw SQLite + DataFrame", () => {
  const db = new DatabaseSync(dbPath);

  // Basic query
  const employees = db.prepare("SELECT * FROM employees").all();
  const employeesDF = createDataFrame(employees, EmployeeSchema);
  employeesDF.print("📊 All Employees");

  // Simple DataFrame operations
  const highEarners = employeesDF.filter((row) => row.salary > 80000);
  highEarners.print("💰 High Earners");

  const deptSummary = employeesDF
    .groupBy("department")
    .summarise({
      count: (group) => group.nrows(),
      avg_salary: (group) => stats.round(stats.mean(group.salary), 0),
    })
    .arrange("avg_salary", "desc");

  deptSummary.print("📈 Department Summary");

  db.close();
});

Deno.test("Drizzle ORM + DataFrame", async () => {
  const client = createClient({ url: `file:${dbPath}` });
  const db = drizzle(client);

  // Basic query
  const allEmployees = await db.select().from(employees).all();
  const employeesDF = createDataFrame(allEmployees); // Automatically infers schema from Drizzle schema
  employeesDF.print("📊 Drizzle - All Employees");

  // Simple DataFrame operations
  const highEarners = employeesDF.filter((row) => row.salary > 80000);
  highEarners.print("💰 High Earners");

  const deptSummary = employeesDF
    .groupBy("department")
    .summarise({
      count: (group) => group.nrows(),
      avg_salary: (group) => stats.round(stats.mean(group.salary), 0),
    })
    .arrange("avg_salary", "desc");

  deptSummary.print("📈 Department Summary");

  client.close();
});
