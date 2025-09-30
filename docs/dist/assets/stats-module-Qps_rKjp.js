import{j as e}from"./radix-BuIbRv-a.js";import{C as s}from"./code-block-_BwUP3j2.js";import{C as i,a,b as n,c as o,d as r}from"./card-djngM638.js";import{D as l}from"./DocPageLayout-CGQ1Zr89.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./shiki-themes-BheiPiei.js";import"./index-COi4_aVs.js";const t={basicDescriptiveStats:`import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

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
console.log("Max:", s.max(values));`,quantilesAndPercentiles:`const quartiles = s.quartiles(values);
const q25 = s.quantile(values, 0.25);
const q75 = s.quantile(values, 0.75);

console.log("Quartiles [Q25, Q50, Q75]:", quartiles);
console.log("25th percentile:", q25);
console.log("75th percentile:", q75);`,mutateWithRanking:`const withRanking = sampleData
  .mutate({
    value_rank: (row, _index, df) => s.rank(df.value, row.value),
  });

withRanking.print("Data with ranking information:");`,cumulativeFunctions:`const cumsum = s.cumsum(values);
const cummax = s.cummax(values);

console.log("Cumulative sum:", cumsum);
console.log("Cumulative max:", cummax);`,distributionFunctions:`import { s } from "@tidy-ts/dataframe";

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
const chiSquareQuantile = s.dist.chiSquare.quantile({ probability: 0.95, degreesOfFreedom: 1 });`,compareAPI:`import { stats as s } from "@tidy-ts/dataframe";

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
// }`,specificTests:`// If you'd prefer to have the specific test instead, we provide that via the test API as well. 
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
const shapiroWilk = s.test.normality.shapiroWilk(data, 0.05);`,compareAPIReference:`// Here are the various functions that the compare API exposes for use.  
// Each has various options to help both new and experienced users feel confident in what they're getting.
s.compare.oneGroup.centralTendency.toValue(...)
s.compare.oneGroup.proportions.toValue(...)
s.compare.oneGroup.distribution.toNormal(...)
s.compare.twoGroups.centralTendency.toEachOther(...)
s.compare.twoGroups.association.toEachOther(...)
s.compare.twoGroups.proportions.toEachOther(...)
s.compare.twoGroups.distributions.toEachOther(...)
s.compare.multiGroups.centralTendency.toEachOther(...)
s.compare.multiGroups.proportions.toEachOther(...)`,importOptions:`// Option 1: Import with full name for clarity
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
// - Statistical tests: stats.test.t.oneSample, stats.test.anova.oneWay, etc.`};function f(){return e.jsxs(l,{title:"Statistical Analysis",description:"Tidy-TS provides a statistical toolkit with 80+ functions across descriptive stats, hypothesis testing, and probability distributions.",currentPath:"/stats-module",children:[e.jsxs("section",{className:"space-y-6",children:[e.jsx("div",{className:"mb-2",children:e.jsx("h2",{className:"text-xl font-semibold text-muted-foreground mb-4",children:"Descriptive Statistics"})}),e.jsx(s,{title:"Basic Descriptive Statistics",description:"Essential statistical measures for understanding your data",explanation:"The stats module provides all the descriptive statistics you need: mean(), median(), mode(), stdev(), variance(), min(), max(), range()",code:t.basicDescriptiveStats}),e.jsx(s,{title:"Quantiles and Percentiles",description:"Statistical measures for data distribution analysis",explanation:"Quantile and ranking functions: quantile(), percentileRank(), iqr(), quartiles(), rank(), denseRank(), percentileRank()",code:t.quantilesAndPercentiles}),e.jsx(s,{title:"Cumulative Functions",description:"Calculate running totals and cumulative statistics",explanation:"Cumulative operations for time series: cumsum(), cummean(), cummin(), cummax(), cumprod()",code:t.cumulativeFunctions}),e.jsx(s,{title:"Window Functions",description:"Lag, lead, and other window operations",explanation:"Window functions for time series analysis: lag(), lead()",code:t.mutateWithRanking})]}),e.jsxs("section",{className:"space-y-6 mt-12",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-xl font-semibold text-muted-foreground mb-3",children:"Probability Distributions"}),e.jsxs("p",{className:"text-sm text-muted-foreground mb-6",children:["16 probability distributions with functions for random values, density, probability, quantile, and data generation.",e.jsx("br",{}),e.jsxs("span",{className:"inline-block mt-1",children:[e.jsx("strong",{children:"Continuous:"})," normal, beta, gamma, exponential, chi-square, t, F, uniform, Weibull, log-normal, Wilcoxon"]}),e.jsx("br",{}),e.jsxs("span",{className:"inline-block mt-1",children:[e.jsx("strong",{children:"Discrete:"})," binomial, Poisson, geometric, negative binomial, hypergeometric"]})]})]}),e.jsx(s,{title:"Probability Distribution Functions",description:"Individual distribution functions for statistical analysis",explanation:"Each distribution provides random(), density(), probability(), and quantile() functions. You can also generate distribution data for visualization.",code:t.distributionFunctions})]}),e.jsxs("section",{className:"space-y-6 mt-12",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-xl font-semibold text-muted-foreground mb-3",children:"Hypothesis Testing"}),e.jsx("p",{className:"text-sm text-muted-foreground mb-6",children:"Comprehensive statistical tests with two approaches: a custom-designed Compare API that guides you to the right test, and direct access to specific tests. All tests are rigorously validated against R."})]}),e.jsx(s,{title:"Compare API - Intuitive Statistical Comparisons",description:"Custom-designed API to help you perform the analysis best suited to your needs",explanation:"All tests available are rigorously vetted against results in R using testing against randomly generated data. The Compare API guides you to the right statistical test with descriptive function names and helpful options.",code:t.compareAPI}),e.jsx(s,{title:"Available Compare API Functions",description:"Complete reference of comparison functions available",explanation:"Each function has various options to help both new and experienced users feel confident in what they're getting.",code:t.compareAPIReference}),e.jsx(s,{title:"Specific Test API",description:"Direct access to specific statistical tests if you prefer",explanation:"If you'd prefer to have the specific test instead, we provide that via the test API as well. All tests return detailed, typed results.",code:t.specificTests})]}),e.jsx("section",{className:"mt-12",children:e.jsx(s,{title:"Import Options",description:"Flexible import patterns for different coding styles",explanation:"Import as 'stats' for clarity or 's' for brevity. Both provide access to the same statistical functionality.",code:t.importOptions})}),e.jsxs(i,{className:"mt-12",children:[e.jsxs(a,{children:[e.jsx(n,{children:"Function Reference"}),e.jsx(o,{children:"Complete list of 80+ statistical functions organized by category"})]}),e.jsx(r,{children:e.jsxs("div",{className:"grid md:grid-cols-3 gap-6",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-3",children:"Descriptive Statistics"}),e.jsxs("ul",{className:"text-sm space-y-1",children:[e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.sum()"})," - Sum of values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.mean()"})," - Arithmetic mean"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.median()"})," - Median value"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.mode()"})," - Most frequent value"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.stdev()"})," - Standard deviation"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.variance()"})," - Variance"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.min()"})," - Minimum value"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.max()"})," - Maximum value"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.range()"})," - Range (max - min)"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.product()"})," - Product of values"]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-3",children:"Statistical Functions"}),e.jsxs("ul",{className:"text-sm space-y-1",children:[e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.quantile()"})," - Quantiles and percentiles"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.quartiles()"})," - Quartiles [Q25, Q50, Q75]"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.iqr()"})," - Interquartile range"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.percentileRank()"})," - Percentile rank"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.rank()"})," - Ranking values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.denseRank()"})," - Dense ranking"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.unique()"})," - Unique values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.uniqueCount()"})," - Count of unique values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.corr()"})," - Correlation coefficient"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.covariance()"})," - Covariance"]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-3",children:"Cumulative Functions"}),e.jsxs("ul",{className:"text-sm space-y-1",children:[e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.cumsum()"})," - Cumulative sum"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.cumprod()"})," - Cumulative product"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.cummin()"})," - Cumulative minimum"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.cummax()"})," - Cumulative maximum"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.cummean()"})," - Cumulative mean"]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-3",children:"Window & Utility Functions"}),e.jsxs("ul",{className:"text-sm space-y-1",children:[e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.lag()"})," - Lag values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.lead()"})," - Lead values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.round()"})," - Round to decimal places"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.floor()"})," - Floor values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.ceiling()"})," - Ceiling values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.countValue()"})," - Count specific values"]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-3",children:"Distribution Functions"}),e.jsxs("ul",{className:"text-sm space-y-1",children:[e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.dist.normal.density()"})," - Normal density"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.dist.normal.probability()"})," - Normal CDF"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.dist.normal.quantile()"})," - Normal quantiles"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.dist.normal.random()"})," - Normal random samples"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.dist.beta.density()"})," - Beta density"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.dist.beta.random()"})," - Beta random samples"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.dist.gamma.density()"})," - Gamma density"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.dist.binomial.random()"})," - Binomial random samples"]}),e.jsxs("li",{children:["• ",e.jsx("em",{children:"...16 distributions × 4 functions each = 64 functions"})]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-3",children:"Statistical Tests"}),e.jsxs("ul",{className:"text-sm space-y-1",children:[e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.test.t.oneSample()"})," - One-sample t-test"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.test.t.independent()"})," - Two-sample t-test"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.test.anova.oneWay()"})," - One-way ANOVA"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.test.correlation.pearson()"})," - Pearson correlation test"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.test.nonparametric.mannWhitney()"})," - Mann-Whitney U test"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.test.categorical.chiSquare()"})," - Chi-square test"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.test.normality.shapiroWilk()"})," - Normality test"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"s.test.nonparametric.kruskalWallis()"})," - Kruskal-Wallis test"]}),e.jsxs("li",{children:["• ",e.jsx("em",{children:"...8 categories with 20+ statistical tests"})]})]})]})]})})]})]})}export{f as component};
