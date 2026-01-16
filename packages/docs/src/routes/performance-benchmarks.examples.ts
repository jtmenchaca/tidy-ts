// Performance benchmark data from status-20250913.md
// Data represents performance comparisons across different libraries

export type Library = "tidy-ts" | "arquero" | "pandas" | "polars" | "dplyr";

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
  // Data from latest benchmark run (2025-01-29) - these are 500K row benchmarks
  fiveHundredKBenchmarkData: [
    {
      operation: "creation",
      sortOrder: 1,
      values: [
        { library: "tidy-ts", timeMs: 115.8, ratio: 1.0 },
        { library: "arquero", timeMs: 37.6, ratio: 0.3 },
        { library: "pandas", timeMs: 757.2, ratio: 6.5 },
        { library: "polars", timeMs: 10.3, ratio: 0.1 },
        { library: "dplyr", timeMs: 0.03, ratio: 0.0 },
      ],
    },
    {
      operation: "distinct",
      sortOrder: 5,
      values: [
        { library: "tidy-ts", timeMs: 108.4, ratio: 1.0 },
        { library: "arquero", timeMs: 615.7, ratio: 5.7 },
        { library: "pandas", timeMs: 54.7, ratio: 0.5 },
        { library: "polars", timeMs: 15.1, ratio: 0.1 },
        { library: "dplyr", timeMs: 16.3, ratio: 0.2 },
      ],
    },
    {
      operation: "filter",
      sortOrder: 2,
      values: [
        { library: "tidy-ts", timeMs: 12.9, ratio: 1.0 },
        { library: "arquero", timeMs: 11.8, ratio: 0.9 },
        { library: "pandas", timeMs: 2.7, ratio: 0.2 },
        { library: "polars", timeMs: 0.5, ratio: 0.04 },
        { library: "dplyr", timeMs: 5.7, ratio: 0.4 },
      ],
    },
    {
      operation: "innerJoin",
      sortOrder: 7,
      values: [
        { library: "tidy-ts", timeMs: 65.8, ratio: 1.0 },
        { library: "arquero", timeMs: 295.7, ratio: 4.5 },
        { library: "pandas", timeMs: 47.2, ratio: 0.7 },
        { library: "polars", timeMs: 14.8, ratio: 0.2 },
        { library: "dplyr", timeMs: 489.9, ratio: 7.4 },
      ],
    },
    {
      operation: "leftJoin",
      sortOrder: 8,
      values: [
        { library: "tidy-ts", timeMs: 50.2, ratio: 1.0 },
        { library: "arquero", timeMs: 400.1, ratio: 8.0 },
        { library: "pandas", timeMs: 56.0, ratio: 1.1 },
        { library: "polars", timeMs: 16.9, ratio: 0.3 },
        { library: "dplyr", timeMs: 912.3, ratio: 18.2 },
      ],
    },
    {
      operation: "mutate",
      sortOrder: 3,
      values: [
        { library: "tidy-ts", timeMs: 2.0, ratio: 1.0 },
        { library: "arquero", timeMs: 3.3, ratio: 1.7 },
        { library: "pandas", timeMs: 3.4, ratio: 1.7 },
        { library: "polars", timeMs: 0.1, ratio: 0.05 },
        { library: "dplyr", timeMs: 0.8, ratio: 0.4 },
      ],
    },
    {
      operation: "outerJoin",
      sortOrder: 9,
      values: [
        { library: "tidy-ts", timeMs: 98.9, ratio: 1.0 },
        { library: "arquero", timeMs: 1244.6, ratio: 12.6 },
        { library: "pandas", timeMs: 66.4, ratio: 0.7 },
        { library: "polars", timeMs: 32.9, ratio: 0.3 },
        { library: "dplyr", timeMs: 806.5, ratio: 8.2 },
      ],
    },
    {
      operation: "pivotLonger",
      sortOrder: 9,
      values: [
        { library: "tidy-ts", timeMs: 246.3, ratio: 1.0 },
        { library: "arquero", timeMs: 287.3, ratio: 1.2 },
        { library: "pandas", timeMs: 64.3, ratio: 0.3 },
        { library: "polars", timeMs: 8.7, ratio: 0.04 },
        { library: "dplyr", timeMs: 39.4, ratio: 0.2 },
      ],
    },
    {
      operation: "pivotWider",
      sortOrder: 10,
      values: [
        { library: "tidy-ts", timeMs: 3.6, ratio: 1.0 },
        { library: "arquero", timeMs: 3.8, ratio: 1.0 },
        { library: "pandas", timeMs: 9.2, ratio: 2.5 },
        { library: "polars", timeMs: 3.6, ratio: 1.0 },
        { library: "dplyr", timeMs: 3.1, ratio: 0.8 },
      ],
    },
    {
      operation: "sort",
      sortOrder: 4,
      values: [
        { library: "tidy-ts", timeMs: 119.0, ratio: 1.0 },
        { library: "arquero", timeMs: 343.1, ratio: 2.9 },
        { library: "pandas", timeMs: 212.2, ratio: 1.8 },
        { library: "polars", timeMs: 55.8, ratio: 0.5 },
        { library: "dplyr", timeMs: 25.9, ratio: 0.2 },
      ],
    },
    {
      operation: "summarize",
      sortOrder: 11,
      values: [
        { library: "tidy-ts", timeMs: 64.0, ratio: 1.0 },
        { library: "arquero", timeMs: 40.8, ratio: 0.64 },
        { library: "pandas", timeMs: 8.3, ratio: 0.13 },
        { library: "polars", timeMs: 2.4, ratio: 0.04 },
        { library: "dplyr", timeMs: 7.5, ratio: 0.12 },
      ],
    },
  ],
};