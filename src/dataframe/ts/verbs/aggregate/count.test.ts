import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("count() - single grouping variable", () => {
  const df = createDataFrame([
    { category: "A", value: 1 },
    { category: "B", value: 2 },
    { category: "A", value: 3 },
    { category: "B", value: 4 },
    { category: "A", value: 5 },
  ]);

  const result = df.count("category");

  expect(result.nrows()).toBe(2);
  expect(result.ncols()).toBe(2);

  const rows = result.toArray();
  expect(rows).toContainEqual({ category: "A", n: 3 });
  expect(rows).toContainEqual({ category: "B", n: 2 });
});

Deno.test("count() - multiple grouping variables", () => {
  const df = createDataFrame([
    { region: "North", product: "Widget", quantity: 10 },
    { region: "South", product: "Widget", quantity: 20 },
    { region: "North", product: "Gadget", quantity: 15 },
    { region: "South", product: "Widget", quantity: 5 },
    { region: "North", product: "Widget", quantity: 8 },
  ]);

  const result = df.count("region", "product");

  expect(result.nrows()).toBe(3);
  expect(result.ncols()).toBe(3);

  const rows = result.toArray();
  expect(rows).toContainEqual({ region: "North", product: "Widget", n: 2 });
  expect(rows).toContainEqual({ region: "South", product: "Widget", n: 2 });
  expect(rows).toContainEqual({ region: "North", product: "Gadget", n: 1 });
});

Deno.test("count() - empty dataframe with grouping", () => {
  const df = createDataFrame({ columns: { category: [], value: [] } });

  const result = df.count("category");

  expect(result.nrows()).toBe(0);
});

Deno.test("count() - single row with grouping", () => {
  const df = createDataFrame([
    { category: "A", value: 1 },
  ]);

  const result = df.count("category");

  expect(result.nrows()).toBe(1);
  expect(result[0]).toEqual({ category: "A", n: 1 });
});

Deno.test("count() - all rows in same group", () => {
  const df = createDataFrame([
    { category: "A", value: 1 },
    { category: "A", value: 2 },
    { category: "A", value: 3 },
  ]);

  const result = df.count("category");

  expect(result.nrows()).toBe(1);
  expect(result[0]).toEqual({ category: "A", n: 3 });
});

Deno.test("count() - all rows in different groups", () => {
  const df = createDataFrame([
    { category: "A", value: 1 },
    { category: "B", value: 2 },
    { category: "C", value: 3 },
  ]);

  const result = df.count("category");

  expect(result.nrows()).toBe(3);

  const rows = result.toArray();
  expect(rows).toContainEqual({ category: "A", n: 1 });
  expect(rows).toContainEqual({ category: "B", n: 1 });
  expect(rows).toContainEqual({ category: "C", n: 1 });
});

Deno.test("count() - with null/undefined values in grouping column", () => {
  const df = createDataFrame([
    { category: "A", value: 1 },
    { category: null, value: 2 },
    { category: "A", value: 3 },
    { category: undefined, value: 4 },
    { category: null, value: 5 },
  ]);

  const result = df.count("category");

  expect(result.nrows()).toBe(3);

  const rows = result.toArray();
  expect(rows).toContainEqual({ category: "A", n: 2 });
  expect(rows).toContainEqual({ category: null, n: 2 });
  expect(rows).toContainEqual({ category: undefined, n: 1 });
});

Deno.test("count() - with mixed data types in grouping column", () => {
  const df = createDataFrame([
    { category: "1", value: 1 },
    { category: "2", value: 2 },
    { category: "1", value: 3 },
    { category: "3", value: 4 },
  ]);

  const result = df.count("category");

  expect(result.nrows()).toBe(3);

  const rows = result.toArray();
  expect(rows).toContainEqual({ category: "1", n: 2 });
  expect(rows).toContainEqual({ category: "2", n: 1 });
  expect(rows).toContainEqual({ category: "3", n: 1 });
});

Deno.test("count() - three grouping variables", () => {
  const df = createDataFrame([
    { region: "North", product: "Widget", status: "Active" },
    { region: "North", product: "Widget", status: "Inactive" },
    { region: "North", product: "Widget", status: "Active" },
    { region: "South", product: "Gadget", status: "Active" },
    { region: "South", product: "Gadget", status: "Active" },
  ]);

  const result = df.count("region", "product", "status");

  expect(result.nrows()).toBe(3);
  expect(result.ncols()).toBe(4);

  const rows = result.toArray();
  expect(rows).toContainEqual({
    region: "North",
    product: "Widget",
    status: "Active",
    n: 2,
  });
  expect(rows).toContainEqual({
    region: "North",
    product: "Widget",
    status: "Inactive",
    n: 1,
  });
  expect(rows).toContainEqual({
    region: "South",
    product: "Gadget",
    status: "Active",
    n: 2,
  });
});

Deno.test("count() - equivalence to groupBy + summarise (single group)", () => {
  const df = createDataFrame([
    { category: "A", value: 1 },
    { category: "B", value: 2 },
    { category: "A", value: 3 },
  ]);

  const countResult = df.count("category");
  const groupByResult = df
    .groupBy("category")
    .summarise({ n: (g) => g.nrows() });

  expect(countResult.toArray()).toEqual(groupByResult.toArray());
});

Deno.test("count() - equivalence to groupBy + summarise (multiple groups)", () => {
  const df = createDataFrame([
    { region: "North", product: "Widget" },
    { region: "South", product: "Widget" },
    { region: "North", product: "Gadget" },
    { region: "North", product: "Widget" },
  ]);

  const countResult = df.count("region", "product");
  const groupByResult = df
    .groupBy("region", "product")
    .summarise({ n: (g) => g.nrows() });

  expect(countResult.toArray()).toEqual(groupByResult.toArray());
});

Deno.test("count() - large dataset", () => {
  const data = Array.from({ length: 10000 }, (_, i) => ({
    category: `Cat${i % 10}`,
    subcategory: `Sub${i % 3}`,
    value: i,
  }));
  const df = createDataFrame(data);

  const result = df.count("category", "subcategory");

  // 10 categories × 3 subcategories = 30 groups
  expect(result.nrows()).toBe(30);

  // Each group should have ~333-334 rows (10000 / 30)
  const firstGroup = result.toArray()[0];
  expect(firstGroup.n).toBeGreaterThanOrEqual(333);
  expect(firstGroup.n).toBeLessThanOrEqual(334);
});

Deno.test("count() - chaining with other verbs", () => {
  const df = createDataFrame([
    { region: "North", product: "Widget", quantity: 10 },
    { region: "South", product: "Widget", quantity: 20 },
    { region: "North", product: "Gadget", quantity: 15 },
    { region: "South", product: "Widget", quantity: 5 },
    { region: "North", product: "Widget", quantity: 8 },
  ]);

  const result = df
    .count("region", "product")
    .filter((row) => row.n > 1)
    .arrange("n", "desc");

  expect(result.nrows()).toBe(2);
  expect(result[0]).toEqual({ region: "North", product: "Widget", n: 2 });
  expect(result[1]).toEqual({ region: "South", product: "Widget", n: 2 });
});

Deno.test("count() - numeric grouping column", () => {
  const df = createDataFrame([
    { age: 25, name: "Alice" },
    { age: 30, name: "Bob" },
    { age: 25, name: "Charlie" },
    { age: 30, name: "David" },
    { age: 35, name: "Eve" },
  ]);

  const result = df.count("age");

  expect(result.nrows()).toBe(3);

  const rows = result.toArray();
  expect(rows).toContainEqual({ age: 25, n: 2 });
  expect(rows).toContainEqual({ age: 30, n: 2 });
  expect(rows).toContainEqual({ age: 35, n: 1 });
});

Deno.test("count() - boolean grouping column", () => {
  const df = createDataFrame([
    { active: true, name: "Alice" },
    { active: false, name: "Bob" },
    { active: true, name: "Charlie" },
    { active: true, name: "David" },
    { active: false, name: "Eve" },
  ]);

  const result = df.count("active");

  expect(result.nrows()).toBe(2);

  const rows = result.toArray();
  expect(rows).toContainEqual({ active: true, n: 3 });
  expect(rows).toContainEqual({ active: false, n: 2 });
});

Deno.test("count() - real-world example: message statistics", () => {
  const messagesWithUsers = createDataFrame([
    { user_role: "Clinician", tofrom_pat_c: "1", message_id: 1 },
    { user_role: "RN", tofrom_pat_c: "2", message_id: 2 },
    { user_role: "Clinician", tofrom_pat_c: "1", message_id: 3 },
    { user_role: "MA", tofrom_pat_c: "1", message_id: 4 },
    { user_role: "Clinician", tofrom_pat_c: "2", message_id: 5 },
  ]);

  // Count by user role
  const byRole = messagesWithUsers.count("user_role");
  expect(byRole.nrows()).toBe(3);

  const roleRows = byRole.toArray();
  expect(roleRows).toContainEqual({ user_role: "Clinician", n: 3 });
  expect(roleRows).toContainEqual({ user_role: "RN", n: 1 });
  expect(roleRows).toContainEqual({ user_role: "MA", n: 1 });

  // Count by direction (to/from patient)
  const byDirection = messagesWithUsers.count("tofrom_pat_c");
  expect(byDirection.nrows()).toBe(2);

  const directionRows = byDirection.toArray();
  expect(directionRows).toContainEqual({ tofrom_pat_c: "1", n: 3 });
  expect(directionRows).toContainEqual({ tofrom_pat_c: "2", n: 2 });

  // Count by role and direction
  const byRoleAndDirection = messagesWithUsers.count(
    "user_role",
    "tofrom_pat_c",
  );
  expect(byRoleAndDirection.nrows()).toBe(4);
});
