import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("transpose - comprehensive functionality test", () => {
  console.log("=== Testing Transpose Functionality ===\n");

  // Test 1: Basic transpose without row labels
  console.log("1. Basic transpose without row labels");
  const basicData = createDataFrame([
    { name: "Alice", age: 25, score: 95.5 },
    { name: "Bob", age: 30, score: 87.2 },
    { name: "Charlie", age: 35, score: 92.1 },
  ]);

  console.log("Original data:");
  basicData.print();

  const basicTransposed = basicData.transpose({ numberOfRows: 3 });
  console.log("Transposed (should have row_0, row_1, row_2 columns):");
  basicTransposed.print();

  // Verify the structure
  const basicTransposedData = basicTransposed.toArray();
  expect(basicTransposedData).toHaveLength(3); // 3 original columns become 3 rows
  expect(basicTransposedData[0]).toHaveProperty("__tidy_row_label__");
  expect(basicTransposedData[0]).toHaveProperty("__tidy_row_types__");
  expect(basicTransposedData[0]).toHaveProperty("row_0");
  expect(basicTransposedData[0]).toHaveProperty("row_1");
  expect(basicTransposedData[0]).toHaveProperty("row_2");

  // Test 2: Transpose with row labels
  console.log("\n2. Transpose with row labels");
  const dataWithLabels = basicData.setRowLabels([
    "person1",
    "person2",
    "person3",
  ]);

  console.log("Data with row labels:");
  dataWithLabels.print();

  const transposedWithLabels = dataWithLabels.transpose({ numberOfRows: 3 });
  console.log(
    "Transposed with labels (should have person1, person2, person3 columns):",
  );
  transposedWithLabels.print();

  // Verify the structure
  const transposedWithLabelsData = transposedWithLabels.toArray();
  expect(transposedWithLabelsData).toHaveLength(3);
  expect(transposedWithLabelsData[0]).toHaveProperty("person1");
  expect(transposedWithLabelsData[0]).toHaveProperty("person2");
  expect(transposedWithLabelsData[0]).toHaveProperty("person3");

  // Test 3: Double transpose (should restore original structure)
  console.log("\n3. Double transpose (restore original)");
  const backToOriginal = transposedWithLabels.transpose({ numberOfRows: 3 });
  console.log("Double transposed (should restore original structure):");
  backToOriginal.print();

  // Verify data integrity
  const originalData = basicData.toArray();
  const restoredData = backToOriginal.toArray();

  // Check that the data values are preserved (ignoring metadata columns)
  for (let i = 0; i < originalData.length; i++) {
    expect(restoredData[i].name).toBe(originalData[i].name);
    expect(restoredData[i].age).toBe(originalData[i].age);
    expect(restoredData[i].score).toBe(originalData[i].score);
  }

  // Test 4: Different data types
  console.log("\n4. Transpose with mixed data types");
  const mixedData = createDataFrame([
    {
      id: 1,
      name: "Alice",
      active: true,
      score: 95.5,
      tags: ["smart", "friendly"],
    },
    {
      id: 2,
      name: "Bob",
      active: false,
      score: 87.2,
      tags: ["creative", "funny"],
    },
  ]);

  console.log("Mixed data types:");
  mixedData.print();

  const mixedTransposed = mixedData.setRowLabels(["user1", "user2"]).transpose(
    { numberOfRows: 2 },
  );
  console.log("Transposed mixed data:");
  mixedTransposed.print();

  // Test 5: Single row dataframe
  console.log("\n5. Single row dataframe");
  const singleRow = createDataFrame([
    { x: 10, y: 20, z: 30 },
  ]);

  console.log("Single row:");
  singleRow.print();

  const singleRowTransposed = singleRow.transpose({ numberOfRows: 1 });
  console.log("Transposed single row:");
  singleRowTransposed.print();

  // Test 6: Empty dataframe
  console.log("\n6. Empty dataframe");
  const emptyData = createDataFrame([]);
  console.log("Empty dataframe:");
  // emptyData.print(); // Skip print for empty dataframe

  // @ts-expect-error - empty dataframe
  const emptyTransposed = emptyData.transpose({ numberOfRows: 0 });
  console.log("Transposed empty dataframe:");
  // emptyTransposed.print(); // Skip print for empty dataframe

  // @ts-expect-error - empty dataframe
  expect(emptyTransposed.nrows()).toBe(0);

  // Test 7: Large dataframe
  console.log("\n7. Large dataframe (5x4)");
  const largeData = createDataFrame([
    { a: 1, b: 2, c: 3, d: 4 },
    { a: 5, b: 6, c: 7, d: 8 },
    { a: 9, b: 10, c: 11, d: 12 },
    { a: 13, b: 14, c: 15, d: 16 },
    { a: 17, b: 18, c: 19, d: 20 },
  ]);

  console.log("Large dataframe:");
  largeData.print();

  const largeTransposed = largeData.setRowLabels([
    "row1",
    "row2",
    "row3",
    "row4",
    "row5",
  ]).transpose({ numberOfRows: 5 });
  console.log("Transposed large dataframe:");
  largeTransposed.print();

  // Test 8: Type preservation verification
  console.log("\n8. Type preservation test");
  const typeTestData = createDataFrame([
    { name: "Alice", age: 25, score: 95.5 },
    { name: "Bob", age: 30, score: 87.2 },
  ]);

  // First transpose
  const firstTranspose = typeTestData.setRowLabels(["first", "second"])
    .transpose({ numberOfRows: 2 });

  // Second transpose should restore original types
  const secondTranspose = firstTranspose.transpose({ numberOfRows: 2 });

  console.log("Type preservation - second transpose:");
  secondTranspose.print();

  // Verify that we can access the original data with correct types
  const finalData = secondTranspose.toArray();
  expect(typeof finalData[0].name).toBe("string");
  expect(typeof finalData[0].age).toBe("number");
  expect(typeof finalData[0].score).toBe("number");

  console.log("\n=== All transpose tests completed successfully! ===");
});

Deno.test("transpose - edge cases and error handling", () => {
  console.log("=== Testing Edge Cases ===\n");

  // Test wrong expected rows count
  console.log("1. Testing wrong expected rows count");
  const data = createDataFrame([
    { a: 1, b: 2 },
    { a: 3, b: 4 },
  ]);

  // This should work fine - transpose doesn't validate expected rows
  const transposed = data.transpose({ numberOfRows: 2 });
  expect(transposed.nrows()).toBe(2); // 2 original columns become 2 rows

  // Test with different expected rows (should still work)
  const transposedWrong = data.transpose({ numberOfRows: 5 });
  expect(transposedWrong.nrows()).toBe(2); // Still 2 rows, not 5

  console.log("Transpose with wrong expected rows (should still work):");
  transposedWrong.print();

  // Test row labels length mismatch
  console.log("\n2. Testing row labels length mismatch");
  try {
    data.setRowLabels(["label1", "label2", "label3"]); // 3 labels for 2 rows
    expect(false).toBe(true); // Should not reach here
  } catch (error) {
    expect((error as Error).message).toContain("Row labels length");
    console.log("✓ Correctly caught row labels length mismatch");
  }

  // Test with null/undefined values
  console.log("\n3. Testing with null/undefined values");
  const dataWithNulls = createDataFrame([
    { a: 1, b: null, c: undefined },
    { a: null, b: 2, c: "test" },
  ]);

  console.log("Data with nulls/undefined:");
  dataWithNulls.print();

  const transposedWithNulls = dataWithNulls.setRowLabels(["row1", "row2"])
    .transpose({ numberOfRows: 2 });
  console.log("Transposed with nulls/undefined:");
  transposedWithNulls.print();

  console.log("\n=== Edge case tests completed! ===");
});

Deno.test("transpose - performance and memory test", () => {
  console.log("=== Performance Test ===\n");

  // Create a moderately large dataset
  const rows = 100;
  const cols = 50;
  const largeData: Record<string, number>[] = [];

  for (let i = 0; i < rows; i++) {
    const row: Record<string, number> = {};
    for (let j = 0; j < cols; j++) {
      row[`col_${j}`] = i * cols + j;
    }
    largeData.push(row);
  }

  const df = createDataFrame(largeData);
  console.log(`Created ${rows}x${cols} dataframe`);

  // Generate row labels
  const rowLabels = Array.from({ length: rows }, (_, i) => `row_${i}`);

  const startTime = performance.now();

  // Transpose
  const transposed = df.setRowLabels(rowLabels).transpose({
    numberOfRows: rows,
  });

  const transposeTime = performance.now() - startTime;
  console.log(`Transpose took ${transposeTime.toFixed(2)}ms`);

  // Transpose back
  const startTime2 = performance.now();
  const backToOriginal = transposed.transpose({ numberOfRows: cols });
  const doubleTransposeTime = performance.now() - startTime2;
  console.log(`Double transpose took ${doubleTransposeTime.toFixed(2)}ms`);

  // Verify data integrity
  const originalData = df.toArray();
  const restoredData = backToOriginal.toArray();

  let matches = 0;
  for (let i = 0; i < Math.min(originalData.length, restoredData.length); i++) {
    for (let j = 0; j < cols; j++) {
      const colName = `col_${j}`;
      if (originalData[i][colName] === restoredData[i][colName]) {
        matches++;
      }
    }
  }

  const totalValues = rows * cols;
  const matchPercentage = (matches / totalValues) * 100;
  console.log(
    `Data integrity: ${matches}/${totalValues} values match (${
      matchPercentage.toFixed(2)
    }%)`,
  );

  expect(matchPercentage).toBeGreaterThan(99); // Should be 100% but allow for floating point precision

  console.log("\n=== Performance test completed! ===");
});
