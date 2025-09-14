import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

console.log("Running pivot type checking tests...");

// Test data for pivot operations
const longData = createDataFrame([
  { group: "A", variable: "x", value: 1 },
  { group: "A", variable: "y", value: 2 },
  { group: "B", variable: "x", value: 3 },
  { group: "B", variable: "y", value: 4 },
]);

const _wideData = createDataFrame([
  { id: 1, x: 10, y: 20, z: 30 },
  { id: 2, x: 15, y: 25, z: 35 },
]);

// 1. Test basic pivot_wider type inference
const basicWider = longData
  .pivotWider({
    names_from: "variable",
    values_from: "value",
    expected_columns: ["x", "y"],
  });

const _basicWiderTypeCheck: DataFrame<{
  group: string;
  x: number;
  y: number;
}> = basicWider;
