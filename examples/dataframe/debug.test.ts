import { createDataFrame, stats } from "@tidy-ts/dataframe";

console.log("=== 1. Setting Up the Data ===");

Deno.test("Advanced Operations and Chaining - Progressive Examples", () => {
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
    });
  console.log("\n\n\n");
  console.log("analysisResult");
  analysisResult.print();
  console.log("\n\n\n");
  const analysisResult1 = analysisResult
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
    });
  console.log("\n\n\n");
  console.log("analysisResult1");
  analysisResult1.print();
  console.log("\n\n\n");
  const analysisResult2 = analysisResult1
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

  console.log("\n\n\n");
  console.log("analysisResult2");
  analysisResult2.print();
  console.log("\n\n\n");
});
