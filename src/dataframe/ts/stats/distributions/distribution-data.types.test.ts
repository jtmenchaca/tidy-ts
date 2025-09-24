import { type DataFrame, s } from "@tidy-ts/dataframe";

// Test normal distribution data generation with correct types

// 1. Test PDF data generation
const normalPDF = s.dist.normal.data({
  mean: 0,
  standardDeviation: 1,
  type: "pdf",
});
const _normalPDFTypeCheck: DataFrame<{
  x: number;
  density: number;
}> = normalPDF;

// 2. Test CDF data generation
const normalCDF = s.dist.normal.data({
  mean: 0,
  standardDeviation: 1,
  type: "cdf",
});
1;
const _normalCDFTypeCheck: DataFrame<{
  x: number;
  probability: number;
}> = normalCDF;

// 3. Test inverse CDF (quantile) data generation
const normalQuantile = s.dist.normal.data({
  mean: 0,
  standardDeviation: 1,
  type: "inverse_cdf",
});
const _normalQuantileTypeCheck: DataFrame<{
  probability: number;
  quantile: number;
}> = normalQuantile;

// 4. Test with custom configuration
const normalPDFCustom = s.dist.normal.data({
  mean: 0,
  standardDeviation: 1,
  type: "pdf",
  range: [-2, 2],
  points: 50,
});
const _normalPDFCustomTypeCheck: DataFrame<{
  x: number;
  density: number;
}> = normalPDFCustom;

// 5. Test that the data method is available on the distribution object
const normalDist = s.dist.normal;
const _hasDataMethod: typeof normalDist.data = normalDist.data;

// 6. Test that other methods are still available
const _hasDensityMethod: typeof normalDist.density = normalDist.density;
const _hasProbabilityMethod: typeof normalDist.probability =
  normalDist.probability;
const _hasQuantileMethod: typeof normalDist.quantile = normalDist.quantile;
const _hasRandomMethod: typeof normalDist.random = normalDist.random;

console.log("✅ All type checks passed for distribution data generation!");
