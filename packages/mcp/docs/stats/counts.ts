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
    related: ["distinct", "mode"],
  },
};
