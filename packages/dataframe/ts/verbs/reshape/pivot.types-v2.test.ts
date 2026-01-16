import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

console.log("Demonstrating pivot_wider type inference...");

// Create sample data with explicit types
const salesData = createDataFrame([
  { store: "A", product: "apples", revenue: 100 },
  { store: "A", product: "apples", revenue: 50 }, // duplicate for aggregation
  { store: "A", product: "bananas", revenue: 75 },
  { store: "B", product: "apples", revenue: 120 },
  { store: "B", product: "bananas", revenue: 90 },
]);

// Example 1: Basic pivot with automatic type inference
const basicPivot = salesData
  .pivotWider({
    namesFrom: "product",
    valuesFrom: "revenue",
    expectedColumns: ["apples", "bananas"],
  });

// Example 1: Basic pivot with automatic type inference
const _basicPivotV2: DataFrame<
  { store: string; apples: number; bananas: number }
> = salesData
  .pivotWider({
    namesFrom: "product",
    valuesFrom: "revenue",
    expectedColumns: ["apples", "bananas"],
  });

console.log("Basic pivot:");
console.log(basicPivot);
// Type: DataFrame<{ store: string; apples: number; bananas: number }>

const aggregatedPivot = salesData
  .pivotWider({
    namesFrom: "product",
    valuesFrom: "revenue",
  });

console.log("\nAggregated pivot (sum):");
console.log(aggregatedPivot);

const meanPivot = salesData
  .pivotWider({
    namesFrom: "product",
    valuesFrom: "revenue",
    expectedColumns: ["apples", "bananas"],
  });

console.log("\nMean pivot:");
console.log(meanPivot);

const customPivot = salesData
  .pivotWider({
    namesFrom: "product",
    valuesFrom: "revenue",
    expectedColumns: ["apples", "bananas"],
    // values is correctly inferred as number[]
    valuesFn: (values) => {
      // We can use array methods without casting
      const sorted = values.sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)]; // median
    },
  });

console.log("\nCustom pivot (median):");
console.log(customPivot);

// Example 5: Working with string values
const categoryData = createDataFrame([
  { dept: "Sales", employee: "Alice", status: "active" },
  { dept: "Sales", employee: "Bob", status: "inactive" },
  { dept: "IT", employee: "Alice", status: "active" },
  { dept: "IT", employee: "Bob", status: "active" },
]);

const stringPivot = categoryData
  .pivotWider({
    namesFrom: "employee",
    valuesFrom: "status",
    expectedColumns: ["Alice", "Bob"],
    // values is inferred as string[]
    valuesFn: (values) => values.join(", "),
  });

console.log("\nString pivot:");
console.log(stringPivot);

console.log("\nAll type inference examples completed successfully!");
