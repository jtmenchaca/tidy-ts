// Code examples for combining DataFrames
export const combiningExamples = {
  basicBindRows: `import { createDataFrame } from "@tidy-ts/dataframe";

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
combined.print("Combined DataFrames:");`,

  multipleDataFrames: `const df1 = createDataFrame([{ id: 1, name: "Alice" }]);
const df2 = createDataFrame([{ id: 2, name: "Bob" }]);
const df3 = createDataFrame([{ id: 3, name: "Charlie" }]);

// Combine multiple DataFrames at once
const combined = df1.bindRows(df2, df3);
combined.print("Multiple DataFrames combined:");`,

  differentColumns: `const df1 = createDataFrame([
  { id: 1, name: "Alice", age: 25 },
]);

const df2 = createDataFrame([
  { id: 2, name: "Bob", age: 30, salary: 50000 },
]);

// Handle DataFrames with different columns
const combined = df1.bindRows(df2);
combined.print("Different columns handled:");`,

  spreadOperator: `const df1 = createDataFrame([{ id: 1, name: "Alice" }]);
const df2 = createDataFrame([{ id: 2, name: "Bob" }]);

// Alternative approach using spread operator
const combined = createDataFrame([...df1, ...df2]);
combined.print("Spread operator combination:");`,
};
