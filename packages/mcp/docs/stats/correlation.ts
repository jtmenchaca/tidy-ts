import type { DocEntry } from "../mcp-types.ts";

export const correlationDocs: Record<string, DocEntry> = {
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
};
