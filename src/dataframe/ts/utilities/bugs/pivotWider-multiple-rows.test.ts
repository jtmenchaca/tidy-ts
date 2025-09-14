import { createDataFrame, stats } from "@tidy-ts/dataframe";

Deno.test("pivotWider multiple rows bug", () => {
  // Reproducible example of the pivotWider issue
  console.log("=== PIVOTWIDER MULTIPLE ROWS BUG ===");

  // Create sample data similar to what we have in analyze.ts
  const sampleData = [
    { operation: "filter", library: "tidy-ts", time_ms: 0.115, ratio: 1.0 },
    { operation: "filter", library: "arquero", time_ms: 0.041, ratio: 0.4 },
    { operation: "filter", library: "pandas", time_ms: 0.189, ratio: 1.6 },
    { operation: "filter", library: "polars", time_ms: 0.518, ratio: 4.5 },
    { operation: "filter", library: "r", time_ms: 0.319, ratio: 2.8 },
    { operation: "sort", library: "tidy-ts", time_ms: 0.061, ratio: 1.0 },
    { operation: "sort", library: "arquero", time_ms: 0.141, ratio: 2.3 },
    { operation: "sort", library: "pandas", time_ms: 0.275, ratio: 4.5 },
    { operation: "sort", library: "polars", time_ms: 0.23, ratio: 3.8 },
    { operation: "sort", library: "r", time_ms: 0.94, ratio: 15.4 },
  ];

  const df = createDataFrame(sampleData);

  console.log("Original data:");
  df.print();
  console.log();

  // Try the same approach as in analyze.ts - THIS IS THE BUG
  console.log("Attempting pivotWider with groupBy + summarise (BUGGY):");
  const result = df
    .groupBy("operation", "library")
    .summarise({
      time_ms: (group) => stats.round(stats.mean(group.time_ms), 3),
      ratio: (group) => stats.round(stats.mean(group.ratio), 1),
    });

  console.log("Result after groupBy + summarise:");
  result.print();

  const result1 = result
    .mutate({
      display: (row) => `${row.time_ms}ms (${row.ratio}x)`,
    });

  console.log("Result after mutate (still has time_ms and ratio columns):");
  result1.print();

  // THE FIX: Drop the extra columns before pivotWider
  console.log("FIXED: Drop extra columns before pivotWider:");
  const result1a = result1
    .drop("time_ms", "ratio")
    .pivotWider({
      names_from: "library",
      values_from: "display",
      expected_columns: ["tidy-ts", "arquero", "pandas", "polars", "r"],
    })
    .arrange("operation");

  console.log("Result after drop + pivotWider (CORRECT):");
  result1a.print();
});
