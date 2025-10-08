import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { test } from "../../tests/shims/test.ts";

test("Joining DataFrames - Progressive Examples", () => {
  // ============================================================================
  // 1. SETTING UP THE DATA - Create our working datasets
  // ============================================================================
  console.log("=== 1. Setting Up the Data ===");

  // Customer information
  const customers = createDataFrame([
    { customer_id: 1, name: "Alice", city: "New York", segment: "Premium" },
    { customer_id: 2, name: "Bob", city: "Los Angeles", segment: "Standard" },
    { customer_id: 3, name: "Carol", city: "Chicago", segment: "Premium" },
    { customer_id: 4, name: "Dave", city: "Houston", segment: "Basic" },
  ]);

  // Order information
  const orders = createDataFrame([
    { order_id: 101, customer_id: 1, product: "Widget", amount: 250.00 },
    { order_id: 102, customer_id: 2, product: "Gadget", amount: 150.00 },
    { order_id: 103, customer_id: 1, product: "Tool", amount: 300.00 },
    { order_id: 104, customer_id: 5, product: "Device", amount: 200.00 }, // No matching customer
  ]);

  console.log("Customers table:");
  customers.print();

  console.log("Orders table:");
  orders.print();

  // ============================================================================
  // 2. INNER JOIN - Matching rows only
  // ============================================================================
  console.log("\n=== 2. Inner Join - Matching Rows Only ===");

  // Inner join: only rows with matching keys in both tables
  // Start with the most common join type: inner join
  const innerJoin = customers
    .innerJoin(orders, "customer_id");

  console.log("Inner join (only customers with orders):");
  innerJoin.print();
  console.log("Result length:", innerJoin.nrows());

  // ============================================================================
  // 3. LEFT JOIN - All left table rows
  // ============================================================================
  console.log("\n=== 3. Left Join - All Left Table Rows ===");

  // Left join: all rows from left table, matched rows from right
  // This preserves all customers, even those without orders
  const leftJoin = customers
    .leftJoin(orders, "customer_id");

  console.log("Left join (all customers, with orders if available):");
  leftJoin.print();
  console.log("Result length:", leftJoin.nrows());

  // ============================================================================
  // 4. RIGHT JOIN - All right table rows
  // ============================================================================
  console.log("\n=== 4. Right Join - All Right Table Rows ===");

  // Right join: all rows from right table, matched rows from left
  // This preserves all orders, even those without customer info
  const rightJoin = customers
    .rightJoin(orders, "customer_id");

  console.log("Right join (all orders, with customer info if available):");
  rightJoin.print();
  console.log("Result length:", rightJoin.nrows());

  // ============================================================================
  // 5. OUTER JOIN - All rows from both tables
  // ============================================================================
  console.log("\n=== 5. Outer Join - All Rows from Both Tables ===");

  // Outer join: all rows from both tables
  // This is the most comprehensive join type
  const outerJoin = customers
    .outerJoin(orders, "customer_id");

  console.log("Outer join (all customers and all orders):");
  outerJoin.print();
  console.log("Result length:", outerJoin.nrows());

  // ============================================================================
  // 6. CROSS JOIN - Cartesian product
  // ============================================================================
  console.log("\n=== 6. Cross Join - Cartesian Product ===");

  // Cross join: Cartesian product of both tables
  // This creates every possible combination
  const crossJoin = customers
    .crossJoin(orders);

  console.log("Cross join (every customer paired with every order):");
  crossJoin.print();
  console.log("Result length:", crossJoin.nrows(), "(4 customers × 4 orders)");

  // ============================================================================
  // 7. bindRows - Combining DataFrames vertically
  // ============================================================================
  console.log("\n=== 7. Bind Rows - Combining DataFrames Vertically ===");

  // Create new orders to add to our existing orders
  const newOrders = createDataFrame([
    { order_id: 105, customer_id: 3, product: "Widget", amount: 175.00 },
    { order_id: 106, customer_id: 4, product: "Gadget", amount: 225.00 },
  ]);

  console.log("New orders to add:");
  newOrders.print();

  // Use bindRows to combine orders vertically
  const allOrders = orders.bindRows(newOrders);
  console.log("All orders after bindRows:");
  allOrders.print();
  console.log("Total orders:", allOrders.nrows());

  // Create orders with additional columns
  const ordersWithDetails = createDataFrame([
    {
      order_id: 107,
      customer_id: 1,
      product: "Tool",
      amount: 350.00,
      priority: "High",
      notes: "Rush delivery",
    },
    {
      order_id: 108,
      customer_id: 2,
      product: "Widget",
      amount: 125.00,
      priority: "Normal",
    },
  ]);

  console.log("\nOrders with additional columns:");
  ordersWithDetails.print();

  // bindRows handles different column sets gracefully
  const combinedOrders = orders.bindRows(newOrders, ordersWithDetails);
  console.log(
    "\nCombined orders with different columns (alphabetically sorted):",
  );
  combinedOrders.print();

  // ============================================================================
  // 8. ADDING MORE DATA - Expanding our analysis
  // ============================================================================
  console.log("\n=== 8. Adding More Data - Expanding Our Analysis ===");

  // Additional data for more complex analysis
  const customerDetails = createDataFrame([
    { customer_id: 1, age: 28, registration_date: "2022-01-15" },
    { customer_id: 2, age: 35, registration_date: "2022-02-20" },
    { customer_id: 3, age: 42, registration_date: "2021-12-10" },
    { customer_id: 4, age: 29, registration_date: "2023-01-05" },
  ]);

  const productInfo = createDataFrame([
    { product: "Widget", category: "Tools", margin: 0.3 },
    { product: "Gadget", category: "Electronics", margin: 0.25 },
    { product: "Tool", category: "Tools", margin: 0.35 },
    { product: "Device", category: "Electronics", margin: 0.28 },
  ]);

  console.log("Customer details:");
  customerDetails.print();

  console.log("Product information:");
  productInfo.print();

  // ============================================================================
  // 9. MULTI-STEP JOIN ANALYSIS - Building complex joins
  // ============================================================================
  console.log("\n=== 9. Multi-Step Join Analysis - Building Complex Joins ===");

  // Complex analysis with multiple joins
  // This shows how to chain multiple joins together
  const fullAnalysis = orders
    .leftJoin(customers, "customer_id") // Get customer info for each order
    .leftJoin(productInfo, "product") // Get product info for each order
    .leftJoin(customerDetails, "customer_id") // Get additional customer details
    .mutate({
      profit: (row) => row.amount * (row.margin || 0), // Calculate profit
      customer_age_group: (row) => {
        if (!row.age) return "Unknown";
        if (row.age < 30) return "Young";
        if (row.age < 40) return "Middle";
        return "Mature";
      },
    })
    .select(
      "order_id",
      "name",
      "city",
      "segment",
      "product",
      "category",
      "amount",
      "profit",
      "customer_age_group",
    );

  console.log("Complete order analysis with multiple joins:");
  fullAnalysis.print();

  // ============================================================================
  // 10. DIFFERENT KEY NAMES - Handling column mismatches
  // ============================================================================
  console.log("\n=== 10. Different Key Names - Handling Column Mismatches ===");

  // Example when join keys have different names
  const suppliers = createDataFrame([
    { supplier_code: "S1", supplier_name: "ACME Corp", rating: 4.5 },
    { supplier_code: "S2", supplier_name: "Best Supply", rating: 4.2 },
  ]);

  const inventory = createDataFrame([
    { item_id: 1, item_name: "Widget", vendor_code: "S1", stock: 100 },
    { item_id: 2, item_name: "Gadget", vendor_code: "S2", stock: 50 },
    { item_id: 3, item_name: "Tool", vendor_code: "S1", stock: 75 },
  ]);

  console.log("Suppliers:");
  suppliers.print();

  console.log("Inventory:");
  inventory.print();

  // Note: This example assumes your join implementation supports different key names
  // You might need to rename columns first if not supported
  const supplierInventory = inventory
    .rename({ supplier_code: "vendor_code" }) // Align key names
    .leftJoin(suppliers, "supplier_code");

  console.log("Inventory with supplier info (renamed columns):");
  supplierInventory.print();

  // ============================================================================
  // 11. HANDLING DUPLICATE KEYS - Multiple matches
  // ============================================================================
  console.log("\n=== 11. Handling Duplicate Keys - Multiple Matches ===");

  // Example with multiple orders per customer
  const moreOrders = createDataFrame([
    { order_id: 201, customer_id: 1, product: "Widget", amount: 100.00 },
    { order_id: 202, customer_id: 1, product: "Gadget", amount: 200.00 },
    { order_id: 203, customer_id: 2, product: "Widget", amount: 150.00 },
    { order_id: 204, customer_id: 2, product: "Tool", amount: 250.00 },
  ]);

  console.log("More orders (multiple per customer):");
  moreOrders.print();

  // Join will create multiple rows for customers with multiple orders
  const customerOrders = customers
    .select("customer_id", "name", "segment") // Select key columns
    .innerJoin(moreOrders, "customer_id");

  console.log("Customers with all their orders (duplicate keys handled):");
  customerOrders.print();

  // ============================================================================
  // 12. POST-JOIN ANALYSIS - Working with joined data
  // ============================================================================
  console.log("\n=== 12. Post-Join Analysis - Working with Joined Data ===");

  // Analysis after joining
  // This shows how to use the joined data for further analysis
  const orderSummary = customerOrders
    .groupBy("customer_id", "name", "segment")
    .summarise({
      total_orders: (df) => df.nrows(),
      total_amount: (df) => stats.sum(df.amount),
      avg_order_amount: (df) => {
        return stats.round(stats.mean(df.amount), 2);
      },
    })
    .arrange("total_amount", "desc");

  console.log("Customer order summary (post-join analysis):");
  orderSummary.print();

  // ============================================================================
  // 13. PUTTING IT ALL TOGETHER - Complete joining workflow
  // ============================================================================
  console.log(
    "\n=== 13. Putting It All Together - Complete Joining Workflow ===",
  );

  // Show a complete workflow that demonstrates all the joining concepts
  const finalResult = orders
    .filter((row) => row.amount > 0) // Data validation
    .leftJoin(customers, "customer_id") // Get customer information
    .leftJoin(productInfo, "product") // Get product information
    .leftJoin(customerDetails, "customer_id") // Get customer details
    .mutate({
      profit: (row) => row.amount * (row.margin || 0), // Calculate profit
      customer_age_group: (row) => {
        if (!row.age) return "Unknown";
        if (row.age < 30) return "Young";
        if (row.age < 40) return "Middle";
        return "Mature";
      },
      order_category: (row) => row.category || "Unknown", // Handle missing categories
    }) // Add calculated columns
    .groupBy("customer_id", "name", "segment", "customer_age_group") // Group for analysis
    .summarise({
      total_orders: (group) => group.nrows(),
      total_amount: (group) => stats.sum(group.amount),
      total_profit: (group) => stats.sum(group.profit),
      avg_order_amount: (group) => stats.round(stats.mean(group.amount), 2),
      categories: (group) => stats.unique(group.order_category),
    }) // Calculate comprehensive statistics
    .ungroup() // Remove grouping
    .arrange("total_profit", "desc") // Sort by profitability
    .select(
      "name",
      "segment",
      "customer_age_group",
      "total_orders",
      "total_amount",
      "total_profit",
      "avg_order_amount",
      "categories",
    ); // Select relevant columns

  console.log("Complete joining workflow combining all concepts:");
  finalResult.print();

  // Test assertions
  expect(innerJoin.nrows()).toBe(3); // 3 orders with matching customers
  expect(leftJoin.nrows()).toBe(5); // All customers with their orders (Alice has 2 orders)
  expect(rightJoin.nrows()).toBe(4); // 4 orders (some with customer info)
  expect(outerJoin.nrows()).toBe(6); // 5 customer rows (Alice appears twice) + 1 order without customer
  expect(crossJoin.nrows()).toBe(16); // 4 customers × 4 orders

  // Test bindRows functionality
  expect(allOrders.nrows()).toBe(6); // 4 original + 2 new
  expect(combinedOrders.nrows()).toBe(8); // 4 original + 2 new + 2 with details
  expect(combinedOrders.columns()).toContain("notes"); // New column from ordersWithDetails
  expect(combinedOrders.columns()).toContain("priority"); // New column from ordersWithDetails
  expect(fullAnalysis.nrows()).toBe(4); // 4 orders
  expect(fullAnalysis.columns()).toContain("profit");
  expect(fullAnalysis.columns()).toContain("customer_age_group");
  expect(supplierInventory.nrows()).toBe(3); // 3 inventory items
  expect(customerOrders.nrows()).toBe(4); // 4 orders for 2 customers
  expect(orderSummary.nrows()).toBe(2); // 2 customers with summaries
  expect(orderSummary.columns()).toContain("total_orders");
  expect(orderSummary.columns()).toContain("total_amount");
  expect(orderSummary.columns()).toContain("avg_order_amount");
  expect(finalResult.nrows()).toBeGreaterThan(0);
  expect(finalResult.total_profit).toBeDefined();
  expect(finalResult.categories).toBeDefined();
});
