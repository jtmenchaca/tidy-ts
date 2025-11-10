import type { DocEntry } from "./mcp-types.ts";

export const statsDocs: Record<string, DocEntry> = {
  // Descriptive Statistics
  mean: {
    name: "s.mean",
    category: "stats",
    signature: "s.mean(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the arithmetic mean (average) of numeric values. Returns null if no valid values. Can be chained with s.round() without assertions.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: A single number or array of numbers",
      "removeNA: Whether to exclude null/undefined values (when using mixed arrays)",
    ],
    returns: "number | null - The arithmetic mean of all numeric values",
    examples: [
      "s.mean(5) // 5",
      "s.mean([1, 2, 3, 4]) // 2.5",
      "s.mean([1, 2, null, 4], true) // 2.33",
      'df.groupBy("region").summarize({ avg: group => s.mean(group.sales) })',
      "// Chain with s.round() - no assertions needed!",
      'df.groupBy("region").summarize({ avg: group => s.round(s.mean(group.sales), 2) })',
    ],
    related: ["median", "mode", "sd", "round"],
    antiPatterns: [
      "❌ BAD: values.reduce((a, b) => a + b, 0) / values.length",
      "❌ BAD: s.round(s.mean(values)!, 2) // Unnecessary - s.round() handles null at runtime",
    ],
    bestPractices: [
      "✓ GOOD: s.mean(values) - built-in, faster, handles edge cases",
      "✓ GOOD: Use with df.columnName for direct access: s.mean(df.age)",
      "✓ GOOD: Chain with s.round() directly: s.round(s.mean(values), 2) - no assertions needed",
      "✓ GOOD: s.round() handles null at runtime, so no need for s.round(s.mean(values)!, 2)",
    ],
  },

  median: {
    name: "s.median",
    category: "stats",
    signature:
      "s.median(values: number[]): number | s.median(values: (number | null)[], removeNA?: boolean): number | null",
    description:
      "Calculate the median (50th percentile). Returns number for clean arrays, or number | null for arrays with nulls/mixed types (when removeNA=false, the default).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers (or array with nulls)",
      "removeNA: If true, guarantees number return; if false (default), may return null",
    ],
    returns: "number for clean arrays, number | null for arrays with nulls",
    examples: [
      "s.median([1, 2, 3, 4, 5]) // 3 (number)",
      "s.median(df.sales) // number (if df.sales is clean)",
      "s.median([1, null, 3, 4]) // 2.5 (number | null - may be null if no valid values)",
      'df.groupBy("region").summarize({ median_price: group => s.median(group.price) })',
    ],
    related: ["mean", "quantile"],
    antiPatterns: [
      "❌ BAD: [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]",
      "❌ BAD: s.median(values)! // May be unnecessary - check if array has nulls first",
    ],
    bestPractices: [
      "✓ GOOD: s.median(values) - handles even/odd lengths correctly",
      "✓ GOOD: For clean arrays, returns number - no assertions needed",
      "✓ GOOD: For arrays with nulls, returns number | null - handle null appropriately",
    ],
  },

  sum: {
    name: "s.sum",
    category: "stats",
    signature: "s.sum(values: number[]): number",
    description: "Calculate the sum of all values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: ["values: Array of numbers"],
    returns: "number",
    examples: [
      "s.sum([1, 2, 3, 4, 5]) // 15",
      "s.sum(df.revenue)",
      'df.groupBy("region").summarize({ total: group => s.sum(group.sales) })',
    ],
    related: ["mean", "cumsum"],
    antiPatterns: [
      "❌ BAD: values.reduce((a, b) => a + b, 0)",
    ],
    bestPractices: [
      "✓ GOOD: s.sum(values) - clearer intent, handles edge cases",
    ],
  },

  max: {
    name: "s.max",
    category: "stats",
    signature:
      "s.max(values: number[]): number | s.max(values: (number | null)[], removeNA?: boolean): number | null",
    description:
      "Find the maximum value. Returns number for clean arrays, or number | null for arrays with nulls/mixed types (when removeNA=false, the default).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers (or array with nulls)",
      "removeNA: If true, guarantees number return; if false (default), may return null",
    ],
    returns: "number for clean arrays, number | null for arrays with nulls",
    examples: [
      "s.max([1, 2, 3, 4, 5]) // 5 (number)",
      "s.max(df.price) // number (if df.price is clean)",
      "s.max([1, null, 3]) // 3 (number | null - may be null if no valid values)",
      'df.groupBy("region").summarize({ max_price: group => s.max(group.price) })',
    ],
    bestPractices: [
      "✓ GOOD: For clean number arrays, returns number - no assertions needed",
      "✓ GOOD: For arrays with nulls, returns number | null - handle null appropriately",
      "✓ GOOD: Use removeNA: true if you want guaranteed number return",
    ],
    related: ["min", "cummax"],
  },

  min: {
    name: "s.min",
    category: "stats",
    signature:
      "s.min(values: number[]): number | s.min(values: (number | null)[], removeNA?: boolean): number | null",
    description:
      "Find the minimum value. Returns number for clean arrays, or number | null for arrays with nulls/mixed types (when removeNA=false, the default).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers (or array with nulls)",
      "removeNA: If true, guarantees number return; if false (default), may return null",
    ],
    returns: "number for clean arrays, number | null for arrays with nulls",
    examples: [
      "s.min([1, 2, 3, 4, 5]) // 1 (number)",
      "s.min(df.price) // number (if df.price is clean)",
      "s.min([1, null, 3]) // 1 (number | null - may be null if no valid values)",
      'df.groupBy("region").summarize({ min_price: group => s.min(group.price) })',
    ],
    bestPractices: [
      "✓ GOOD: For clean number arrays, returns number - no assertions needed",
      "✓ GOOD: For arrays with nulls, returns number | null - handle null appropriately",
      "✓ GOOD: Use removeNA: true if you want guaranteed number return",
    ],
    related: ["max", "cummin"],
  },

  mode: {
    name: "s.mode",
    category: "stats",
    signature: "s.mode(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the mode (most frequent value) of an array. Returns null if no valid values and removeNA=false.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, guarantees a number return (throws if no valid values)",
    ],
    returns: "number | null",
    examples: [
      "s.mode(42) // Always returns the single value",
      "s.mode([1, 1, 2, 3, 3, 3]) // 3 (always number for clean array)",
      "s.mode([null, 2, 3], false) // 3 (or null if no valid values)",
      "s.mode([null, 2, 3], true) // 3 (guaranteed number or throws)",
    ],
    related: ["mean", "median", "unique"],
  },

  stdev: {
    name: "s.stdev",
    category: "stats",
    signature: "s.stdev(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the sample standard deviation of an array of values. Returns null if insufficient data or removeNA=false with mixed types. Can be chained with s.round() without assertions.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, processes valid numbers from mixed arrays; if false, returns null for mixed arrays",
    ],
    returns: "number | null",
    examples: [
      "s.stdev(42) // Always returns 0 for single value",
      "s.stdev([1, 2, 3, 4, 5]) // sample standard deviation (default)",
      's.stdev([1, "2", 3], true) // 1.41... (std dev of [1, 3] with removeNA=true)',
      's.stdev([1, "2", 3], false) // null (mixed types, removeNA=false)',
      "// Chain with s.round() - no assertions needed!",
      'df.groupBy("region").summarize({ std: group => s.round(s.stdev(group.sales), 2) })',
    ],
    antiPatterns: [
      "❌ BAD: s.round(s.stdev(values)!, 2) // Unnecessary - s.round() handles null at runtime",
    ],
    bestPractices: [
      "✓ GOOD: Chain with s.round() directly: s.round(s.stdev(values), 2) - no assertions needed",
      "✓ GOOD: s.round() handles null at runtime, so no need for s.round(s.stdev(values)!, 2)",
    ],
    related: ["variance", "mean", "round"],
  },

  variance: {
    name: "s.variance",
    category: "stats",
    signature:
      "s.variance(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the sample variance of an array of values (uses N-1 denominator). Returns null if insufficient data.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, processes valid numbers from mixed arrays; if false, returns null for mixed arrays",
    ],
    returns: "number | null",
    examples: [
      "s.variance(42) // Always returns 0 for single value",
      "s.variance([1, 2, 3, 4, 5]) // sample variance (default)",
      's.variance([1, "2", 3], true) // 1 (variance of [1, 3] with removeNA=true)',
      's.variance([1, "2", 3], false) // null (mixed types, removeNA=false)',
    ],
    related: ["sd", "mean"],
  },

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

  iqr: {
    name: "s.iqr",
    category: "stats",
    signature: "s.iqr(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the interquartile range (IQR) of values (Q75 - Q25). Returns null if no valid values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
    ],
    returns: "number | null",
    examples: [
      "s.iqr(42) // Always returns 0 for single value",
      "const iqr_val = s.iqr([1, 2, 3, 4, 5]) // 2 (4 - 2)",
    ],
    related: ["quartiles", "quantile", "range"],
  },

  range: {
    name: "s.range",
    category: "stats",
    signature: "s.range(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the range of values (max - min). Returns null if no valid values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers, or single number",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
    ],
    returns: "number | null",
    examples: [
      "s.range(42) // Always returns 0 for single value",
      "const r = s.range([1, 5, 3, 9, 2]) // 8 (9 - 1)",
    ],
    related: ["max", "min", "iqr"],
  },

  product: {
    name: "s.product",
    category: "stats",
    signature: "s.product(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the product (multiplication) of all values. Returns null if no valid values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, guarantees a number return (throws if no valid values)",
    ],
    returns: "number | null",
    examples: [
      "s.product(5) // 5",
      "s.product([1, 2, 3, 4]) // 24",
      "s.product([2, null, 3], false) // null (due to null)",
      "s.product([2, null, 3], true) // 6 (ignoring null)",
    ],
    related: ["sum", "cumprod"],
  },

  // Window Functions
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
    related: ["cumsum", "mean"],
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

  lag: {
    name: "s.lag",
    category: "stats",
    signature:
      "s.lag(values: T[], k?: number, defaultValue?: T): (T | undefined)[] OR s.lag(columnName: string, k?: number, defaultValue?: T): (row, index, df) => T | undefined",
    description:
      "Lag values by k positions (shift forward, filling with default). Supports two usage patterns: array-based and column-based (for use in mutate).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "valuesOrColumnName: Array of values to lag OR column name for DataFrame operations",
      "k: Number of positions to lag (default: 1)",
      "defaultValue: Value to fill missing positions (default: undefined)",
    ],
    returns:
      "Array with values lagged by k positions OR function for mutate operations",
    examples: [
      "// Array-based usage",
      "s.lag([1, 2, 3, 4, 5])  // [undefined, 1, 2, 3, 4]",
      "s.lag([1, 2, 3, 4, 5], 2)  // [undefined, undefined, 1, 2, 3]",
      "s.lag([1, 2, 3, 4, 5], 1, 0)  // [0, 1, 2, 3, 4]",
      "// Column-based usage in mutate",
      'df.mutate({ prev_sales: s.lag("sales", 1, 0) })',
    ],
    related: ["lead"],
  },

  lead: {
    name: "s.lead",
    category: "stats",
    signature:
      "s.lead(values: T[], k?: number, defaultValue?: T): (T | undefined)[] OR s.lead(columnName: string, k?: number, defaultValue?: T): (row, index, df) => T | undefined",
    description:
      "Lead values by k positions (shift backward, filling with default). Supports two usage patterns: array-based and column-based (for use in mutate).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "valuesOrColumnName: Array of values to lead OR column name for DataFrame operations",
      "k: Number of positions to lead (default: 1)",
      "defaultValue: Value to fill missing positions (default: undefined)",
    ],
    returns:
      "Array with values led by k positions OR function for mutate operations",
    examples: [
      "// Array-based usage",
      "s.lead([1, 2, 3, 4, 5])  // [2, 3, 4, 5, undefined]",
      "s.lead([1, 2, 3, 4, 5], 2)  // [3, 4, 5, undefined, undefined]",
      "s.lead([1, 2, 3, 4, 5], 1, 0)  // [2, 3, 4, 5, 0]",
      "// Column-based usage in mutate",
      'df.mutate({ next_sales: s.lead("sales", 1, 0) })',
    ],
    related: ["lag"],
  },

  // Ranking Functions
  rank: {
    name: "s.rank",
    category: "stats",
    signature:
      's.rank(values: number[], ties?: "average" | "min" | "max" | "dense", descending?: boolean): number[] | (number | null)[] OR s.rank(values: number[], target: number): number | null',
    description:
      "Calculate ranks for an array of values. Supports finding rank of all values or a specific target value. Handles ties using specified method including dense ranking.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      'ties: How to handle ties: "average" (default), "min", "max", "dense"',
      "descending: Whether to rank in descending order (default: false = ascending)",
      "target: Optional - The value to find the rank for (returns single rank)",
    ],
    returns: "number[] for all ranks OR number | null for target rank",
    examples: [
      "s.rank([3, 1, 4, 1, 5]) // [3, 1.5, 4, 1.5, 5] (average)",
      's.rank([3, 1, 4, 1, 5], "min") // [3, 1, 4, 1, 5]',
      's.rank([3, 1, 4, 1, 5], "max") // [3, 2, 4, 2, 5]',
      's.rank([3, 1, 4, 1, 5], "average", true) // descending order',
      "s.rank([3, 1, 4, 1, 5], 3) // 3 (rank of value 3)",
    ],
    related: ["denseRank", "percentileRank"],
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

  chunk: {
    name: "s.chunk",
    category: "stats",
    signature: "s.chunk<T>(arr: T[], size: number): T[][]",
    description:
      "Split an array into chunks of specified size. The last chunk may be smaller if the array length is not evenly divisible by the chunk size.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "arr: Array to split into chunks",
      "size: Size of each chunk (must be positive integer)",
    ],
    returns: "Array of chunks, where each chunk is an array of elements",
    examples: [
      "s.chunk([1, 2, 3, 4, 5, 6, 7], 3) // [[1, 2, 3], [4, 5, 6], [7]]",
      "s.chunk(['a', 'b', 'c', 'd'], 2) // [['a', 'b'], ['c', 'd']]",
      "s.chunk([1, 2, 3], 1) // [[1], [2], [3]]",
      "s.chunk([1, 2, 3], 10) // [[1, 2, 3]] (chunk size larger than array)",
    ],
    related: ["batch"],
    bestPractices: [
      "✓ GOOD: Use for batch processing large datasets",
      "✓ GOOD: Useful for pagination or splitting work into parallel tasks",
      "✓ GOOD: Works with any array type (numbers, strings, objects)",
      "✓ GOOD: Combine with s.batch() for concurrent async processing",
    ],
  },

  batch: {
    name: "s.batch",
    category: "stats",
    signature:
      "s.batch<T, R>(items: T[], fn: (item: T, index: number) => Promise<R>, options?: ConcurrencyOptions): Promise<R[]>",
    description:
      "Process an array of items with an async function, applying concurrency control, batching, and retry logic. Provides fine-grained control over async operations to prevent overwhelming servers.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "items: Array of items to process",
      "fn: Async function to apply to each item (receives item and index)",
      "options.concurrency: Maximum number of concurrent operations (default: 1)",
      "options.batchSize: Process items in batches of this size (default: undefined)",
      "options.batchDelay: Delay in milliseconds between batches (default: 0)",
      'options.retry.backoff: Retry strategy - "exponential" | "linear" | "custom"',
      "options.retry.maxRetries: Maximum retry attempts (default: 3 when retry enabled)",
      "options.retry.baseDelay: Initial retry delay in ms (default: 100)",
      "options.retry.maxDelay: Maximum delay between retries in ms (default: 5000)",
      "options.retry.backoffMultiplier: Multiplier for exponential backoff (default: 2)",
      "options.retry.shouldRetry: Function to determine if error should trigger retry",
      "options.retry.onRetry: Callback when retry occurs (error, attempt, taskIndex)",
    ],
    returns: "Promise<R[]> - Array of results in same order as input",
    examples: [
      "// Basic usage with concurrency limit\nawait s.batch(userIds, async (id) => fetchUser(id), { concurrency: 5 })",
      "// Batch processing with delays\nawait s.batch(apiCalls, async (call) => makeRequest(call), { batchSize: 100, batchDelay: 50 })",
      "// With exponential backoff retry\nawait s.batch(tasks, async (task) => processTask(task), {\n  concurrency: 5,\n  retry: {\n    backoff: 'exponential',\n    maxRetries: 3,\n    baseDelay: 100\n  }\n})",
      "// Combine with s.chunk for batch processing\nconst batches = s.chunk(ids, 300);\nawait s.batch(batches, async (batch) => processBatch(batch), { concurrency: 2 })",
      "// With custom retry logic\nawait s.batch(items, async (item) => process(item), {\n  retry: {\n    backoff: 'exponential',\n    maxRetries: 5,\n    shouldRetry: (error) => error.message.includes('rate limit')\n  }\n})",
    ],
    related: ["chunk", "parallel"],
    bestPractices: [
      "✓ GOOD: Use concurrency limits to prevent overwhelming APIs (concurrency: 5-10)",
      "✓ GOOD: Use batchSize + batchDelay for rate-limited APIs",
      "✓ GOOD: Add retry logic for unreliable network operations",
      "✓ GOOD: Combine s.chunk() and s.batch() for nested batch processing",
      "✓ GOOD: Use shouldRetry to filter which errors trigger retries",
      "✓ GOOD: Use s.parallel() instead when working with already-created promises",
      "❌ BAD: Promise.all() with no concurrency control on large arrays",
      "❌ BAD: No retry logic for network operations",
    ],
  },

  parallel: {
    name: "s.parallel",
    category: "stats",
    signature:
      "s.parallel<T>(promises: Array<Promise<T> | (() => Promise<T>)>, options?: { concurrency?: number; retry?: RetryOptions }): Promise<T[]>",
    description:
      "Process an array of promises with concurrency control and retry logic. Enhanced replacement for Promise.all that accepts both promises and functions. For retry to work properly, pass functions that create promises instead of already-created promises.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "promises: Array of promises OR functions that create promises",
      "options.concurrency: Maximum concurrent operations (default: Infinity - all in parallel)",
      'options.retry.backoff: Retry strategy - "exponential" | "linear" | "custom"',
      "options.retry.maxRetries: Maximum retry attempts (default: 3)",
      "options.retry.baseDelay: Initial retry delay in ms (default: 100)",
      "options.retry.maxDelay: Maximum delay between retries in ms (default: 5000)",
      "options.retry.backoffMultiplier: Multiplier for exponential backoff (default: 2)",
      "options.retry.shouldRetry: Function to determine if error should trigger retry",
      "options.retry.onRetry: Callback when retry occurs",
    ],
    returns: "Promise<T[]> - Array of results in same order as input",
    examples: [
      "// Basic usage like Promise.all\nconst results = await s.parallel([fetchUser(1), fetchUser(2), fetchUser(3)])",
      "// With concurrency limit\nconst results = await s.parallel(promises, { concurrency: 5 })",
      "// With retry - use functions for proper retry support\nconst results = await s.parallel(\n  [() => fetch(url1), () => fetch(url2)],\n  { retry: { backoff: 'exponential', maxRetries: 3 } }\n)",
      "// Mix promises and functions\nconst results = await s.parallel([\n  fetchUser(1),      // Promise - no retry\n  () => fetchUser(2) // Function - can retry\n])",
    ],
    related: ["batch"],
    bestPractices: [
      "✓ GOOD: Use s.parallel() instead of Promise.all() for concurrency control",
      "✓ GOOD: Pass functions (() => Promise) for retry support, not already-created promises",
      "✓ GOOD: Use concurrency limits to prevent overwhelming servers",
      "✓ GOOD: Default behavior (no options) works exactly like Promise.all()",
      "✓ GOOD: Use s.batch() when you need to map over items (better for processing arrays of data)",
      "❌ BAD: Passing already-created promises with retry enabled (retry won't work)",
      "❌ BAD: Using Promise.all() with large arrays of API calls",
    ],
  },

  // Transformation Functions
  normalize: {
    name: "s.normalize",
    category: "stats",
    signature:
      's.normalize(values: number[], method?: "minmax" | "zscore"): number[] | (number | null)[] OR s.normalize(values: number[], target: number, method?: "minmax" | "zscore"): number | null',
    description:
      "Normalize values to 0-1 range using min-max normalization or z-score standardization. Supports finding normalized value for all values or a specific target value.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      'method: Normalization method: "minmax" (default) or "zscore"',
      "target: Optional - The value to find the normalized value for",
    ],
    returns: "number[] for all values OR number | null for target value",
    examples: [
      "s.normalize([10, 20, 30]) // [0, 0.5, 1] (min-max normalization)",
      's.normalize([10, 20, 30], "zscore") // z-scores with mean=0, std=1',
      "s.normalize([10, 20, 30], 20) // 0.5 (20 is halfway between 10 and 30)",
      's.normalize([10, 20, 30], 20, "zscore") // z-score of 20',
    ],
    related: ["sd", "mean"],
  },

  round: {
    name: "s.round",
    category: "stats",
    signature:
      "s.round(value: number | null | number[], digits?: number): number | null | number[]",
    description:
      "Round a number or all values in an array to a specified number of decimal places. Accepts null values and returns null when given null (useful for chaining with s.mean(), s.stdev(), s.max(), s.min(), or s.median() which return number | null).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "value: Number, null, or array of numbers to round",
      "digits: Number of decimal places (default: 0)",
    ],
    returns: "number, null, or number[] (returns null if input is null)",
    examples: [
      "s.round(3.14159) // 3",
      "s.round(3.14159, 2) // 3.14",
      "s.round(123.456, 1) // 123.5",
      "s.round(123.456, -1) // 120",
      "s.round([1.234, 2.567, 3.891], 2) // [1.23, 2.57, 3.89]",
      "s.round(null) // null (returns null when given null)",
      "// Works with nullable stats functions - no assertions needed!",
      "s.round(s.mean([1, 2, 3]), 2) // 2.0",
      "s.round(s.mean([null, null]), 2) // null (mean returns null, round handles it)",
      "s.round(s.stdev([1, 2, 3]), 2) // 1.0",
      "s.round(s.max([1, null, 3]), 2) // 3.0 (or null if max returns null)",
      'df.groupBy("region").summarize({ avg: group => s.round(s.mean(group.sales), 2) })',
    ],
    bestPractices: [
      "✓ GOOD: No need for non-null assertions (!) - s.round() accepts null and returns null",
      "✓ GOOD: Chain directly: s.round(s.mean(values), 2) - no need for s.round(s.mean(values)!, 2)",
      "✓ GOOD: Type-safe chaining: s.round() signature includes null, so TypeScript won't complain",
      "✓ GOOD: Works seamlessly with s.mean(), s.stdev(), s.max(), s.min(), s.median() which return number | null",
    ],
    related: ["mean", "stdev", "max", "min", "median"],
  },

  percent: {
    name: "s.percent",
    category: "stats",
    signature:
      "s.percent(numerator: number | null | undefined, denominator: number | null | undefined, decimals?: number): number | null",
    description:
      "Calculate a percentage from a numerator and denominator, rounded to a given number of decimals. Returns 0 when denominator is 0 to handle division-by-zero gracefully. Returns null if either numerator or denominator is null/undefined.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "numerator: The portion value",
      "denominator: The total value",
      "decimals: Number of decimal places to round to (default: 1)",
    ],
    returns:
      "number | null - Percentage (0–100 scale), rounded, or null if inputs are null/undefined",
    examples: [
      "s.percent(25, 100) // 25.0",
      "s.percent(1, 3) // 33.3",
      "s.percent(2, 3, 2) // 66.67",
      "s.percent(5, 0) // 0 (handles division by zero)",
      "s.percent(0, 100) // 0.0",
      "s.percent(null, 100) // null",
    ],
    related: ["round"],
  },

  // Utility Functions
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

  covariance: {
    name: "s.covariance",
    category: "stats",
    signature:
      "s.covariance(x: number[], y: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the sample covariance between two arrays of values. Arrays must have the same length. Returns null if no valid pairs.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "x: First array of numbers",
      "y: Second array of numbers (same length as x)",
      "removeNA: If true, guarantees a number return (throws if no valid pairs)",
    ],
    returns: "number | null",
    examples: [
      "s.covariance([1, 2, 3], [1, 2, 3]) // 1",
      "s.covariance([1, 2, 3], [3, 2, 1]) // -1",
      "s.covariance([1, null, 3], [1, 2, 3], false) // null (due to null)",
      "s.covariance([1, null, 3], [1, 2, 3], true) // 2 (ignoring null pair)",
    ],
    related: ["s.test.correlation.pearson", "variance"],
  },

  // Statistics - Tests
  tTest: {
    name: "s.test.t.oneSample",
    category: "stats",
    signature:
      "s.test.t.oneSample({ data, mu, alternative?, alpha? }): TestResult",
    description:
      "One-sample t-test. Tests if mean differs from a hypothesized value.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "data: Array of numbers",
      "mu: Hypothesized mean",
      'alternative: "two-sided" (default), "less", or "greater"',
      "alpha: Significance level (default: 0.05)",
    ],
    returns:
      "TestResult with p_value, test_statistic, confidence_interval, etc.",
    examples: [
      's.test.t.oneSample({ data: heights, mu: 170, alternative: "two-sided", alpha: 0.05 })',
    ],
    related: ["s.test.t.independent", "s.test.t.paired", "s.compare"],
  },

  compareAPI: {
    name: "s.compare",
    category: "stats",
    signature: "s.compare.{scenario}.{test}(...)",
    description:
      "Intent-driven statistical testing API. Helps you choose the right test based on your comparison goal.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "Scenarios: oneGroup, twoGroups, multiGroups",
      "Tests: centralTendency, proportions, distribution, association",
      "Options: parametric/nonparametric/auto, comparator type, alpha",
    ],
    returns: "TestResult",
    examples: [
      's.compare.oneGroup.centralTendency.toValue({ data, hypothesizedValue: 100, parametric: "auto" })',
      's.compare.twoGroups.centralTendency.toEachOther({ x, y, paired: false, parametric: "parametric" })',
      's.compare.twoGroups.association.toEachOther({ x, y, method: "pearson" })',
    ],
    related: ["s.test", "s.dist"],
  },

  // Distributions
  normalDist: {
    name: "s.dist.normal",
    category: "stats",
    signature: "s.dist.normal.{function}(...)",
    description: "Normal (Gaussian) distribution functions.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "random({ mean, standardDeviation, sampleSize }): Generate random values",
      "density({ at, mean, standardDeviation }): PDF at x",
      "probability({ at, mean, standardDeviation }): CDF (cumulative probability)",
      "quantile({ probability, mean, standardDeviation }): Inverse CDF (critical value)",
      'data({ mean, standardDeviation, type: "pdf" | "cdf", range, points }): Generate data for plotting',
    ],
    returns: "number or number[]",
    examples: [
      "s.dist.normal.random({ mean: 0, standardDeviation: 1, sampleSize: 100 })",
      "s.dist.normal.probability({ at: 1.96, mean: 0, standardDeviation: 1 }) // ~0.975",
      "s.dist.normal.quantile({ probability: 0.975, mean: 0, standardDeviation: 1 }) // ~1.96",
    ],
    related: ["s.dist.t", "s.dist.chiSquare", "s.dist.beta"],
  },
};
