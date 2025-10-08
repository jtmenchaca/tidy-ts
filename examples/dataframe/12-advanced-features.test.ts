import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { test } from "../../tests/shims/test.ts";

test("Advanced DataFrame Features - Progressive Examples", () => {
  // ============================================================================
  // 1. SETTING UP THE DATA - Create our working dataset
  // ============================================================================
  console.log("=== 1. Setting Up the Data ===");

  // Sample data for demonstrations
  const salesData = createDataFrame([
    {
      id: 1,
      name: "Alice Johnson",
      sales: 1500,
      region: "North",
      date: "2024-01-15",
      status: "active",
    },
    {
      id: 2,
      name: "Bob Smith",
      sales: 2200,
      region: "South",
      date: "2024-01-20",
      status: "active",
    },
    {
      id: 3,
      name: "Carol Davis",
      sales: 1800,
      region: "North",
      date: "2024-01-25",
      status: "inactive",
    },
    {
      id: 4,
      name: "David Wilson",
      sales: 3100,
      region: "East",
      date: "2024-02-01",
      status: "active",
    },
    {
      id: 5,
      name: "Eva Brown",
      sales: 1200,
      region: "West",
      date: "2024-02-05",
      status: "active",
    },
    {
      id: 6,
      name: "Frank Miller",
      sales: 2800,
      region: "South",
      date: "2024-02-10",
      status: "inactive",
    },
    {
      id: 7,
      name: "Grace Lee",
      sales: 1900,
      region: "North",
      date: "2024-02-15",
      status: "active",
    },
    {
      id: 8,
      name: "Henry Taylor",
      sales: 2500,
      region: "East",
      date: "2024-02-20",
      status: "active",
    },
  ]);

  console.log("Original sales data:");
  salesData.print();

  // ============================================================================
  // 2. BASIC FOR_EACH OPERATIONS - Simple row iteration
  // ============================================================================
  console.log("\n=== 2. Basic For Each Operations - Simple Row Iteration ===");

  // Start with the simplest case: basic row iteration
  const highPerformers: string[] = [];
  const lowPerformers: string[] = [];

  salesData
    .forEachRow((row) => {
      if (row.sales >= 2500) {
        highPerformers.push(row.name);
      } else if (row.sales < 1500) {
        lowPerformers.push(row.name);
      }
    });

  console.log("High performers (sales >= 2500):", highPerformers);
  console.log("Low performers (sales < 1500):", lowPerformers);

  // ============================================================================
  // 3. ADVANCED FOR_EACH OPERATIONS - Multiple side effects
  // ============================================================================
  console.log(
    "\n=== 3. Advanced For Each Operations - Multiple Side Effects ===",
  );

  // Multiple for_each operations with different side effects
  salesData
    .forEachRow((row) => {
      // Another side effect - logging
      if (row.status === "inactive") {
        console.log(`⚠️  ${row.name} is inactive`);
      }
    });

  // ============================================================================
  // 4. FOR_EACH_COL OPERATIONS - Column-wise iteration
  // ============================================================================
  console.log(
    "\n=== 4. For Each Column Operations - Column-Wise Iteration ===",
  );

  // for_each_col - iterate over each column
  const columnStats: Record<string, { min: number; max: number; avg: number }> =
    {};

  salesData
    .select("sales", "id")
    .forEachCol((colName, df) => {
      // Much cleaner! We access column data directly through df[colName]
      if (colName === "sales") {
        columnStats.sales = {
          min: stats.min(df.sales)!,
          max: stats.max(df.sales)!,
          avg: stats.mean(df.sales),
        };
      } else if (colName === "id") {
        columnStats.id = {
          min: stats.min(df.id)!,
          max: stats.max(df.id)!,
          avg: stats.mean(df.id),
        };
      }
    });

  console.log("Column statistics:", columnStats);

  // ============================================================================
  // 5. BASIC STRING MANIPULATION - Simple text operations
  // ============================================================================
  console.log(
    "\n=== 5. Basic String Manipulation - Simple Text Operations ===",
  );

  // Start with simple string operations
  const withBasicStrings = salesData.mutate({
    first_name: (row) => row.name.split(" ")[0],
    last_name: (row) => row.name.split(" ")[1],
  });

  console.log("Data with basic string extraction:");
  withBasicStrings.print();

  // ============================================================================
  // 6. ADVANCED STRING MANIPULATION - Complex text analysis
  // ============================================================================
  console.log(
    "\n=== 6. Advanced String Manipulation - Complex Text Analysis ===",
  );

  // More complex string operations
  const withAdvancedStrings = salesData.mutate({
    first_name: (row) => row.name.split(" ")[0],
    last_name: (row) => row.name.split(" ")[1],
    name_length: (row) => row.name.length,
    has_middle: (row) => row.name.split(" ").length > 2,
    name_initials: (row) => {
      const parts = row.name.split(" ");
      return parts.map((part) => part[0]).join(".");
    },
  });

  console.log("Data with advanced string operations:");
  withAdvancedStrings.print();

  // ============================================================================
  // 7. BASIC TYPE CONVERSION - Simple type changes
  // ============================================================================
  console.log("\n=== 7. Basic Type Conversion - Simple Type Changes ===");

  // Create data with mixed types for conversion
  const mixedData = createDataFrame([
    {
      id: "1",
      name: "Alice",
      age: "25",
      score: "85.5",
      active: "true",
      date: "2024-01-15",
    },
    {
      id: "2",
      name: "Bob",
      age: "30",
      score: "92.1",
      active: "false",
      date: "2024-02-01",
    },
    {
      id: "3",
      name: "Charlie",
      age: "35",
      score: "78.3",
      active: "true",
      date: "2024-03-01",
    },
  ]);

  console.log("Original mixed data:");
  mixedData.print();

  // Convert types (these functions may need to be imported separately)
  const convertedData = mixedData.mutate({
    id_num: (row) => parseInt(row.id as string),
    age_num: (row) => parseInt(row.age as string),
    score_num: (row) => parseFloat(row.score as string),
    active_bool: (row) => (row.active as string) === "true",
    date_obj: (row) => new Date(row.date as string),
  });

  console.log("Data with converted types:");
  convertedData.print();

  // ============================================================================
  // 8. BASIC SLICING OPERATIONS - Simple row selection
  // ============================================================================
  console.log("\n=== 8. Basic Slicing Operations - Simple Row Selection ===");

  // Start with basic slicing operations
  const firstThree = salesData.head(3);
  const lastThree = salesData.tail(3);

  console.log("First 3 rows:");
  firstThree.print();
  console.log("Last 3 rows:");
  lastThree.print();

  // ============================================================================
  // 9. ADVANCED SLICING OPERATIONS - Value-based selection
  // ============================================================================
  console.log(
    "\n=== 9. Advanced Slicing Operations - Value-Based Selection ===",
  );

  // slice_min - get rows with minimum values
  const lowestSales = salesData.sliceMin("sales", 3);
  console.log("3 lowest sales performers:");
  lowestSales.print();

  // slice_max - get rows with maximum values
  const highestSales = salesData.sliceMax("sales", 3);
  console.log("3 highest sales performers:");
  highestSales.print();

  // slice_sample - random sampling
  const randomSample = salesData.sample(3);
  console.log("Random sample of 3 rows:");
  randomSample.print();

  // ============================================================================
  // 10. BASIC GROUPING AND SUMMARIZATION - Simple aggregations
  // ============================================================================
  console.log(
    "\n=== 10. Basic Grouping and Summarization - Simple Aggregations ===",
  );

  // Start with simple grouping
  const basicSummary = salesData
    .groupBy("region")
    .summarise({
      count: (df) => df.nrows(),
      total_sales: (df) => stats.sum(df.sales),
      avg_sales: (df) => stats.mean(df.sales),
    });

  console.log("Basic summary by region:");
  basicSummary.print();

  // ============================================================================
  // 11. ADVANCED GROUPING AND SUMMARIZATION - Complex metrics
  // ============================================================================
  console.log(
    "\n=== 11. Advanced Grouping and Summarization - Complex Metrics ===",
  );

  // Multi-level grouping with complex summaries
  const advancedSummary = salesData
    .groupBy("region", "status")
    .summarise({
      count: (df) => df.nrows(),
      total_sales: (df) => stats.sum(df.sales),
      avg_sales: (df) => stats.mean(df.sales),
      min_sales: (df) => stats.min(df.sales),
      max_sales: (df) => stats.max(df.sales),
      sales_range: (df) => {
        const min = stats.min(df.sales);
        const max = stats.max(df.sales);
        if (min === null || max === null) return 0;
        return stats.round(max - min, 2);
      },
      performance_ratio: (df) => {
        const avg = stats.mean(df.sales);
        const overallAvg = stats.mean(salesData.sales);
        return stats.round((avg / overallAvg) * 100, 1);
      },
    })
    .arrange("total_sales", "desc");

  console.log("Advanced summary by region and status:");
  advancedSummary.print();

  // ============================================================================
  // 12. BASIC DATA TRANSFORMATIONS - Simple reshaping
  // ============================================================================
  console.log("\n=== 12. Basic Data Transformations - Simple Reshaping ===");

  // Simple pivot operations
  const salesByRegion = salesData
    .groupBy("region")
    .summarise({
      total_sales: (df) => stats.sum(df.sales),
      avg_sales: (df) => stats.mean(df.sales),
      count: (df) => df.nrows(),
    });

  console.log("Sales summary by region:");
  salesByRegion.print();

  // ============================================================================
  // 13. ADVANCED DATA TRANSFORMATIONS - Complex reshaping
  // ============================================================================
  console.log(
    "\n=== 13. Advanced Data Transformations - Complex Reshaping ===",
  );

  // Create a wide format pivot
  const wideFormat = salesData
    .pivotWider({
      namesFrom: "region",
      valuesFrom: "sales",
      valuesFn: (values) => stats.mean(values),
    });

  console.log("Wide format (sales by region):");
  wideFormat.print();

  // ============================================================================
  // 14. BASIC DATA VALIDATION - Simple quality checks
  // ============================================================================
  console.log("\n=== 14. Basic Data Validation - Simple Quality Checks ===");

  // Remove rows with missing values
  const cleanData = salesData
    .filter((row) =>
      row.name !== null &&
      row.sales !== null &&
      row.region !== null &&
      row.status !== null
    );

  console.log("Clean data (no missing values):");
  cleanData.print();

  // ============================================================================
  // 15. ADVANCED DATA VALIDATION - Quality metrics
  // ============================================================================
  console.log("\n=== 15. Advanced Data Validation - Quality Metrics ===");

  // Data quality checks
  const dataQuality = {
    originalRows: salesData.nrows(),
    cleanRows: cleanData.nrows(),
    missingRows: salesData.nrows() - cleanData.nrows(),
    completeness: (cleanData.nrows() / salesData.nrows()) * 100,
  };

  console.log("Data quality metrics:", dataQuality);

  // ============================================================================
  // 16. PERFORMANCE OPTIMIZATION TECHNIQUES - Efficient operations
  // ============================================================================
  console.log("\n=== 16. Performance Optimization - Efficient Operations ===");

  // Use for_each_col for efficient column-wise operations
  const columnEfficiency: Record<string, number> = {};

  salesData
    .select("sales", "id")
    .forEachCol((colName, df) => {
      if (colName === "sales") {
        // Access the column data through df[colName] instead of the col parameter
        const sales = df.sales;
        // Efficient calculation without creating intermediate arrays
        let sum = 0;
        let count = 0;
        for (let i = 0; i < sales.length; i++) {
          if (sales[i] !== null && sales[i] !== undefined) {
            sum += sales[i];
            count++;
          }
        }
        columnEfficiency.sales = count > 0 ? sum / count : 0;
      }
    });

  console.log("Efficient column calculations:", columnEfficiency);

  // ============================================================================
  // 17. ADVANCED FEATURE COMBINATIONS - Complex workflows
  // ============================================================================
  console.log(
    "\n=== 17. Advanced Feature Combinations - Complex Workflows ===",
  );

  // Show how to combine multiple advanced features
  const complexWorkflow = salesData
    .filter((row) => row.status === "active") // Filter active users
    .mutate({
      performance_tier: (row) => {
        if (row.sales >= 2500) return "High";
        if (row.sales >= 1500) return "Medium";
        return "Low";
      },
      name_initials: (row) => {
        const parts = row.name.split(" ");
        return parts.map((part) => part[0]).join(".");
      },
    }) // Add calculated columns
    .groupBy("region", "performance_tier") // Group by multiple criteria
    .summarise({
      region: (group) => group.region[0],
      tier: (group) => group.performance_tier[0],
      count: (group) => group.nrows(),
      total_sales: (group) => stats.sum(group.sales),
      avg_sales: (group) => stats.round(stats.mean(group.sales), 2),
      representatives: (group) => group.name_initials.join(", "),
    }) // Calculate comprehensive statistics
    .ungroup() // Remove grouping
    .arrange("total_sales", "desc") // Sort by performance
    .head(5); // Take top 5 results

  console.log("Complex workflow combining multiple advanced features:");
  complexWorkflow.print();

  // ============================================================================
  // 18. PUTTING IT ALL TOGETHER - Complete advanced workflow
  // ============================================================================
  console.log(
    "\n=== 18. Putting It All Together - Complete Advanced Workflow ===",
  );

  // Show a complete workflow that demonstrates all the advanced concepts
  const finalResult = salesData
    .filter((row) => row.sales > 0) // Data validation
    .mutate({
      performance_tier: (row) => {
        if (row.sales >= 2500) return "High";
        if (row.sales >= 1500) return "Medium";
        return "Low";
      },
      first_name: (row) => row.name.split(" ")[0],
      last_name: (row) => row.name.split(" ")[1],
      name_initials: (row) => {
        const parts = row.name.split(" ");
        return parts.map((part) => part[0]).join(".");
      },
      month: (row) => new Date(row.date).toISOString().slice(0, 7),
    }) // Add calculated columns
    .groupBy("region", "performance_tier", "month") // Multi-level grouping
    .summarise({
      region: (group) => group.region[0],
      tier: (group) => group.performance_tier[0],
      month: (group) => group.month[0],
      count: (group) => group.nrows(),
      total_sales: (group) => stats.sum(group.sales),
      avg_sales: (group) => stats.round(stats.mean(group.sales), 2),
      representatives: (group) => group.name_initials.join(", "),
      performance_score: (group) => {
        const avg = stats.mean(group.sales);
        const overallAvg = stats.mean(salesData.sales);
        return stats.round((avg / overallAvg) * 100, 1);
      },
    }) // Calculate comprehensive statistics
    .ungroup() // Remove grouping
    .arrange("total_sales", "desc") // Sort by performance
    .head(10) // Take top 10 results
    .select(
      "region",
      "tier",
      "month",
      "count",
      "total_sales",
      "avg_sales",
      "representatives",
      "performance_score",
    ); // Select relevant columns

  console.log("Complete advanced workflow combining all concepts:");
  finalResult.print();

  // ============================================================================
  // VERIFICATION AND TESTING
  // ============================================================================
  console.log("\n=== Verification ===");

  // Verify our operations worked correctly
  expect(highPerformers.length).toBeGreaterThan(0);
  expect(lowPerformers.length).toBeGreaterThan(0);
  expect(columnStats.sales).toBeDefined();
  expect(columnStats.sales.avg).toBeCloseTo(stats.mean(salesData.sales), 1);
  expect(advancedSummary.nrows()).toBeGreaterThan(0);
  expect(cleanData.nrows()).toBeLessThanOrEqual(salesData.nrows());
  expect(complexWorkflow.nrows()).toBeGreaterThan(0);
  expect(complexWorkflow.total_sales).toBeDefined();
  expect(finalResult.nrows()).toBeGreaterThan(0);
  expect(finalResult.performance_score).toBeDefined();

  console.log("✅ All advanced features working correctly!");
  console.log("\n=== End of Advanced Features Examples ===");
});
