import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Reshaping Data - Pivot and Dummy Variables - Progressive Examples", () => {
  // ============================================================================
  // 1. SETTING UP THE DATA - Create our working dataset
  // ============================================================================
  console.log("=== 1. Setting Up the Data ===");

  // Wide format data (typical for analysis)
  const studentScores = createDataFrame([
    { student_id: 1, name: "Alice", math: 90, science: 85, english: 92 },
    { student_id: 2, name: "Bob", math: 78, science: 82, english: 75 },
    { student_id: 3, name: "Carol", math: 95, science: 88, english: 89 },
  ]);

  console.log("Original wide format data:");
  studentScores.print();

  // ============================================================================
  // 2. BASIC PIVOT LONGER - Converting wide to long format
  // ============================================================================
  console.log(
    "\n=== 2. Basic Pivot Longer - Converting Wide to Long Format ===",
  );

  // Convert wide to long format
  // Start with the simplest case: converting subject columns to rows
  const longScores = studentScores
    .pivotLonger({
      cols: ["math", "science", "english"],
      names_to: "subject",
      values_to: "score",
    });

  console.log("Converted to long format:");
  longScores.print();

  // ============================================================================
  // 3. BASIC PIVOT WIDER - Converting long to wide format
  // ============================================================================
  console.log(
    "\n=== 3. Basic Pivot Wider - Converting Long to Wide Format ===",
  );

  // Convert back to wide format
  // This shows how to reverse the pivot_longer operation
  const wideAgain = longScores
    .pivotWider({
      names_from: "subject",
      values_from: "score",
    });

  console.log("Converted back to wide format:");
  wideAgain.print();

  // ============================================================================
  // 4. REAL-WORLD PIVOT EXAMPLE - Sales data transformation
  // ============================================================================
  console.log(
    "\n=== 4. Real-World Pivot Example - Sales Data Transformation ===",
  );

  // Sales data in long format
  // This demonstrates a more realistic use case
  const salesLong = createDataFrame([
    { month: "Jan", region: "North", metric: "revenue", value: 10000 },
    { month: "Jan", region: "North", metric: "units", value: 100 },
    { month: "Jan", region: "South", metric: "revenue", value: 8000 },
    { month: "Jan", region: "South", metric: "units", value: 80 },
    { month: "Feb", region: "North", metric: "revenue", value: 12000 },
    { month: "Feb", region: "North", metric: "units", value: 110 },
    { month: "Feb", region: "South", metric: "revenue", value: 9000 },
    { month: "Feb", region: "South", metric: "units", value: 85 },
  ]);

  console.log("Sales data (long format):");
  salesLong.print();

  // Pivot to get metrics as columns
  const salesWide = salesLong
    .pivotWider({
      names_from: "metric",
      values_from: "value",
    });

  console.log("Sales data pivoted wider (metrics as columns):");
  salesWide.print();

  // ============================================================================
  // 5. BASIC DUMMY VARIABLES - One-hot encoding introduction
  // ============================================================================
  console.log(
    "\n=== 5. Basic Dummy Variables - One-Hot Encoding Introduction ===",
  );

  const customerData = createDataFrame([
    { id: 1, name: "Alice", category: "Premium", region: "North" },
    { id: 2, name: "Bob", category: "Standard", region: "South" },
    { id: 3, name: "Carol", category: "Premium", region: "East" },
    { id: 4, name: "Dave", category: "Basic", region: "North" },
    { id: 5, name: "Eve", category: "Standard", region: "West" },
    { id: 6, name: "Frank", category: null, region: "South" }, // null value
  ]);

  console.log("Original customer data:");
  customerData.print();

  // Create dummy variables for category
  // Start with the simplest case: basic dummy variables
  const withCategoryDummies = customerData
    .dummyCol("category", {
      expected_categories: ["Premium", "Standard", "Basic"],
      prefix: "category_",
    });

  console.log("With category dummy variables (null values ignored):");
  withCategoryDummies.print();

  // ============================================================================
  // 6. DUMMY VARIABLES WITH OPTIONS - Customizing the output
  // ============================================================================
  console.log(
    "\n=== 6. Dummy Variables with Options - Customizing the Output ===",
  );

  // Create dummy variables with custom options
  // This shows how to customize naming and behavior
  const withPrefixDummies = customerData
    .dummyCol("region", {
      expected_categories: ["North", "South", "East", "West"],
      prefix: "region_",
      include_na: false, // Don't include null/undefined as a category
      drop_original: false, // Keep the original column
    });

  console.log("With region dummy variables (custom prefix, keep original):");
  withPrefixDummies.print();

  // ============================================================================
  // 7. HANDLING NULL VALUES - Managing missing data in dummies
  // ============================================================================
  console.log(
    "\n=== 7. Handling Null Values - Managing Missing Data in Dummies ===",
  );

  // Include null values as a category
  // This demonstrates how to handle missing data in categorical variables
  const withNullDummies = customerData
    .dummyCol("category", {
      expected_categories: ["Premium", "Standard", "Basic", "null"],
      include_na: true, // Include null/undefined as "NA" category
      prefix: "cat_",
      suffix: "_flag",
    });

  console.log("With null handling and custom naming:");
  withNullDummies.print();

  // ============================================================================
  // 8. MULTIPLE DUMMY COLUMNS - Working with several categorical variables
  // ============================================================================
  console.log(
    "\n=== 8. Multiple Dummy Columns - Working with Several Categorical Variables ===",
  );

  // Create dummy variables for multiple columns
  // This shows how to handle multiple categorical variables at once
  const multiDummies = customerData
    .dummyCol("category", {
      expected_categories: ["Premium", "Standard", "Basic"],
      prefix: "cat_",
    })
    .dummyCol("region", {
      expected_categories: ["North", "South", "East", "West"],
      prefix: "reg_",
    });

  console.log("Multiple dummy variable columns:");
  multiDummies.print();

  // ============================================================================
  // 9. COMBINING RESHAPING OPERATIONS - Complex transformations
  // ============================================================================
  console.log(
    "\n=== 9. Combining Reshaping Operations - Complex Transformations ===",
  );

  // Complex example: survey data transformation
  // This demonstrates how to combine multiple reshaping operations
  const surveyData = createDataFrame([
    { respondent: 1, age_group: "25-34", satisfaction: "High", product: "A" },
    { respondent: 2, age_group: "35-44", satisfaction: "Medium", product: "B" },
    { respondent: 3, age_group: "25-34", satisfaction: "High", product: "A" },
    { respondent: 4, age_group: "45-54", satisfaction: "Low", product: "C" },
  ]);

  console.log("Survey data:");
  surveyData.print();

  // Transform for machine learning analysis
  const mlReady = surveyData
    .dummyCol("age_group", {
      expected_categories: ["25-34", "35-44", "45-54"],
      prefix: "age_",
    })
    .dummyCol("satisfaction", {
      expected_categories: ["High", "Medium", "Low"],
      prefix: "sat_",
    })
    .dummyCol("product", {
      expected_categories: ["A", "B", "C"],
      prefix: "prod_",
    })
    .select(
      "respondent",
      "age_25-34",
      "age_35-44",
      "age_45-54",
      "sat_High",
      "sat_Medium",
      "sat_Low",
      "prod_A",
      "prod_B",
      "prod_C",
    );

  console.log("ML-ready format with dummy variables:");
  mlReady.print();

  // ============================================================================
  // 10. ADVANCED PIVOT WITH AGGREGATION - Handling duplicate combinations
  // ============================================================================
  console.log(
    "\n=== 10. Advanced Pivot with Aggregation - Handling Duplicate Combinations ===",
  );

  // When pivoting, you might need aggregation if there are duplicate combinations
  // This shows how to handle data that needs aggregation before pivoting
  const detailedSales = createDataFrame([
    { month: "Jan", product: "Widget", region: "North", sales: 100 },
    { month: "Jan", product: "Widget", region: "North", sales: 150 }, // Duplicate combination
    { month: "Jan", product: "Gadget", region: "South", sales: 200 },
    { month: "Feb", product: "Widget", region: "North", sales: 120 },
  ]);

  console.log("Sales data with duplicates:");
  detailedSales.print();

  // First aggregate, then pivot
  const aggregatedFirst = detailedSales
    .groupBy("month", "product", "region")
    .summarise({
      total_sales: (df) => stats.sum(df.sales),
    });

  console.log("Aggregated sales data:");
  aggregatedFirst.print();

  const pivotedSales = aggregatedFirst
    .pivotWider({
      names_from: "product",
      values_from: "total_sales",
      expected_columns: ["Widget", "Gadget"],
    });

  console.log("Final pivoted sales by product:");
  pivotedSales.print();

  // ============================================================================
  // 11. ADVANCED RESHAPING PATTERNS - Complex scenarios
  // ============================================================================
  console.log("\n=== 11. Advanced Reshaping Patterns - Complex Scenarios ===");

  // Show more advanced reshaping patterns
  const complexData = createDataFrame([
    {
      quarter: "Q1",
      department: "Sales",
      metric: "revenue",
      value: 1000,
      year: 2023,
    },
    {
      quarter: "Q1",
      department: "Sales",
      metric: "costs",
      value: 600,
      year: 2023,
    },
    {
      quarter: "Q1",
      department: "Marketing",
      metric: "revenue",
      value: 500,
      year: 2023,
    },
    {
      quarter: "Q1",
      department: "Marketing",
      metric: "costs",
      value: 300,
      year: 2023,
    },
    {
      quarter: "Q2",
      department: "Sales",
      metric: "revenue",
      value: 1200,
      year: 2023,
    },
    {
      quarter: "Q2",
      department: "Sales",
      metric: "costs",
      value: 700,
      year: 2023,
    },
  ]);

  console.log("Complex data with multiple dimensions:");
  complexData.print();

  // Complex reshaping: pivot wider with multiple grouping
  const complexReshaped = complexData
    .pivotWider({
      names_from: "metric",
      values_from: "value",
      expected_columns: ["costs", "revenue"],
    })
    .mutate({
      profit: (row) => row.revenue - row.costs,
      profit_margin: (row) => {
        const revenue = row.revenue;
        const profit = row.revenue - row.costs;
        return revenue > 0 ? (profit / revenue * 100).toFixed(1) : "0.0";
      },
    });

  console.log("Complex reshaped data with calculated columns:");
  complexReshaped.print();

  // ============================================================================
  // 12. PUTTING IT ALL TOGETHER - Complete reshaping workflow
  // ============================================================================
  console.log(
    "\n=== 12. Putting It All Together - Complete Reshaping Workflow ===",
  );

  // Show a complete workflow that demonstrates all the reshaping concepts
  const finalResult = salesLong
    .filter((row) => row.value > 0) // Data validation
    .pivotWider({
      names_from: "metric",
      values_from: "value",
      expected_columns: ["revenue", "units"],
    }) // Pivot to wide format
    .mutate({
      total_value: (row) => row.revenue + row.units * 100, // Calculate total value
      efficiency: (row) => {
        const revenue = row.revenue;
        const units = row.units;
        return units > 0 ? (revenue / units).toFixed(2) : "0.00";
      },
    }) // Add calculated columns
    .dummyCol("region", {
      expected_categories: ["North", "South"],
      prefix: "region_",
    }) // Create dummy variables
    .select(
      "month",
      "revenue",
      "units",
      "total_value",
      "efficiency",
      "region_North",
      "region_South",
    ); // Select relevant columns

  console.log("Complete reshaping workflow combining all concepts:");
  finalResult.print();

  // Test assertions
  expect(longScores.nrows()).toBe(9); // 3 students × 3 subjects
  expect(wideAgain.nrows()).toBe(3); // Back to 3 students
  expect(salesWide.nrows()).toBe(4); // 2 months × 2 regions
  expect(withCategoryDummies.nrows()).toBe(6);
  expect(withCategoryDummies.category_Premium).toBeDefined();
  expect(withCategoryDummies.category_Standard).toBeDefined();
  expect(withCategoryDummies.category_Basic).toBeDefined();
  expect(multiDummies.nrows()).toBe(6);
  expect(multiDummies.cat_Premium).toBeDefined();
  expect(multiDummies.reg_North).toBeDefined();
  expect(mlReady.nrows()).toBe(4);
  expect(mlReady["age_25-34"]).toBeDefined();
  expect(mlReady.sat_High).toBeDefined();
  expect(mlReady.prod_A).toBeDefined();
  expect(pivotedSales.nrows()).toBe(3); // 3 month-region combinations
  expect(pivotedSales.Widget).toBeDefined();
  expect(pivotedSales.Gadget).toBeDefined();
  expect(complexReshaped.nrows()).toBeGreaterThan(0);
  expect(complexReshaped.profit).toBeDefined();
  expect(finalResult.nrows()).toBeGreaterThan(0);
  expect(finalResult.total_value).toBeDefined();
  expect(finalResult.efficiency).toBeDefined();
});
