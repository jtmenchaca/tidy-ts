import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Extract Methods - Column Value Extraction Examples", () => {
  // ============================================================================
  // 1. SETTING UP THE DATA - Create our working dataset
  // ============================================================================
  console.log("=== 1. Setting Up the Data ===");

  const salesData = createDataFrame([
    { id: 1, rep: "Alice", product: "Widget", sales: 1500, quarter: "Q1" },
    { id: 2, rep: "Bob", product: "Gadget", sales: 2200, quarter: "Q1" },
    { id: 3, rep: "Carol", product: "Tool", sales: 1800, quarter: "Q1" },
    { id: 4, rep: "David", product: "Widget", sales: 3100, quarter: "Q2" },
    { id: 5, rep: "Eve", product: "Gadget", sales: 1200, quarter: "Q2" },
    { id: 6, rep: "Frank", product: "Device", sales: 2800, quarter: "Q2" },
    { id: 7, rep: "Grace", product: "Tool", sales: 1900, quarter: "Q3" },
    { id: 8, rep: "Henry", product: "Widget", sales: 2500, quarter: "Q3" },
  ]);

  console.log("Sales data:");
  salesData.print();

  // ============================================================================
  // 2. BASIC EXTRACT - Get all values from a column
  // ============================================================================
  console.log("\n=== 2. Basic Extract - Get All Values ===");

  // Extract all representative names
  const allReps = salesData.extract("rep");
  console.log("All representatives:", allReps);

  // Extract all sales amounts
  const allSales = salesData.extract("sales");
  console.log("All sales amounts:", allSales);

  // ============================================================================
  // 3. EXTRACT_HEAD - Get first n values
  // ============================================================================
  console.log("\n=== 3. Extract Head - Get First N Values ===");

  // Get first representative name (single value)
  const firstRep = salesData.extractHead("rep", 1);
  console.log("First representative:", firstRep); // "Alice"

  // Get first 3 representative names (array)
  const first3Reps = salesData.extractHead("rep", 3);
  console.log("First 3 representatives:", first3Reps); // ["Alice", "Bob", "Carol"]

  // Get to p performer after sorting
  const topPerformer = salesData
    .arrange("sales", "desc")
    .extractHead("rep", 1);
  console.log("Top performer:", topPerformer); // "David"

  // ============================================================================
  // 4. EXTRACT_TAIL - Get last n values
  // ============================================================================
  console.log("\n=== 4. Extract Tail - Get Last N Values ===");

  // Get last representative name (single value)
  const lastRep = salesData.extractTail("rep", 1);
  console.log("Last representative:", lastRep); // "Henry"

  // Get last 2 representative names (array)
  const last2Reps = salesData.extractTail("rep", 2);
  console.log("Last 2 representatives:", last2Reps); // ["Grace", "Henry"]

  // Get most recent quarter
  const mostRecentQuarter = salesData.extractTail("quarter", 1);
  console.log("Most recent quarter:", mostRecentQuarter); // "Q3"

  // ============================================================================
  // 5. EXTRACT_NTH - Get value at specific index
  // ============================================================================
  console.log("\n=== 5. Extract Nth - Get Value at Specific Index ===");

  // Get representative at index 2 (third person)
  const thirdRep = salesData.extractNth("rep", 2);
  console.log("Third representative:", thirdRep); // "Carol"

  // Get sales amount at index 0
  const firstSale = salesData.extractNth("sales", 0);
  console.log("First sales amount:", firstSale); // 1500

  // Get value at non-existent index
  const invalidIndex = salesData.extractNth("rep", 99);
  console.log("Rep at index 99:", invalidIndex); // undefined

  // ============================================================================
  // 6. EXTRACT_SAMPLE - Get random n values
  // ============================================================================
  console.log("\n=== 6. Extract Sample - Get Random N Values ===");

  // Get 3 random representative names
  const randomReps = salesData.extractSample("rep", 3);
  console.log("3 random representatives:", randomReps);

  // Get 2 random sales amounts
  const randomSales = salesData.extractSample("sales", 2);
  console.log("2 random sales amounts:", randomSales);

  // ============================================================================
  // 7. PRACTICAL EXAMPLES - Real-world use cases
  // ============================================================================
  console.log("\n=== 7. Practical Examples - Real-World Use Cases ===");

  // Example 1: Get the best product name
  const bestProduct = salesData
    .sliceMax("sales", 1)
    .extractHead("product", 1);
  console.log("Best selling product:", bestProduct); // "Widget"

  // Example 2: Get top 3 quarters by performance
  const topQuarters = salesData
    .groupBy("quarter")
    .summarise({
      total_sales: (row) => stats.sum(row.sales),
    })
    .arrange("total_sales", "desc")
    .extractHead("quarter", 3);
  console.log("Top 3 quarters:", topQuarters);

  // Example 3: Get names of people who sold widgets
  const widgetSellers = salesData
    .filter((row) => row.product === "Widget")
    .extract("rep");
  console.log("Widget sellers:", widgetSellers);

  // Example 4: Get a sample of products for analysis
  const productSample = salesData
    .distinct("product")
    .extractSample("product", 2);
  console.log("Sample products for analysis:", productSample);

  // ============================================================================
  // 8. GROUPED DATA EXAMPLES - Working with grouped DataFrames
  // ============================================================================
  console.log("\n=== 8. Grouped Data Examples ===");

  // Note: Extract methods work on grouped data too, but they operate on each group
  const quarterlyTopReps = salesData
    .groupBy("quarter")
    .arrange("sales", "desc")
    .head(1) // Top performer per quarter
    .extract("rep");

  console.log("Top rep per quarter:", quarterlyTopReps);

  // ============================================================================
  // 9. TYPE SAFETY DEMONSTRATION - TypeScript benefits
  // ============================================================================
  console.log("\n=== 9. Type Safety Demonstration ===");

  // These examples show how TypeScript knows the return types
  const _singleRep: string | undefined = salesData.extractHead("rep", 1);
  const _multipleReps: string[] = salesData.extractHead("rep", 3);
  const _allRepsList: string[] = salesData.extract("rep");
  const _randomRep: string | undefined = salesData.extractNth("rep", 0);

  console.log("Type safety examples completed successfully");

  // ============================================================================
  // 10. PERFORMANCE COMPARISON - Different approaches
  // ============================================================================
  console.log("\n=== 10. Performance Comparison ===");

  // Compare different ways to get the first value
  console.log("Method 1 - extract_head(1):", salesData.extractHead("rep", 1));
  console.log("Method 2 - extract_nth(0):", salesData.extractNth("rep", 0));
  console.log("Method 3 - extract()[0]:", salesData.extract("rep")[0]);

  // All three methods return the same result, but extract_head(1) is most intuitive

  // ============================================================================
  // 11. ERROR HANDLING - Edge cases
  // ============================================================================
  console.log("\n=== 11. Error Handling - Edge Cases ===");

  // Empty dataframe (with known structure)
  const emptyDf = createDataFrame([] as { rep: string; sales: number }[]);
  const emptyResult = emptyDf.extractHead("rep", 1);
  console.log("Empty dataframe result:", emptyResult); // undefined

  // More values requested than available
  const moreValuesThanAvailable = salesData.extractHead("rep", 20);
  console.log("Requested 20, got:", moreValuesThanAvailable.length, "values");

  // ============================================================================
  // 12. CHAINING EXAMPLES - Complex workflows
  // ============================================================================
  console.log("\n=== 12. Chaining Examples - Complex Workflows ===");

  // Complex workflow: Find the quarter with highest average sales
  const bestQuarter = salesData
    .groupBy("quarter")
    .summarise({
      avg_sales: (df) => {
        const sales = df.extract("sales");
        return sales.reduce((a, b) => a + b, 0) / sales.length;
      },
    })
    .sliceMax("avg_sales", 1)
    .extractHead("quarter", 1);

  console.log("Quarter with highest average sales:", bestQuarter);

  // Find representative with most diverse product portfolio
  const mostDiverseRep = salesData
    .groupBy("rep")
    .summarise({
      product_count: (df) => new Set(df.extract("product")).size,
    })
    .sliceMax("product_count", 1)
    .extractHead("rep", 1);

  console.log("Most diverse representative:", mostDiverseRep);

  // ============================================================================
  // VERIFICATION TESTS
  // ============================================================================

  // Test basic extract
  expect(allReps).toHaveLength(8);
  expect(allReps[0]).toBe("Alice");

  // Test extract_head with n=1 (single value)
  expect(typeof firstRep).toBe("string");
  expect(firstRep).toBe("Alice");

  // Test extract_head with n>1 (array)
  expect(Array.isArray(first3Reps)).toBe(true);
  expect(first3Reps).toHaveLength(3);
  expect(first3Reps[0]).toBe("Alice");

  // Test extract_tail with n=1 (single value)
  expect(typeof lastRep).toBe("string");
  expect(lastRep).toBe("Henry");

  // Test extract_tail with n>1 (array)
  expect(Array.isArray(last2Reps)).toBe(true);
  expect(last2Reps).toHaveLength(2);
  expect(last2Reps[1]).toBe("Henry");

  // Test extract_nth
  expect(thirdRep).toBe("Carol");
  expect(firstSale).toBe(1500);
  expect(invalidIndex).toBeUndefined();

  // Test extract_sample
  expect(Array.isArray(randomReps)).toBe(true);
  expect(randomReps).toHaveLength(3);
  expect(Array.isArray(randomSales)).toBe(true);
  expect(randomSales).toHaveLength(2);

  // Test practical examples
  expect(bestProduct).toBe("Widget");
  expect(Array.isArray(topQuarters)).toBe(true);
  expect(Array.isArray(widgetSellers)).toBe(true);

  console.log("\n✅ All extract method tests passed!");
});
