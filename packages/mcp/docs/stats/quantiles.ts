import type { DocEntry } from "../mcp-types.ts";

export const quantilesDocs: Record<string, DocEntry> = {
  quantile: {
    name: "s.quantile",
    category: "stats",
    signature:
      "s.quantile(data: number[], probs: number | number[], removeNA?: boolean): number | number[] | null",
    description:
      "Calculate quantiles of an array of values. Uses R's Type 7 algorithm (default). Accepts single probability or array of probabilities.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "data: Array of numbers or single number",
      "probs: Probability value(s) between 0 and 1",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
    ],
    returns:
      "number | number[] | null - Single value or array depending on probs input",
    examples: [
      "const q50 = s.quantile([1, 2, 3, 4, 5], 0.5) // 3 (median)",
      "const [q25, q75] = s.quantile([1, 2, 3, 4, 5], [0.25, 0.75]) // [2, 4]",
    ],
    related: ["median", "quartiles", "iqr"],
  },

  quartiles: {
    name: "s.quartiles",
    category: "stats",
    signature:
      "s.quartiles(values: number[], removeNA?: boolean): [number, number, number] | null",
    description:
      "Calculate the quartiles (Q25, median/Q50, Q75) of values. Returns null if no valid values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or values that can contain null/undefined, or single number",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
    ],
    returns: "[Q25, Q50, Q75] tuple or null",
    examples: [
      "s.quartiles(42) // Always returns [42, 42, 42] for single value",
      "const [q25, q50, q75] = s.quartiles([1, 2, 3, 4, 5]) // [2, 3, 4]",
    ],
    related: ["quantile", "iqr", "median"],
  },
};
