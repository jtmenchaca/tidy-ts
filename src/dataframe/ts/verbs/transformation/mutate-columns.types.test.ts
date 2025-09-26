import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

// Test data
const testData = createDataFrame([
  { name: "Alice", age: 25, score1: 85, score2: 90, score3: 88, team: "A" },
  { name: "Bob", age: 30, score1: 92, score2: 88, score3: 95, team: "B" },
  { name: "Charlie", age: 28, score1: 78, score2: 85, score3: 82, team: "A" },
  { name: "Diana", age: 35, score1: 95, score2: 92, score3: 90, team: "B" },
]);

console.log("Running mutate_columns type checking tests...");

// 1. Ungrouped mutate_columns type check with integrated type inference
const ungroupedMutate = testData
  .mutateColumns({
    colType: "number",
    columns: ["score1", "score2"],
    newColumns: [
      { prefix: "add_1_", fn: (col) => col + 1 },
      { prefix: "double_", fn: (col) => col * 2 },
    ],
  });

// This should work - both column names AND types should be properly inferred and prettified
// Note: Both operations return numbers
const _ungroupedTypeCheck: DataFrame<{
  name: string;
  age: number;
  score1: number;
  score2: number;
  score3: number;
  team: string;
  add_1_score1: number;
  add_1_score2: number;
  double_score1: number;
  double_score2: number;
}> = ungroupedMutate;

console.log("Ungrouped result:", ungroupedMutate);
console.log("Ungrouped mutate_columns type checking passed!");

// 2. Test with suffix instead of prefix
const suffixMutate = testData
  .mutateColumns({
    colType: "number",
    columns: ["score1"],
    newColumns: [{ suffix: "_plus_10", fn: (col) => col + 10 }],
  });

const _suffixTypeCheck: DataFrame<{
  name: string;
  age: number;
  score1: number;
  score2: number;
  score3: number;
  team: string;
  score1_plus_10: number;
}> = suffixMutate;

console.log("Suffix mutate_columns type checking passed!");

// 3. Test with both prefix and suffix
const prefixSuffixMutate = testData
  .mutateColumns({
    colType: "number",
    columns: ["score1"],
    newColumns: [{ prefix: "new_", suffix: "_value", fn: (col) => col * 1.5 }],
  });

const _prefixSuffixTypeCheck: DataFrame<{
  name: string;
  age: number;
  score1: number;
  score2: number;
  score3: number;
  team: string;
  new_score1_value: number;
}> = prefixSuffixMutate;

console.log("Prefix+suffix mutate_columns type checking passed!");

// 4. Test with string columns
const stringMutate = testData.mutateColumns({
  colType: "string",
  columns: ["name", "team"],
  newColumns: [
    { prefix: "upper_", fn: (col) => col.toUpperCase() },
    { suffix: "_length", fn: (col) => col.length },
  ],
});

const _stringTypeCheck: DataFrame<{
  name: string;
  age: number;
  score1: number;
  score2: number;
  score3: number;
  team: string;
  upper_name: string;
  upper_team: string;
  name_length: number;
  team_length: number;
}> = stringMutate;

console.log("String mutate_columns type checking passed!");

// // 5. Single group mutate_columns type check (commented out like in summarise_columns-types.test.ts)
// const singleGroupMutate = pipe(
//   testData,
//   groupBy("team"),
//   mutateColumns({
//     colType: "number",
//     columns: ["score1", "score2"],
//     newColumns: [
//       { prefix: "add_1_", fn: (col) => col + 1 },
//       { prefix: "double_", fn: (col) => col * 2 },
//     ],
//   }),
// );

// // This should preserve the original columns and add new ones
// const _singleGroupTypeCheck: DataFrame<{
//   name: string;
//   age: number;
//   score1: number;
//   score2: number;
//   score3: number;
//   team: string;
//   add_1_score1: number;
//   add_1_score2: number;
//   double_score1: number;
//   double_score2: number;
// }> = singleGroupMutate;

// console.log("Single group mutate_columns type checking passed!");

console.log("All mutate_columns type checking tests completed successfully!");
