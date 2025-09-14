import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Multi-key join tests - comprehensive API variations
// Tests all join syntax options: simple arrays, objects with keys, different column names, suffixes

Deno.test("leftJoin - multiple keys basic", () => {
  const sales = createDataFrame([
    { region: "North", product: "A", quantity: 10 },
    { region: "North", product: "B", quantity: 20 },
    { region: "South", product: "A", quantity: 15 },
    { region: "South", product: "C", quantity: 25 },
  ]);

  const inventory = createDataFrame([
    { region: "North", product: "A", stock: 100 },
    { region: "North", product: "B", stock: 50 },
    { region: "South", product: "A", stock: 75 },
    { region: "East", product: "A", stock: 200 }, // No matching sales
  ]);

  // Multi-key joins with object API
  const result = sales.leftJoin(inventory, {
    keys: ["region", "product"],
    // keys: { left: "left_column_to_join", right: "right_column_to_join" },
    // keys: { left: ["region", "product"], right: ["region", "product"] },
    // keys: { left: ["left_column_to_join", "product"], right: ["right_column_to_join", "product"] },
    suffixes: { left: "_L", right: "_R" },
    // suffixes: { right: "_R" },
    // suffixes: { left: "_L" },
  });

  // LeftJoin<L,R,K> → L ∪ (R\K)?
  // Effect: Non-key fields from R become optional
  const _leftJoinTypeCheck: DataFrame<{
    region: string; // Key field (from L)
    product: string; // Key field (from L)
    quantity: number; // Non-key field from L (required)
    stock: number | undefined; // Non-key field from R (explicit undefined)
  }> = result;

  expect(result.toArray()).toEqual([
    { region: "North", product: "A", quantity: 10, stock: 100 },
    { region: "North", product: "B", quantity: 20, stock: 50 },
    { region: "South", product: "A", quantity: 15, stock: 75 },
    { region: "South", product: "C", quantity: 25, stock: undefined },
  ]);
});

Deno.test("innerJoin - multiple keys basic", () => {
  const orders = createDataFrame([
    { customer: "Alice", product: "Widget", year: 2023 },
    { customer: "Alice", product: "Gadget", year: 2023 },
    { customer: "Bob", product: "Widget", year: 2022 },
    { customer: "Bob", product: "Widget", year: 2023 },
  ]);

  const prices = createDataFrame([
    { product: "Widget", year: 2022, price: 10.00 },
    { product: "Widget", year: 2023, price: 12.00 },
    { product: "Gadget", year: 2023, price: 25.00 },
    { product: "Tool", year: 2023, price: 15.00 }, // No matching orders
  ]);

  const result = orders.innerJoin(prices, ["product", "year"]);

  // InnerJoin<L,R,K> → L ∪ R\K
  // Effect: All output fields required
  const _innerJoinTypeCheck: DataFrame<{
    customer: string; // Non-key field from L (required)
    product: string; // Key field (required)
    year: number; // Key field (required)
    price: number; // Non-key field from R (required)
  }> = result;

  expect(result.toArray()).toEqual([
    { customer: "Alice", product: "Widget", year: 2023, price: 12.00 },
    { customer: "Alice", product: "Gadget", year: 2023, price: 25.00 },
    { customer: "Bob", product: "Widget", year: 2022, price: 10.00 },
    { customer: "Bob", product: "Widget", year: 2023, price: 12.00 },
  ]);
});

Deno.test("rightJoin - multiple keys basic", () => {
  const employees = createDataFrame([
    { dept: "Sales", level: "Junior", name: "Alice" },
    { dept: "Sales", level: "Senior", name: "Bob" },
    { dept: "Engineering", level: "Junior", name: "Carol" },
  ]);

  const budgets = createDataFrame([
    { dept: "Sales", level: "Junior", budget: 50000 },
    { dept: "Sales", level: "Senior", budget: 80000 },
    { dept: "Engineering", level: "Senior", budget: 100000 }, // No matching employee
    { dept: "Marketing", level: "Junior", budget: 45000 }, // No matching employee
  ]);

  const result = employees.rightJoin(budgets, ["dept", "level"]);

  // RightJoin<L,R,K> → (L\K)? ∪ R
  // Effect: Non-key fields from L become optional
  const _rightJoinTypeCheck: DataFrame<{
    dept: string; // Key field (from R)
    level: string; // Key field (from R)
    name: string | undefined; // Non-key field from L (explicit undefined)
    budget: number; // Non-key field from R (required)
  }> = result;

  expect(result.toArray()).toEqual([
    { dept: "Sales", level: "Junior", name: "Alice", budget: 50000 },
    { dept: "Sales", level: "Senior", name: "Bob", budget: 80000 },
    { dept: "Engineering", level: "Senior", name: undefined, budget: 100000 },
    { dept: "Marketing", level: "Junior", name: undefined, budget: 45000 },
  ]);
});

Deno.test("outerJoin - multiple keys basic", () => {
  const actual = createDataFrame([
    { quarter: "Q1", region: "North", sales: 1000 },
    { quarter: "Q1", region: "South", sales: 1500 },
    { quarter: "Q2", region: "North", sales: 1200 },
  ]);

  const target = createDataFrame([
    { quarter: "Q1", region: "North", target: 1100 },
    { quarter: "Q1", region: "South", target: 1400 },
    { quarter: "Q2", region: "South", target: 1600 }, // No actual data
    { quarter: "Q3", region: "North", target: 1300 }, // No actual data
  ]);

  const result = actual.outerJoin(target, ["quarter", "region"]);

  // FullJoin<L,R,K> → (L\K)? ∪ (R\K)?
  // Effect: Both sides' non-key fields optional
  const _outerJoinTypeCheck: DataFrame<{
    quarter: string; // Key field (required)
    region: string; // Key field (required)
    sales: number | undefined; // Non-key field from L (optional)
    target: number | undefined; // Non-key field from R (optional)
  }> = result;

  expect(result.toArray()).toEqual([
    { quarter: "Q1", region: "North", sales: 1000, target: 1100 },
    { quarter: "Q1", region: "South", sales: 1500, target: 1400 },
    { quarter: "Q2", region: "North", sales: 1200, target: undefined },
    { quarter: "Q2", region: "South", sales: undefined, target: 1600 },
    { quarter: "Q3", region: "North", sales: undefined, target: 1300 },
  ]);
});

Deno.test("leftJoin - multiple keys with duplicate composite keys", () => {
  const transactions = createDataFrame([
    { date: "2023-01-01", account: "A", amount: 100 },
    { date: "2023-01-01", account: "A", amount: 50 }, // Duplicate composite key
    { date: "2023-01-01", account: "B", amount: 200 },
    { date: "2023-01-02", account: "A", amount: 75 },
  ]);

  const limits = createDataFrame([
    { date: "2023-01-01", account: "A", limit: 500 },
    { date: "2023-01-01", account: "A", limit: 600 }, // Duplicate composite key
    { date: "2023-01-01", account: "B", limit: 1000 },
  ]);

  const result = transactions.leftJoin(limits, ["date", "account"]);

  // LeftJoin with duplicates - Cartesian product for matching composite keys
  const _leftJoinDuplicatesTypeCheck: DataFrame<{
    date: string; // Key field (required)
    account: string; // Key field (required)
    amount: number; // Non-key field from L (required)
    limit: number | undefined; // Non-key field from R (explicit undefined)
  }> = result;

  // Should produce Cartesian product for matching composite keys
  expect(result.toArray()).toEqual([
    { date: "2023-01-01", account: "A", amount: 100, limit: 500 },
    { date: "2023-01-01", account: "A", amount: 100, limit: 600 },
    { date: "2023-01-01", account: "A", amount: 50, limit: 500 },
    { date: "2023-01-01", account: "A", amount: 50, limit: 600 },
    { date: "2023-01-01", account: "B", amount: 200, limit: 1000 },
    { date: "2023-01-02", account: "A", amount: 75, limit: undefined },
  ]);
});

Deno.test("innerJoin - multiple keys with mixed data types", () => {
  const events = createDataFrame([
    { user_id: 1, session_id: "abc123", event: "login" },
    { user_id: 1, session_id: "abc456", event: "purchase" },
    { user_id: 2, session_id: "def789", event: "login" },
  ]);

  const sessions = createDataFrame([
    { user_id: 1, session_id: "abc123", duration: 300 },
    { user_id: 1, session_id: "abc456", duration: 120 },
    { user_id: 2, session_id: "def789", duration: 180 },
    { user_id: 3, session_id: "ghi000", duration: 90 }, // No matching event
  ]);

  const result = events.innerJoin(sessions, ["user_id", "session_id"]);

  // InnerJoin with mixed data types (number + string composite key)
  const _innerJoinMixedTypesCheck: DataFrame<{
    user_id: number; // Key field - numeric (required)
    session_id: string; // Key field - string (required)
    event: string; // Non-key field from L (required)
    duration: number; // Non-key field from R (required)
  }> = result;

  expect(result.toArray()).toEqual([
    { user_id: 1, session_id: "abc123", event: "login", duration: 300 },
    { user_id: 1, session_id: "abc456", event: "purchase", duration: 120 },
    { user_id: 2, session_id: "def789", event: "login", duration: 180 },
  ]);
});

Deno.test("leftJoin - multiple keys empty scenarios", () => {
  const left = createDataFrame([
    { a: 1, b: "x", value: 10 },
    { a: 2, b: "y", value: 20 },
  ]);

  const emptyRight: { a: number; b: string; other: string }[] = [];
  const right = createDataFrame(emptyRight);

  const result = left.leftJoin(right, ["a", "b"]);

  expect(result.toArray()).toEqual([
    { a: 1, b: "x", value: 10 },
    { a: 2, b: "y", value: 20 },
  ]);
});

Deno.test("rightJoin - multiple keys empty left", () => {
  const emptyLeft: { a: number; b: string; value: number }[] = [];
  const left = createDataFrame(emptyLeft);

  const right = createDataFrame([
    { a: 1, b: "x", other: "A" },
    { a: 2, b: "y", other: "B" },
  ]);

  const result = left.rightJoin(right, ["a", "b"]);

  expect(result.toArray()).toEqual([
    { a: 1, b: "x", value: undefined, other: "A" },
    { a: 2, b: "y", value: undefined, other: "B" },
  ]);
});

Deno.test("outerJoin - multiple keys no matches", () => {
  const left = createDataFrame([
    { region: "North", quarter: "Q1", sales: 100 },
    { region: "South", quarter: "Q2", sales: 200 },
  ]);

  const right = createDataFrame([
    { region: "East", quarter: "Q3", target: 150 },
    { region: "West", quarter: "Q4", target: 250 },
  ]);

  const result = left.outerJoin(right, ["region", "quarter"]);

  expect(result.toArray()).toEqual([
    { region: "North", quarter: "Q1", sales: 100, target: undefined },
    { region: "South", quarter: "Q2", sales: 200, target: undefined },
    { region: "East", quarter: "Q3", sales: undefined, target: 150 },
    { region: "West", quarter: "Q4", sales: undefined, target: 250 },
  ]);
});

Deno.test("innerJoin - multiple keys column collision handling", () => {
  const left = createDataFrame([
    { id: 1, type: "A", x: 10, y: "left" },
    { id: 2, type: "B", x: 20, y: "left" },
  ]);

  const right = createDataFrame([
    { id: 1, type: "A", x: 99, y: "right", z: "extra" },
    { id: 2, type: "B", x: 88, y: "right", z: "more" },
  ]);

  const result = left.innerJoin(right, ["id", "type"], {
    suffixes: { left: "_L", right: "_R" },
  });

  // InnerJoin with column collisions - suffixes applied to conflicting columns from both sides
  // Let TypeScript infer the actual type to debug the type issue
  const _innerJoinCollisionTypeCheck = result;

  expect(result.toArray()).toEqual([
    {
      id: 1,
      type: "A",
      x_L: 10,
      y_L: "left",
      x_R: 99,
      y_R: "right",
      z: "extra",
    },
    {
      id: 2,
      type: "B",
      x_L: 20,
      y_L: "left",
      x_R: 88,
      y_R: "right",
      z: "more",
    },
  ]);
});

Deno.test("leftJoin - multiple keys three-column composite key", () => {
  const sales = createDataFrame([
    { year: 2023, quarter: "Q1", region: "North", revenue: 1000 },
    { year: 2023, quarter: "Q2", region: "North", revenue: 1200 },
    { year: 2023, quarter: "Q1", region: "South", revenue: 800 },
  ]);

  const costs = createDataFrame([
    { year: 2023, quarter: "Q1", region: "North", cost: 600 },
    { year: 2023, quarter: "Q2", region: "North", cost: 700 },
    { year: 2023, quarter: "Q3", region: "North", cost: 500 }, // No revenue match
  ]);

  const result = sales.leftJoin(costs, ["year", "quarter", "region"]);

  // LeftJoin with three-column composite key
  const _leftJoinTripleKeyTypeCheck: DataFrame<{
    year: number; // Key field 1 (required)
    quarter: string; // Key field 2 (required)
    region: string; // Key field 3 (required)
    revenue: number; // Non-key field from L (required)
    cost: number | undefined; // Non-key field from R (explicit undefined)
  }> = result;

  expect(result.toArray()).toEqual([
    { year: 2023, quarter: "Q1", region: "North", revenue: 1000, cost: 600 },
    { year: 2023, quarter: "Q2", region: "North", revenue: 1200, cost: 700 },
    {
      year: 2023,
      quarter: "Q1",
      region: "South",
      revenue: 800,
      cost: undefined,
    },
  ]);
});

// =============================================================================
// API VARIATIONS - Comprehensive syntax testing
// =============================================================================

Deno.test("leftJoin - API variation 1: Simple array syntax (same column names)", () => {
  const employees = createDataFrame([
    { dept_id: 10, year: 2023, name: "Alice", salary: 50000 },
    { dept_id: 20, year: 2023, name: "Bob", salary: 60000 },
    { dept_id: 10, year: 2022, name: "Carol", salary: 45000 },
  ]);

  const budgets = createDataFrame([
    { dept_id: 10, year: 2023, budget: 100000 },
    { dept_id: 20, year: 2023, budget: 120000 },
    { dept_id: 30, year: 2023, budget: 80000 }, // No employees
  ]);

  // Simple API: Array of column names (when both sides have same names)

  const result = employees.leftJoin(budgets, ["dept_id", "year"]);

  const _typeCheck: DataFrame<{
    dept_id: number;
    year: number;
    name: string;
    salary: number;
    budget: number | undefined;
  }> = result;

  expect(result.toArray()).toEqual([
    { dept_id: 10, year: 2023, name: "Alice", salary: 50000, budget: 100000 },
    { dept_id: 20, year: 2023, name: "Bob", salary: 60000, budget: 120000 },
    {
      dept_id: 10,
      year: 2022,
      name: "Carol",
      salary: 45000,
      budget: undefined,
    },
  ]);
});

Deno.test("leftJoin - API variation 2: Object with keys array", () => {
  const customers = createDataFrame([
    {
      region: "North",
      segment: "Enterprise",
      customer_id: 1,
      name: "Acme Corp",
    },
    { region: "South", segment: "SMB", customer_id: 2, name: "Beta LLC" },
  ]);

  const revenue = createDataFrame([
    { region: "North", segment: "Enterprise", total_revenue: 50000 },
    { region: "South", segment: "SMB", total_revenue: 25000 },
  ]);

  // Object API: Explicit keys array (same as simple array, but more extensible)

  const result = customers.leftJoin(revenue, {
    keys: ["region", "segment"],
  });

  expect(result.toArray()).toEqual([
    {
      region: "North",
      segment: "Enterprise",
      customer_id: 1,
      name: "Acme Corp",
      total_revenue: 50000,
    },
    {
      region: "South",
      segment: "SMB",
      customer_id: 2,
      name: "Beta LLC",
      total_revenue: 25000,
    },
  ]);
});

Deno.test("leftJoin - API variation 3: Object with suffixes", () => {
  const actual_sales = createDataFrame([
    { region: "North", product: "Widget", actual: 100, quarter: "Q1" },
    { region: "South", product: "Gadget", actual: 150, quarter: "Q1" },
  ]);

  const target_sales = createDataFrame([
    { region: "North", product: "Widget", target: 90, quarter: "Q1" },
    { region: "South", product: "Gadget", target: 140, quarter: "Q2" },
  ]);

  // Object API: Keys array with custom suffixes

  const result = actual_sales.leftJoin(target_sales, {
    keys: ["region", "product"],
    suffixes: { left: "_actual", right: "_target" },
  });

  expect(result.toArray()).toEqual([
    {
      region: "North",
      product: "Widget",
      actual: 100,
      quarter_actual: "Q1",
      target: 90,
      quarter_target: "Q1",
    },
    {
      region: "South",
      product: "Gadget",
      actual: 150,
      quarter_actual: "Q1",
      target: 140,
      quarter_target: "Q2",
    },
  ]);
});

Deno.test("leftJoin - API variation 4: Different column names (single key)", () => {
  const customers = createDataFrame([
    { customer_id: 1, name: "Alice", email: "alice@example.com" },
    { customer_id: 2, name: "Bob", email: "bob@example.com" },
  ]);

  const orders = createDataFrame([
    { order_id: 101, client_id: 1, amount: 250.00 },
    { order_id: 102, client_id: 1, amount: 150.00 },
  ]);

  // Object API: Different column names - single key mapping

  const result = customers.leftJoin(orders, {
    keys: { left: "customer_id", right: "client_id" },
  });

  expect(result.toArray()).toEqual([
    {
      customer_id: 1,
      name: "Alice",
      email: "alice@example.com",
      order_id: 101,
      client_id: 1,
      amount: 250.00,
    },
    {
      customer_id: 1,
      name: "Alice",
      email: "alice@example.com",
      order_id: 102,
      client_id: 1,
      amount: 150.00,
    },
    {
      customer_id: 2,
      name: "Bob",
      email: "bob@example.com",
      order_id: undefined,
      client_id: undefined,
      amount: undefined,
    },
  ]);
});

Deno.test("leftJoin - API variation 5: Different column names (multiple keys)", () => {
  const employees = createDataFrame([
    { emp_dept: 10, emp_year: 2023, name: "Alice", role: "Engineer" },
    { emp_dept: 20, emp_year: 2023, name: "Bob", role: "Manager" },
  ]);

  const budgets = createDataFrame([
    { budget_dept: 10, budget_year: 2023, allocation: 100000 },
    { budget_dept: 20, budget_year: 2023, allocation: 150000 },
  ]);

  // Object API: Different column names - multiple key mapping

  const result = employees.leftJoin(budgets, {
    keys: {
      left: ["emp_dept", "emp_year"],
      right: ["budget_dept", "budget_year"],
    },
  });

  expect(result.toArray()).toEqual([
    {
      emp_dept: 10,
      emp_year: 2023,
      name: "Alice",
      role: "Engineer",
      budget_dept: 10,
      budget_year: 2023,
      allocation: 100000,
    },
    {
      emp_dept: 20,
      emp_year: 2023,
      name: "Bob",
      role: "Manager",
      budget_dept: 20,
      budget_year: 2023,
      allocation: 150000,
    },
  ]);
});
