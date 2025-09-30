import{j as e}from"./radix-BuIbRv-a.js";import{C as a}from"./code-block-_BwUP3j2.js";import{D as i}from"./DocPageLayout-CGQ1Zr89.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./card-djngM638.js";import"./index-COi4_aVs.js";import"./shiki-themes-BheiPiei.js";const t={basicBindRows:`import { createDataFrame } from "@tidy-ts/dataframe";

const df1 = createDataFrame([
  { id: 1, name: "Alice", age: 25 },
  { id: 2, name: "Bob", age: 30 },
]);

const df2 = createDataFrame([
  { id: 3, name: "Charlie", age: 35 },
  { id: 4, name: "Diana", age: 28 },
]);

// Combine DataFrames with bindRows
const combined = df1.bindRows(df2);
combined.print("Combined DataFrames:");`,multipleDataFrames:`const df1 = createDataFrame([{ id: 1, name: "Alice" }]);
const df2 = createDataFrame([{ id: 2, name: "Bob" }]);
const df3 = createDataFrame([{ id: 3, name: "Charlie" }]);

// Combine multiple DataFrames at once
const combined = df1.bindRows(df2, df3);
combined.print("Multiple DataFrames combined:");`,differentColumns:`const df1 = createDataFrame([
  { id: 1, name: "Alice", age: 25 },
]);

const df2 = createDataFrame([
  { id: 2, name: "Bob", age: 30, salary: 50000 },
]);

// Handle DataFrames with different columns
const combined = df1.bindRows(df2);
combined.print("Different columns handled:");`,spreadOperator:`const df1 = createDataFrame([{ id: 1, name: "Alice" }]);
const df2 = createDataFrame([{ id: 2, name: "Bob" }]);

// Alternative approach using spread operator
const combined = createDataFrame([...df1, ...df2]);
combined.print("Spread operator combination:");`};function p(){return e.jsxs(i,{title:"Combining DataFrames",description:"Combine data from multiple sources with bindRows and other combining operations. Learn how to merge datasets effectively.",currentPath:"/combining-dataframes",children:[e.jsx(a,{title:"Basic bindRows",description:"Combine two DataFrames by stacking rows",explanation:"bindRows is the main way to combine DataFrames by adding rows from one DataFrame to another. It's great for combining datasets with the same structure.",code:t.basicBindRows}),e.jsx(a,{title:"Multiple DataFrames",description:"Combine multiple DataFrames at once",explanation:"You can combine multiple DataFrames in a single bindRows call. This is more efficient than chaining multiple bindRows operations.",code:t.multipleDataFrames}),e.jsx(a,{title:"Different Columns",description:"Handle DataFrames with different column structures",explanation:"bindRows gracefully handles DataFrames with different columns. It creates a union of all columns, filling missing values with undefined where needed.",code:t.differentColumns}),e.jsx(a,{title:"Spread Operator",description:"Alternative approach using spread operator",explanation:"You can also use the traditional spread operator to combine DataFrames, though bindRows is generally preferred for its clarity and type safety.",code:t.spreadOperator})]})}export{p as component};
