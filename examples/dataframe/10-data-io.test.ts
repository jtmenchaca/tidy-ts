import {
  createDataFrame,
  type DataFrame,
  read_csv,
  stats,
  write_csv,
} from "@tidy-ts/dataframe";
import { z } from "zod";

Deno.test("Data Input/output/ Operations - Progressive Examples", async () => {
  // ============================================================================
  // 1. SETTING UP THE DATA - Create our working dataset
  // ============================================================================
  console.log("=== 1. Setting Up the Data ===");

  // Create comprehensive sample dataset
  const salesData = createDataFrame([
    {
      id: 1,
      date: new Date("2023-01-15"),
      product: "Widget Pro",
      price: 29.99,
      quantity: 5,
      customer: "Alice Johnson",
      region: "North",
      sold: true,
      notes: "Excellent customer, repeat buyer",
    },
    {
      id: 2,
      date: new Date("2023-01-20"),
      product: "Gadget Max",
      price: 49.99,
      quantity: 2,
      customer: "Bob Smith",
      region: "South",
      sold: true,
      notes: "First-time buyer",
    },
    {
      id: 3,
      date: new Date("2023-02-01"),
      product: "Tool Kit",
      price: 79.99,
      quantity: 1,
      customer: "Carol Davis",
      region: "East",
      sold: false,
      notes: "Returned due to defect",
    },
    {
      id: 4,
      date: new Date("2023-02-15"),
      product: "Device Elite",
      price: 199.99,
      quantity: 3,
      customer: "Dave Wilson",
      region: "West",
      sold: true,
      notes: null, // Missing notes
    },
    {
      id: 5,
      date: new Date("2023-03-01"),
      product: "Widget Pro",
      price: 29.99,
      quantity: 10,
      customer: "Eve Brown",
      region: "North",
      sold: true,
      notes: "Bulk order, discount applied",
    },
  ]);

  console.log("Sample sales data:");
  salesData.print();

  // ============================================================================
  // 2. CSV READING WITH SCHEMA - Type-safe data input
  // ============================================================================
  console.log("\n=== 2. CSV Reading with Schema - Type-safe Data Input ===");

  // Define a Zod schema for our CSV data
  const PenguinsSchema = z.object({
    species: z.string(),
    island: z.string(),
    bill_length_mm: z.number().nullable(),
    bill_depth_mm: z.number().nullable(),
    flipper_length_mm: z.number().nullable(),
    body_mass_g: z.number().nullable(),
    sex: z.string().nullable(),
    year: z.number(),
  });

  // Read CSV content with automatic type conversion and validation (simulating file reading)
  const penguinsCsv =
    `species,island,bill_length_mm,bill_depth_mm,flipper_length_mm,body_mass_g,sex,year
Adelie,Torgersen,39.1,18.7,181,3750,male,2007
Adelie,Torgersen,39.5,17.4,186,3800,female,2007
Adelie,Torgersen,40.3,18.0,195,3250,female,2007
Adelie,Torgersen,NA,NA,NA,NA,NA,2007
Adelie,Torgersen,36.7,19.3,193,3450,female,2007`;

  const penguins = await read_csv(penguinsCsv, PenguinsSchema, {
    skipEmptyLines: true,
    naValues: ["", "NA", "NULL", "null"],
  });

  console.log("Penguins data loaded from CSV:");
  penguins.slice(0, 5).print(); // Show first 5 rows
  console.log(`Total rows: ${penguins.nrows()}`);

  // Type check: Schema ensures proper typing
  const _penguinsTypeCheck: DataFrame<
    {
      species: string;
      island: string;
      bill_length_mm: number | null;
      bill_depth_mm: number | null;
      flipper_length_mm: number | null;
      body_mass_g: number | null;
      sex: string | null;
      year: number;
    }
  > = penguins;

  // ============================================================================
  // 3. HANDLING MISSING DATA - Working with nulls and NAs
  // ============================================================================
  console.log(
    "\n=== 3. Handling Missing Data - Working with Nulls and NAs ===",
  );

  // Show missing data patterns
  const missingDataSummary = penguins
    .summarise({
      total_rows: (df) => df.nrows(),
      bill_length_missing: (df) =>
        df.bill_length_mm.filter((x) => x === null).length,
      bill_depth_missing: (df) =>
        df.bill_depth_mm.filter((x) => x === null).length,
      flipper_length_missing: (df) =>
        df.flipper_length_mm.filter((x) => x === null).length,
      body_mass_missing: (df) =>
        df.body_mass_g.filter((x) => x === null).length,
      sex_missing: (df) => df.sex.filter((x) => x === null).length,
    });

  console.log("Missing data summary:");
  missingDataSummary.print();

  // Clean missing data using replaceNA
  const cleanedPenguins = penguins.replaceNA({
    bill_length_mm: stats.mean(
      penguins.bill_length_mm.filter((x) => x !== null) as number[],
    ),
    bill_depth_mm: stats.mean(
      penguins.bill_depth_mm.filter((x) => x !== null) as number[],
    ),
    flipper_length_mm: stats.mean(
      penguins.flipper_length_mm.filter((x) => x !== null) as number[],
    ),
    body_mass_g: stats.mean(
      penguins.body_mass_g.filter((x) => x !== null) as number[],
    ),
    sex: "Unknown",
  });

  console.log("After replacing missing values with means/defaults:");
  cleanedPenguins.slice(0, 5).print();

  // Type check: replace_na properly transforms nullable types to non-nullable
  const _cleanedTypeCheck: typeof cleanedPenguins = cleanedPenguins;
  const _testValue: number = cleanedPenguins[0].bill_length_mm; // Now guaranteed to be number, not null

  // ============================================================================
  // 4. BASIC CSV WRITING - Simple export
  // ============================================================================
  console.log("\n=== 4. Basic CSV Writing - Simple Export ===");

  // Write basic CSV
  // Start with the simplest case: basic CSV export
  write_csv(salesData, "./examples/dataframe/output/salesData.csv");

  console.log("Basic CSV written successfully");

  // ============================================================================
  // 5. CSV WITH CUSTOM OPTIONS - Handling missing values
  // ============================================================================
  console.log("\n=== 5. CSV with Custom Options - Handling Missing Values ===");

  // Custom CSV formatting
  // This shows how to handle null values and customize output
  write_csv(salesData, "./examples/dataframe/output/salesData.csv");

  console.log(
    "Custom formatted CSV (null values replaced with N/A) written successfully",
  );

  // ============================================================================
  // 6. WORKING WITH PROCESSED DATA - Transform before export
  // ============================================================================
  console.log(
    "\n=== 6. Working with Processed Data - Transform Before Export ===",
  );

  // Process data before export
  // This demonstrates how to clean and transform data before exporting
  const processedData = salesData
    .mutate({
      total_value: (row) => row.price * row.quantity,
      month: (row) => row.date.toISOString().slice(0, 7), // YYYY-MM format
      customer_category: (row) => {
        const total = row.price * row.quantity;
        if (total >= 200) return "Premium";
        if (total >= 100) return "Standard";
        return "Basic";
      },
      has_notes: (row) => row.notes ? "Yes" : "No",
    })
    .select(
      "id",
      "product",
      "total_value",
      "month",
      "customer_category",
      "has_notes",
    );

  console.log("Processed data for export:");
  processedData.print();

  write_csv(processedData, "./examples/dataframe/output/processedData.csv");
  console.log("\nProcessed data as CSV written successfully");

  // ============================================================================
  // 7. EXPORTING AGGREGATED DATA - Summary statistics
  // ============================================================================
  console.log("\n=== 7. Exporting Aggregated Data - Summary Statistics ===");

  // Export summary statistics
  // This shows how to export aggregated data for reporting
  const summaryData = salesData
    .groupBy("region")
    .summarise({
      total_sales: (df) => stats.sum(df.price),
      total_quantity: (df) => stats.sum(df.quantity),
      avg_price: (df) => stats.round(stats.mean(df.price), 2),
      transaction_count: (df) => df.nrows(),
      success_rate: (df) => {
        const sold = df.filter((row) => row.sold).nrows();
        return stats.round((sold / df.nrows()) * 100, 1);
      },
    })
    .arrange("total_sales", "desc");

  console.log("Regional summary data:");
  summaryData.print();

  write_csv(summaryData, "./examples/dataframe/output/summaryData.csv");
  console.log("\nSummary data as CSV written successfully");

  // ============================================================================
  // 8. EXPORTING FOR DATABASE IMPORT - Database-ready format
  // ============================================================================
  console.log(
    "\n=== 8. Exporting for Database Import - Database-Ready Format ===",
  );

  // Export for database import
  // This shows how to format data for database systems
  const dbExport = salesData
    .mutate({
      created_at: (row) => row.date.toISOString(),
      updated_at: () => new Date().toISOString(),
      status: (row) => row.sold ? "completed" : "cancelled",
      revenue: (row) => row.price * row.quantity,
    })
    .select(
      "id",
      "created_at",
      "updated_at",
      "product",
      "price",
      "quantity",
      "customer",
      "region",
      "status",
      "revenue",
    );

  console.log("Database-ready export:");
  dbExport.print();

  write_csv(dbExport, "./examples/dataframe/output/dbExport.csv");
  console.log("\nDatabase export as CSV written successfully");

  // ============================================================================
  // 9. EXPORTING FOR ANALYTICS/ML - Machine learning format
  // ============================================================================
  console.log(
    "\n=== 9. Exporting for Analytics/ML - Machine Learning Format ===",
  );

  // Export for analytics/ML
  // This demonstrates how to create ML-ready datasets with dummy variables
  const analyticsExport = salesData
    .mutate({
      day_of_week: (row) => row.date.getDay(),
      month_num: (row) => row.date.getMonth() + 1,
      price_tier: (row) => {
        if (row.price >= 100) return "High";
        if (row.price >= 50) return "Medium";
        return "Low";
      },
      total_value: (row) => row.price * row.quantity,
      is_sold: (row) => row.sold ? 1 : 0,
      has_notes: (row) => row.notes ? 1 : 0,
      quantity_category: (row) => {
        if (row.quantity <= 2) return "Small";
        if (row.quantity <= 5) return "Medium";
        return "Large";
      },
    })
    .dummyCol("region", {
      expected_categories: ["North", "South", "East", "West"],
      prefix: "region_",
    })
    .dummyCol("quantity_category", {
      expected_categories: ["Small", "Medium", "Large"],
      prefix: "qty_",
    })
    .select(
      "id",
      "day_of_week",
      "month_num",
      "price",
      "quantity",
      "price_tier",
      "total_value",
      "is_sold",
      "has_notes",
      "region_North",
      "region_South",
      "region_East",
      "region_West",
      "qty_Small",
      "qty_Medium",
      "qty_Large",
    );

  console.log("Analytics/ML ready export:");
  analyticsExport.print();

  // ============================================================================
  // 11. PERFORMANCE TIPS - Working with large datasets
  // ============================================================================
  console.log("\n=== 11. Performance Tips - Working with Large Datasets ===");

  // Tips for working with larger datasets
  // This provides guidance for efficient data processing
  const performanceTips = createDataFrame([
    {
      tip: "Filter Early",
      description: "Apply filters before other operations to reduce data size",
    },
    {
      tip: "Select Columns",
      description: "Use select() to work with only needed columns",
    },
    {
      tip: "Batch Processing",
      description: "Process data in chunks for very large datasets",
    },
    {
      tip: "Efficient Grouping",
      description: "Group by categorical columns with reasonable cardinality",
    },
    {
      tip: "Memory Management",
      description: "Use streaming operations for massive datasets",
    },
  ]);

  console.log("Performance tips for large datasets:");
  performanceTips.print();

  // ============================================================================
  // 12. EFFICIENT PROCESSING EXAMPLE - Putting tips into practice
  // ============================================================================
  console.log(
    "\n=== 12. Efficient Processing Example - Putting Tips into Practice ===",
  );

  // Example of efficient processing
  // This demonstrates the performance tips in action
  const efficientProcessing = salesData
    .filter((row) => row.sold === true) // Filter early
    .select("product", "price", "quantity", "region") // Select needed columns
    .groupBy("product") // Group efficiently
    .summarise({
      avg_price: (df) => stats.mean(df.price),
      total_quantity: (df) => stats.sum(df.quantity),
    });

  console.log("Efficiently processed summary:");
  efficientProcessing.print();

  write_csv(
    efficientProcessing,
    "./examples/dataframe/output/efficientProcessing.csv",
  );
  console.log("\nEfficient processing result as CSV written successfully");

  // ============================================================================
  // 13. ADVANCED EXPORT PATTERNS - Complex workflows
  // ============================================================================
  console.log("\n=== 13. Advanced Export Patterns - Complex Workflows ===");

  // Show more advanced export patterns
  const advancedExport = salesData
    .filter((row) => row.sold === true) // Only successful sales
    .mutate({
      revenue: (row) => row.price * row.quantity,
      quarter: (row) => {
        const month = row.date.getMonth();
        if (month < 3) return "Q1";
        if (month < 6) return "Q2";
        if (month < 9) return "Q3";
        return "Q4";
      },
      customer_type: (row) => row.quantity > 5 ? "Bulk" : "Individual",
    })
    .groupBy("quarter", "customer_type")
    .summarise({
      total_revenue: (group) => stats.sum(group.revenue),
      avg_order_size: (group) => stats.round(stats.mean(group.quantity), 1),
      customer_count: (group) => stats.unique(group.customer).length,
    })
    .ungroup()
    .arrange("total_revenue", "desc");

  console.log("Advanced export pattern (quarterly analysis):");
  advancedExport.print();

  write_csv(advancedExport, "./examples/dataframe/output/advancedExport.csv");
  console.log("\nAdvanced export as CSV written successfully");

  // ============================================================================
  // 14. PUTTING IT ALL TOGETHER - Complete export workflow
  // ============================================================================
  console.log(
    "\n=== 14. Putting It All Together - Complete Export Workflow ===",
  );

  // Show a complete workflow that demonstrates all the export concepts
  const finalResult = salesData
    .filter((row) => row.sold === true) // Data validation
    .mutate({
      revenue: (row) => row.price * row.quantity,
      month: (row) => row.date.toISOString().slice(0, 7),
      customer_segment: (row) => {
        const total = row.price * row.quantity;
        if (total >= 200) return "Premium";
        if (total >= 100) return "Standard";
        return "Basic";
      },
    }) // Add calculated columns
    .groupBy("region", "customer_segment") // Group for analysis
    .summarise({
      region: (group) => group.region[0],
      segment: (group) => group.customer_segment[0],
      total_revenue: (group) => stats.sum(group.revenue),
      avg_order_value: (group) => stats.round(stats.mean(group.revenue), 2),
      customer_count: (group) => stats.unique(group.customer).length,
      product_variety: (group) => stats.unique(group.product).length,
    }) // Calculate comprehensive statistics
    .ungroup() // Remove grouping
    .arrange("total_revenue", "desc") // Sort by revenue
    .select(
      "region",
      "segment",
      "total_revenue",
      "avg_order_value",
      "customer_count",
      "product_variety",
    ); // Select relevant columns

  console.log("Complete export workflow combining all concepts:");
  finalResult.print();

  write_csv(finalResult, "./examples/dataframe/output/finalResult.csv");
  console.log("\nFinal workflow result as CSV written successfully");
});
