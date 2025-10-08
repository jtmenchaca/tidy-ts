import { createDataFrame, stats } from "@tidy-ts/dataframe";

// Quick test to find the data size limit
function quickLimitTest() {
  console.log("🔍 Quick data size limit test...");

  // Binary search approach to find the limit more efficiently
  let minSize = 20_000_000;
  let maxSize = 25_000_000;
  let lastSuccessfulSize = 0;

  const testSize = (size: number): boolean => {
    try {
      console.log(`Testing ${size.toLocaleString()} rows...`);

      // Generate test data
      const data = Array.from({ length: size }, (_, i) => ({
        product: `Product${i % 10}`,
        quantity: Math.floor(Math.random() * 100) + 1,
        price: Math.floor(Math.random() * 500) + 50,
        region: `Region${i % 5}`,
      }));

      // Create DataFrame and run operations
      const sales = createDataFrame(data);
      const analysis = sales
        .mutate({ revenue: (r) => r.quantity * r.price })
        .groupBy("region")
        .summarize({
          total_revenue: (df) => stats.sum(df.revenue),
          avg_quantity: (df) => stats.mean(df.quantity),
          product_count: (df) => df.nrows(),
        })
        .arrange("total_revenue", "desc");

      console.log("Number of rows in original data: ", sales.nrows());
      console.log("Number of rows in summary data: ", analysis.nrows());
      sales.sliceHead(10).print();

      console.log(`✅ ${size.toLocaleString()} rows - SUCCESS`);
      return true;
    } catch (error) {
      console.log(
        `❌ ${size.toLocaleString()} rows - FAILED: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  };

  // Binary search to find the limit
  while (minSize <= maxSize) {
    const midSize = Math.floor((minSize + maxSize) / 2);

    if (testSize(midSize)) {
      lastSuccessfulSize = midSize;
      minSize = midSize + 1;
    } else {
      maxSize = midSize - 1;
    }
  }

  console.log(
    `\n🎯 Maximum data size: ${lastSuccessfulSize.toLocaleString()} rows`,
  );
  return lastSuccessfulSize;
}

// Run the test
if (import.meta.main) {
  quickLimitTest();
}

export { quickLimitTest };
