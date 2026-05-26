// run-48-joins-dynamic-chained.ts
// Chained joins across 4 tables; dynamic join key helper; regional revenue vs targets;
// customer with orders in >= 2 product categories.

import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// ---------------------------------------------------------------------------
// Source tables
// ---------------------------------------------------------------------------

const customers = createDataFrame([
  { customer_id: 1, name: "Alice", region: "North", signup_date: "2024-01-15" },
  { customer_id: 2, name: "Bob", region: "South", signup_date: "2024-02-20" },
  { customer_id: 3, name: "Carol", region: "East", signup_date: "2024-03-10" },
  { customer_id: 4, name: "Dan", region: "West", signup_date: "2024-04-05" },
]);

const orders = createDataFrame([
  { order_id: 101, customer_id: 1, product_id: 10, amount: 50.0 },
  { order_id: 102, customer_id: 1, product_id: 20, amount: 30.0 },
  { order_id: 103, customer_id: 2, product_id: 10, amount: 50.0 },
  { order_id: 104, customer_id: 3, product_id: 30, amount: 75.0 },
  { order_id: 105, customer_id: 3, product_id: 10, amount: 50.0 },
  { order_id: 106, customer_id: 4, product_id: 20, amount: 30.0 },
]);

const products = createDataFrame([
  { product_id: 10, name: "Widget", category: "Hardware" },
  { product_id: 20, name: "Sprocket", category: "Hardware" },
  { product_id: 30, name: "Gizmo", category: "Electronics" },
]);

const regionTargets = createDataFrame([
  { region: "North", target_amount: 100 },
  { region: "South", target_amount: 150 },
  { region: "East", target_amount: 200 },
  { region: "West", target_amount: 100 },
]);

// ---------------------------------------------------------------------------
// Task 1: denormalized table via chained joins
// ---------------------------------------------------------------------------

// Rename clashing "name" columns so we can keep both customer name and product name.
const customersRenamed = customers.rename({ name: "customer_name" });
const productsRenamed = products.rename({ name: "product_name" });
const regionTargetsRenamed = regionTargets.rename({
  target_amount: "region_target",
});

const denormalized = orders
  .innerJoin(customersRenamed, "customer_id")
  .innerJoin(productsRenamed, "product_id")
  .innerJoin(regionTargetsRenamed, "region")
  .select(
    "order_id",
    "customer_id",
    "customer_name",
    "region",
    "product_id",
    "product_name",
    "category",
    "amount",
    "region_target",
  );

denormalized.print("Task 1 — denormalized orders");

// ---------------------------------------------------------------------------
// Task 2: dynamic join-key helper
// ---------------------------------------------------------------------------

// We accept generic DataFrame-shaped inputs by typing through the concrete
// DataFrames we will pass in. We use `any` only at the parameter type because
// the skill does not document a generic DataFrame interface; the runtime
// behaviour is what we are demonstrating.
// deno-lint-ignore no-explicit-any
type AnyDF = { columns(): string[]; innerJoin: (...args: any[]) => any };

function joinByColumns<L extends AnyDF, R extends AnyDF>(
  left: L,
  right: R,
  columns: string[],
) {
  if (columns.length === 0) {
    throw new Error("joinByColumns: at least one column is required");
  }
  const leftCols = left.columns();
  const rightCols = right.columns();
  const missingLeft = columns.filter((c) => !leftCols.includes(c));
  const missingRight = columns.filter((c) => !rightCols.includes(c));
  if (missingLeft.length > 0) {
    throw new Error(
      `joinByColumns: left frame missing column(s): ${
        missingLeft.join(", ")
      }. Available: ${leftCols.join(", ")}`,
    );
  }
  if (missingRight.length > 0) {
    throw new Error(
      `joinByColumns: right frame missing column(s): ${
        missingRight.join(", ")
      }. Available: ${rightCols.join(", ")}`,
    );
  }
  // The skill documents two overloads: a single string, an array of strings,
  // or the `{ keys, suffixes }` object form. For a runtime-built list of
  // columns we pass the array directly.
  return left.innerJoin(right, columns);
}

const byCustomer = joinByColumns(orders, customers, ["customer_id"]);
console.log(
  `Task 2a — joinByColumns(orders, customers, ["customer_id"]) -> ${byCustomer.nrows()} rows`,
);

const byProduct = joinByColumns(orders, products, ["product_id"]);
console.log(
  `Task 2b — joinByColumns(orders, products, ["product_id"]) -> ${byProduct.nrows()} rows`,
);

// Sanity-check the error path: a missing column should throw a useful message.
try {
  joinByColumns(orders, customers, ["nonexistent_id"]);
  console.log("Task 2c — FAILED: expected an error for missing column");
} catch (err) {
  console.log(
    `Task 2c — guard works: ${(err as Error).message}`,
  );
}

// ---------------------------------------------------------------------------
// Task 3: per-region revenue vs target
// ---------------------------------------------------------------------------

// orders has customer_id but not region; bring region in first.
const ordersWithRegion = orders.innerJoin(
  customers.select("customer_id", "region"),
  "customer_id",
);

const perRegion = ordersWithRegion
  .groupBy("region")
  .summarize({
    total_revenue: (g) => s.sum(g.amount),
  })
  .ungroup()
  .innerJoin(regionTargets, "region")
  .mutate({
    met_target: (r) => (r.total_revenue ?? 0) >= r.target_amount,
  })
  .arrange("region");

perRegion.print("Task 3 — per-region revenue vs target");

// ---------------------------------------------------------------------------
// Task 4: customer with orders in >= 2 categories
// ---------------------------------------------------------------------------

// Build (customer, category) pairs, dedupe, then count distinct categories per customer.
const customerCategoryPairs = orders
  .innerJoin(products, "product_id")
  .select("customer_id", "category")
  .distinct("customer_id", "category");

const multiCategory = customerCategoryPairs
  .groupBy("customer_id")
  .summarize({
    n_categories: (g) => g.nrows(),
    categories: (g) => s.unique(g.category).join(", "),
  })
  .ungroup()
  .filter((r) => r.n_categories >= 2)
  .innerJoin(customers.select("customer_id", "name"), "customer_id");

multiCategory.print("Task 4 — customers in >= 2 categories");

for (const row of multiCategory.toRows()) {
  console.log(
    `Task 4 — ${row.name} ordered in categories: ${row.categories}`,
  );
}
