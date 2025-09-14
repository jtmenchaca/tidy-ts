import { createDataFrame, type DataFrame, stats } from "@tidy-ts/dataframe";

console.log("Running comprehensive pivot type checking tests...");

// Test data for pivot operations
const longData = createDataFrame([
  { group: "A", variable: "x", value: 1 },
  { group: "A", variable: "y", value: 2 },
  { group: "B", variable: "x", value: 3 },
  { group: "B", variable: "y", value: 4 },
]);

const wideData = createDataFrame([
  { id: 1, x: 10, y: 20, z: 30 },
  { id: 2, x: 15, y: 25, z: 35 },
]);

const basicWider = longData
  .pivotWider({
    names_from: "variable",
    values_from: "value",
    expected_columns: ["x", "y"],
  });

// Type check passes - columns are properly inferred
const _basicWiderTypeCheck: DataFrame<{
  group: string;
  x: number;
  y: number;
}> = basicWider;

console.log("Basic pivot_wider result:", basicWider);

// 2. Test pivot_wider with aggregation function
const aggregatedWider = createDataFrame([
  { group: "A", variable: "x", value: 1 },
  { group: "A", variable: "x", value: 2 }, // duplicate
  { group: "A", variable: "y", value: 3 },
  { group: "B", variable: "x", value: 4 },
  { group: "B", variable: "y", value: 5 },
])
  .pivotWider({
    names_from: "variable",
    values_from: "value",
    expected_columns: ["x", "y"],
    values_fn: (values) => stats.sum(values),
  });

// Type check - aggregation function changes return type
const _aggregatedWiderTypeCheck: DataFrame<{
  group: string;
  x: number;
  y: number;
}> = aggregatedWider;

console.log("Aggregated pivot_wider result:", aggregatedWider);

// 3. Test pivot_wider with prefix
const prefixedWider = longData
  .pivotWider({
    names_from: "variable",
    values_from: "value",
    expected_columns: ["x", "y"],
    names_prefix: "val_",
  });

// Type check - prefix is applied to column names
const _prefixedWiderTypeCheck: DataFrame<{
  group: string;
  val_x: number;
  val_y: number;
}> = prefixedWider;

console.log("Prefixed pivot_wider result:", prefixedWider);

// 4. Test pivot_longer with type inference
const longerData = wideData
  .pivotLonger({
    cols: ["x", "y", "z"],
    names_to: "variable",
    values_to: "value",
  });

// Type check - proper type inference for pivot_longer
const _longerTypeCheck: DataFrame<{
  id: number;
  variable: string;
  value: number;
}> = longerData;

console.log("Pivot_longer result:", longerData);

// 5. Test pivot_wider without expected_columns (falls back to Record<string, unknown>)
const dynamicWider = longData
  .pivotWider({
    names_from: "variable",
    values_from: "value",
  });

// This now preserves original column types with dynamic columns as unknown
const _dynamicWiderTypeCheck: DataFrame<{
  group: string;
  [key: string]: unknown;
}> = dynamicWider;
console.log("Dynamic pivot_wider result (with preserved types):", dynamicWider);

console.log("All comprehensive pivot type checking tests passed!");
