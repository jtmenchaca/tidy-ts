import{j as e}from"./radix-BuIbRv-a.js";import{C as s}from"./code-block-qUDodC0a.js";import{D as o}from"./DocPageLayout-D23yNU3W.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./card-BOllKCcH.js";import"./index-CW5Q2cxR.js";import"./shiki-themes-BheiPiei.js";const a={basicTranspose:`import { createDataFrame } from "@tidy-ts/dataframe";

const sales = createDataFrame([
  { product: "Widget A", q1: 100, q2: 120, q3: 110, q4: 130 },
  { product: "Widget B", q1: 80, q2: 90, q3: 95, q4: 105 },
]);

// Transpose rows and columns
const transposed = sales.transpose({ number_of_rows: 2 });
console.log("Transposed data:");
transposed.print();`,transposeWithLabels:`// Add custom row labels before transposing
const withLabels = sales.setRowLabels(["widget_a", "widget_b"]);
const labeledTranspose = withLabels.transpose({ number_of_rows: 2 });

console.log("Transposed with custom labels:");
labeledTranspose.print();`,doubleTranspose:`// Double transpose returns to original structure
const backToOriginal = transposed.transpose({ number_of_rows: 2 });
console.log("Double transpose (restored):");
backToOriginal.print();`,mixedDataTypes:`// Transpose works with mixed data types
const mixed = createDataFrame([
  { id: 1, name: "Alice", active: true, score: 95.5 },
  { id: 2, name: "Bob", active: false, score: 87.2 },
]);

const mixedTranspose = mixed.setRowLabels(["user1", "user2"]).transpose({ number_of_rows: 2 });
console.log("Mixed data types transpose:");
mixedTranspose.print();`};function m(){return e.jsxs(o,{title:"Transposing Data",description:"Flip rows and columns to change your data perspective. Perfect for time series analysis, visualization, and preparing data for different analysis tools.",currentPath:"/transposing-data",children:[e.jsx(s,{title:"Basic Transpose",description:"Flip rows and columns with a simple transpose operation",explanation:"Transpose operations flip rows and columns, making it easy to reshape data for different analysis needs. tidy-ts provides reversible transposes with strong type preservation.",code:a.basicTranspose}),e.jsx(s,{title:"Custom Row Labels",description:"Use meaningful row labels instead of generic names",explanation:"You can provide custom row labels to make transposed data more meaningful and easier to work with in subsequent operations. This is especially useful for time series data.",code:a.transposeWithLabels}),e.jsx(s,{title:"Double Transpose (Round-trip)",description:"Transpose operations are perfectly reversible",explanation:"Transpose operations are reversible with perfect data integrity. You can transpose data, perform analysis, and transpose back to the original structure without any data loss.",code:a.doubleTranspose}),e.jsx(s,{title:"Mixed Data Types",description:"Transpose works with any data types including arrays and objects",explanation:"Transpose operations work with any data types including strings, numbers, booleans, and even complex types like arrays and objects. All types are preserved perfectly.",code:a.mixedDataTypes})]})}export{m as component};
