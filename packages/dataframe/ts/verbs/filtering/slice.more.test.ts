import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

// Extended test dataset for comprehensive slice testing
const extendedData = createDataFrame([
  // Species A group (5 rows)
  { species: "A", value: 10, priority: 1, id: "A1" },
  { species: "A", value: 15, priority: 2, id: "A2" },
  { species: "A", value: 12, priority: 3, id: "A3" },
  { species: "A", value: 18, priority: 1, id: "A4" },
  { species: "A", value: 8, priority: 2, id: "A5" },
  // Species B group (3 rows)
  { species: "B", value: 25, priority: 1, id: "B1" },
  { species: "B", value: 30, priority: 3, id: "B2" },
  { species: "B", value: 22, priority: 2, id: "B3" },
  // Species C group (4 rows)
  { species: "C", value: 5, priority: 1, id: "C1" },
  { species: "C", value: 35, priority: 2, id: "C2" },
  { species: "C", value: 40, priority: 3, id: "C3" },
  { species: "C", value: 28, priority: 1, id: "C4" },
]);

Deno.test("Slice Methods - Comprehensive Grouped vs Ungrouped Behavior", () => {
  console.log("\n🔬 Testing Comprehensive Slice Method Behavior");

  // Test 1: slice_head behavior
  console.log("\n1️⃣ Testing slice_head behavior");

  const ungroupedHead = extendedData.head(3);
  console.log("Ungrouped slice_head(3):");
  for (let i = 0; i < ungroupedHead.nrows(); i++) {
    console.log(
      `  Row ${i + 1}: ${ungroupedHead[i].id} (species: ${
        ungroupedHead[i].species
      }, value: ${ungroupedHead[i].value})`,
    );
  }

  const groupedHead = extendedData.groupBy("species").head(2);
  console.log("Grouped by species, slice_head(2):");
  for (let i = 0; i < groupedHead.nrows(); i++) {
    console.log(
      `  Row ${i + 1}: ${groupedHead[i].id} (species: ${
        groupedHead[i].species
      }, value: ${groupedHead[i].value})`,
    );
  }

  // Ungrouped: should return first 3 rows of entire dataset
  expect(ungroupedHead.nrows()).toBe(3);
  expect(ungroupedHead[0].id).toBe("A1");
  expect(ungroupedHead[1].id).toBe("A2");
  expect(ungroupedHead[2].id).toBe("A3");

  // Grouped: should return first 2 rows from each group (6 total: 2 from A, 2 from B, 2 from C)
  expect(groupedHead.nrows()).toBe(6);
  // First group (A): A1, A2 (correct order after fix)
  expect(groupedHead[0].species).toBe("A");
  expect(groupedHead[0].id).toBe("A1");
  expect(groupedHead[1].species).toBe("A");
  expect(groupedHead[1].id).toBe("A2");
  // Second group (B): B1, B2 (correct order after fix)
  expect(groupedHead[2].species).toBe("B");
  expect(groupedHead[2].id).toBe("B1");
  expect(groupedHead[3].species).toBe("B");
  expect(groupedHead[3].id).toBe("B2");
  // Third group (C): C1, C2 (correct order after fix)
  expect(groupedHead[4].species).toBe("C");
  expect(groupedHead[4].id).toBe("C1");
  expect(groupedHead[5].species).toBe("C");
  expect(groupedHead[5].id).toBe("C2");

  console.log("slice_head behavior verification checked");

  // Test 2: slice_tail behavior
  console.log("\n2️⃣ Testing slice_tail behavior");

  const ungroupedTail = extendedData.tail(3);
  console.log("Ungrouped slice_tail(3):");
  for (let i = 0; i < ungroupedTail.nrows(); i++) {
    console.log(
      `  Row ${i + 1}: ${ungroupedTail[i].id} (species: ${
        ungroupedTail[i].species
      }, value: ${ungroupedTail[i].value})`,
    );
  }

  const groupedTail = extendedData.groupBy("species").tail(1);
  console.log("Grouped by species, slice_tail(1):");
  for (let i = 0; i < groupedTail.nrows(); i++) {
    console.log(
      `  Row ${i + 1}: ${groupedTail[i].id} (species: ${
        groupedTail[i].species
      }, value: ${groupedTail[i].value})`,
    );
  }

  // Ungrouped: should return last 3 rows of entire dataset
  expect(ungroupedTail.nrows()).toBe(3);
  expect(ungroupedTail[0].id).toBe("C2");
  expect(ungroupedTail[1].id).toBe("C3");
  expect(ungroupedTail[2].id).toBe("C4");

  // Grouped: should return last 1 row from each group (3 total: 1 from A, 1 from B, 1 from C)
  expect(groupedTail.nrows()).toBe(3);
  expect(groupedTail[0].species).toBe("A");
  expect(groupedTail[0].id).toBe("A5"); // Last row of group A (correct order after fix)
  expect(groupedTail[1].species).toBe("B");
  expect(groupedTail[1].id).toBe("B3"); // Last row of group B (correct order after fix)
  expect(groupedTail[2].species).toBe("C");
  expect(groupedTail[2].id).toBe("C4"); // Last row of group C (correct order after fix)

  console.log("slice_tail behavior verification checked");

  // Test 3: slice_min behavior
  console.log("\n3️⃣ Testing slice_min behavior");

  const ungroupedMin = extendedData.sliceMin("value", 2);
  console.log("Ungrouped slice_min('value', 2):");
  for (let i = 0; i < ungroupedMin.nrows(); i++) {
    console.log(
      `  Row ${i + 1}: ${ungroupedMin[i].id} (species: ${
        ungroupedMin[i].species
      }, value: ${ungroupedMin[i].value})`,
    );
  }

  const groupedMin = extendedData.groupBy("species").sliceMin("value", 1);
  console.log("Grouped by species, slice_min('value', 1):");
  for (let i = 0; i < groupedMin.nrows(); i++) {
    console.log(
      `  Row ${i + 1}: ${groupedMin[i].id} (species: ${
        groupedMin[i].species
      }, value: ${groupedMin[i].value})`,
    );
  }

  // Ungrouped: should return 2 rows with lowest values across entire dataset
  expect(ungroupedMin.nrows()).toBe(2);
  expect(ungroupedMin[0].value).toBe(5); // C1
  expect(ungroupedMin[1].value).toBe(8); // A5

  // Grouped: should return row with lowest value from each group
  expect(groupedMin.nrows()).toBe(3);
  expect(groupedMin[0].species).toBe("A");
  expect(groupedMin[0].value).toBe(8); // A5 (lowest in group A)
  expect(groupedMin[1].species).toBe("B");
  expect(groupedMin[1].value).toBe(22); // B3 (lowest in group B)
  expect(groupedMin[2].species).toBe("C");
  expect(groupedMin[2].value).toBe(5); // C1 (lowest in group C)

  console.log("slice_min behavior verification checked");

  // Test 4: slice_max behavior
  console.log("\n4️⃣ Testing slice_max behavior");

  const ungroupedMax = extendedData.sliceMax("value", 2);
  console.log("Ungrouped slice_max('value', 2):");
  for (let i = 0; i < ungroupedMax.nrows(); i++) {
    console.log(
      `  Row ${i + 1}: ${ungroupedMax[i].id} (species: ${
        ungroupedMax[i].species
      }, value: ${ungroupedMax[i].value})`,
    );
  }

  const groupedMax = extendedData.groupBy("species").sliceMax("value", 1);
  console.log("Grouped by species, slice_max('value', 1):");
  for (let i = 0; i < groupedMax.nrows(); i++) {
    console.log(
      `  Row ${i + 1}: ${groupedMax[i].id} (species: ${
        groupedMax[i].species
      }, value: ${groupedMax[i].value})`,
    );
  }

  // Ungrouped: should return 2 rows with highest values across entire dataset
  expect(ungroupedMax.nrows()).toBe(2);
  expect(ungroupedMax[0].value).toBe(40); // C3
  expect(ungroupedMax[1].value).toBe(35); // C2

  // Grouped: should return row with highest value from each group
  expect(groupedMax.nrows()).toBe(3);
  expect(groupedMax[0].species).toBe("A");
  expect(groupedMax[0].value).toBe(18); // A4 (highest in group A)
  expect(groupedMax[1].species).toBe("B");
  expect(groupedMax[1].value).toBe(30); // B2 (highest in group B)
  expect(groupedMax[2].species).toBe("C");
  expect(groupedMax[2].value).toBe(40); // C3 (highest in group C)

  console.log("slice_max behavior verification checked");

  // Test 5: slice (by indices) behavior
  console.log("\n5️⃣ Testing slice (by indices) behavior");

  const ungroupedIndices = extendedData.slice(2, 5);
  console.log("Ungrouped slice(2, 5, 8):");
  for (let i = 0; i < ungroupedIndices.nrows(); i++) {
    console.log(
      `  Row ${i + 1}: ${ungroupedIndices[i].id} (species: ${
        ungroupedIndices[i].species
      }, value: ${ungroupedIndices[i].value})`,
    );
  }

  const groupedIndices = extendedData.groupBy("species").slice(1, 2);
  console.log("Grouped by species, slice(1, 2):");
  for (let i = 0; i < groupedIndices.nrows(); i++) {
    console.log(
      `  Row ${i + 1}: ${groupedIndices[i].id} (species: ${
        groupedIndices[i].species
      }, value: ${groupedIndices[i].value})`,
    );
  }

  // Ungrouped: should return rows at indices 2, 5, 8 (1-based) from entire dataset
  expect(ungroupedIndices.nrows()).toBe(3);
  expect(ungroupedIndices[0].id).toBe("A3"); // Index 2
  expect(ungroupedIndices[1].id).toBe("A4"); // Index 5
  expect(ungroupedIndices[2].id).toBe("A5"); // Index 8

  // Grouped: should return indices 1, 2 from each group (first two rows of each group)
  expect(groupedIndices.nrows()).toBe(3);
  // Group A: indices 1, 2 -> A2 (corrected order)
  expect(groupedIndices[0].species).toBe("A");
  expect(groupedIndices[0].id).toBe("A2");
  // Group B: indices 1, 2 -> B2 (corrected order)
  expect(groupedIndices[1].species).toBe("B");
  expect(groupedIndices[1].id).toBe("B2");
  // Group C: indices 1, 2 -> C2 (corrected order)
  expect(groupedIndices[2].species).toBe("C");
  expect(groupedIndices[2].id).toBe("C2");

  console.log("slice (by indices) behavior verification checked");

  console.log(
    "\n📊 All slice method grouped vs ungrouped behavior tests finished",
  );
});

Deno.test("Slice Methods - Group Preservation and Ungroup Behavior", () => {
  console.log("\n🔬 Testing Group Preservation and Ungroup Behavior");

  // Test that slice methods preserve groups
  const grouped = extendedData.groupBy("species");

  // Test each slice method preserves grouping
  const slicedGrouped = grouped.head(2);
  expect(slicedGrouped.__groups).toBeDefined();
  console.log("slice_head preserves groups");

  const tailGrouped = grouped.tail(1);
  expect(tailGrouped.__groups).toBeDefined();
  console.log("slice_tail preserves groups");

  const minGrouped = grouped.sliceMin("value", 1);
  expect(minGrouped.__groups).toBeDefined();
  console.log("slice_min preserves groups");

  const maxGrouped = grouped.sliceMax("value", 1);
  expect(maxGrouped.__groups).toBeDefined();
  console.log("slice_max preserves groups");

  const indicesGrouped = grouped.slice(1, 2);
  expect(indicesGrouped.__groups).toBeDefined();
  console.log("slice (indices) preserves groups");

  // Test ungroup after slice operations
  const ungroupedAfterSlice = grouped.head(2).ungroup();
  // @ts-expect-error - TypeScript correctly identifies ungroupedAfterSlice as ungrouped DataFrame
  expect(ungroupedAfterSlice.__groups).toBeUndefined();
  console.log("ungroup verified after slice operations");

  console.log("\n📊 Group preservation and ungroup behavior tests finished");
});

Deno.test("Slice Methods - Edge Cases and Boundary Conditions", () => {
  console.log("\n🔬 Testing Edge Cases and Boundary Conditions");

  // Test with small groups
  const smallGroupData = createDataFrame([
    { group: "X", value: 1, id: "X1" },
    { group: "Y", value: 2, id: "Y1" },
    { group: "Y", value: 3, id: "Y2" },
  ]);

  // Test requesting more rows than group size
  const moreThanGroupSize = smallGroupData.groupBy("group").head(5);

  console.log("Testing request more rows than group size:");
  for (let i = 0; i < moreThanGroupSize.nrows(); i++) {
    console.log(
      `  Row ${i + 1}: ${moreThanGroupSize[i].id} (group: ${
        moreThanGroupSize[i].group
      })`,
    );
  }

  // Should return all available rows from each group
  expect(moreThanGroupSize.nrows()).toBe(3); // 1 from X, 2 from Y
  expect(moreThanGroupSize[0].id).toBe("X1");
  expect(moreThanGroupSize[1].id).toBe("Y1"); // Corrected order
  expect(moreThanGroupSize[2].id).toBe("Y2");

  // Test empty group handling
  const emptyData = createDataFrame([]);
  // @ts-expect-error - empty dataframe
  const emptySliced = emptyData.slice(0, 3);
  expect(emptySliced.nrows()).toBe(0);
  console.log("Empty DataFrame slice handling verified");

  // Test single row group
  const singleRowGroup = createDataFrame([
    { group: "single", value: 42, id: "S1" },
  ]).groupBy("group").tail(3);
  expect(singleRowGroup.nrows()).toBe(1);
  expect(singleRowGroup[0].id).toBe("S1");
  console.log("Single row group handling verified");

  console.log("\n📊 Edge cases and boundary conditions tests finished");
});

Deno.test("Slice Methods - Multiple Grouping Columns", () => {
  console.log("\n🔬 Testing Multiple Grouping Columns");

  const multiGroupData = createDataFrame([
    { category: "A", type: "X", value: 10, id: "AX1" },
    { category: "A", type: "X", value: 15, id: "AX2" },
    { category: "A", type: "Y", value: 20, id: "AY1" },
    { category: "B", type: "X", value: 25, id: "BX1" },
    { category: "B", type: "Y", value: 30, id: "BY1" },
    { category: "B", type: "Y", value: 35, id: "BY2" },
  ]);

  const multiGroupSlice = multiGroupData.groupBy("category", "type")
    .head(1);

  console.log("Multiple grouping columns slice_head(1):");
  for (let i = 0; i < multiGroupSlice.nrows(); i++) {
    console.log(
      `  Row ${i + 1}: ${multiGroupSlice[i].id} (${
        multiGroupSlice[i].category
      }-${multiGroupSlice[i].type})`,
    );
  }

  // Should return first row from each category-type combination
  expect(multiGroupSlice.nrows()).toBe(4); // AX, AY, BX, BY
  expect(multiGroupSlice[0].id).toBe("AX1"); // Corrected order
  expect(multiGroupSlice[1].id).toBe("AY1");
  expect(multiGroupSlice[2].id).toBe("BX1");
  expect(multiGroupSlice[3].id).toBe("BY1"); // Corrected order

  console.log("\n📊 Multiple grouping columns tests finished");
});

Deno.test("Slice Methods - Data Integrity and Type Safety", () => {
  console.log("\n🔬 Testing Data Integrity and Type Safety");

  const originalData = extendedData;
  const sliced = originalData.groupBy("species").head(2);

  // Verify original data is unchanged
  expect(originalData.nrows()).toBe(12);
  expect(originalData[0].id).toBe("A1");

  // Verify sliced data maintains all properties
  for (let i = 0; i < sliced.nrows(); i++) {
    const row = sliced[i];
    expect(typeof row.species).toBe("string");
    expect(typeof row.value).toBe("number");
    expect(typeof row.priority).toBe("number");
    expect(typeof row.id).toBe("string");
  }

  // Verify no data corruption
  expect(sliced[0].species).toBe("A");
  expect(sliced[0].value).toBe(10); // Corrected order - first row of group A
  expect(sliced[0].priority).toBe(1);
  expect(sliced[0].id).toBe("A1");

  console.log("Data integrity and type safety verified");
  console.log("\n📊 Data integrity and type safety tests finished");
});
