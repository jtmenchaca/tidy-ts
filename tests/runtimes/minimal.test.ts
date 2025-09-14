import { createDataFrame, stats } from "@tidy-ts/dataframe";

console.log("Minimal runtime test");

// Create a DataFrame
const sales = createDataFrame([
  { product: "Widget", quantity: 10, price: 100, region: "North" },
  { product: "Gadget", quantity: 5, price: 200, region: "South" },
  { product: "Widget", quantity: 20, price: 100, region: "South" },
]);

// Analyze data with type-safe operations
const analysis = sales
  .mutate({ revenue: (r) => r.quantity * r.price })
  .groupBy("region")
  .summarize({
    total_revenue: (df) => stats.sum(df.revenue),
    avg_quantity: (df) => stats.mean(df.quantity),
    product_count: (df) => df.nrows(),
  })
  .arrange("total_revenue", "desc");

analysis.print("Regional sales analysis:");
console.log("✅ Minimal test completed successfully");
