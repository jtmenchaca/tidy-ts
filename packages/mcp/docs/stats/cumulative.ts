import type { DocEntry } from "../mcp-types.ts";

export const cumulativeDocs: Record<string, DocEntry> = {
  cumsum: {
    name: "s.cumsum",
    category: "stats",
    signature:
      "s.cumsum(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number[]",
    description:
      "Calculate cumulative sums for an array of values. Returns array where each element is the sum of all previous elements. Type inference narrows return type based on input array type and removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers (or array with nulls/undefined)",
      "options.removeNull: If true, skips null values in accumulation",
      "options.removeUndefined: If true, skips undefined values in accumulation",
      "options.removeNaN: If true, skips NaN values (otherwise NaN propagates)",
    ],
    returns:
      "number[] for clean arrays; (number | null)[] for nullable arrays without removal flags",
    examples: [
      "s.cumsum([1, 2, 3, 4, 5]) // [1, 3, 6, 10, 15]",
      "s.cumsum([1, null, 3, 4]) // [null, null, null, null] - null propagates",
      "s.cumsum([1, null, 3, 4], { removeNull: true }) // [1, 1, 4, 8]",
      "s.cumsum([1, NaN, 3], { removeNaN: true }) // [1, 1, 4]",
    ],
    related: ["sum", "cummean", "cumprod"],
  },

  cummean: {
    name: "s.cummean",
    category: "stats",
    signature:
      "s.cummean(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number[]",
    description:
      "Calculate cumulative mean of values. Returns an array where each element is the mean of all values up to that point.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers (or array with nulls/undefined)",
      "options.removeNull: If true, skips null values in mean calculation",
      "options.removeUndefined: If true, skips undefined values",
      "options.removeNaN: If true, skips NaN values",
    ],
    returns:
      "number[] for clean arrays; (number | null)[] for nullable arrays without removal flags",
    examples: [
      "s.cummean([1, 2, 3, 4])  // [1, 1.5, 2, 2.5]",
      "s.cummean([1, null, 3, 4, 5], { removeNull: true })  // [1, 1, 2, 2.67, 3.25]",
    ],
    related: ["cumsum", "mean", "rolling"],
  },

  cumprod: {
    name: "s.cumprod",
    category: "stats",
    signature:
      "s.cumprod(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number[]",
    description:
      "Calculate cumulative product of numeric values. Returns array where each element is the product of all previous elements.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers (or array with nulls/undefined)",
      "options.removeNull: If true, skips null values in product calculation",
      "options.removeUndefined: If true, skips undefined values",
      "options.removeNaN: If true, skips NaN values",
    ],
    returns:
      "number[] for clean arrays; (number | null)[] for nullable arrays without removal flags",
    examples: [
      "s.cumprod([1, 2, 3, 4, 5]) // [1, 2, 6, 24, 120]",
      "s.cumprod([1, null, 3, 4], { removeNull: true }) // [1, 1, 3, 12]",
    ],
    related: ["cumsum", "product"],
  },

  cummax: {
    name: "s.cummax",
    category: "stats",
    signature:
      "s.cummax(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number[]",
    description:
      "Calculate cumulative maximum of numeric values. Returns array where each element is the max of all previous elements.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers (or array with nulls/undefined)",
      "options.removeNull: If true, skips null values",
      "options.removeUndefined: If true, skips undefined values",
      "options.removeNaN: If true, skips NaN values",
    ],
    returns:
      "number[] for clean arrays; (number | null)[] for nullable arrays without removal flags",
    examples: [
      "s.cummax([1, 3, 2, 5, 4]) // [1, 3, 3, 5, 5]",
      "s.cummax([1, null, 3, 4], { removeNull: true }) // [1, 1, 3, 4]",
    ],
    related: ["cummin", "max"],
  },

  cummin: {
    name: "s.cummin",
    category: "stats",
    signature:
      "s.cummin(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number[]",
    description:
      "Calculate cumulative minimum of numeric values. Returns array where each element is the min of all previous elements.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers (or array with nulls/undefined)",
      "options.removeNull: If true, skips null values",
      "options.removeUndefined: If true, skips undefined values",
      "options.removeNaN: If true, skips NaN values",
    ],
    returns:
      "number[] for clean arrays; (number | null)[] for nullable arrays without removal flags",
    examples: [
      "s.cummin([5, 3, 4, 1, 2]) // [5, 3, 3, 1, 1]",
      "s.cummin([3, null, 1, 4], { removeNull: true }) // [3, 3, 1, 1]",
    ],
    related: ["cummax", "min"],
  },
};
