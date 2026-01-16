import type { DocEntry } from "../mcp-types.ts";

export const cumulativeDocs: Record<string, DocEntry> = {
  cumsum: {
    name: "s.cumsum",
    category: "stats",
    signature:
      "s.cumsum(values: number[], removeNA?: boolean): number | number[] | (number | null)[]",
    description:
      "Calculate cumulative sums for an array of values. Returns array where each element is the sum of all previous elements.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
    ],
    returns: "number | number[] | (number | null)[]",
    examples: [
      "s.cumsum([1, 2, 3, 4, 5]) // [1, 3, 6, 10, 15]",
      "s.cumsum([1, null, 3, 4], true) // [1, 1, 4, 8] - removes nulls",
    ],
    related: ["sum", "cummean", "cumprod"],
  },

  cummean: {
    name: "s.cummean",
    category: "stats",
    signature:
      "s.cummean(values: number[], removeNA?: boolean): number | number[] | (number | null)[]",
    description:
      "Calculate cumulative mean of values. Returns an array where each element is the mean of all values up to that point.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
    ],
    returns: "number | number[] | (number | null)[]",
    examples: [
      "s.cummean([1, 2, 3, 4])  // [1, 1.5, 2, 2.5]",
      "s.cummean([1, null, 3, 4, 5], true)  // [1, 1, 2, 2.5, 3]",
    ],
    related: ["cumsum", "mean", "rolling"],
  },

  cumprod: {
    name: "s.cumprod",
    category: "stats",
    signature:
      "s.cumprod(values: number[], removeNA?: boolean): number | number[] | (number | null)[]",
    description:
      "Calculate cumulative product of numeric values. Returns array where each element is the product of all previous elements.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
    ],
    returns: "number | number[] | (number | null)[]",
    examples: [
      "s.cumprod([1, 2, 3, 4, 5]) // [1, 2, 6, 24, 120]",
      "s.cumprod([1, null, 3, 4], true) // [1, 1, 3, 12] - removes nulls",
    ],
    related: ["cumsum", "product"],
  },

  cummax: {
    name: "s.cummax",
    category: "stats",
    signature:
      "s.cummax(values: number[], removeNA?: boolean): number | number[] | (number | null)[]",
    description:
      "Calculate cumulative maximum of numeric values. Returns array where each element is the max of all previous elements.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
    ],
    returns: "number | number[] | (number | null)[]",
    examples: [
      "s.cummax([1, 2, 3, 4, 5]) // [1, 2, 3, 4, 5]",
      "s.cummax([1, null, 3, 4], true) // [1, 1, 3, 4] - removes nulls",
    ],
    related: ["cummin", "max"],
  },

  cummin: {
    name: "s.cummin",
    category: "stats",
    signature:
      "s.cummin(values: number[], removeNA?: boolean): number | number[] | (number | null)[]",
    description:
      "Calculate cumulative minimum of numeric values. Returns array where each element is the min of all previous elements.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
    ],
    returns: "number | number[] | (number | null)[]",
    examples: [
      "s.cummin([1, 2, 3, 4, 5]) // [1, 1, 1, 1, 1]",
      "s.cummin([1, null, 3, 4], true) // [1, 1, 1, 1] - removes nulls",
    ],
    related: ["cummax", "min"],
  },
};
