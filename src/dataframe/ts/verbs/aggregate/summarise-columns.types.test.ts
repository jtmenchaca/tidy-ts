import { createDataFrame, type DataFrame, stats } from "@tidy-ts/dataframe";

// Test data
const testData = createDataFrame([
  { name: "Alice", age: 25, score1: 85, score2: 90, score3: 88, team: "A" },
  { name: "Bob", age: 30, score1: 92, score2: 88, score3: 95, team: "B" },
  { name: "Charlie", age: 28, score1: 78, score2: 85, score3: 82, team: "A" },
  { name: "Diana", age: 35, score1: 95, score2: 92, score3: 90, team: "B" },
]);

console.log("Running summarise_columns type checking tests...");

// 1. Ungrouped summarise_columns type check with integrated type inference
const ungroupedSummary = testData
  .summariseColumns({
    col_type: "number",
    columns: ["score1", "score2"],
    new_columns: [
      { prefix: "mean_", fn: (col) => stats.mean(col) },
      { prefix: "sum_", fn: (col) => stats.sum(col) },
    ],
  });

// This should work - both column names AND types should be properly inferred and prettified
// Note: mean() returns number, sum() returns number
const _ungroupedTypeCheck: DataFrame<{
  name: string;
  age: number;
  score1: number;
  score2: number;
  score3: number;
  team: string;
  mean_score1: number;
  mean_score2: number;
  sum_score1: number;
  sum_score2: number;
}> = ungroupedSummary;

console.log("Ungrouped result:", ungroupedSummary);
console.log("Ungrouped summarise_columns type checking passed!");

// 2. Single group summarise_columns type check
const singleGroupSummary = testData
  .groupBy("team")
  .summariseColumns({
    col_type: "number",
    columns: ["score1", "score2"],
    new_columns: [
      { prefix: "mean_", fn: (col) => stats.mean(col) },
      { prefix: "sum_", fn: (col) => stats.sum(col) },
    ],
  });

// This should preserve the 'team' grouping column but currently fails
const _singleGroupTypeCheck: DataFrame<{
  team: string;
  mean_score1: number;
  mean_score2: number;
  sum_score1: number;
  sum_score2: number;
}> = singleGroupSummary;

console.log("Single group summarise_columns type checking passed!");

// 3. Multiple group summarise_columns type check
const multiGroupSummary = testData
  .groupBy("team", "age")
  .summariseColumns({
    col_type: "number",
    columns: ["score1"],
    new_columns: [
      { prefix: "mean_", fn: (col) => stats.mean(col) },
    ],
  });

// This should preserve both 'team' and 'age' grouping columns but currently fails
const _multiGroupTypeCheck: DataFrame<{
  team: string;
  age: number;
  mean_score1: number;
}> = multiGroupSummary;

console.log("Multiple group summarise_columns type checking passed!");

console.log(
  "All summarise_columns type checking tests completed successfully!",
);
