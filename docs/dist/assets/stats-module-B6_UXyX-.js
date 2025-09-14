import{j as e}from"./vega-DaDS7kWN.js";import{C as s}from"./code-block-B9d36udg.js";import{C as i,a as t,b as n,c as l,d as c}from"./card-BE-SfOYi.js";import{D as r}from"./DocPageLayout-r87ErOYz.js";import"./recharts-BW8nexKl.js";import"./shiki-BpdrxAJG.js";import"./shiki-themes-BheiPiei.js";import"./index-CejWlMk4.js";import"./radix-CNB_C82Z.js";const a={basicDescriptiveStats:`import { createDataFrame, stats } from "@tidy-ts/dataframe";

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
console.log("Cumulative max:", cummax);`};function g(){return e.jsxs(r,{title:"Stats Module",description:"Statistical functions for data analysis. The stats module provides 25+ statistical functions with full TypeScript support and optimized performance.",currentPath:"/stats-module",children:[e.jsx(s,{title:"Basic Descriptive Statistics",description:"Essential statistical measures for understanding your data",explanation:"The stats module provides all the descriptive statistics you need for data analysis. All functions are fully typed and optimized for performance.",code:a.basicDescriptiveStats}),e.jsx(s,{title:"Quantiles and Percentiles",description:"Advanced statistical measures for data distribution analysis",explanation:"Quantiles and percentiles help you understand the distribution of your data. They're essential for identifying outliers and understanding data spread.",code:a.quantilesAndPercentiles}),e.jsx(s,{title:"Ranking and Ordering",description:"Rank values and find unique elements",explanation:"Ranking functions help you understand the relative position of values in your dataset. Dense ranking handles ties differently than regular ranking.",code:a.rankingFunctions}),e.jsx(s,{title:"Cumulative Functions",description:"Calculate running totals and cumulative statistics",explanation:"Cumulative functions are essential for time series analysis and understanding how values accumulate over time or sequence.",code:a.cumulativeFunctions}),e.jsx(s,{title:"Window Functions",description:"Lag, lead, and other window operations",explanation:"Window functions are crucial for time series analysis, allowing you to compare values with their neighbors and calculate changes over time.",code:a.mutateWithRanking}),e.jsx(s,{title:"Correlation and Covariance",description:"Measure relationships between variables",explanation:"Correlation and covariance help you understand relationships between variables. They're essential for feature selection and understanding data dependencies.",code:a.cumulativeFunctions}),e.jsxs(i,{children:[e.jsxs(t,{children:[e.jsx(n,{children:"Complete Stats Function Reference"}),e.jsx(l,{children:"All 25+ statistical functions available in the stats module"})]}),e.jsx(c,{children:e.jsxs("div",{className:"grid md:grid-cols-2 gap-6",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-3",children:"Descriptive Statistics"}),e.jsxs("ul",{className:"text-sm space-y-1",children:[e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.sum()"})," - Sum of values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.mean()"})," - Arithmetic mean"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.median()"})," - Median value"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.mode()"})," - Most frequent value"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.stdev()"})," - Standard deviation"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.variance()"})," - Variance"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.min()"})," - Minimum value"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.max()"})," - Maximum value"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.range()"})," - Range (max - min)"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.product()"})," - Product of values"]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-3",children:"Advanced Functions"}),e.jsxs("ul",{className:"text-sm space-y-1",children:[e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.quantile()"})," - Quantiles and percentiles"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.quartiles()"})," - Quartiles [Q25, Q50, Q75]"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.iqr()"})," - Interquartile range"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.percentileRank()"})," - Percentile rank"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.rank()"})," - Ranking values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.denseRank()"})," - Dense ranking"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.unique()"})," - Unique values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.uniqueCount()"})," - Count of unique values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.corr()"})," - Correlation coefficient"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.covariance()"})," - Covariance"]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-3",children:"Cumulative Functions"}),e.jsxs("ul",{className:"text-sm space-y-1",children:[e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.cumsum()"})," - Cumulative sum"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.cumprod()"})," - Cumulative product"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.cummin()"})," - Cumulative minimum"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.cummax()"})," - Cumulative maximum"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.cummean()"})," - Cumulative mean"]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-3",children:"Window & Utility Functions"}),e.jsxs("ul",{className:"text-sm space-y-1",children:[e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.lag()"})," - Lag values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.lead()"})," - Lead values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.round()"})," - Round to decimal places"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.floor()"})," - Floor values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.ceiling()"})," - Ceiling values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.countValue()"})," - Count specific values"]})]})]})]})})]})]})}export{g as component};
