// Code examples for joining DataFrames
export const joiningExamples = {
  innerJoin: `import { createDataFrame } from "@tidy-ts/dataframe";

const employees = createDataFrame([
  { emp_id: 1, name: "Alice", dept_id: 10 },
  { emp_id: 2, name: "Bob", dept_id: 20 },
  { emp_id: 3, name: "Charlie", dept_id: 10 },
]);

const departments = createDataFrame([
  { dept_id: 10, dept_name: "Engineering" },
  { dept_id: 20, dept_name: "Marketing" },
]);

const joined = employees.innerJoin(departments, "dept_id");
joined.print("Inner join result:");`,

  leftJoin: `const employees = createDataFrame([
  { emp_id: 1, name: "Alice", dept_id: 10 },
  { emp_id: 2, name: "Bob", dept_id: 20 },
  { emp_id: 3, name: "Charlie", dept_id: 30 }, // No matching department
]);

const departments = createDataFrame([
  { dept_id: 10, dept_name: "Engineering" },
  { dept_id: 20, dept_name: "Marketing" },
]);

const joined = employees.leftJoin(departments, "dept_id");
joined.print("Left join result:");`,

  multiKeyJoin: `const sales = createDataFrame([
  { year: 2023, quarter: "Q1", product: "Widget A", sales: 1000 },
  { year: 2023, quarter: "Q2", product: "Widget B", sales: 1500 },
]);

const targets = createDataFrame([
  { year: 2023, quarter: "Q1", product: "Widget A", target: 1200 },
  { year: 2023, quarter: "Q2", product: "Widget B", target: 1400 },
]);

const joined = sales.innerJoin(targets, ["year", "quarter", "product"]);
joined.print("Multi-key join result:");`,

  differentColumnNames: `const orders = createDataFrame([
  { order_id: 1, order_region: "North", order_product: "A", quantity: 10 },
  { order_id: 2, order_region: "South", order_product: "B", quantity: 20 },
]);

const inventory = createDataFrame([
  { inv_region: "North", inv_product: "A", stock: 100 },
  { inv_region: "South", inv_product: "B", stock: 200 },
]);

const joined = orders.innerJoin(inventory, {
  keys: {
    left: ["order_region", "order_product"],
    right: ["inv_region", "inv_product"],
  },
});

joined.print("Join with different column names:");`,
};
