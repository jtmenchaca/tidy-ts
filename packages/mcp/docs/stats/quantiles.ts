import type { DocEntry } from "../mcp-types.ts";

export const quantilesDocs: Record<string, DocEntry> = {
  quantile: {
    name: "s.quantile",
    category: "stats",
    signature:
      "s.quantile(data, probs, options?): number | number[] | null\n// data: number | Float64Array | arrays / iterables / nullable variants; probs: number | number[] — full overloads in packages/dataframe/ts/stats/descriptive/quantiles/quantile.ts",
    description:
      "Calculate quantiles of an array of values. Uses R's Type 7 algorithm (default). Accepts single probability or array of probabilities. Type inference narrows return type based on removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "data: Single number, Float64Array, numeric arrays, Iterables, or nullable numeric arrays",
      "probs: One probability in [0,1] or an array of probabilities",
      "options.removeNull / removeUndefined / removeNaN: Optional filtering flags",
    ],
    returns:
      "number | number[] | null - Single value or array depending on probs input",
    examples: [
      "s.quantile([1, 2, 3, 4, 5], 0.5) // 3 (median)",
      "s.quantile([1, 2, 3, 4, 5], [0.25, 0.75]) // [2, 4]",
      "s.quantile([1, null, 5], 0.5) // null (null present)",
      "s.quantile([1, null, 5], 0.5, { removeNull: true }) // 3",
      "s.quantile([1, NaN, 5], 0.5, { removeNaN: true }) // 3",
    ],
    related: ["median", "quartiles", "iqr"],
  },

  quartiles: {
    name: "s.quartiles",
    category: "stats",
    signature:
      "s.quartiles(values, options?): [number, number, number] | null\n// values: number | readonly number[] | Iterable<number> | nullable arrays — packages/dataframe/ts/stats/descriptive/quantiles/quartiles.ts",
    description:
      "Calculate the quartiles (Q25, median/Q50, Q75) of values. Returns null if no valid values. Type inference narrows return type based on removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Single number, numeric arrays, Iterables, or nullable variants (see source)",
      "options.removeNull: If true, skips null values",
      "options.removeUndefined: If true, skips undefined values",
      "options.removeNaN: If true, skips NaN values",
    ],
    returns: "[Q25, Q50, Q75] tuple or null",
    examples: [
      "s.quartiles(42) // [42, 42, 42] (single value)",
      "s.quartiles([1, 2, 3, 4, 5]) // [2, 3, 4]",
      "s.quartiles([1, null, 5]) // null (null present)",
      "s.quartiles([1, null, 5], { removeNull: true }) // quartiles of [1, 5]",
      "s.quartiles([1, NaN, 5], { removeNaN: true }) // quartiles of [1, 5]",
    ],
    related: ["quantile", "iqr", "median"],
  },
};
