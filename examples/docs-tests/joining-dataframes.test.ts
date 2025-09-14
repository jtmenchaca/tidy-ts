import { describe, expect, it } from "bun:test";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

describe("Joining DataFrames", () => {
  it("should perform inner join", () => {
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

    // Type check: inner join preserves all fields as required
    const _joinedTypeCheck: DataFrame<{
      emp_id: number;
      name: string;
      dept_id: number;
      dept_name: string;
    }> = joined;
    void _joinedTypeCheck; // Suppress unused variable warning

    joined.print("Inner join result:");

    expect(joined.nrows()).toBe(3);
    expect(joined.columns()).toEqual([
      "emp_id",
      "name",
      "dept_id",
      "dept_name",
    ]);
    expect(joined.toArray()).toEqual([
      { emp_id: 1, name: "Alice", dept_id: 10, dept_name: "Engineering" },
      { emp_id: 2, name: "Bob", dept_id: 20, dept_name: "Marketing" },
      { emp_id: 3, name: "Charlie", dept_id: 10, dept_name: "Engineering" },
    ]);
  });

  it("should perform left join", () => {
    const employees = createDataFrame([
      { emp_id: 1, name: "Alice", dept_id: 10 },
      { emp_id: 2, name: "Bob", dept_id: 20 },
      { emp_id: 3, name: "Charlie", dept_id: 30 }, // No matching department
    ]);

    const departments = createDataFrame([
      { dept_id: 10, dept_name: "Engineering" },
      { dept_id: 20, dept_name: "Marketing" },
    ]);

    const joined = employees.leftJoin(departments, "dept_id");

    // Type check: left join makes right non-key fields optional
    const _joinedTypeCheck: DataFrame<{
      emp_id: number;
      name: string;
      dept_id: number;
      dept_name: string | undefined;
    }> = joined;
    void _joinedTypeCheck; // Suppress unused variable warning

    joined.print("Left join result:");

    expect(joined.nrows()).toBe(3);
    expect(joined.columns()).toEqual([
      "emp_id",
      "name",
      "dept_id",
      "dept_name",
    ]);
    expect(joined.toArray()).toEqual([
      { emp_id: 1, name: "Alice", dept_id: 10, dept_name: "Engineering" },
      { emp_id: 2, name: "Bob", dept_id: 20, dept_name: "Marketing" },
      { emp_id: 3, name: "Charlie", dept_id: 30, dept_name: undefined },
    ]);
  });

  it("should perform multi-key join", () => {
    const sales = createDataFrame([
      { year: 2023, quarter: "Q1", product: "Widget A", sales: 1000 },
      { year: 2023, quarter: "Q2", product: "Widget B", sales: 1500 },
    ]);

    const targets = createDataFrame([
      { year: 2023, quarter: "Q1", product: "Widget A", target: 1200 },
      { year: 2023, quarter: "Q2", product: "Widget B", target: 1400 },
    ]);

    const joined = sales.innerJoin(targets, ["year", "quarter", "product"]);

    joined.print("Multi-key join result:");

    expect(joined.nrows()).toBe(2);
    expect(joined.columns()).toEqual([
      "year",
      "quarter",
      "product",
      "sales",
      "target",
    ]);
    expect(joined.toArray()).toEqual([
      {
        year: 2023,
        quarter: "Q1",
        product: "Widget A",
        sales: 1000,
        target: 1200,
      },
      {
        year: 2023,
        quarter: "Q2",
        product: "Widget B",
        sales: 1500,
        target: 1400,
      },
    ]);
  });

  it("should perform join with different column names", () => {
    const orders = createDataFrame([
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

    joined.print("Join with different column names:");

    expect(joined.nrows()).toBe(2);
    expect(joined.columns()).toEqual([
      "order_id",
      "order_region",
      "order_product",
      "quantity",
      "inv_region",
      "inv_product",
      "stock",
    ]);
  });
});
