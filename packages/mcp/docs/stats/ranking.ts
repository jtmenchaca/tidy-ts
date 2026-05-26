import type { DocEntry } from "../mcp-types.ts";

export const rankingDocs: Record<string, DocEntry> = {
  rank: {
    name: "s.rank",
    category: "stats",
    signature:
      's.rank(values: number[], options?: { ties?: "average" | "min" | "max" | "dense" | "first"; desc?: boolean }): number[] | (number | null)[] OR s.rank(values: number[], target: number): number | null',
    description:
      "Calculate ranks for an array of values. Supports finding rank of all values or a specific target value. Handles ties via the `ties` option, including `\"first\"` for strictly unique 1..n ranks broken by encounter order.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      'options.ties: How to handle ties: "average" (default), "min", "max", "dense", "first"',
      "options.desc: Whether to rank in descending order (default: false = ascending)",
      "target: Single positional argument for target lookup (returns single rank)",
    ],
    returns: "number[] for all ranks OR number | null for target rank",
    examples: [
      "s.rank([3, 1, 4, 1, 5]) // [3, 1.5, 4, 1.5, 5] (default: average)",
      's.rank([3, 1, 4, 1, 5], { ties: "min" }) // [3, 1, 4, 1, 5]',
      's.rank([3, 1, 4, 1, 5], { ties: "max" }) // [3, 2, 4, 2, 5]',
      's.rank([3, 1, 4, 1, 5], { ties: "first" }) // [3, 1, 4, 2, 5] (unique 1..n)',
      's.rank([3, 1, 4, 1, 5], { ties: "average", desc: true }) // descending',
      "s.rank([3, 1, 4, 1, 5], 3) // 3 (rank of value 3)",
    ],
    related: ["denseRank", "percentileRank", "rowNumber"],
  },

  rowNumber: {
    name: "s.rowNumber",
    category: "stats",
    signature:
      "s.rowNumber(length: number): number[] OR s.rowNumber(values: ArrayLike<unknown> | Iterable<unknown>): number[]",
    description:
      "Generate 1-based row positions: [1, 2, ..., n]. Useful in `mutateOverGroup` for per-group running counts or position labels without hand-rolling `Array.from(...)`.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "length: Non-negative integer count, OR",
      "values: Any array, typed array, or iterable; the function uses its length.",
    ],
    returns: "number[] of length n with values 1..n",
    examples: [
      "s.rowNumber(5) // [1, 2, 3, 4, 5]",
      "s.rowNumber([10, 20, 30]) // [1, 2, 3]",
      "df.groupBy('species').mutateOverGroup({ position: (g) => s.rowNumber(g.nrows()) })",
    ],
    related: ["rank", "denseRank", "cumsum"],
  },

  denseRank: {
    name: "s.denseRank",
    category: "stats",
    signature:
      "s.denseRank(values: T[], options?: { desc?: boolean }): number[] OR s.denseRank(values: T[], target: T, options?: { desc?: boolean }): number | null",
    description:
      "Calculate dense rank of values (no gaps in ranking). Unlike regular rank, has no gaps after tied values. Supports finding rank of all values or a specific target value.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of values to rank",
      "options: Ranking options with desc for descending order (default: false)",
      "target: Optional - The value to find the dense rank for (returns single rank)",
    ],
    returns: "number[] for all ranks OR number | null for target rank",
    examples: [
      "s.denseRank([10, 20, 20, 30])  // [1, 2, 2, 3] (no gap after ties)",
      "s.denseRank([5, 3, 8, 3, 1])   // [3, 2, 4, 2, 1]",
      "s.denseRank([10, 20, 20, 30], { desc: true })  // [4, 3, 3, 1]",
    ],
    related: ["rank", "percentileRank"],
  },

  percentileRank: {
    name: "s.percentile_rank",
    category: "stats",
    signature:
      "s.percentile_rank(values: number[]): number[] | (number | null)[] OR s.percentile_rank(values: number[], target: number): number | null",
    description:
      "Calculate the percentile rank of a value within an array. Returns a value between 0 and 1 representing the percentile rank. If target is not provided, returns percentile ranks for all values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "target: Optional - The value to find the percentile rank for (between 0 and 1)",
    ],
    returns:
      "number | null for single target OR number[] | (number | null)[] for all values",
    examples: [
      "s.percentile_rank([1, 2, 3, 4, 5], 3) // 0.6 (3 is at 60th percentile)",
      "s.percentile_rank([10, 20, 30, 40, 50], 25) // 0.4 (25 is at 40th percentile)",
      "s.percentile_rank([1, 2, 3, 4, 5]) // [0.2, 0.4, 0.6, 0.8, 1.0]",
    ],
    related: ["rank", "denseRank", "quantile"],
  },
};
