import{j as s}from"./vega-DaDS7kWN.js";import{C as e}from"./code-block-DNrkRg0G.js";import{C as i,a as t,b as r,c as n,d as o}from"./card-BHRuJ_3B.js";import{D as c}from"./DocPageLayout-DA3oHHtz.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./shiki-themes-BheiPiei.js";import"./index-Bn-fflGs.js";import"./radix-CNB_C82Z.js";const a={basicGroupBy:`import { createDataFrame, stats } from "@tidy-ts/dataframe";

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
    avg_height: (group) => stats.round(stats.mean(group.height), 1),
    avg_mass: (group) => stats.round(stats.mean(group.mass), 1),
    max_height: (group) => stats.max(group.height),
    min_mass: (group) => stats.min(group.mass),
  })
  .arrange("avg_mass", "desc");

speciesAnalysis.print("Species analysis:");`,multipleColumnGrouping:`// Group by multiple columns
const multiGroupAnalysis = people
  .groupBy("species", "year")
  .summarise({
    count: (group) => group.nrows(),
    avg_mass: (group) => stats.round(stats.mean(group.mass), 1),
    avg_height: (group) => stats.round(stats.mean(group.height), 1),
    total_mass: (group) => stats.sum(group.mass),
  })
  .arrange("species", "year");

multiGroupAnalysis.print("Multi-column grouping analysis:");`,conditionalAggregation:`// Basic aggregation with conditional logic
const basicAnalysis = people
  .groupBy("species")
  .summarise({
    total_count: (group) => group.nrows(),
    heavy_count: (group) => group.filter((row) => row.mass > 100).nrows(),
    avg_mass: (group) => stats.round(stats.mean(group.mass), 1),
    top_performer: (group) => {
      return group.sliceMax("mass", 1).extractHead("name", 1) || "N/A";
    },
  })
  .arrange("avg_mass", "desc");

basicAnalysis.print("Basic species analysis:");`};function y(){return s.jsxs(c,{title:"Grouping and Aggregation",description:"Group your data and calculate summary statistics. Learn how to split your data into categories and get useful insights.",currentPath:"/grouping-aggregation",children:[s.jsx(e,{title:"Basic groupBy and summarize",description:"Group data by one or more columns and calculate summary statistics",explanation:"groupBy lets you split your data into categories, then calculate summary statistics for each group. Great for understanding patterns and differences across categories.",code:a.basicGroupBy}),s.jsx(e,{title:"Multiple Column Grouping",description:"Group by multiple columns for more detailed analysis",explanation:"You can group by multiple columns to create more detailed breakdowns and see how different factors interact in your data.",code:a.multipleColumnGrouping}),s.jsx(e,{title:"Advanced Aggregation Patterns",description:"Complex aggregation with conditional logic and custom calculations",explanation:"You can create complex summary statistics with conditional logic, custom calculations, and derived metrics.",code:a.conditionalAggregation}),s.jsxs(i,{children:[s.jsxs(t,{children:[s.jsx(r,{children:"Common Aggregation Functions"}),s.jsx(n,{children:"Essential functions for group summaries"})]}),s.jsx(o,{children:s.jsxs("div",{className:"grid md:grid-cols-2 gap-4",children:[s.jsxs("div",{children:[s.jsx("h4",{className:"font-medium mb-2",children:"Count and Size"}),s.jsxs("ul",{className:"text-sm space-y-1",children:[s.jsxs("li",{children:["• ",s.jsx("code",{children:"group.nrows()"})," - Number of rows in group"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"group.length"})," - Same as nrows()"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.countValue()"})," - Count specific values"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.uniqueCount()"})," - Count unique values"]})]})]}),s.jsxs("div",{children:[s.jsx("h4",{className:"font-medium mb-2",children:"Central Tendency"}),s.jsxs("ul",{className:"text-sm space-y-1",children:[s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.mean()"})," - Arithmetic mean"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.median()"})," - Median value"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.mode()"})," - Most frequent value"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.quantile()"})," - Specific quantiles"]})]})]}),s.jsxs("div",{children:[s.jsx("h4",{className:"font-medium mb-2",children:"Spread and Variation"}),s.jsxs("ul",{className:"text-sm space-y-1",children:[s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.stdev()"})," - Standard deviation"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.variance()"})," - Variance"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.range()"})," - Range (max - min)"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.iqr()"})," - Interquartile range"]})]})]}),s.jsxs("div",{children:[s.jsx("h4",{className:"font-medium mb-2",children:"Extremes"}),s.jsxs("ul",{className:"text-sm space-y-1",children:[s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.min()"})," - Minimum value"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.max()"})," - Maximum value"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.first()"})," - First value"]}),s.jsxs("li",{children:["• ",s.jsx("code",{children:"stats.last()"})," - Last value"]})]})]})]})})]})]})}export{y as component};
