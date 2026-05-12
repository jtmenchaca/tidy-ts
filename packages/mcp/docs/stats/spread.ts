import type { DocEntry } from "../mcp-types.ts";

export const spreadDocs: Record<string, DocEntry> = {
  stdev: {
    name: "s.stdev",
    category: "stats",
    signature:
      "s.stdev(values: number | Float64Array | readonly number[] | Iterable<number> | (number | null | undefined)[] | readonly (number | null | undefined)[], options?: { removeNull?: boolean; removeUndefined?: boolean; removeNaN?: boolean }): number | null",
    description:
      "Calculate the sample standard deviation of an array of values. Returns null if insufficient data. Type inference narrows return type based on removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "options.removeNull: If true, skips null values",
      "options.removeUndefined: If true, skips undefined values",
      "options.removeNaN: If true, skips NaN values",
    ],
    returns: "number | null",
    examples: [
      "s.stdev(42) // 0 (single value)",
      "s.stdev([1, 2, 3, 4, 5]) // sample standard deviation",
      "s.stdev([1, null, 3], { removeNull: true }) // std dev of [1, 3]",
      "s.stdev([1, NaN, 3], { removeNaN: true }) // std dev of [1, 3]",
      'df.groupBy("region").summarize({ std: group => s.stdev(group.sales) })',
    ],
    related: ["variance", "mean", "round"],
  },

  variance: {
    name: "s.variance",
    category: "stats",
    signature:
      "s.variance(values: number | Float64Array | readonly number[] | Iterable<number> | (number | null | undefined)[] | readonly (number | null | undefined)[], options?: { removeNull?: boolean; removeUndefined?: boolean; removeNaN?: boolean }): number | null",
    description:
      "Calculate the sample variance of an array of values (uses N-1 denominator). Returns null if insufficient data. Type inference narrows return type based on removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "options.removeNull: If true, skips null values",
      "options.removeUndefined: If true, skips undefined values",
      "options.removeNaN: If true, skips NaN values",
    ],
    returns: "number | null",
    examples: [
      "s.variance(42) // 0 (single value)",
      "s.variance([1, 2, 3, 4, 5]) // sample variance",
      "s.variance([1, null, 3], { removeNull: true }) // variance of [1, 3]",
      "s.variance([1, NaN, 3], { removeNaN: true }) // variance of [1, 3]",
    ],
    related: ["stdev", "mean"],
  },

  range: {
    name: "s.range",
    category: "stats",
    signature:
      "s.range(values: number | readonly number[] | Iterable<number> | (number | null | undefined)[] | readonly (number | null | undefined)[], options?: { removeNull?: boolean; removeUndefined?: boolean; removeNaN?: boolean }): number | null",
    description:
      "Calculate the range of values (max - min). Returns null if no valid values. Type inference narrows return type based on removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers, or single number",
      "options.removeNull: If true, skips null values",
      "options.removeUndefined: If true, skips undefined values",
      "options.removeNaN: If true, skips NaN values",
    ],
    returns: "number | null",
    examples: [
      "s.range(42) // 0 (single value)",
      "s.range([1, 5, 3, 9, 2]) // 8 (9 - 1)",
      "s.range([1, null, 9], { removeNull: true }) // 8",
    ],
    related: ["max", "min", "iqr"],
  },

  iqr: {
    name: "s.iqr",
    category: "stats",
    signature:
      "s.iqr(values: number | readonly number[] | Iterable<number> | (number | null | undefined)[] | readonly (number | null | undefined)[], options?: { removeNull?: boolean; removeUndefined?: boolean; removeNaN?: boolean }): number | null\n// Iterable overloads use CleanNumberIterable in source — packages/dataframe/ts/stats/descriptive/spread/iqr.ts",
    description:
      "Calculate the interquartile range (IQR) of values (Q75 - Q25). Returns null if no valid values. Type inference narrows return type based on removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "options.removeNull: If true, skips null values",
      "options.removeUndefined: If true, skips undefined values",
      "options.removeNaN: If true, skips NaN values",
    ],
    returns: "number | null",
    examples: [
      "s.iqr(42) // 0 (single value)",
      "s.iqr([1, 2, 3, 4, 5]) // 2 (Q75 - Q25 = 4 - 2)",
      "s.iqr([1, null, 5], { removeNull: true }) // IQR of [1, 5]",
      "s.iqr([1, NaN, 5], { removeNaN: true }) // IQR of [1, 5]",
    ],
    related: ["quartiles", "quantile", "range"],
  },
};
