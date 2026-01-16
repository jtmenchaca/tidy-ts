import { expect } from "@std/expect";
import { createDataFrame, stats } from "@tidy-ts/dataframe";

Deno.test("for_each integration - real-world usage", () => {
  const df = createDataFrame([
    { name: "Alice", age: 30, city: "NYC" },
    { name: "Bob", age: 25, city: "LA" },
    { name: "Charlie", age: 35, city: "NYC" },
  ]);

  // Test for_each_row
  const rowData: string[] = [];
  df.forEachRow((row, idx) => {
    rowData.push(`${idx}: ${row.name} (${row.age})`);
  });

  expect(rowData).toEqual([
    "0: Alice (30)",
    "1: Bob (25)",
    "2: Charlie (35)",
  ]);

  // Test for_each_col
  const colInfo: string[] = [];
  df.forEachCol((colName, df) => {
    colInfo.push(`${String(colName)}: ${df[colName].length} items`);
  });

  expect(colInfo.sort()).toEqual([
    "age: 3 items",
    "city: 3 items",
    "name: 3 items",
  ]);

  // Test chaining with side effects
  const sideEffects: string[] = [];
  const agesInNYC: number[] = [];

  const result = df
    .forEachRow((row) => {
      if (row.age > 30) {
        sideEffects.push(`${row.name} is over 30`);
      }
    })
    .filter((row) => row.city === "NYC")
    .forEachCol((colName, df) => {
      if (colName === "age") {
        agesInNYC.push(...(df[colName]));
      }
    })
    .mutate({ senior: (row) => row.age >= 35 });

  expect(sideEffects).toEqual(["Charlie is over 30"]);
  // BUG: This test fails due to a bug in forEachCol with filtered DataFrames
  // The forEachCol should only iterate over filtered rows, but currently iterates over all rows
  expect(agesInNYC).toEqual([30, 35]); // Expected: only ages from NYC residents (Alice and Charlie)

  // BUG: This test fails due to a bug in mutate with filtered DataFrames
  // The mutate should work on filtered rows, but currently doesn't work properly
  expect(result.toArray()).toEqual([
    { name: "Alice", age: 30, city: "NYC", senior: false },
    { name: "Charlie", age: 35, city: "NYC", senior: true }, // Expected: Charlie should be marked as senior (age >= 35)
  ]);
});

Deno.test("for_each integration - collecting metadata", () => {
  const sales = createDataFrame([
    { product: "A", quarter: "Q1", revenue: 1000, units: 50 },
    { product: "B", quarter: "Q1", revenue: 1500, units: 75 },
    { product: "A", quarter: "Q2", revenue: 1200, units: 60 },
    { product: "B", quarter: "Q2", revenue: null, units: 80 },
    { product: "C", quarter: "Q1", revenue: 800, units: null },
  ]);

  // Collect metadata about the dataset
  type Metadata = {
    totalRows: number;
    columnCompleteness: Record<string, number>;
    uniqueProducts: Set<string>;
    nullValues: string[];
  };
  const metadata: Metadata = {
    totalRows: 0,
    columnCompleteness: {},
    uniqueProducts: new Set(),
    nullValues: [],
  };

  sales
    .forEachRow((row, idx) => {
      metadata.totalRows++;
      metadata.uniqueProducts.add(row.product);

      // Track null values
      if (row.revenue === null) {
        metadata.nullValues.push(`Row ${idx}: revenue is null`);
      }
      if (row.units === null) {
        metadata.nullValues.push(`Row ${idx}: units is null`);
      }
    })
    .forEachCol((colName, df) => {
      const nonNull = df[colName].filter((v) =>
        v !== null && v !== undefined
      ).length;
      metadata.columnCompleteness[String(colName)] = nonNull /
        df[colName].length;
    });

  expect(metadata.totalRows).toBe(5);
  expect(Array.from(metadata.uniqueProducts).sort()).toEqual(["A", "B", "C"]);
  expect(metadata.nullValues).toEqual([
    "Row 3: revenue is null",
    "Row 4: units is null",
  ]);
  expect(metadata.columnCompleteness.product).toBe(1.0);
  expect(metadata.columnCompleteness.quarter).toBe(1.0);
  expect(metadata.columnCompleteness.revenue).toBe(0.8);
  expect(metadata.columnCompleteness.units).toBe(0.8);
});

Deno.test("for_each integration - grouped operations", () => {
  const employees = createDataFrame([
    { name: "Alice", department: "Engineering", salary: 120000 },
    { name: "Bob", department: "Sales", salary: 85000 },
    { name: "Charlie", department: "Engineering", salary: 110000 },
    { name: "Diana", department: "Sales", salary: 95000 },
    { name: "Eve", department: "Engineering", salary: 130000 },
  ]);

  const departmentInfo: Record<string, string[]> = {};

  const result = employees
    .groupBy("department")
    .forEachRow((row) => {
      // Collect employees by department
      if (!departmentInfo[row.department]) {
        departmentInfo[row.department] = [];
      }
      departmentInfo[row.department].push(row.name);
    })
    .summarise({
      avg_salary: (df) => stats.mean(df.salary),
      count: (df) => df.nrows(),
    });

  expect(departmentInfo).toEqual({
    Engineering: ["Alice", "Charlie", "Eve"],
    Sales: ["Bob", "Diana"],
  });

  expect(result.toArray()).toEqual([
    { department: "Engineering", avg_salary: 120000, count: 3 },
    { department: "Sales", avg_salary: 90000, count: 2 },
  ]);
});

Deno.test("for_each integration - validation and logging simulation", () => {
  const orders = createDataFrame([
    { id: 1, customer: "ABC Corp", amount: 5000, status: "pending" },
    { id: 2, customer: "XYZ Inc", amount: -100, status: "completed" },
    { id: 3, customer: "ABC Corp", amount: 3000, status: "completed" },
    { id: 4, customer: "123 Ltd", amount: 0, status: "cancelled" },
  ]);

  const issues: string[] = [];
  const logs: string[] = [];

  const processed = orders
    .forEachRow((row) => {
      // Simulate validation
      if (row.amount < 0) {
        issues.push(`Order ${row.id}: negative amount`);
      }
      if (row.amount === 0 && row.status !== "cancelled") {
        issues.push(`Order ${row.id}: zero amount but not cancelled`);
      }

      // Simulate logging
      logs.push(`Processing order ${row.id} from ${row.customer}`);
    })
    .mutate({
      validated: (row) => row.amount > 0,
      processed_at: () => new Date().toISOString().split("T")[0],
    })
    .forEachCol((colName, df) => {
      if (colName === "validated") {
        const validCount = df[colName].filter((v) => v === true).length;
        logs.push(
          `Validation complete: ${validCount}/${
            df[colName].length
          } orders valid`,
        );
      }
    });

  expect(issues).toEqual([
    "Order 2: negative amount",
  ]);

  expect(logs).toEqual([
    "Processing order 1 from ABC Corp",
    "Processing order 2 from XYZ Inc",
    "Processing order 3 from ABC Corp",
    "Processing order 4 from 123 Ltd",
    "Validation complete: 2/4 orders valid",
  ]);

  expect(processed.nrows()).toBe(4);
  expect(processed.toArray()[0].validated).toBe(true);
  expect(processed.toArray()[1].validated).toBe(false);
});
