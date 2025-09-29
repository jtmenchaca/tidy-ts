import{j as s}from"./radix-BuIbRv-a.js";import{C as e}from"./code-block-qUDodC0a.js";import{C as a,a as r,b as n,c as o,d as t}from"./card-BOllKCcH.js";import{D as c}from"./DocPageLayout-D23yNU3W.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./shiki-themes-BheiPiei.js";import"./index-CW5Q2cxR.js";const i={basicGroupBy:`import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const people = createDataFrame([
  { id: 1, name: "Luke", species: "Human", mass: 77, height: 172, year: 2023 },
  { id: 2, name: "C-3PO", species: "Droid", mass: 75, height: 167, year: 2023 },
  { id: 3, name: "R2-D2", species: "Droid", mass: 32, height: 96, year: 2023 },
  { id: 4, name: "Darth Vader", species: "Human", mass: 136, height: 202, year: 2024 },
  { id: 5, name: "Chewbacca", species: "Wookiee", mass: 112, height: 228, year: 2024 },
]);

// Basic species analysis
const speciesAnalysis = people
  .groupBy("species")
  .summarise({
    count: (group) => group.nrows(),
    avg_height: (group) => s.round(s.mean(group.height), 1),
    avg_mass: (group) => s.round(s.mean(group.mass), 1),
    max_height: (group) => s.max(group.height),
    min_mass: (group) => s.min(group.mass),
  })
  .arrange("avg_mass", "desc");

speciesAnalysis.print("Species analysis:");`,multipleColumnGrouping:`// Group by multiple columns
const multiGroupAnalysis = people
  .groupBy("species", "year")
  .summarise({
    count: (group) => group.nrows(),
    avg_mass: (group) => s.round(s.mean(group.mass), 1),
    avg_height: (group) => s.round(s.mean(group.height), 1),
    total_mass: (group) => s.sum(group.mass),
  })
  .arrange("species", "year");

multiGroupAnalysis.print("Multi-column grouping analysis:");`,conditionalAggregation:`// Basic aggregation with conditional logic
const basicAnalysis = people
  .groupBy("species")
  .summarise({
    total_count: (group) => group.nrows(),
    heavy_count: (group) => group.filter((row) => row.mass > 100).nrows(),
    avg_mass: (group) => s.round(s.mean(group.mass), 1),
    top_performer: (group) => {
      return group.sliceMax("mass", 1).extractHead("name", 1) || "N/A";
    },
  })
  .arrange("avg_mass", "desc");

basicAnalysis.print("Basic species analysis:");`};function j(){return s.jsxs(c,{title:"Grouping and Aggregation",description:"Group your data and calculate summary statistics. Learn how to split your data into categories and get useful insights.",currentPath:"/grouping-aggregation",children:[s.jsx(e,{title:"Basic groupBy and summarize",description:"Group data by one or more columns and calculate summary statistics",explanation:"groupBy lets you split your data into categories, then calculate summary statistics for each group. Great for understanding patterns and differences across categories.",code:i.basicGroupBy}),s.jsx(e,{title:"Multiple Column Grouping",description:"Group by multiple columns for more detailed analysis",explanation:"You can group by multiple columns to create more detailed breakdowns and see how different factors interact in your data.",code:i.multipleColumnGrouping}),s.jsx(e,{title:"Complex Aggregation Patterns",description:"Complex aggregation with conditional logic and custom calculations",explanation:"You can create complex summary statistics with conditional logic, custom calculations, and derived metrics.",code:i.conditionalAggregation}),s.jsxs(a,{children:[s.jsxs(r,{children:[s.jsx(n,{children:"Common Aggregation Functions"}),s.jsx(o,{children:"Essential functions for group summaries"})]}),s.jsx(t,{children:s.jsxs("div",{className:"grid md:grid-cols-2 gap-4",children:[s.jsxs("div",{children:[s.jsx("h4",{className:"font-medium mb-2",children:"Count and Size"}),s.jsxs("ul",{className:"text-sm space-y-1",children:[s.jsxs("li",{children:["• ",s.jsx("code",{children:"group.nrows()"})," - Number of rows in group"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"group.length"})," - Same as nrows()"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"s.countValue()"})," - Count specific values"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"s.uniqueCount()"})," - Count unique values"]})]})]}),s.jsxs("div",{children:[s.jsx("h4",{className:"font-medium mb-2",children:"Central Tendency"}),s.jsxs("ul",{className:"text-sm space-y-1",children:[s.jsxs("li",{children:["• ",s.jsx("code",{children:"s.mean()"})," - Arithmetic mean"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"s.median()"})," - Median value"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"s.mode()"})," - Most frequent value"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"s.quantile()"})," - Specific quantiles"]})]})]}),s.jsxs("div",{children:[s.jsx("h4",{className:"font-medium mb-2",children:"Spread and Variation"}),s.jsxs("ul",{className:"text-sm space-y-1",children:[s.jsxs("li",{children:["• ",s.jsx("code",{children:"s.stdev()"})," - Standard deviation"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"s.variance()"})," - Variance"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"s.range()"})," - Range (max - min)"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"s.iqr()"})," - Interquartile range"]})]})]}),s.jsxs("div",{children:[s.jsx("h4",{className:"font-medium mb-2",children:"Extremes"}),s.jsxs("ul",{className:"text-sm space-y-1",children:[s.jsxs("li",{children:["• ",s.jsx("code",{children:"s.min()"})," - Minimum value"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"s.max()"})," - Maximum value"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"s.first()"})," - First value"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"s.last()"})," - Last value"]})]})]})]})})]})]})}export{j as component};
