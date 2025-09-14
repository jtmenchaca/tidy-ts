// Code examples for reshaping data
export const reshapingExamples = {
  pivotWider: `import { createDataFrame } from "@tidy-ts/dataframe";

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

salesWide.print("Sales data pivoted to wide format:");`,

  pivotLonger: `// Create student grade data in wide format (one column per subject)
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

gradesLong.print("Student grades melted to long format:");`,

  regionalComparison: `// Create multi-dimensional sales data
const regionalSales = createDataFrame([
  { year: 2023, region: "North", product: "Widget A", sales: 1000 },
  { year: 2023, region: "North", product: "Widget B", sales: 1500 },
  { year: 2023, region: "South", product: "Widget A", sales: 800 },
  { year: 2023, region: "South", product: "Widget B", sales: 1200 },
  { year: 2024, region: "North", product: "Widget A", sales: 1100 },
  { year: 2024, region: "North", product: "Widget B", sales: 1600 },
  { year: 2024, region: "South", product: "Widget A", sales: 900 },
  { year: 2024, region: "South", product: "Widget B", sales: 1300 },
]);

// Pivot by region to compare North vs South sales
const regionComparison = regionalSales.pivotWider({
  names_from: "region",
  values_from: "sales",
  expected_columns: ["North", "South"],
});

regionComparison.print("Sales comparison by region:");`,

  complexReshape: `// Start with wide format student data
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
backToWide.print();`,

  handlingMissingValues: `// Create data with some missing values
const incompleteData = createDataFrame([
  { id: 1, category: "A", value: 10 },
  { id: 2, category: "B", value: 20 },
  { id: 3, category: "A", value: null },
  { id: 4, category: "B", value: 30 },
]);

// Pivot with missing values
const pivoted = incompleteData.pivotWider({
  names_from: "category",
  values_from: "value",
  expected_columns: ["A", "B"],
});

pivoted.print("Data pivoted with missing values handled:");`,
};
