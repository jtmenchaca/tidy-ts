import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("cross_tabulate - empty DataFrame error handling", () => {
  // @ts-expect-error - expected error for empty DataFrame crossTabulate
  const result = createDataFrame([]).crossTabulate("col1", "col2");

  expect(result.contingencyTable).toEqual([]);
  expect(result.rowLabels).toEqual([]);
  expect(result.colLabels).toEqual([]);
  expect(result.grandTotal).toBe(0);
});

Deno.test("cross_tabulate - basic functionality", () => {
  const testData = createDataFrame([
    { treatment: "A", outcome: "Success" },
    { treatment: "A", outcome: "Failure" },
    { treatment: "B", outcome: "Success" },
  ]);

  const result = testData.crossTabulate("treatment", "outcome");

  expect(result.rowLabels.length).toBeGreaterThan(0);
  expect(result.colLabels.length).toBeGreaterThan(0);
  expect(result.grandTotal).toBe(3);
});
// console.log("Column labels:", basicResult.colLabels);

// // Should be: Success: A=2, B=1; Failure: A=1, B=2
// expect(basicResult.contingencyTable).toEqual([
//   [2, 1], // Success: A=2, B=1
//   [1, 2], // Failure: A=1, B=2
// ]);
// expect(basicResult.rowLabels).toEqual(["Success", "Failure"]);
// expect(basicResult.colLabels).toEqual(["A", "B"]);
// expect(basicResult.rowTotals).toEqual([3, 3]); // Success=3, Failure=3
// expect(basicResult.colTotals).toEqual([3, 3]); // A=3, B=3
// expect(basicResult.grandTotal).toBe(6);

// console.log("✓ Basic cross-tabulation test passed");

// // Test 2: Test with missing values
// console.log("\n--- Test 2: Missing values handling ---");
// const missingData = createDataFrame([
//   { group: "X", category: "Alpha" },
//   { group: "X", category: null },
//   { group: null, category: "Alpha" },
//   { group: "Y", category: "Beta" },
//   { group: null, category: null },
// ]);

// const missingResult = missingData.cross_tabulate("category", "group");

// console.log("Missing values result:", missingResult);
// expect(missingResult.rowLabels).toContain("Missing");
// expect(missingResult.colLabels).toContain("Missing");
// expect(missingResult.grandTotal).toBe(5);

// // Check that missing values are properly counted
// const missingRowIndex = missingResult.rowLabels.indexOf("Missing");
// const missingColIndex = missingResult.colLabels.indexOf("Missing");
// expect(missingRowIndex).toBeGreaterThanOrEqual(0);
// expect(missingColIndex).toBeGreaterThanOrEqual(0);
// expect(missingResult.contingencyTable[missingRowIndex][missingColIndex]).toBe(
//   1,
// );

// console.log("✓ Missing values handling test passed");

// // Test 3: Test summary formatting
// console.log("\n--- Test 3: Summary formatting ---");
// const summaryData = createDataFrame([
//   { gender: "M", status: "Active" },
//   { gender: "M", status: "Active" },
//   { gender: "M", status: "Inactive" },
//   { gender: "F", status: "Active" },
//   { gender: "F", status: "Active" },
//   { gender: "F", status: "Active" },
// ]);

// const summaryResult = summaryData.cross_tabulate("status", "gender");

// console.log("Summary by column:", summaryResult.summaryByColumn);

// // Check M column: Active: 2 (66.7%), Inactive: 1 (33.3%)
// expect(summaryResult.summaryByColumn["M"]).toContain("Active: 2 (66.7%)");
// expect(summaryResult.summaryByColumn["M"]).toContain("Inactive: 1 (33.3%)");

// // Check F column: Active: 3 (100.0%), Inactive: 0 (0.0%)
// expect(summaryResult.summaryByColumn["F"]).toContain("Active: 3 (100.0%)");
// expect(summaryResult.summaryByColumn["F"]).toContain("Inactive: 0 (0.0%)");

// console.log("✓ Summary formatting test passed");

// // Test 4: Single category test
// console.log("\n--- Test 4: Single category ---");
// const singleData = createDataFrame([
//   { type: "A", value: "X" },
//   { type: "A", value: "X" },
//   { type: "A", value: "X" },
// ]);

//   const singleResult = singleData.cross_tabulate("value", "type");

// expect(singleResult.contingencyTable).toEqual([[3]]);
// expect(singleResult.rowLabels).toEqual(["X"]);
// expect(singleResult.colLabels).toEqual(["A"]);
// expect(singleResult.grandTotal).toBe(3);

// console.log("✓ Single category test passed");

// // Test 5: Empty data
// console.log("\n--- Test 5: Empty data ---");
// const emptyData = createDataFrame([]);
// const emptyResult = emptyData
//   // @ts-expect-error - empty dataframe
//   .cross_tabulate("a", "b");

// expect(emptyResult.contingencyTable).toEqual([]);
// expect(emptyResult.rowLabels).toEqual([]);
// expect(emptyResult.colLabels).toEqual([]);
// expect(emptyResult.grandTotal).toBe(0);

// console.log("✓ Empty data test passed");

// // Test 6: Error handling
// console.log("\n--- Test 6: Error handling ---");
// const testData = createDataFrame([
//   { valid: "A", other: "X" },
// ]);

//   testData
//     // @ts-expect-error - invalid row variable
//     .cross_tabulate("invalid" as keyof typeof testData[0], "other");
//   );
//   console.log("ERROR: Should have thrown for invalid row variable");
//   expect(true).toBe(false);
// } catch (error) {
//   console.log(
//     "✓ Expected error for invalid row variable:",
//     (error as Error).message,
//   );
//   expect((error as Error).message).toContain(
//     "Row variable 'invalid' not found",
//   );
// }

//   testData
//     // @ts-expect-error - invalid column variable
//     .cross_tabulate("valid", "invalid" as keyof typeof testData[0]);
//   console.log("ERROR: Should have thrown for invalid column variable");
//   expect(true).toBe(false);
//   console.log(
//     "✓ Expected error for invalid column variable:",
//     (error as Error).message,
//   );
//   expect((error as Error).message).toContain(
//     "Column variable 'invalid' not found",
//   );
// }

// console.log("✓ Error handling test passed");

// // Test 7: Large contingency table
// console.log("\n--- Test 7: Multiple categories ---");
// const multiData = createDataFrame([
//   { region: "North", product: "A", season: "Spring" },
//   { region: "North", product: "B", season: "Spring" },
//   { region: "South", product: "A", season: "Summer" },
//   { region: "South", product: "C", season: "Summer" },
//   { region: "East", product: "A", season: "Fall" },
//   { region: "West", product: "B", season: "Winter" },
// ]);

// const multiResult = multiData.cross_tabulate("product", "region");

// expect(multiResult.rowLabels.length).toBe(3); // A, B, C
// expect(multiResult.colLabels.length).toBe(4); // North, South, East, West
// expect(multiResult.grandTotal).toBe(6);

// // Verify totals add up correctly
// const calculatedGrandTotal = multiResult.rowTotals.reduce(
//   (sum, total) => sum + total,
//   0,
// );
// expect(calculatedGrandTotal).toBe(multiResult.grandTotal);

// const calculatedGrandTotalFromCols = multiResult.colTotals.reduce(
//   (sum, total) => sum + total,
//   0,
// );
// expect(calculatedGrandTotalFromCols).toBe(multiResult.grandTotal);

// console.log("✓ Multiple categories test passed");

// // Test 8: Type inference
// console.log("\n--- Test 8: Type inference ---");
// const typedData = createDataFrame([
//   { str_col: "A", num_col: 1 },
//   { str_col: "B", num_col: 2 },
// ]);

// const typedResult = typedData.cross_tabulate("str_col", "num_col");

// // Should work with mixed types (numbers converted to strings)
// expect(typedResult.colLabels).toEqual(["1", "2"]);
// expect(typedResult.rowLabels).toEqual(["A", "B"]);

// console.log("✓ Type inference test passed");

// console.log("\nAll cross_tabulate tests passed!");
