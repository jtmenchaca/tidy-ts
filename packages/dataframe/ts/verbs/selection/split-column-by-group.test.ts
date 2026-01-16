// import { pipe } from "effect";
// import { expect } from "@std/expect";
// import { createDataFrame, extract_columnBy_group } from "@tidy-ts/dataframe";

// console.log("Running split_columnBy_group tests...");

// // Test data
// const testData = createDataFrame([
//   { treatment: "A", score: 85, subject: "alice" },
//   { treatment: "A", score: 90, subject: "bob" },
//   { treatment: "B", score: 78, subject: "charlie" },
//   { treatment: "B", score: 82, subject: "diana" },
//   { treatment: "C", score: 95, subject: "eve" },
// ]);

// // Test 1: Basic functionality with numbers
// console.log("\n--- Test 1: Basic functionality with numbers ---");
// const numericResult = testData.extract_columnBy_group("treatment", "score");

// console.log("Numeric result:", numericResult);
// expect(numericResult).toEqual({
//   "A": [85, 90],
//   "B": [78, 82],
//   "C": [95],
// });

// // Type check - should infer correct types
// const _numericTypeCheck: Record<string, number[]> = numericResult;
// console.log("✓ Numeric type checking passed");

// // Test 2: Basic functionality with strings
// console.log("\n--- Test 2: Basic functionality with strings ---");
// const stringResult = testData.extract_columnBy_group("treatment", "subject");

// console.log("String result:", stringResult);
// expect(stringResult).toEqual({
//   "A": ["alice", "bob"],
//   "B": ["charlie", "diana"],
//   "C": ["eve"],
// });

// // Type check - should infer correct types
// const _stringTypeCheck: Record<string, string[]> = stringResult;
// console.log("✓ String type checking passed");

// // Test 3: Handle null/undefined values in grouping column
// console.log("\n--- Test 3: Null/undefined in grouping column ---");
// const nullGroupData = createDataFrame([
//   { group: "A", value: 1 },
//   { group: null, value: 2 },
//   { group: undefined, value: 3 },
//   { group: "A", value: 4 },
// ]);

// const nullGroupResult = pipe(
//   nullGroupData,
//   split_columnBy_group("group", "value"),
// );

// console.log("Null group result:", nullGroupResult);
// expect(nullGroupResult).toEqual({
//   "A": [1, 4],
//   "null": [2],
//   "undefined": [3],
// });
// console.log("✓ Null/undefined grouping handled correctly");

// // Test 4: Handle null/undefined values in value column
// console.log("\n--- Test 4: Null/undefined in value column ---");
// const nullValueData = createDataFrame([
//   { group: "A", value: 1 },
//   { group: "A", value: null },
//   { group: "B", value: undefined },
//   { group: "B", value: 2 },
// ]);

// const nullValueResult = nullValueData.extract_columnBy_group("group", "value");

// console.log("Null value result:", nullValueResult);
// expect(nullValueResult).toEqual({
//   "A": [1, null],
//   "B": [undefined, 2],
// });
// console.log("✓ Null/undefined values preserved correctly");

// // Test 5: Empty dataframe
// console.log("\n--- Test 5: Empty dataframe ---");
// const emptyData = createDataFrame<{ group: string; value: number }>([]);
// const emptyResult = emptyData.extract_columnBy_group("group", "value");

// console.log("Empty result:", emptyResult);
// expect(emptyResult).toEqual({});
// console.log("✓ Empty dataframe handled correctly");

// // Test 6: Single row
// console.log("\n--- Test 6: Single row ---");
// const singleRowData = createDataFrame([
//   { category: "X", measurement: 42 },
// ]);

// const singleRowResult = singleRowData.extract_columnBy_group(
//   "category",
//   "measurement",
// );

// console.log("Single row result:", singleRowResult);
// expect(singleRowResult).toEqual({
//   "X": [42],
// });
// console.log("✓ Single row handled correctly");

// // Test 7: All same group
// console.log("\n--- Test 7: All same group ---");
// const sameGroupData = createDataFrame([
//   { type: "uniform", val: 10 },
//   { type: "uniform", val: 20 },
//   { type: "uniform", val: 30 },
// ]);

// const sameGroupResult = sameGroupData.extract_columnBy_group("type", "val");

// console.log("Same group result:", sameGroupResult);
// expect(sameGroupResult).toEqual({
//   "uniform": [10, 20, 30],
// });
// console.log("✓ All same group handled correctly");

// // Test 8: Error handling - missing group column
// console.log("\n--- Test 8: Error handling - missing group column ---");
// try {
//   testData.extract_columnBy_group(
//     "nonexistent" as keyof typeof testData[0],
//     "score",
//   );
//   console.log("ERROR: Should have thrown for missing group column");
// } catch (error) {
//   console.log(
//     "✓ Expected error for missing group column:",
//     (error as Error).message,
//   );
//   expect((error as Error).message).toContain(
//     "Group column 'nonexistent' not found in data",
//   );
// }

// // Test 9: Error handling - missing value column
// console.log("\n--- Test 9: Error handling - missing value column ---");
// try {
//   testData.extract_columnBy_group(
//     "treatment",
//     "nonexistent" as keyof typeof testData[0],
//   );
//   console.log("ERROR: Should have thrown for missing value column");
// } catch (error) {
//   console.log(
//     "✓ Expected error for missing value column:",
//     (error as Error).message,
//   );
//   expect((error as Error).message).toContain(
//     "Value column 'nonexistent' not found in data",
//   );
// }

// // Test 10: Mixed data types in value column
// console.log("\n--- Test 10: Mixed data types in value column ---");
// const mixedData = createDataFrame([
//   { group: "A", mixed: 42 },
//   { group: "A", mixed: "hello" },
//   { group: "B", mixed: true },
//   { group: "B", mixed: null },
// ]);

// const mixedResult = mixedData.extract_columnBy_group("group", "mixed");

// console.log("Mixed data result:", mixedResult);
// expect(mixedResult).toEqual({
//   "A": [42, "hello"],
//   "B": [true, null],
// });

// // Type should be Record<string, unknown[]> for mixed types
// const _mixedTypeCheck: Record<string, unknown[]> = mixedResult;
// console.log("✓ Mixed data types handled correctly");

// console.log("\nAll split_columnBy_group tests passed!");
