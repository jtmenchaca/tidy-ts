import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { test } from "../../tests/shims/test.ts";

test("Advanced Operations and Chaining - Progressive Examples", () => {
  // ============================================================================
  // 1. SETTING UP THE DATA - Create our working dataset
  // ============================================================================
  console.log("=== 1. Setting Up the Data ===");

  const salesData = createDataFrame([
    {
      id: 1,
      region: "North",
      product: "Widget",
      sales: 1000,
      date: "2023-Q1",
      rep: "Alice",
    },
    {
      id: 2,
      region: "North",
      product: "Gadget",
      sales: 1500,
      date: "2023-Q1",
      rep: "Bob",
    },
    {
      id: 3,
      region: "South",
      product: "Widget",
      sales: 800,
      date: "2023-Q1",
      rep: "Carol",
    },
    {
      id: 4,
      region: "South",
      product: "Gadget",
      sales: 1200,
      date: "2023-Q1",
      rep: "Dave",
    },
    {
      id: 5,
      region: "North",
      product: "Widget",
      sales: 1100,
      date: "2023-Q2",
      rep: "Alice",
    },
    {
      id: 6,
      region: "North",
      product: "Gadget",
      sales: 1600,
      date: "2023-Q2",
      rep: "Bob",
    },
    {
      id: 7,
      region: "South",
      product: "Widget",
      sales: 900,
      date: "2023-Q2",
      rep: "Carol",
    },
    {
      id: 8,
      region: "South",
      product: "Gadget",
      sales: 1300,
      date: "2023-Q2",
      rep: "Dave",
    },
    {
      id: 9,
      region: "West",
      product: "Tool",
      sales: 500,
      date: "2023-Q1",
      rep: "Eve",
    },
    {
      id: 10,
      region: "West",
      product: "Device",
      sales: 750,
      date: "2023-Q2",
      rep: "Frank",
    },
  ]);

  console.log("Original sales data:");
  console.table(salesData);

  // ============================================================================
  // 2. BASIC PIPELINE - Simple chaining operations
  // ============================================================================
  console.log("\n=== 2. Basic Pipeline - Simple Chaining Operations ===");

  // Start with a simple pipeline: mutate then filter
  const basicPipeline = salesData
    .mutate({
      quarter_num: (row) => row.date.includes("Q1") ? 1 : 2,
      sales_category: (row) => {
        if (row.sales >= 1500) return "High";
        if (row.sales >= 1000) return "Medium";
        return "Low";
      },
    })
    .filter((row) => row.sales >= 1000);

  console.log("Basic pipeline result (mutate + filter):");
  basicPipeline.print();

  // ============================================================================
  // 3. INTERMEDIATE PIPELINE - Adding grouping and aggregation
  // ============================================================================
  console.log(
    "\n=== 3. Intermediate Pipeline - Adding Grouping and Aggregation ===",
  );

  // Add grouping and aggregation to the pipeline
  const intermediatePipeline = salesData
    .mutate({
      quarter_num: (row) => row.date.includes("Q1") ? 1 : 2,
      sales_category: (row) => {
        if (row.sales >= 1500) return "High";
        if (row.sales >= 1000) return "Medium";
        return "Low";
      },
    })
    .filter((row) => row.sales >= 1000)
    .groupBy("region", "quarter_num")
    .summarise({
      total_sales: (g) => stats.sum(g.sales),
      avg_sales: (g) => stats.round(stats.mean(g.sales), 2),
      transaction_count: (g) => g.nrows(),
    });

  console.log("Intermediate pipeline result (with grouping):");
  intermediatePipeline.print();

  // ============================================================================
  // 4. COMPLEX PIPELINE - Full transformation workflow
  // ============================================================================
  console.log("\n=== 4. Complex Pipeline - Full Transformation Workflow ===");

  // Multi-step transformation pipeline
  // This demonstrates a complete analysis workflow
  const analysisResult = salesData
    // 1. Add calculated columns
    .mutate({
      quarter_num: (row) => row.date.includes("Q1") ? 1 : 2,
      sales_category: (row) => {
        if (row.sales >= 1500) return "High";
        if (row.sales >= 1000) return "Medium";
        return "Low";
      },
      region_code: (row) => row.region.substring(0, 1).toUpperCase(),
    })
    // 2. Filter to focus on main regions
    .filter((row) => ["North", "South"].includes(row.region))
    // 3. Group and aggregate
    .groupBy("region", "quarter_num")
    .summarise({
      total_sales: (df) => stats.sum(df.sales),
      avg_sales: (df) => stats.round(stats.mean(df.sales), 2),
      transaction_count: (df) => df.nrows(),
      top_product: (df) => {
        const topProduct = df
          .groupBy("product")
          .summarise({
            total: (g) => stats.sum(g.sales),
          })
          .sliceMax("total", 1)
          .extractHead("product", 1);
        return topProduct || "Unknown";
      },
    })
    // 4. Add derived metrics
    .mutate({
      sales_per_transaction: (row) =>
        stats.round(row.total_sales / row.transaction_count, 2),
      performance_score: (row) => {
        const baseScore = row.avg_sales / 1000; // Normalize to 0-1 scale
        return stats.round(baseScore * 100, 1);
      },
    })
    // 5. Final arrangement
    .arrange("total_sales", "desc");

  console.log("Complex pipeline result:");
  analysisResult.print();

  // ============================================================================
  // 5. CONDITIONAL GROUPING - Dynamic grouping based on data
  // ============================================================================
  console.log(
    "\n=== 5. Conditional Grouping - Dynamic Grouping Based on Data ===",
  );

  // Dynamic grouping based on data characteristics
  // This shows how to create groups based on calculated values
  const conditionalGroups = salesData
    .mutate({
      performance_tier: (row) => {
        if (row.sales >= 1500) return "Top";
        if (row.sales >= 1000) return "Middle";
        return "Bottom";
      },
      season: (row) => row.date.includes("Q1") ? "Winter" : "Spring",
    })
    .groupBy("performance_tier", "season")
    .summarise({
      count: (df) => df.nrows(),
      total_revenue: (df) => stats.sum(df.sales),
      avg_performance: (df) => stats.round(stats.mean(df.sales), 2),
    })
    .arrange("total_revenue", "desc");

  console.log("Conditional grouping by performance and season:");
  console.table(conditionalGroups);

  // ============================================================================
  // 6. NESTED OPERATIONS - Complex nested analysis
  // ============================================================================
  console.log("\n=== 6. Nested Operations - Complex Nested Analysis ===");

  // Complex nested operations
  // This demonstrates how to perform analysis within groups
  const nestedAnalysis = salesData
    .groupBy("region")
    .summarise({
      products: (df) => {
        // Within each region, analyze products
        const productAnalysis = df
          .groupBy("product")
          .summarise({
            total_sales: (gdf) => stats.sum(gdf.sales),
            avg_sales: (gdf) => stats.round(stats.mean(gdf.sales), 2),
            rep_count: (gdf) => stats.uniqueCount(gdf.rep),
          })
          .arrange("total_sales", "desc");

        // Return top product info
        const topProduct = productAnalysis[0];
        return {
          top_product: topProduct?.product || "None",
          top_sales: topProduct?.total_sales || 0,
          total_products: productAnalysis.nrows(),
        };
      },
      performance: (df) => {
        // Calculate region performance metrics
        const totalSales = stats.sum(df.sales);
        const avgSales = stats.mean(df.sales);
        const salesVariance = stats.variance(df.sales);
        const salesStdDev = stats.stdev(df.sales);

        return {
          total_sales: totalSales,
          avg_sales: stats.round(avgSales, 2),
          sales_variance: stats.round(salesVariance, 2),
          sales_std_dev: stats.round(salesStdDev, 2),
          coefficient_variation: stats.round(salesStdDev / avgSales, 3),
        };
      },
    });

  console.log("Nested analysis by region:");
  nestedAnalysis.print();

  // ============================================================================
  // 7. ADVANCED FILTERING - Complex filtering with multiple conditions
  // ============================================================================
  console.log(
    "\n=== 7. Advanced Filtering - Complex Filtering with Multiple Conditions ===",
  );

  // Complex filtering with multiple conditions
  // This shows how to combine multiple filtering criteria
  const advancedFiltered = salesData
    .filter((row) => {
      // Multiple conditions combined
      const isHighValue = row.sales >= 1000;
      const isMainRegion = ["North", "South"].includes(row.region);
      const isQ1 = row.date.includes("Q1");
      const hasGoodRep = ["Alice", "Bob", "Carol"].includes(row.rep);

      // Complex logic: high value OR (main region AND Q1 AND good rep)
      return isHighValue || (isMainRegion && isQ1 && hasGoodRep);
    })
    .mutate({
      filter_reason: (row) => {
        if (row.sales >= 1000) return "High Value";
        if (
          ["North", "South"].includes(row.region) &&
          row.date.includes("Q1") &&
          ["Alice", "Bob", "Carol"].includes(row.rep)
        ) {
          return "Main Region Q1 Good Rep";
        }
        return "Other";
      },
    });

  console.log("Advanced filtered data:");
  console.table(advancedFiltered);

  // ============================================================================
  // 8. DATA QUALITY AND VALIDATION - Ensuring data integrity
  // ============================================================================
  console.log(
    "\n=== 8. Data Quality and Validation - Ensuring Data Integrity ===",
  );

  // Data quality checks
  // This demonstrates how to validate and score data quality
  const dataQuality = salesData
    .mutate({
      has_valid_id: (row) => row.id > 0 && Number.isInteger(row.id),
      has_valid_sales: (row) => row.sales > 0 && Number.isFinite(row.sales),
      has_valid_date: (row) => row.date && row.date.includes("Q"),
      has_valid_region: (row) => row.region && row.region.length > 0,
      has_valid_rep: (row) => row.rep && row.rep.length > 0,
    })
    .mutate({
      quality_score: (row) => {
        const checks = [
          row.has_valid_id,
          row.has_valid_sales,
          row.has_valid_date,
          row.has_valid_region,
          row.has_valid_rep,
        ];
        const passedChecks = checks.filter(Boolean).length;
        return stats.round((passedChecks / checks.length) * 100, 1);
      },
    });

  console.log("Data quality assessment:");
  console.table(dataQuality.select("id", "region", "sales", "quality_score"));

  // ============================================================================
  // 9. MARKET SEGMENT ANALYSIS - Advanced segmentation
  // ============================================================================
  console.log("\n=== 9. Market Segment Analysis - Advanced Segmentation ===");

  // Advanced market segmentation
  // This shows how to create sophisticated business analysis
  const marketSegments = salesData
    .mutate({
      segment: (row) => {
        if (row.sales >= 1500) return "Premium";
        if (row.sales >= 1000) return "Standard";
        return "Economy";
      },
      market_maturity: (row) => {
        if (["North", "South"].includes(row.region)) return "Mature";
        if (row.region === "West") return "Emerging";
        return "New";
      },
    })
    .groupBy("segment", "market_maturity")
    .summarise({
      count: (g) => g.nrows(),
      total_sales: (g) => stats.sum(g.sales),
      avg_sales: (g) => stats.round(stats.mean(g.sales), 2),
      unique_regions: (g) => stats.uniqueCount(g.region),
      unique_products: (g) => stats.uniqueCount(g.product),
    })
    .arrange("total_sales", "desc");

  console.log("Market segment analysis:");
  console.table(marketSegments);

  // ============================================================================
  // 10. UNIQUE VALUE ANALYSIS - Understanding data distributions
  // ============================================================================
  console.log(
    "\n=== 10. Unique Value Analysis - Understanding Data Distributions ===",
  );

  // Analyze unique values and their distributions
  // This demonstrates how to understand data diversity
  const uniqueAnalysis = salesData
    .groupBy("region")
    .summarise({
      unique_products: (g) => stats.uniqueCount(g.product),
      unique_reps: (g) => stats.uniqueCount(g.rep),
      unique_quarters: (g) => stats.uniqueCount(g.date),
      product_diversity: (g) => {
        const totalProducts = stats.uniqueCount(g.product);
        const totalTransactions = g.nrows();
        return stats.round(totalProducts / totalTransactions, 3);
      },
    });

  console.log("Unique value analysis by region:");
  console.table(uniqueAnalysis);

  // Count occurrences in original data
  const marketCoverage = salesData
    .groupBy("region", "product")
    .summarise({
      transaction_count: (g) => g.nrows(),
      total_sales: (g) => stats.sum(g.sales),
      unique_reps: (g) => stats.uniqueCount(g.rep),
    })
    .mutate({
      avg_transaction_size: (row) =>
        stats.round(row.total_sales / row.transaction_count, 2),
    })
    .arrange("total_sales", "desc");

  console.log("Market coverage analysis:");
  console.table(marketCoverage);

  // ============================================================================
  // 11. ITERATIVE OPERATIONS - Using for_each for side effects
  // ============================================================================
  console.log(
    "\n=== 11. Iterative Operations - Using for_each for Side Effects ===",
  );

  // Using for_each for side effects or complex operations
  // This shows how to perform operations with side effects
  let totalCommission = 0;
  const withSideEffects = salesData
    .mutate({ commission: (row) => row.sales * 0.05 })
    .forEachRow((row) => {
      totalCommission += row.commission;
      // Could log, send notifications, etc.
    })
    .forEachCol((columnName, df) => {
      if (columnName === "sales") {
        console.log(
          `Total sales across all transactions: ${stats.sum(df.sales)}`,
        );
      }
    });

  console.log(
    `Total commission calculated: $${stats.round(totalCommission, 2)}`,
  );
  console.log("for_each operations preserve the DataFrame:");
  console.table(withSideEffects.select("rep", "sales", "commission"));

  // ============================================================================
  // 12. ERROR HANDLING AND DATA CLEANING - Managing messy data
  // ============================================================================
  console.log(
    "\n=== 12. Error Handling and Data Cleaning - Managing Messy Data ===",
  );

  // Simulate data quality issues
  const messyData = createDataFrame([
    { id: 1, name: "Alice", score: 95, category: "A" },
    { id: 2, name: "", score: 88, category: "B" }, // Empty name
    { id: 3, name: "Charlie", score: null, category: "A" }, // Null score
    { id: 4, name: "Dave", score: 92, category: "" }, // Empty category
    { id: 5, name: "Eve", score: 87, category: "C" },
  ]);

  console.log("Messy data:");
  console.table(messyData);

  // Clean and analyze
  const cleanedData = messyData
    .filter((row) =>
      !!row.name && row.name.trim().length > 0 && // Valid name
      row.score !== null && typeof row.score === "number" && // Valid score
      !!row.category && row.category.trim().length > 0 // Valid category
    )
    .mutate({
      name_clean: (row) => row.name.trim(),
      grade: (row) => {
        if (row.score! >= 90) return "A";
        if (row.score! >= 80) return "B";
        return "C";
      },
    });

  console.log("Cleaned data:");
  console.table(cleanedData);

  // ============================================================================
  // 13. PERFORMANCE CONSIDERATIONS - Efficient operations for large datasets
  // ============================================================================
  console.log(
    "\n=== 13. Performance Considerations - Efficient Operations for Large Datasets ===",
  );

  // Efficient operations for larger datasets
  // This provides guidance for optimizing performance
  const efficientPipeline = salesData
    // Do filtering early to reduce data size
    .filter((row) => row.sales > 500)
    // Use select early to work with fewer columns
    .select("region", "product", "sales", "rep")
    // Group operations are efficient
    .groupBy("region")
    // Slice operations on groups are optimized
    .sliceMax("sales", 1)
    // Final transformations on smaller dataset
    .mutate({
      performance_label: (row) => `${row.rep} - Top in ${row.region}`,
    });

  console.log("Efficient pipeline result:");
  efficientPipeline.print();

  // ============================================================================
  // 14. PUTTING IT ALL TOGETHER - Complete advanced workflow
  // ============================================================================
  console.log(
    "\n=== 14. Putting It All Together - Complete Advanced Workflow ===",
  );

  // Show a complete workflow that demonstrates all the advanced concepts
  const finalResult = salesData
    .filter((row) => row.sales > 0) // Data validation
    .mutate({
      quarter: (row) => row.date.includes("Q1") ? "Q1" : "Q2",
      performance_tier: (row) => {
        if (row.sales >= 1500) return "Premium";
        if (row.sales >= 1000) return "Standard";
        return "Economy";
      },
      region_type: (row) => {
        if (["North", "South"].includes(row.region)) return "Core";
        return "Expansion";
      },
    }) // Add calculated columns
    .groupBy("region_type", "quarter", "performance_tier") // Group for analysis
    .summarise({
      region_type: (group) => group.region_type[0],
      quarter: (group) => group.quarter[0],
      tier: (group) => group.performance_tier[0],
      total_sales: (group) => stats.sum(group.sales),
      avg_sales: (group) => stats.round(stats.mean(group.sales), 2),
      transaction_count: (group) => group.nrows(),
      unique_products: (group) => stats.uniqueCount(group.product),
      unique_reps: (group) => stats.uniqueCount(group.rep),
    }) // Calculate comprehensive statistics
    .ungroup() // Remove grouping
    .arrange("total_sales", "desc") // Sort by performance
    .select(
      "region_type",
      "quarter",
      "tier",
      "total_sales",
      "avg_sales",
      "transaction_count",
      "unique_products",
      "unique_reps",
    ); // Select relevant columns

  console.log("Complete advanced workflow combining all concepts:");
  finalResult.print();

  // Test assertions
  expect(basicPipeline.nrows()).toBeGreaterThan(0);
  expect(basicPipeline.quarter_num).toBeDefined();
  expect(intermediatePipeline.nrows()).toBeGreaterThan(0);
  expect(intermediatePipeline.total_sales).toBeDefined();
  expect(analysisResult.nrows()).toBeGreaterThan(0);
  expect(analysisResult.total_sales).toBeDefined();
  expect(analysisResult.sales_per_transaction).toBeDefined();
  expect(analysisResult.performance_score).toBeDefined();
  expect(conditionalGroups.nrows()).toBeGreaterThan(0);
  expect(conditionalGroups.performance_tier).toBeDefined();
  expect(conditionalGroups.season).toBeDefined();
  expect(nestedAnalysis.nrows()).toBeGreaterThan(0);
  expect(nestedAnalysis.products[0].top_product).toBeDefined();
  expect(nestedAnalysis.performance[0].total_sales).toBeDefined();
  expect(advancedFiltered.nrows()).toBeGreaterThan(0);
  expect(advancedFiltered.filter_reason).toBeDefined();
  expect(dataQuality.nrows()).toBe(10);
  expect(dataQuality.quality_score).toBeDefined();
  expect(marketSegments.nrows()).toBeGreaterThan(0);
  expect(marketSegments.segment).toBeDefined();
  expect(marketSegments.market_maturity).toBeDefined();
  expect(uniqueAnalysis.nrows()).toBeGreaterThan(0);
  expect(uniqueAnalysis.unique_products).toBeDefined();
  expect(marketCoverage.nrows()).toBeGreaterThan(0);
  expect(marketCoverage.avg_transaction_size).toBeDefined();
  expect(withSideEffects.nrows()).toBe(10);
  expect(withSideEffects.commission).toBeDefined();
  expect(cleanedData.nrows()).toBe(2); // Only 2 rows pass validation
  expect(cleanedData.grade).toBeDefined();
  expect(efficientPipeline.nrows()).toBeGreaterThan(0);
  expect(efficientPipeline.performance_label).toBeDefined();
  expect(finalResult.nrows()).toBeGreaterThan(0);
  expect(finalResult.total_sales).toBeDefined();
  expect(finalResult.unique_products).toBeDefined();
});
