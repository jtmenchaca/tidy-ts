import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { test } from "../../tests/shims/test.ts";

test("Grouped Statistics - Progressive Examples", () => {
  // ============================================================================
  // 1. SETTING UP THE DATA - Create our working dataset
  // ============================================================================
  console.log("=== 1. Setting Up the Data ===");

  // Sample data for all tests
  const salesData = createDataFrame([
    {
      id: 1,
      date: new Date("2023-01-15"),
      product: "Widget Pro",
      price: 29.99,
      quantity: 5,
      customer: "Alice Johnson",
      region: "North",
      category: "Electronics",
      sold: true,
    },
    {
      id: 2,
      date: new Date("2023-01-20"),
      product: "Gadget Max",
      price: 49.99,
      quantity: 2,
      customer: "Bob Smith",
      region: "South",
      category: "Electronics",
      sold: true,
    },
    {
      id: 3,
      date: new Date("2023-02-01"),
      product: "Tool Kit",
      price: 79.99,
      quantity: 1,
      customer: "Carol Davis",
      region: "East",
      category: "Tools",
      sold: false,
    },
    {
      id: 4,
      date: new Date("2023-02-15"),
      product: "Device Elite",
      price: 199.99,
      quantity: 3,
      customer: "Dave Wilson",
      region: "West",
      category: "Electronics",
      sold: true,
    },
    {
      id: 5,
      date: new Date("2023-03-01"),
      product: "Widget Pro",
      price: 29.99,
      quantity: 10,
      customer: "Eve Brown",
      region: "North",
      category: "Electronics",
      sold: true,
    },
    {
      id: 6,
      date: new Date("2023-03-10"),
      product: "Hammer Set",
      price: 45.99,
      quantity: 2,
      customer: "Frank Miller",
      region: "East",
      category: "Tools",
      sold: true,
    },
    {
      id: 7,
      date: new Date("2023-03-15"),
      product: "Drill Kit",
      price: 89.99,
      quantity: 1,
      customer: "Grace Lee",
      region: "West",
      category: "Tools",
      sold: true,
    },
    {
      id: 8,
      date: new Date("2023-03-20"),
      product: "Smartphone",
      price: 299.99,
      quantity: 1,
      customer: "Henry Chen",
      region: "North",
      category: "Electronics",
      sold: true,
    },
  ]);

  console.log("Sample sales data:");
  salesData.print();

  // ============================================================================
  // 2. BASIC GROUPED STATISTICS - Simple grouping by region
  // ============================================================================
  console.log(
    "\n=== 2. Basic Grouped Statistics - Simple Grouping by Region ===",
  );

  // Start with the simplest case: grouping by one column
  const regionStats = salesData
    .groupBy("region")
    .summarise({
      total_sales: (df) =>
        stats.sum(df.price.map((p, i) => p * df.quantity[i])),
      avg_price: (df) => stats.mean(df.price),
      total_quantity: (df) => stats.sum(df.quantity),
      avg_quantity: (df) => stats.mean(df.quantity),
      transaction_count: (df) => df.nrows(),
    });

  console.log("Sales statistics by region:");
  regionStats.print();

  // ============================================================================
  // 3. GROUPED STATISTICS BY CATEGORY - Product category analysis
  // ============================================================================
  console.log(
    "\n=== 3. Grouped Statistics by Category - Product Category Analysis ===",
  );

  // Group by product category
  // This shows how to analyze different product types
  const categoryStats = salesData
    .groupBy("category")
    .summarise({
      total_revenue: (df) =>
        stats.sum(df.price.map((p, i) => p * df.quantity[i])),
      avg_unit_price: (df) => stats.mean(df.price),
      total_units_sold: (df) => stats.sum(df.quantity),
      avg_order_size: (df) => stats.mean(df.quantity),
      product_count: (df) => df.nrows(),
      success_rate: (df) => {
        const successful = stats.countValue(df.sold, true);
        return stats.round((successful / df.nrows()) * 100);
      },
    });

  console.log("Product category statistics:");
  categoryStats.print();

  // ============================================================================
  // 4. MULTI-LEVEL GROUPING - Region and category together
  // ============================================================================
  console.log(
    "\n=== 4. Multi-Level Grouping - Region and Category Together ===",
  );

  // Multi-level grouping
  // This demonstrates how to group by multiple columns
  const regionCategoryStats = salesData
    .groupBy("region", "category")
    .summarise({
      total_revenue: (df) => stats.sum(df.price),
      avg_price: (df) => stats.mean(df.price),
      total_quantity: (df) => stats.sum(df.quantity),
      transaction_count: (df) => df.nrows(),
    })
    .arrange(["region", "category"]);

  console.log("Sales by region and category:");
  regionCategoryStats.print();

  // ============================================================================
  // 5. CONDITIONAL GROUPING - Filtering before grouping
  // ============================================================================
  console.log("\n=== 5. Conditional Grouping - Filtering Before Grouping ===");

  // Only successful sales, grouped by region
  // This shows how to combine filtering with grouping
  const successfulSalesByRegion = salesData
    .filter((row) => row.sold === true)
    .groupBy("region")
    .summarise({
      total_revenue: (df) => stats.sum(df.price),
      avg_order_value: (df) => {
        return stats.round(stats.mean(df.price), 2);
      },
      total_units: (df) => stats.sum(df.quantity),
      avg_units_per_order: (df) =>
        stats.round(stats.mean(df.quantity, true), 2),
      order_count: (df) => df.nrows(),
    })
    .arrange("total_revenue", "desc");

  console.log("Successful sales by region:");
  successfulSalesByRegion.print();

  // ============================================================================
  // 6. ADVANCED STATISTICAL CALCULATIONS - Complex metrics
  // ============================================================================
  console.log(
    "\n=== 6. Advanced Statistical Calculations - Complex Metrics ===",
  );

  // Advanced statistical calculations
  // This demonstrates more sophisticated statistical analysis
  const advancedStats = salesData
    .groupBy("category")
    .summarise({
      // Basic sums and means
      total_revenue: (df) => stats.sum(df.price),
      avg_unit_price: (df) => stats.mean(df.price),
      total_units: (df) => stats.sum(df.quantity),

      // Calculated metrics
      revenue_per_unit: (df) => {
        const totalRevenue = stats.sum(df.price);
        const totalUnits = stats.sum(df.quantity);
        return stats.round(totalRevenue / totalUnits, 2);
      },

      // Success metrics
      successful_transactions: (df) => stats.countValue(df.sold, true),
      total_transactions: (df) => df.nrows(),
      success_rate_percent: (df) => {
        const successful = stats.countValue(df.sold, true);
        return stats.round((successful / df.nrows()) * 100);
      },

      // Price analysis
      min_price: (df) => stats.min(df.price),
      max_price: (df) => stats.max(df.price),
      price_range: (df) => {
        const min = stats.min(df.price);
        const max = stats.max(df.price);
        if (min === null || max === null) return 0;
        return stats.round(max - min, 2);
      },
    })
    .arrange("total_revenue", "desc");

  console.log("Advanced statistics by category:");
  advancedStats.print();

  // ============================================================================
  // 7. TIME-BASED GROUPING - Monthly trends analysis
  // ============================================================================
  console.log("\n=== 7. Time-Based Grouping - Monthly Trends Analysis ===");

  // Time-based grouping
  // This shows how to analyze trends over time
  const monthlyStats = salesData
    .mutate({
      month: (row) => row.date.toISOString().slice(0, 7), // YYYY-MM format
      revenue: (row) => row.price * row.quantity,
    })
    .groupBy("month")
    .summarise({
      total_revenue: (df) => stats.sum(df.revenue),
      avg_order_value: (df) => stats.mean(df.revenue),
      total_orders: (df) => df.nrows(),
      successful_orders: (df) => stats.countValue(df.sold, true),
      success_rate: (df) => {
        const successful = stats.countValue(df.sold, true);
        return stats.round((successful / df.nrows()) * 100);
      },
    })
    .arrange("month");

  console.log("Monthly sales trends:");
  monthlyStats.print();

  // ============================================================================
  // 8. PERFORMANCE COMPARISON - Regional performance analysis
  // ============================================================================
  console.log(
    "\n=== 8. Performance Comparison - Regional Performance Analysis ===",
  );

  // Performance comparison across regions
  // This demonstrates how to create performance metrics
  const performanceComparison = salesData
    .groupBy("region")
    .summarise({
      total_revenue: (df) => stats.sum(df.price),
      avg_order_value: (df) => {
        return stats.round(stats.mean(df.price), 2);
      },
      total_orders: (df) => df.nrows(),
      success_rate: (df) => {
        const successful = stats.countValue(df.sold, true);
        return stats.round((successful / df.nrows()) * 100);
      },
    })
    .mutate({
      revenue_per_order: (row) =>
        stats.round(row.total_revenue / row.total_orders, 2),
      performance_score: (row) => {
        // Simple performance score based on revenue and success rate
        const revenueScore = row.total_revenue / 1000; // Normalize to 0-1 scale
        const successScore = row.success_rate / 100;
        return stats.round(revenueScore * 0.7 + successScore * 0.3, 2);
      },
    })
    .arrange("performance_score", "desc");

  console.log("Regional performance comparison:");
  performanceComparison.print();

  // ============================================================================
  // 9. ADVANCED GROUPING PATTERNS - Complex scenarios
  // ============================================================================
  console.log("\n=== 9. Advanced Grouping Patterns - Complex Scenarios ===");

  // Show more advanced grouping patterns
  const advancedGrouping = salesData
    .mutate({
      price_tier: (row) => {
        if (row.price >= 100) return "High";
        if (row.price >= 50) return "Medium";
        return "Low";
      },
      quarter: (row) => {
        const month = row.date.getMonth();
        if (month < 3) return "Q1";
        if (month < 6) return "Q2";
        if (month < 9) return "Q3";
        return "Q4";
      },
    })
    .groupBy("price_tier", "quarter", "category")
    .summarise({
      price_tier: (group) => group.price_tier[0],
      quarter: (group) => group.quarter[0],
      category: (group) => group.category[0],
      total_revenue: (group) => stats.sum(group.price),
      avg_price: (group) => stats.round(stats.mean(group.price), 2),
      transaction_count: (group) => group.nrows(),
      success_rate: (group) => {
        const successful = stats.countValue(group.sold, true);
        return stats.round((successful / group.nrows()) * 100);
      },
    })
    .ungroup()
    .arrange("total_revenue", "desc");

  console.log("Advanced grouping by price tier, quarter, and category:");
  advancedGrouping.print();

  // ============================================================================
  // 10. CUMULATIVE STATISTICS - Running totals and trends
  // ============================================================================
  console.log(
    "\n=== 10. Cumulative Statistics - Running Totals and Trends ===",
  );

  // Calculate cumulative statistics
  // This shows how to track running totals and trends
  const cumulativeStats = salesData
    .arrange("date")
    .mutate({
      revenue: (row) => row.price * row.quantity,
    })
    .mutate({
      cumulative_revenue: (_row, _index, df) => stats.cumsum(df.revenue),
      cumulative_orders: (_row, index) => index + 1,
      avg_revenue_per_order: (_row, _index, df) =>
        stats.round(stats.mean(df.revenue), 2),
    })
    .select(
      "date",
      "product",
      "revenue",
      "cumulative_revenue",
      "cumulative_orders",
      "avg_revenue_per_order",
    );

  console.log("Cumulative statistics over time:");
  cumulativeStats.print();

  // ============================================================================
  // 11. FUNCTION USAGE EXAMPLES - Key functions documentation
  // ============================================================================
  console.log(
    "\n=== 11. Function Usage Examples - Key Functions Documentation ===",
  );

  // Summary of key functions used
  const functionExamples = createDataFrame([
    {
      function: "sum()",
      description: "Adds up all values in an array",
      example: "sum(df.price) - sums all prices",
      use_case: "Total revenue, total quantities, counting successes",
    },
    {
      function: "mean()",
      description: "Calculates the average of all values",
      example: "mean(df.price) - average price per item",
      use_case: "Average order value, average unit price, typical quantities",
    },
    {
      function: "groupBy()",
      description: "Groups data by specified columns",
      example: "groupBy('region', 'category')",
      use_case: "Organize data for analysis by dimensions",
    },
    {
      function: "summarise()",
      description: "Applies functions to grouped data",
      example: "summarise({ total: (df) => sum(df.value) })",
      use_case: "Calculate statistics for each group",
    },
  ]);

  console.log("Key functions demonstrated:");
  functionExamples.print();

  // ============================================================================
  // 12. PUTTING IT ALL TOGETHER - Complete grouped analysis workflow
  // ============================================================================
  console.log(
    "\n=== 12. Putting It All Together - Complete Grouped Analysis Workflow ===",
  );

  // Show a complete workflow that demonstrates all the grouped statistics concepts
  const finalResult = salesData
    .filter((row) => row.sold === true) // Data validation
    .mutate({
      revenue: (row) => row.price * row.quantity,
      month: (row) => row.date.toISOString().slice(0, 7),
      price_tier: (row) => {
        if (row.price >= 100) return "High";
        if (row.price >= 50) return "Medium";
        return "Low";
      },
    }) // Add calculated columns
    .groupBy("region", "category", "price_tier") // Multi-level grouping
    .summarise({
      region: (group) => group.region[0],
      category: (group) => group.category[0],
      price_tier: (group) => group.price_tier[0],
      total_revenue: (group) => stats.sum(group.revenue),
      avg_revenue: (group) => stats.round(stats.mean(group.revenue), 2),
      transaction_count: (group) => group.nrows(),
      avg_price: (group) => stats.round(stats.mean(group.price), 2),
      total_quantity: (group) => stats.sum(group.quantity),
    }) // Calculate comprehensive statistics
    .ungroup() // Remove grouping
    .arrange("total_revenue", "desc") // Sort by performance
    .select(
      "region",
      "category",
      "price_tier",
      "total_revenue",
      "avg_revenue",
      "transaction_count",
      "avg_price",
      "total_quantity",
    ); // Select relevant columns

  console.log("Complete grouped analysis workflow combining all concepts:");
  finalResult.print();

  // Test assertions
  expect(regionStats.nrows()).toBe(4); // 4 regions: North, South, East, West
  expect(categoryStats.nrows()).toBe(2); // 2 categories: Electronics, Tools
  expect(regionCategoryStats.nrows()).toBe(5); // 5 region-category combinations
  expect(successfulSalesByRegion.nrows()).toBe(4); // All regions have successful sales
  expect(advancedStats.nrows()).toBe(2); // 2 categories
  expect(monthlyStats.nrows()).toBe(3); // 3 months
  expect(performanceComparison.nrows()).toBe(4); // 4 regions
  expect(advancedGrouping.nrows()).toBeGreaterThan(0);
  expect(advancedGrouping.total_revenue).toBeDefined();
  expect(cumulativeStats.nrows()).toBe(8); // All 8 transactions
  expect(cumulativeStats.cumulative_revenue).toBeDefined();
  expect(functionExamples.nrows()).toBe(4); // 4 function examples
  expect(finalResult.nrows()).toBeGreaterThan(0);
  expect(finalResult.total_revenue).toBeDefined();
  expect(finalResult.avg_revenue).toBeDefined();

  // Additional verification
  const northRegion = regionStats.filter((r) => r.region === "North");
  expect(northRegion.nrows()).toBe(1);
  expect(northRegion.total_quantity[0]).toBe(16); // 5 + 10 + 1 = 16

  const electronics = categoryStats.filter((c) => c.category === "Electronics");
  expect(electronics.nrows()).toBe(1);
  expect(electronics.success_rate[0]).toBe(100); // All electronics sold successfully

  const totalSuccessfulOrders = stats.sum(successfulSalesByRegion.order_count);
  const originalSuccessfulOrders = salesData.filter((r) => r.sold === true)
    .nrows();
  expect(totalSuccessfulOrders).toBe(originalSuccessfulOrders);

  console.log("\n=== End of Grouped Statistics Examples ===");
});
