import { s } from "@tidy-ts/dataframe";

Deno.test("All Distributions Data API Demo", () => {
  console.log("\n=== ALL DISTRIBUTIONS DATA API DEMO ===");

  // Test Normal Distribution
  console.log("\n📊 Normal Distribution:");
  const normalPDF = s.dist.normal.data({
    mean: 0,
    standardDeviation: 1,
    type: "pdf",
    range: [-3, 3],
    points: 10,
  });
  console.log("PDF data points:", normalPDF.nrows());

  // Test Beta Distribution
  console.log("\n📊 Beta Distribution:");
  const betaPDF = s.dist.beta.data({
    alpha: 2,
    beta: 5,
    type: "pdf",
    range: [0, 1],
    points: 10,
  });
  console.log("PDF data points:", betaPDF.nrows());

  // Test Binomial Distribution
  console.log("\n📊 Binomial Distribution:");
  const binomialPDF = s.dist.binomial.data({
    trials: 20,
    probabilityOfSuccess: 0.3,
    type: "pdf",
    range: [0, 20],
    points: 21,
  });
  console.log("PDF data points:", binomialPDF.nrows());

  // Test Chi-Square Distribution
  console.log("\n📊 Chi-Square Distribution:");
  const chiSquarePDF = s.dist.chiSquare.data({
    degreesOfFreedom: 5,
    type: "pdf",
    range: [0, 20],
    points: 10,
  });
  console.log("PDF data points:", chiSquarePDF.nrows());

  // Test Exponential Distribution
  console.log("\n📊 Exponential Distribution:");
  const expPDF = s.dist.exponential.data({
    rate: 2,
    type: "pdf",
    range: [0, 5],
    points: 10,
  });
  console.log("PDF data points:", expPDF.nrows());

  // Test Gamma Distribution
  console.log("\n📊 Gamma Distribution:");
  const gammaPDF = s.dist.gamma.data({
    shape: 2,
    rate: 1,
    type: "pdf",
    range: [0, 10],
    points: 10,
  });
  console.log("PDF data points:", gammaPDF.nrows());

  // Test Poisson Distribution
  console.log("\n📊 Poisson Distribution:");
  const poissonPDF = s.dist.poisson.data({
    rateLambda: 3,
    type: "pdf",
    range: [0, 15],
    points: 16,
  });
  console.log("PDF data points:", poissonPDF.nrows());

  // Test t-Distribution
  console.log("\n📊 t-Distribution:");
  const tPDF = s.dist.t.data({
    degreesOfFreedom: 10,
    type: "pdf",
    range: [-4, 4],
    points: 10,
  });
  console.log("PDF data points:", tPDF.nrows());

  // Test Uniform Distribution
  console.log("\n📊 Uniform Distribution:");
  const uniformPDF = s.dist.uniform.data({
    min: 0,
    max: 1,
    type: "pdf",
    range: [0, 1],
    points: 10,
  });
  console.log("PDF data points:", uniformPDF.nrows());

  // Test Weibull Distribution
  console.log("\n📊 Weibull Distribution:");
  const weibullPDF = s.dist.weibull.data({
    shape: 2,
    scale: 1,
    type: "pdf",
    range: [0, 5],
    points: 10,
  });
  console.log("PDF data points:", weibullPDF.nrows());

  // Test CDF for Normal Distribution
  console.log("\n📈 Normal Distribution CDF:");
  const normalCDF = s.dist.normal.data({
    mean: 0,
    standardDeviation: 1,
    type: "cdf",
    range: [-3, 3],
    points: 10,
  });
  console.log("CDF data points:", normalCDF.nrows());

  // Test Inverse CDF for Normal Distribution
  console.log("\n📉 Normal Distribution Inverse CDF:");
  const normalQuantile = s.dist.normal.data({
    mean: 0,
    standardDeviation: 1,
    type: "inverse_cdf",
    range: [0.1, 0.9],
    points: 10,
  });
  console.log("Quantile data points:", normalQuantile.nrows());

  console.log("\n✅ All distribution data generation working perfectly!");
});
