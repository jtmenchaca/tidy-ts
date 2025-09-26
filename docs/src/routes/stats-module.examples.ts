// Code examples for stats module
export const statsModuleExamples = {
  basicDescriptiveStats: `import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const sampleData = createDataFrame([
  { id: 1, value: 10, category: "A", score: 85 },
  { id: 2, value: 20, category: "B", score: 92 },
  { id: 3, value: 15, category: "A", score: 78 },
  { id: 4, value: 25, category: "B", score: 88 },
  { id: 5, value: 12, category: "A", score: 95 },
  { id: 6, value: 30, category: "C", score: 82 },
  { id: 7, value: 18, category: "B", score: 90 },
  { id: 8, value: 22, category: "A", score: 87 },
]);

const values = sampleData.value;

console.log("Values:", values);
console.log("Sum:", s.sum(values));
console.log("Mean:", s.mean(values));
console.log("Median:", s.median(values));
console.log("Min:", s.min(values));
console.log("Max:", s.max(values));`,

  quantilesAndPercentiles: `const quartiles = s.quartiles(values);
const q25 = s.quantile(values, 0.25);
const q75 = s.quantile(values, 0.75);

console.log("Quartiles [Q25, Q50, Q75]:", quartiles);
console.log("25th percentile:", q25);
console.log("75th percentile:", q75);`,

  mutateWithStats: `const withStats = sampleData
  .mutate({
    value_centered: (row, _index, df) => {
      const mean = s.mean(df.value);
      return row.value - mean;
    },
    value_quartile: (row, _index, df) => {
      const q = s.quartiles(df.value);
      if (row.value <= q[0]) return "Q1";
      if (row.value <= q[1]) return "Q2";
      if (row.value <= q[2]) return "Q3";
      return "Q4";
    },
  });

withStats.print("Data with statistical measures:");`,

  rankingFunctions: `const ranks = s.rank(values);
const uniqueCount = s.uniqueCount(values);

console.log("Ranks:", ranks);
console.log("Unique count:", uniqueCount);`,

  mutateWithRanking: `const withRanking = sampleData
  .mutate({
    value_rank: (row, _index, df) => s.rank(df.value, row.value),
  });

withRanking.print("Data with ranking information:");`,

  cumulativeFunctions: `const cumsum = s.cumsum(values);
const cummax = s.cummax(values);

console.log("Cumulative sum:", cumsum);
console.log("Cumulative max:", cummax);`,

  distributionFunctions: `import { s } from "@tidy-ts/dataframe";

// Individual distribution functions
const randomValue = s.dist.normal.random({ mean: 0, standardDeviation: 1, sampleSize: 10 });        // Random sample
const density = s.dist.normal.density({ at: 0, mean: 0, standardDeviation: 1});        // PDF at x=0
const probability = s.dist.normal.probability({ at: 1.96, mean: 0, standardDeviation: 1 });  // CDF (P-value)
const quantile = s.dist.normal.quantile({ probability: 0.975, mean: 0, standardDeviation: 1 });  // Critical value

// Generate distribution data for visualization
const normalPDFData = s.dist.normal.data({
  mean: 0,
  standardDeviation: 2,
  type: "pdf",
  range: [-4, 4],
  points: 100,
});

// Other distributions: beta, gamma, exponential, chi-square, t, f, uniform,
// weibull, binomial, poisson, geometric, hypergeometric, and more
const betaSample = s.dist.beta.random({ alpha: 2, beta: 5 });
const chiSquareQuantile = s.dist.chiSquare.quantile({ probability: 0.95, degreesOfFreedom: 1 });`,

  compareAPI: `import { stats as s } from "@tidy-ts/dataframe";

// Compare API - designed to help you perform the analysis best suited to your needs
const heights = [170, 165, 180, 175, 172, 168];
const testResult = s.compare.oneGroup.centralTendency.toValue({
  data: heights,
  hypothesizedValue: 170,
  parametric: "parametric" // Use "auto" for help deciding if parametric or non-parametric is best
}); 
console.log(testResult);

// {
//   test_name: "One-sample t-test",
//   p_value: 0.47...,
//   effect_size: { value: 0.31..., name: "Cohen's D" },
//   test_statistic: { value: 0.76..., name: "T-Statistic" },
//   confidence_interval: {
//     lower: 166.08...,
//     upper: 177.24...,
//     confidence_level: 0.95
//   },
//   degrees_of_freedom: 5,
//   alpha: 0.05
// } 

const group1 = [23, 45, 67, 34, 56, 78, 29, 41, 52, 38]; // Hours spent studying per week
const group2 = [78, 85, 92, 73, 88, 95, 69, 81, 89, 76]; // Final exam scores
const groupComparison = s.compare.twoGroups.association.toEachOther({
  x: group1,
  y: group2,
  method: "pearson", // Use "auto" for help choosing the right correlation test
});
console.log(groupComparison);

// Two-group comparison result: {
//   test_name: "Pearson correlation test",
//   p_value: 0.0003...,
//   effect_size: { value: 0.90..., name: "Pearson's R" },
//   test_statistic: { value: 5.95..., name: "T-Statistic" },
//   confidence_interval: {
//     lower: 0.63...,
//     upper: 0.97...,
//     confidence_level: 0.95
//   },
//   degrees_of_freedom: 8,
//   alpha: 0.05
// }`,

  specificTests: `// If you'd prefer to have the specific test instead, we provide that via the test API as well. 
const data = [170, 165, 180, 175, 172, 168];
const before = [23, 25, 28, 30, 32, 29, 27];
const after = [25, 27, 30, 32, 34, 31, 29];
const group1 = [23, 25, 28, 30, 32, 29, 27];
const group2 = [18, 20, 22, 24, 26, 21, 19];
const group3 = [15, 17, 19, 21, 23, 18, 16];

const oneSampleT = s.test.t.oneSample({ data, mu: 170, alternative: "two-sided", alpha: 0.05 });
const independentT = s.test.t.independent({ x: group1, y: group2, alpha: 0.05 });
const pairedT = s.test.t.paired({ x: before, y: after, alpha: 0.05 });
const anovaResult = s.test.anova.oneWay([group1, group2, group3], 0.05);
const mannWhitney = s.test.nonparametric.mannWhitney(group1, group2, 0.05);
const kruskalWallis = s.test.nonparametric.kruskalWallis([group1, group2], 0.05);
const pearsonTest = s.test.correlation.pearson(group1, group2, "two-sided", 0.05);
const shapiroWilk = s.test.normality.shapiroWilk(data, 0.05);`,

  compareAPIReference: `// Here are the various functions that the compare API exposes for use.  
// Each has various options to help both new and experienced users feel confident in what they're getting.
s.compare.oneGroup.centralTendency.toValue(...)
s.compare.oneGroup.proportions.toValue(...)
s.compare.oneGroup.distribution.toNormal(...)
s.compare.twoGroups.centralTendency.toEachOther(...)
s.compare.twoGroups.association.toEachOther(...)
s.compare.twoGroups.proportions.toEachOther(...)
s.compare.twoGroups.distributions.toEachOther(...)
s.compare.multiGroups.centralTendency.toEachOther(...)
s.compare.multiGroups.proportions.toEachOther(...)`,

  importOptions: `// Option 1: Import with full name for clarity
import { stats } from "@tidy-ts/dataframe";
const mean1 = stats.mean([1, 2, 3, 4, 5]);
const randomNormal1 = stats.dist.normal.random(0, 1);
const tTest1 = stats.test.t.oneSample([1, 2, 3], 2, "two-sided", 0.05);

// Option 2: Import with short alias for brevity
import { stats as s } from "@tidy-ts/dataframe";
const mean2 = s.mean([1, 2, 3, 4, 5]);
const randomNormal2 = s.dist.normal.random(0, 1);
const tTest2 = s.test.t.oneSample([1, 2, 3], 2, "two-sided", 0.05);

// Option 3: Both imports (they reference the same object)
import { stats, s } from "@tidy-ts/dataframe";
console.log("Same object:", stats === s);  // true

// Option 4: Default import
import stats from "@tidy-ts/dataframe";
const mean4 = stats.mean([1, 2, 3, 4, 5]);

// All approaches provide access to 80+ statistical functions:
// - Descriptive statistics: mean, median, stdev, variance, etc.
// - Distribution functions: stats.dist.normal.random, stats.dist.beta.density, etc.
// - Statistical tests: stats.test.t.oneSample, stats.test.anova.oneWay, etc.`,
};
