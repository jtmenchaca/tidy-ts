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

  distributionFunctions: `import { stats as s } from "@tidy-ts/dataframe";

// Normal distribution with intuitive function names
const normalSample = s.dist.normal.random(0, 1);  // Random sample from N(0,1)
const normalDensity = s.dist.normal.density(0, 0, 1);  // PDF at x=0
const normalCDF = s.dist.normal.probability(0, 0, 1);  // CDF at x=0
const normalQuantile = s.dist.normal.quantile(0.5, 0, 1);  // 50th percentile

console.log("Normal random sample:", normalSample);
console.log("Normal density at 0:", normalDensity);
console.log("Normal CDF at 0:", normalCDF);
console.log("Normal median:", normalQuantile);

// Beta distribution for bounded random variables
const betaSample = s.dist.beta.random(2, 3);  // Beta(2,3) sample
const betaDensity = s.dist.beta.density(0.5, 2, 3);  // PDF at x=0.5

console.log("Beta random sample:", betaSample);
console.log("Beta density at 0.5:", betaDensity);

// Chi-squared distribution for statistical testing
const chiSquareCritical = s.dist.chiSquare.quantile(0.95, 1);  // 95th percentile
const chiSquareP = s.dist.chiSquare.probability(3.84, 1);  // P-value calculation

console.log("Chi-square critical value (α=0.05, df=1):", chiSquareCritical);
console.log("Chi-square probability:", chiSquareP);

// Generate multiple samples for analysis
const samples = Array.from({length: 1000}, () => s.dist.normal.random(0, 1));
const sampleMean = s.mean(samples);
const sampleStd = s.stdev(samples);

console.log("Sample mean (should be ~0):", sampleMean);
console.log("Sample std (should be ~1):", sampleStd);`,

  statisticalTests: `import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Sample data for testing
const groupA = [23, 25, 28, 30, 32, 29, 27];
const groupB = [18, 20, 22, 24, 26, 21, 19];
const groupC = [15, 17, 19, 21, 23, 18, 16];

// One-sample t-test
const tTestResult = s.test.t.oneSample(groupA, 25, "two-sided", 0.05);
console.log("One-sample t-test:", {
  statistic: tTestResult.statistic,
  pValue: tTestResult.pValue,
  significant: tTestResult.pValue < 0.05
});

// Independent two-sample t-test
const tTestInd = s.test.t.independent(groupA, groupB, 0.05);
console.log("Two-sample t-test p-value:", tTestInd.pValue);

// One-way ANOVA
const anovaResult = s.test.anova.oneWay([groupA, groupB, groupC], 0.05);
console.log("ANOVA F-statistic:", anovaResult.fStatistic);
console.log("ANOVA p-value:", anovaResult.pValue);

// Normality test
const normalityTest = s.test.normality.shapiroWilk(groupA, 0.05);
console.log("Shapiro-Wilk test for normality:", {
  statistic: normalityTest.statistic,
  pValue: normalityTest.pValue,
  isNormal: normalityTest.pValue > 0.05
});

// Correlation test
const x = [1, 2, 3, 4, 5, 6, 7];
const y = [2, 4, 6, 8, 10, 12, 14];
const corrTest = s.test.correlation.pearson(x, y, "two-sided", 0.05);
console.log("Pearson correlation test:", {
  correlation: corrTest.statistic,
  pValue: corrTest.pValue
});`,

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
