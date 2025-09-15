import{j as e}from"./radix-BuIbRv-a.js";import{C as t}from"./code-block-B0XYfMng.js";import{D as a}from"./DocPageLayout-CwA4bbf5.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./card-BIm9p5cD.js";import"./index-BVriQQBm.js";import"./shiki-themes-BheiPiei.js";const o={pivotWider:`import { createDataFrame } from "@tidy-ts/dataframe";

// Create sales data in long format (one row per product per quarter)
const salesLong = createDataFrame([
  { year: 2023, quarter: "Q1", product: "Widget A", sales: 1000 },
  { year: 2023, quarter: "Q1", product: "Widget B", sales: 1500 },
  { year: 2023, quarter: "Q2", product: "Widget A", sales: 1200 },
  { year: 2023, quarter: "Q2", product: "Widget B", sales: 1800 },
]);

// Pivot to wide format (one row per quarter, columns for each product)
const salesWide = salesLong.pivotWider({
  names_from: "product",
  values_from: "sales",
  expected_columns: ["Widget A", "Widget B"],
});

salesWide.print("Sales data pivoted to wide format:");`,pivotLonger:`// Create student grade data in wide format (one column per subject)
const gradesWide = createDataFrame([
  { id: 1, name: "Alice", math: 85, science: 92, english: 78 },
  { id: 2, name: "Bob", math: 90, science: 88, english: 85 },
  { id: 3, name: "Charlie", math: 78, science: 95, english: 92 },
]);

// Melt to long format (one row per student per subject)
const gradesLong = gradesWide.pivotLonger({
  cols: ["math", "science", "english"],
  names_to: "subject",
  values_to: "score",
});

gradesLong.print("Student grades melted to long format:");`,complexReshape:`// Start with wide format student data
const studentData = createDataFrame([
  { id: 1, name: "Alice", math: 85, science: 92, english: 78 },
  { id: 2, name: "Bob", math: 90, science: 88, english: 85 },
]);

console.log("Original wide format:");
studentData.print();

// First melt to long format
const longFormat = studentData.pivotLonger({
  cols: ["math", "science", "english"],
  names_to: "subject",
  values_to: "score",
});

console.log("After melting to long format:");
longFormat.print();

// Then pivot back to wide with different structure
const backToWide = longFormat.pivotWider({
  names_from: "subject",
  values_from: "score",
  expected_columns: ["math", "science", "english"],
});

console.log("After pivoting back to wide format:");
backToWide.print();`};function m(){return e.jsxs(a,{title:"Reshaping Data",description:"Transform your data between long and wide formats with pivot operations and transpose data for different analysis needs. Learn how to reshape data effectively.",currentPath:"/reshaping-data",children:[e.jsx(t,{title:"Pivot Wider (Long to Wide)",description:"Convert long format data to wide format with products as columns",explanation:"pivotWider transforms long format data to wide format, making it easier to compare values across categories and prepare data for analysis or visualization.",code:o.pivotWider}),e.jsx(t,{title:"Pivot Longer (Wide to Long)",description:"Convert wide format data to long format for analysis",explanation:"pivotLonger (also called 'melting') converts wide format data to long format, which is often required for statistical analysis and visualization libraries.",code:o.pivotLonger}),e.jsx(t,{title:"Basic Transpose",description:"Flip rows and columns for different analysis perspectives",explanation:"Transpose operations flip rows and columns, making it easy to reshape data for different analysis needs. tidy-ts provides reversible transposes with strong type preservation.",code:o.pivotWider}),e.jsx(t,{title:"Transpose with Custom Labels",description:"Use meaningful row labels instead of generic names",explanation:"You can provide custom row labels to make transposed data more meaningful and easier to work with in subsequent operations.",code:o.pivotLonger}),e.jsx(t,{title:"Double Transpose (Round-trip)",description:"Transpose operations are perfectly reversible",explanation:"Transpose operations are reversible with perfect data integrity. You can transpose data, perform analysis, and transpose back to the original structure.",code:o.complexReshape})]})}export{m as component};
