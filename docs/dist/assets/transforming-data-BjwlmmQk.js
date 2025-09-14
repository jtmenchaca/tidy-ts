import{j as e}from"./vega-DaDS7kWN.js";import{C as s}from"./code-block-DiQW49M1.js";import{C as t,a as i,b as n,c as r,d as c}from"./card-DEO3CS5P.js";import{D as l}from"./DocPageLayout-CfKsBfK4.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./shiki-themes-BheiPiei.js";import"./index-CMR82d_W.js";import"./radix-CNB_C82Z.js";const a={basicMutate:`import { createDataFrame, stats } from "@tidy-ts/dataframe";

const people = createDataFrame([
  { id: 1, name: "Luke", species: "Human", mass: 77, height: 172 },
  { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167 },
  { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96 },
  { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202 },
  { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228 },
]);

// Add a single calculated column
const withBmi = people
  .mutate({
    bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
  });

withBmi.print("Added BMI column:");`,mutateWithParameters:`// The mutate function provides three parameters:
const withParameters = people
  .mutate({
    // row: Access current row's values
    bmi: (row) => row.mass / Math.pow(row.height / 100, 2),
    
    // index: Get the current row's position (0-based)
    in_first_half: (_row, index, df) => index < df.nrows() / 2,
    
    // df: Access the entire DataFrame for calculations across all rows
    is_above_average: (row, _index, df) => row.mass > stats.mean(df.mass)
  });

withParameters.print("Using all three parameters:");`,chainingMutate:`// When intermediate values are needed, you can always chain multiple mutate calls
const chainedExample = people
  .mutate({
    doubleMass: (row) => row.mass * 2,
  })
  .mutate({
    quadrupleMass: (row) => row.doubleMass * 2, // Now doubleMass exists
  })
  .mutate({
    massRatio: (row) => row.quadrupleMass / row.mass,
  });

chainedExample.print("Chained mutate operations:");`,usingStatsFunctions:`// Use the stats module for advanced calculations
const withStats = people
  .mutate({
    // Calculate z-score for mass
    mass_zscore: (row, _index, df) => {
      const mean = stats.mean(df.mass);
      const std = stats.stdev(df.mass);
      return stats.round((row.mass - mean) / std, 3);
    },
    
    // Calculate percentile rank
    mass_percentile: (row, _index, df) => {
      return stats.round(stats.percentileRank(df.mass, row.mass), 1);
    },
    
    // Use cumulative functions
    cumulative_mass: (_row, index, df) => stats.cumsum(df.mass)[index],
  });

withStats.print("Added columns using stats functions:");`};function d(){return e.jsxs(t,{children:[e.jsxs(i,{children:[e.jsx(n,{children:"Stats Module Reference"}),e.jsx(r,{children:"Comprehensive statistical functions available in mutate operations"})]}),e.jsx(c,{children:e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Basic Statistics"}),e.jsxs("ul",{className:"text-sm space-y-1",children:[e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.sum()"})," - Sum of values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.mean()"})," - Arithmetic mean"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.median()"})," - Median value"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.mode()"})," - Most frequent value"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.min()"})," - Minimum value"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.max()"})," - Maximum value"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.product()"})," - Product of values"]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Spread & Distribution"}),e.jsxs("ul",{className:"text-sm space-y-1",children:[e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.range()"})," - Range (max - min)"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.variance()"})," - Variance"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.stdev()"})," - Standard deviation"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.iqr()"})," - Interquartile range"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.quantile()"})," ","- Quantiles and percentiles"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.quartiles()"})," ","- First, second, third quartiles"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.percentileRank()"})," - Percentile rank"]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Advanced Functions"}),e.jsxs("ul",{className:"text-sm space-y-1",children:[e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.rank()"})," - Ranking values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.denseRank()"})," - Dense ranking"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.cumsum()"})," - Cumulative sum"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.cummean()"})," - Cumulative mean"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.cumprod()"})," - Cumulative product"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.cummin()"})," - Cumulative minimum"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.cummax()"})," - Cumulative maximum"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.lag()"})," - Lag values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.lead()"})," - Lead values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.normalize()"})," - Normalize values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.round()"})," - Round to decimal places"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.floor()"})," - Floor values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.ceiling()"})," - Ceiling values"]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Bivariate Statistics"}),e.jsxs("ul",{className:"text-sm space-y-1",children:[e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.covariance()"})," - Covariance"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.corr()"})," - Correlation coefficient"]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Count & Unique"}),e.jsxs("ul",{className:"text-sm space-y-1",children:[e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.unique()"})," - Unique values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.uniqueCount()"})," ","- Count of unique values"]}),e.jsxs("li",{children:["• ",e.jsx("code",{children:"stats.countValue()"})," - Count specific value"]})]})]})]})})]})}function w(){return e.jsxs(l,{title:"Transforming Data with mutate()",description:"The mutate() function is your primary tool for adding calculated columns and transforming data. Learn everything from basic calculations to advanced async operations.",currentPath:"/transforming-data",children:[e.jsx(s,{title:"Basic Mutate",description:"Let's start with the simplest case: adding one calculated column",explanation:"The mutate() function adds new columns to your DataFrame. Each key becomes a column name, and the value is a function that uses the current row.",code:a.basicMutate}),e.jsx(s,{title:"More than just the current row",description:"You're not just limited to the current row. You can also use the index (i.e. row number) and the entire DataFrame to help you calculate the new column.",explanation:"row: Current row's data • index: Row position (0-based) • df: Entire DataFrame",code:a.mutateWithParameters}),e.jsx(s,{title:"Chaining Mutate Operations",description:"Different approaches for handling dependent calculations",code:a.chainingMutate}),e.jsx(s,{title:"Using Stats Functions",description:"Leverage the comprehensive stats module for advanced calculations",explanation:"The stats module provides 25+ statistical functions including mean, median, standard deviation, quantiles, ranking, and more. All functions are fully typed and optimized for performance.",code:a.usingStatsFunctions}),e.jsxs(t,{children:[e.jsxs(i,{children:[e.jsx(n,{children:"Async Operations"}),e.jsx(r,{children:"Handle asynchronous operations seamlessly with full type safety"})]}),e.jsxs(c,{children:[e.jsx("p",{className:"mb-4",children:"tidy-ts supports asynchronous operations across all functions including mutate(), filter(), groupBy().summarise(), and more. Async operations are automatically handled with proper concurrency control and retry mechanisms."}),e.jsxs("p",{className:"text-sm text-blue-600 dark:text-blue-400",children:["📖 ",e.jsx("strong",{children:"Learn more:"})," See the"," ",e.jsx("a",{href:"/async-operations",className:"underline hover:no-underline",children:"Async Operations"})," ","page for comprehensive examples and advanced patterns."]})]})]}),e.jsx(d,{})]})}export{w as component};
