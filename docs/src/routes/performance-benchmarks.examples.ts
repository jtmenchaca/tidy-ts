// Performance benchmark data from status-20250913.md
// Data represents performance comparisons across different libraries

export type Library = "tidy-ts" | "arquero" | "pandas" | "polars" | "r";

export interface BenchmarkCell {
  library: Library;
  timeMs: number;
  ratio: number;
}

export interface BenchmarkRow {
  operation: string;
  sortOrder: number;
  values: BenchmarkCell[];
}

export const performanceBenchmarksExamples = {
  // Data from status-20250913.md - these are 500K row benchmarks
  fiveHundredKBenchmarkData: [
    {
      operation: "creation",
      sortOrder: 1,
      values: [
        { library: "tidy-ts", timeMs: 215.917, ratio: 1 },
        { library: "arquero", timeMs: 36.772, ratio: 0.2 },
        { library: "pandas", timeMs: 666.927, ratio: 3.1 },
        { library: "polars", timeMs: 8.966, ratio: 0 },
        { library: "r-dplyr", timeMs: 0.024, ratio: 0 },
      ],
    },
    {
      operation: "distinct",
      sortOrder: 5,
      values: [
        { library: "tidy-ts", timeMs: 127.042, ratio: 1 },
        { library: "arquero", timeMs: 546.319, ratio: 4.3 },
        { library: "pandas", timeMs: 40.531, ratio: 0.3 },
        { library: "polars", timeMs: 16.637, ratio: 0.1 },
        { library: "r-dplyr", timeMs: 12.153, ratio: 0.1 },
      ],
    },
    {
      operation: "filter",
      sortOrder: 2,
      values: [
        { library: "tidy-ts", timeMs: 7.742, ratio: 1 },
        { library: "arquero", timeMs: 8.154, ratio: 1.1 },
        { library: "pandas", timeMs: 1.98, ratio: 0.3 },
        { library: "polars", timeMs: 0.489, ratio: 0.1 },
        { library: "r-dplyr", timeMs: 4.447, ratio: 0.6 },
      ],
    },
    {
      operation: "innerJoin",
      sortOrder: 7,
      values: [
        { library: "tidy-ts", timeMs: 92.388, ratio: 1 },
        { library: "arquero", timeMs: 349.337, ratio: 3.8 },
        { library: "pandas", timeMs: 33.89, ratio: 0.4 },
        { library: "polars", timeMs: 8.498, ratio: 0.1 },
        { library: "r-dplyr", timeMs: 343.436, ratio: 3.7 },
      ],
    },
    {
      operation: "leftJoin",
      sortOrder: 8,
      values: [
        { library: "tidy-ts", timeMs: 64.091, ratio: 1 },
        { library: "arquero", timeMs: 946.598, ratio: 14.8 },
        { library: "pandas", timeMs: 39.313, ratio: 0.6 },
        { library: "polars", timeMs: 10.88, ratio: 0.2 },
        { library: "r-dplyr", timeMs: 558.421, ratio: 8.7 },
      ],
    },
    {
      operation: "mutate",
      sortOrder: 3,
      values: [
        { library: "tidy-ts", timeMs: 3.107, ratio: 1 },
        { library: "arquero", timeMs: 9.12, ratio: 2.9 },
        { library: "pandas", timeMs: 1.462, ratio: 0.5 },
        { library: "polars", timeMs: 0.109, ratio: 0 },
        { library: "r-dplyr", timeMs: 0.725, ratio: 0.2 },
      ],
    },
    {
      operation: "outerJoin",
      sortOrder: 9,
      values: [
        { library: "tidy-ts", timeMs: 103.256, ratio: 1 },
        { library: "arquero", timeMs: 1457.796, ratio: 14.1 },
        { library: "pandas", timeMs: 47.199, ratio: 0.5 },
        { library: "polars", timeMs: 23.33, ratio: 0.2 },
        { library: "r-dplyr", timeMs: 550.389, ratio: 5.3 },
      ],
    },
    {
      operation: "pivotLonger",
      sortOrder: 9,
      values: [
        { library: "tidy-ts", timeMs: 160.768, ratio: 1 },
        { library: "arquero", timeMs: 238.698, ratio: 1.5 },
        { library: "pandas", timeMs: 64.685, ratio: 0.4 },
        { library: "polars", timeMs: 17.024, ratio: 0.1 },
        { library: "r-dplyr", timeMs: 37.746, ratio: 0.2 },
      ],
    },
    {
      operation: "pivotWider",
      sortOrder: 10,
      values: [
        { library: "tidy-ts", timeMs: 2.617, ratio: 1 },
        { library: "arquero", timeMs: 2.211, ratio: 0.8 },
        { library: "pandas", timeMs: 5.416, ratio: 2.1 },
        { library: "polars", timeMs: 2.543, ratio: 1 },
        { library: "r-dplyr", timeMs: 2.297, ratio: 0.9 },
      ],
    },
    {
      operation: "sort",
      sortOrder: 4,
      values: [
        { library: "tidy-ts", timeMs: 187.764, ratio: 1 },
        { library: "arquero", timeMs: 245.303, ratio: 1.3 },
        { library: "pandas", timeMs: 171.514, ratio: 0.9 },
        { library: "polars", timeMs: 48.197, ratio: 0.3 },
        { library: "r-dplyr", timeMs: 20.575, ratio: 0.1 },
      ],
    },
    {
      operation: "summarize",
      sortOrder: 11,
      values: [
        { library: "tidy-ts", timeMs: 184.089, ratio: 1 },
        { library: "arquero", timeMs: 49.039, ratio: 0.3 },
        { library: "pandas", timeMs: 6.456, ratio: 0 },
        { library: "polars", timeMs: 1.226, ratio: 0 },
        { library: "r-dplyr", timeMs: 6.226, ratio: 0 },
      ],
    },
  ],
};