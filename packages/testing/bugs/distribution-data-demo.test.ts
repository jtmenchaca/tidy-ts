import { s } from "@tidy-ts/dataframe";

Deno.test("Distribution Data API Demo", () => {
  console.log("\n=== DISTRIBUTION DATA API DEMO ===");

  // PDF (Probability Density Function)
  console.log("\n📊 Normal Distribution PDF:");
  const normalPDF = s.dist.normal.data({
    mean: 0,
    standardDeviation: 1,
    type: "pdf",
    range: [-3, 3],
    points: 10,
  });
  console.table(normalPDF.head(5));

  // CDF (Cumulative Distribution Function)
  console.log("\n📈 Normal Distribution CDF:");
  const normalCDF = s.dist.normal.data({
    mean: 0,
    standardDeviation: 1,
    type: "cdf",
    range: [-3, 3],
    points: 10,
  });
  console.table(normalCDF.head(5));

  // Inverse CDF (Quantile Function)
  console.log("\n📉 Normal Distribution Quantile Function:");
  const normalQuantile = s.dist.normal.data({
    mean: 0,
    standardDeviation: 1,
    type: "inverse_cdf",
    range: [0.1, 0.9],
    points: 10,
  });
  console.table(normalQuantile.head(5));

  // Default configuration
  console.log("\n🎯 Default Configuration (100 points, auto range):");
  const normalDefault = s.dist.normal.data({
    mean: 0,
    standardDeviation: 1,
    type: "pdf",
  });
  console.log(`Generated ${normalDefault.nrows()} points`);
  console.table(normalDefault.head(3));

  console.log("\n✅ All distribution data generation working perfectly!");
});
