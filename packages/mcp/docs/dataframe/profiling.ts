import type { DocEntry } from "../mcp-types.ts";

export const profilingDocs: Record<string, DocEntry> = {
  profile: {
    name: "profile",
    category: "dataframe",
    signature: "profile(): DataFrame<ColumnProfile>",
    description:
      "Profile a DataFrame by computing comprehensive statistics for each column. Returns a DataFrame with one row per column.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [],
    returns:
      "DataFrame with columns: column, type, count, nulls, null_pct, mean, median, min, max, sd, q1, q3, iqr, variance (numeric), unique, top_values (categorical)",
    examples: [
      "df.profile().print()",
      "const stats = penguins.profile()",
      "df.profile().filter(p => p.type === 'numeric')",
    ],
    related: ["summarize", "mean", "median", "stdev"],
    bestPractices: [
      "Use profile() for quick exploratory data analysis",
      "Filter the profile result to focus on numeric or categorical columns",
      "Combine with .print() for immediate visual inspection",
    ],
  },
};
