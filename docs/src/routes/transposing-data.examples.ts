// Code examples for transposing data
export const transposingExamples = {
  basicTranspose: `import { createDataFrame } from "@tidy-ts/dataframe";

const sales = createDataFrame([
  { product: "Widget A", q1: 100, q2: 120, q3: 110, q4: 130 },
  { product: "Widget B", q1: 80, q2: 90, q3: 95, q4: 105 },
]);

// Transpose rows and columns
const transposed = sales.transpose({ numberOfRows: 2 });
console.log("Transposed data:");
transposed.print();`,

  transposeWithLabels: `// Add custom row labels before transposing
const withLabels = sales.setRowLabels(["widget_a", "widget_b"]);
const labeledTranspose = withLabels.transpose({ numberOfRows: 2 });

console.log("Transposed with custom labels:");
labeledTranspose.print();`,

  doubleTranspose: `// Double transpose returns to original structure
const backToOriginal = transposed.transpose({ numberOfRows: 2 });
console.log("Double transpose (restored):");
backToOriginal.print();`,

  mixedDataTypes: `// Transpose works with mixed data types
const mixed = createDataFrame([
  { id: 1, name: "Alice", active: true, score: 95.5 },
  { id: 2, name: "Bob", active: false, score: 87.2 },
]);

const mixedTranspose = mixed.setRowLabels(["user1", "user2"]).transpose({ numberOfRows: 2 });
console.log("Mixed data types transpose:");
mixedTranspose.print();`,
};
