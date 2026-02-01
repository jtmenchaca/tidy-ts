// Code examples for missing data handling
export const missingDataExamples = {
  nullUndefinedSupport: `import { createDataFrame } from "@tidy-ts/dataframe";

// DataFrames naturally support null and undefined values
const data = createDataFrame([
  { id: 1, name: "Alice", age: 25, score: 85 },
  { id: 2, name: null, age: 30, score: undefined },
  { id: 3, name: "Charlie", age: null, score: 92 },
]);

data.print("Data with null and undefined values:");`,

  statsDefaultBehavior:
    `import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const data = createDataFrame([
  { id: 1, value: 10 },
  { id: 2, value: null },
  { id: 3, value: 20 },
  { id: 4, value: undefined },
]);

// By default, stats functions return null when NA values are present
const total = s.sum(data.value);
const average = s.mean(data.value);
const maximum = s.max(data.value);

console.log("Default behavior (with NA values):");
console.log("Sum:", total);        // null
console.log("Mean:", average);     // null  
console.log("Max:", maximum);      // null`,

  removeNaOption:
    `import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const data = createDataFrame([
  { id: 1, value: 10 },
  { id: 2, value: null },
  { id: 3, value: 20 },
  { id: 4, value: undefined },
]);

// Use removeNull and removeUndefined to ignore null and undefined values
const total = s.sum(data.value, { removeNull: true, removeUndefined: true });
const average = s.mean(data.value, { removeNull: true, removeUndefined: true });
const maximum = s.max(data.value, { removeNull: true, removeUndefined: true });

console.log("With removeNull/removeUndefined: true:");
console.log("Sum:", total);        // 30 (10 + 20)
console.log("Mean:", average);     // 15 ((10 + 20) / 2)
console.log("Max:", maximum);      // 20`,

  replaceWithDefaults: `import { createDataFrame } from "@tidy-ts/dataframe";

const messyData = createDataFrame([
  { id: 1, name: "Alice", age: 25, score: 85 },
  { id: 2, name: null, age: 30, score: null },
  { id: 3, name: "Charlie", age: null, score: 92 },
]);

// Replace null and undefined with defaults (chain replaceNull and replaceUndefined)
const cleaned = messyData
  .replaceNull({ name: "Unknown", age: 0, score: -1 })
  .replaceUndefined({ name: "Unknown", age: 0, score: -1 });

cleaned.print("After replaceNull/replaceUndefined:");`,
};
