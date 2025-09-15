import{j as a}from"./radix-BuIbRv-a.js";import{C as e}from"./code-block-BI5ZJb3a.js";import{D as n}from"./DocPageLayout-CubtEZbD.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./card-BQg-nQJZ.js";import"./index-Cq5Y5JWB.js";import"./shiki-themes-BheiPiei.js";const t={nullUndefinedSupport:`import { createDataFrame } from "@tidy-ts/dataframe";

// DataFrames naturally support null and undefined values
const data = createDataFrame([
  { id: 1, name: "Alice", age: 25, score: 85 },
  { id: 2, name: null, age: 30, score: undefined },
  { id: 3, name: "Charlie", age: null, score: 92 },
]);

data.print("Data with null and undefined values:");`,statsDefaultBehavior:`import { createDataFrame } from "@tidy-ts/dataframe";
import { sum, mean, max } from "@tidy-ts/dataframe";

const data = createDataFrame([
  { id: 1, value: 10 },
  { id: 2, value: null },
  { id: 3, value: 20 },
  { id: 4, value: undefined },
]);

// By default, stats functions return null when NA values are present
const total = sum(data.value);
const average = mean(data.value);
const maximum = max(data.value);

console.log("Default behavior (with NA values):");
console.log("Sum:", total);        // null
console.log("Mean:", average);     // null  
console.log("Max:", maximum);      // null`,removeNaOption:`import { createDataFrame } from "@tidy-ts/dataframe";
import { sum, mean, max } from "@tidy-ts/dataframe";

const data = createDataFrame([
  { id: 1, value: 10 },
  { id: 2, value: null },
  { id: 3, value: 20 },
  { id: 4, value: undefined },
]);

// Use remove_na: true to ignore NA values
const total = sum(data.value, true);
const average = mean(data.value, true);
const maximum = max(data.value, true);

console.log("With remove_na: true:");
console.log("Sum:", total);        // 30 (10 + 20)
console.log("Mean:", average);     // 15 ((10 + 20) / 2)
console.log("Max:", maximum);      // 20`,replaceNAWithDefaults:`import { createDataFrame } from "@tidy-ts/dataframe";

const messyData = createDataFrame([
  { id: 1, name: "Alice", age: 25, score: 85 },
  { id: 2, name: null, age: 30, score: null },
  { id: 3, name: "Charlie", age: null, score: 92 },
]);

// Replace missing values with defaults
const cleaned = messyData.replaceNA({
  name: "Unknown",
  age: 0,
  score: -1,
});

cleaned.print("After replaceNA:");`};function c(){return a.jsxs(n,{title:"Missing Data Handling",description:"How tidy-ts handles null and undefined values, including stats functions with remove_na option and data replacement strategies.",currentPath:"/missing-data",children:[a.jsx(e,{title:"Null and Undefined Support",description:"tidy-ts naturally supports null and undefined values",explanation:"DataFrames can contain null and undefined values in any column. These are treated as missing data (NA) and handled appropriately by all operations.",code:t.nullUndefinedSupport}),a.jsx(e,{title:"Stats Functions Default Behavior",description:"Statistical functions return null when NA values are present",explanation:"By default, statistical functions like sum, mean, max, etc. return null when any NA values are present in the data. This preserves data integrity.",code:t.statsDefaultBehavior}),a.jsx(e,{title:"Using remove_na Option",description:"Ignore NA values in statistical calculations",explanation:"Set remove_na: true to calculate statistics on only the valid (non-NA) values. This is useful when you want to analyze available data despite missing values.",code:t.removeNaOption}),a.jsx(e,{title:"Replace Missing Values",description:"Replace NA values with defaults using replaceNA",explanation:"Use replaceNA to replace missing values with specific defaults. This is useful for data cleaning and preparation before analysis.",code:t.replaceNAWithDefaults})]})}export{c as component};
