import type { DocEntry } from "../mcp-types.ts";

export const countsDocs: Record<string, DocEntry> = {
  unique: {
    name: "s.unique",
    category: "stats",
    signature: "s.unique(values: T[]): T[]",
    description:
      "Get unique values from an array (WASM-optimized version). Returns unique values in order of first appearance.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: ["values: Array of values to get unique values from"],
    returns: "T[] - array with duplicates removed in order of first appearance",
    examples: [
      "s.unique([1, 2, 1, 3, 2]) // [1, 2, 3]",
      's.unique(["a", "b", "a", "c"]) // ["a", "b", "c"]',
      "s.unique([true, false, true]) // [true, false]",
    ],
    related: ["distinct", "mode", "uniqueCount", "countValue"],
  },

  uniqueCount: {
    name: "s.uniqueCount",
    category: "stats",
    signature: [
      "uniqueCount(value: number | string): number;",
      "uniqueCount(values: (number | string | null | undefined)[]): number;",
      "uniqueCount(values: Iterable<number | string>): number;",
      "uniqueCount(values: Iterable<number | string | null | undefined>): number;",
    ].join("\n"),
    description:
      "Count distinct values in an iterable or array. A single number or string argument always returns 1. Empty array returns 0.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "value: Single number or string → returns 1",
      "values: Array or iterable of numbers/strings (null/undefined treated per implementation)",
    ],
    returns: "number — count of unique values",
    examples: [
      "s.uniqueCount(42) // 1",
      "s.uniqueCount([1, 1, 2, 3]) // 3",
      's.uniqueCount(["a", "b", "a"]) // 2',
    ],
    related: ["unique", "countValue"],
  },

  countValue: {
    name: "s.countValue",
    category: "stats",
    signature: "countValue<T>(values: T[] | Iterable<T>, target: T): number",
    description:
      "Count how many times `target` appears in `values`. Uses WASM fast paths for numeric, string, and boolean columns; other types use a JS fallback.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array or iterable to scan",
      "target: Value to compare (same type as elements)",
    ],
    returns: "number — nonnegative count",
    examples: [
      "s.countValue([1, 2, 1, 3], 1) // 2",
      's.countValue(["a", "b", "a"], "a") // 2',
    ],
    related: ["unique", "uniqueCount"],
  },
};
