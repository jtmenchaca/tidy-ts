import{j as s}from"./radix-BuIbRv-a.js";import{C as t}from"./code-block-B0XYfMng.js";import{C as a,a as i,b as n,c as l,d as o}from"./card-BIm9p5cD.js";import{D as r}from"./DocPageLayout-CwA4bbf5.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./shiki-themes-BheiPiei.js";import"./index-BVriQQBm.js";const e={basicDescriptiveStats:`import { createDataFrame, stats } from "@tidy-ts/dataframe";

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
console.log("Sum:", stats.sum(values));
console.log("Mean:", stats.mean(values));
console.log("Median:", stats.median(values));
console.log("Min:", stats.min(values));
console.log("Max:", stats.max(values));`,quantilesAndPercentiles:`const quartiles = stats.quartiles(values);
const q25 = stats.quantile(values, 0.25);
const q75 = stats.quantile(values, 0.75);

console.log("Quartiles [Q25, Q50, Q75]:", quartiles);
console.log("25th percentile:", q25);
console.log("75th percentile:", q75);`,rankingFunctions:`const ranks = stats.rank(values);
const uniqueCount = stats.uniqueCount(values);

console.log("Ranks:", ranks);
console.log("Unique count:", uniqueCount);`,mutateWithRanking:`const withRanking = sampleData
  .mutate({
    value_rank: (row, _index, df) => stats.rank(df.value, row.value),
  });

withRanking.print("Data with ranking information:");`,cumulativeFunctions:`const cumsum = stats.cumsum(values);
const cummax = stats.cummax(values);

console.log("Cumulative sum:", cumsum);
console.log("Cumulative max:", cummax);`,distributionFunctions:`import { stats } from "@tidy-ts/dataframe";

// Normal distribution
const normalSample = stats.dist.rnorm(0, 1);  // Random sample from N(0,1)
const normalDensity = stats.dist.dnorm(0, 0, 1);  // PDF at x=0
const normalCDF = stats.dist.pnorm(0, 0, 1);  // CDF at x=0
const normalQuantile = stats.dist.qnorm(0.5, 0, 1);  // 50th percentile

console.log("Normal random sample:", normalSample);
console.log("Normal density at 0:", normalDensity);
console.log("Normal CDF at 0:", normalCDF);
console.log("Normal median:", normalQuantile);

// Beta distribution for bounded random variables
const betaSample = stats.dist.rbeta(2, 3);  // Beta(2,3) sample
const betaDensity = stats.dist.dbeta(0.5, 2, 3);  // PDF at x=0.5

console.log("Beta random sample:", betaSample);
console.log("Beta density at 0.5:", betaDensity);

// Generate multiple samples for analysis
const samples = Array.from({length: 1000}, () => stats.dist.rnorm(0, 1));
const sampleMean = stats.mean(samples);
const sampleStd = stats.stdev(samples);

console.log("Sample mean (should be ~0):", sampleMean);
console.log("Sample std (should be ~1):", sampleStd);`,statisticalTests:`import { createDataFrame, stats } from "@tidy-ts/dataframe";

// Sample data for testing
const groupA = [23, 25, 28, 30, 32, 29, 27];
const groupB = [18, 20, 22, 24, 26, 21, 19];
const groupC = [15, 17, 19, 21, 23, 18, 16];

// One-sample t-test
const tTestResult = stats.test.t_test(groupA, 25, "two-sided", 0.05);
console.log("One-sample t-test:", {
  statistic: tTestResult.statistic,
  pValue: tTestResult.pValue,
  significant: tTestResult.pValue < 0.05
});

// Independent two-sample t-test
const tTestInd = stats.test.tTestIndependent(groupA, groupB, 0.05);
console.log("Two-sample t-test p-value:", tTestInd.pValue);

// One-way ANOVA
const anovaResult = stats.test.anovaOneWay([groupA, groupB, groupC], 0.05);
console.log("ANOVA F-statistic:", anovaResult.fStatistic);
console.log("ANOVA p-value:", anovaResult.pValue);

// Normality test
const normalityTest = stats.test.shapiroWilkTest(groupA, 0.05);
console.log("Shapiro-Wilk test for normality:", {
  statistic: normalityTest.statistic,
  pValue: normalityTest.pValue,
  isNormal: normalityTest.pValue > 0.05
});

// Correlation test
const x = [1, 2, 3, 4, 5, 6, 7];
const y = [2, 4, 6, 8, 10, 12, 14];
const corrTest = stats.test.pearsonTest(x, y, "two-sided", 0.05);
console.log("Pearson correlation test:", {
  correlation: corrTest.statistic,
  pValue: corrTest.pValue
});`,importOptions:`// Option 1: Import with full name for clarity
import { stats } from "@tidy-ts/dataframe";
const mean1 = stats.mean([1, 2, 3, 4, 5]);
const randomNormal1 = stats.dist.rnorm(0, 1);
const tTest1 = stats.test.t_test([1, 2, 3], 2, "two-sided", 0.05);

// Option 2: Import with short alias for brevity
import { s } from "@tidy-ts/dataframe";
const mean2 = s.mean([1, 2, 3, 4, 5]);
const randomNormal2 = s.dist.rnorm(0, 1);
const tTest2 = s.test.t_test([1, 2, 3], 2, "two-sided", 0.05);

// Option 3: Both imports (they reference the same object)
import { stats, s } from "@tidy-ts/dataframe";
console.log("Same object:", stats === s);  // true

// Option 4: Default import
import stats from "@tidy-ts/dataframe";
const mean4 = stats.mean([1, 2, 3, 4, 5]);

// All approaches provide access to 80+ statistical functions:
// - Descriptive statistics: mean, median, std, var, etc.
// - Distribution functions: stats.dist.dnorm, stats.dist.rnorm, etc.
// - Statistical tests: stats.test.t_test, stats.test.anovaOneWay, etc.`};function v(){return s.jsxs(r,{title:"Stats Module",description:"Comprehensive statistical functions for data analysis. The stats module provides 80+ statistical functions including descriptive statistics, probability distributions, and statistical tests with full TypeScript support and optimized performance.",currentPath:"/stats-module",children:[s.jsx(t,{title:"Basic Descriptive Statistics",description:"Essential statistical measures for understanding your data",explanation:"The stats module provides all the descriptive statistics you need for data analysis. All functions are fully typed and optimized for performance.",code:e.basicDescriptiveStats}),s.jsx(t,{title:"Quantiles and Percentiles",description:"Advanced statistical measures for data distribution analysis",explanation:"Quantiles and percentiles help you understand the distribution of your data. They're essential for identifying outliers and understanding data spread.",code:e.quantilesAndPercentiles}),s.jsx(t,{title:"Ranking and Ordering",description:"Rank values and find unique elements",explanation:"Ranking functions help you understand the relative position of values in your dataset. Dense ranking handles ties differently than regular ranking.",code:e.rankingFunctions}),s.jsx(t,{title:"Cumulative Functions",description:"Calculate running totals and cumulative statistics",explanation:"Cumulative functions are essential for time series analysis and understanding how values accumulate over time or sequence.",code:e.cumulativeFunctions}),s.jsx(t,{title:"Window Functions",description:"Lag, lead, and other window operations",explanation:"Window functions are crucial for time series analysis, allowing you to compare values with their neighbors and calculate changes over time.",code:e.mutateWithRanking}),s.jsx(t,{title:"Correlation and Covariance",description:"Measure relationships between variables",explanation:"Correlation and covariance help you understand relationships between variables. They're essential for feature selection and understanding data dependencies.",code:e.cumulativeFunctions}),s.jsx(t,{title:"Probability Distributions",description:"Complete DPQR (Density, Probability, Quantile, Random) functions for 17 distributions",explanation:"Access probability functions for normal, beta, gamma, chi-squared, t-distribution, F-distribution, and more. Each distribution provides density (d*), cumulative probability (p*), quantile (q*), and random generation (r*) functions.",code:e.distributionFunctions}),s.jsx(t,{title:"Statistical Tests",description:"Comprehensive hypothesis testing with t-tests, ANOVA, correlation tests, and more",explanation:"Perform statistical hypothesis testing with full TypeScript support. All tests return detailed results including p-values, test statistics, confidence intervals, and more.",code:e.statisticalTests}),s.jsx(t,{title:"Import Options",description:"Flexible import patterns for different coding styles",explanation:"Import as 'stats' for clarity or 's' for brevity. Both provide access to the same comprehensive statistical functionality.",code:e.importOptions}),s.jsxs(a,{children:[s.jsxs(i,{children:[s.jsx(n,{children:"Complete Stats Function Reference"}),s.jsx(l,{children:"All 80+ statistical functions available in the stats module"})]}),s.jsx(o,{children:s.jsxs("div",{className:"grid md:grid-cols-3 gap-6",children:[s.jsxs("div",{children:[s.jsx("h4",{className:"font-medium mb-3",children:"Descriptive Statistics"}),s.jsxs("ul",{className:"text-sm space-y-1",children:[s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.sum()"})," - Sum of values"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.mean()"})," - Arithmetic mean"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.median()"})," - Median value"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.mode()"})," - Most frequent value"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.stdev()"})," - Standard deviation"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.variance()"})," - Variance"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.min()"})," - Minimum value"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.max()"})," - Maximum value"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.range()"})," - Range (max - min)"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.product()"})," - Product of values"]})]})]}),s.jsxs("div",{children:[s.jsx("h4",{className:"font-medium mb-3",children:"Advanced Functions"}),s.jsxs("ul",{className:"text-sm space-y-1",children:[s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.quantile()"})," - Quantiles and percentiles"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.quartiles()"})," - Quartiles [Q25, Q50, Q75]"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.iqr()"})," - Interquartile range"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.percentileRank()"})," - Percentile rank"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.rank()"})," - Ranking values"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.denseRank()"})," - Dense ranking"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.unique()"})," - Unique values"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.uniqueCount()"})," - Count of unique values"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.corr()"})," - Correlation coefficient"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.covariance()"})," - Covariance"]})]})]}),s.jsxs("div",{children:[s.jsx("h4",{className:"font-medium mb-3",children:"Cumulative Functions"}),s.jsxs("ul",{className:"text-sm space-y-1",children:[s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.cumsum()"})," - Cumulative sum"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.cumprod()"})," - Cumulative product"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.cummin()"})," - Cumulative minimum"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.cummax()"})," - Cumulative maximum"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.cummean()"})," - Cumulative mean"]})]})]}),s.jsxs("div",{children:[s.jsx("h4",{className:"font-medium mb-3",children:"Window & Utility Functions"}),s.jsxs("ul",{className:"text-sm space-y-1",children:[s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.lag()"})," - Lag values"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.lead()"})," - Lead values"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.round()"})," - Round to decimal places"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.floor()"})," - Floor values"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.ceiling()"})," - Ceiling values"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.countValue()"})," - Count specific values"]})]})]}),s.jsxs("div",{children:[s.jsx("h4",{className:"font-medium mb-3",children:"Distribution Functions"}),s.jsxs("ul",{className:"text-sm space-y-1",children:[s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.dist.dnorm()"})," - Normal density"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.dist.pnorm()"})," - Normal CDF"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.dist.qnorm()"})," - Normal quantiles"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.dist.rnorm()"})," - Normal random samples"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.dist.dbeta()"})," - Beta density"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.dist.rbeta()"})," - Beta random samples"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.dist.dgamma()"})," - Gamma density"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.dist.rgamma()"})," - Gamma random samples"]}),s.jsxs("li",{children:["• ",s.jsx("em",{children:"...and 60+ more distribution functions"})]})]})]}),s.jsxs("div",{children:[s.jsx("h4",{className:"font-medium mb-3",children:"Statistical Tests"}),s.jsxs("ul",{className:"text-sm space-y-1",children:[s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.test.t_test()"})," - One-sample t-test"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.test.tTestIndependent()"})," - Two-sample t-test"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.test.anovaOneWay()"})," - One-way ANOVA"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.test.pearsonTest()"})," - Pearson correlation test"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.test.mannWhitneyTest()"})," - Mann-Whitney U test"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.test.chiSquareTest()"})," - Chi-square test"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.test.shapiroWilkTest()"})," - Normality test"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.test.kruskalWallisTest()"})," - Kruskal-Wallis test"]}),s.jsxs("li",{children:["• ",s.jsx("em",{children:"...and 15+ more statistical tests"})]})]})]})]})})]})]})}export{v as component};
