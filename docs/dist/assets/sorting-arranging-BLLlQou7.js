import{j as e}from"./radix-BuIbRv-a.js";import{C as r}from"./code-block-B7aOnjQg.js";import{C as t,a as s,b as n,c as o,d as i}from"./card--XqZNj_C.js";import{D as c}from"./DocPageLayout-nEFeHVMt.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./shiki-themes-BheiPiei.js";import"./index-jU-cbpu9.js";const a={basicSorting:`import { createDataFrame } from "@tidy-ts/dataframe";

const students = createDataFrame([
  { id: 1, name: "Charlie", age: 35, score: 78 },
  { id: 2, name: "Alice", age: 25, score: 85 },
  { id: 3, name: "Bob", age: 30, score: 92 },
]);

// Sort by age (ascending by default)
const sortedByAge = students.arrange("age");
sortedByAge.print("Students sorted by age (youngest first):");

// Sort by score in descending order
const sortedByScore = students.arrange("score", "desc");
sortedByScore.print("Students sorted by score (highest first):");`,multiColumnSorting:`const employees = createDataFrame([
  { id: 1, name: "Alice", age: 25, score: 85, department: "Engineering" },
  { id: 2, name: "Bob", age: 30, score: 92, department: "Marketing" },
  { id: 3, name: "Charlie", age: 25, score: 78, department: "Engineering" },
  { id: 4, name: "Diana", age: 30, score: 88, department: "Marketing" },
]);

// Sort by department first, then by score descending within each department
const sorted = employees
  .arrange("department", "asc")
  .arrange("score", "desc");

sorted.print("Employees sorted by department, then by score:");`,sortingWithCalculatedValues:`const grades = createDataFrame([
  { id: 1, name: "Alice", math: 85, science: 90, english: 80 },
  { id: 2, name: "Bob", math: 92, science: 88, english: 95 },
  { id: 3, name: "Charlie", math: 78, science: 85, english: 90 },
]);

// Calculate average grade and sort by it
const withAverage = grades
  .mutate({
    average: (row) => (row.math + row.science + row.english) / 3,
  })
  .arrange("average", "desc");

withAverage.print("Students ranked by average grade:");`,findingTopPerformers:`const sales = createDataFrame([
  { id: 1, name: "Alice", region: "North", sales: 50000 },
  { id: 2, name: "Bob", region: "South", sales: 75000 },
  { id: 3, name: "Charlie", region: "North", sales: 60000 },
  { id: 4, name: "Diana", region: "East", sales: 80000 },
]);

// Find top 2 performers
const topPerformers = sales
  .arrange("sales", "desc")
  .sliceHead(2);

topPerformers.print("Top 2 sales performers:");

// Find best performer in each region
const bestByRegion = sales
  .groupBy("region")
  .summarise({
    top_sales: (group) => group.sliceMax("sales", 1).extractHead("name", 1) || "N/A",
    max_sales: (group) => group.sliceMax("sales", 1).extractHead("sales", 1) || 0,
  })
  .arrange("max_sales", "desc");

bestByRegion.print("Best performer by region:");`,stringSorting:`const products = createDataFrame([
  { id: 1, name: "Charlie", category: "Zebra", price: 15.99 },
  { id: 2, name: "Alice", category: "Apple", price: 2.50 },
  { id: 3, name: "Bob", category: "Banana", price: 1.25 },
]);

// Sort by name alphabetically
const sortedByName = products.arrange("name");
sortedByName.print("Products sorted by name:");

// Sort by category alphabetically
const sortedByCategory = products.arrange("category");
sortedByCategory.print("Products sorted by category:");

// Sort by price (numeric)
const sortedByPrice = products.arrange("price");
sortedByPrice.print("Products sorted by price:");`};function b(){return e.jsxs(c,{title:"Sorting and Arranging Data",description:"Sort your data to understand patterns, find extremes, and organize information for better analysis. tidy-ts provides flexible sorting with full type safety.",currentPath:"/sorting-arranging",children:[e.jsx(r,{title:"Basic Sorting",description:"Sort by a single column in ascending or descending order",explanation:"The arrange() function sorts your DataFrame by one or more columns. By default, sorting is ascending, but you can specify 'desc' for descending order.",code:a.basicSorting}),e.jsx(r,{title:"Multiple Column Sorting",description:"Sort by multiple columns with different orders",explanation:"You can sort by multiple columns by passing an array. The DataFrame will be sorted by the first column, then by the second column within groups of equal values in the first column, and so on.",code:a.multiColumnSorting}),e.jsx(r,{title:"Sorting with Calculated Values",description:"Sort by values calculated from existing columns",explanation:"You can sort by any column, including calculated ones. This is particularly useful for finding the highest or lowest values after performing transformations.",code:a.sortingWithCalculatedValues}),e.jsxs(t,{children:[e.jsxs(s,{children:[e.jsx(n,{children:"Sorting Patterns"}),e.jsx(o,{children:"Common sorting patterns and use cases"})]}),e.jsx(i,{children:e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Finding Extremes"}),e.jsx(r,{code:a.findingTopPerformers})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-medium mb-2",children:"Categorical Sorting"}),e.jsx(r,{code:a.stringSorting})]})]})})]})]})}export{b as component};
