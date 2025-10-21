export interface ExampleEntry {
  name: string;
  description: string;
  path: string;
  category: string;
}

export const EXAMPLES: Record<string, ExampleEntry> = {
  "getting-started": {
    name: "Getting Started",
    description: "Basic DataFrame creation and operations",
    path: "examples/dataframe/01-getting-started.test.ts",
    category: "basics",
  },
  "creating-dataframes": {
    name: "Creating DataFrames",
    description: "Different ways to create DataFrames from data",
    path: "examples/dataframe/02-creating-dataframes.test.ts",
    category: "basics",
  },
  "reading-writing-files": {
    name: "Reading & Writing Files",
    description: "CSV, XLSX, JSON, Parquet, and Arrow I/O operations",
    path: "examples/dataframe/03-reading-writing-files.test.ts",
    category: "io",
  },
  "dataframe-basics": {
    name: "DataFrame Basics",
    description: "Core DataFrame operations and methods",
    path: "examples/dataframe/04-dataframe-basics.test.ts",
    category: "basics",
  },
  "selecting-columns": {
    name: "Selecting Columns",
    description: "Select, drop, and work with columns",
    path: "examples/dataframe/05-selecting-columns.test.ts",
    category: "manipulation",
  },
  "filtering-rows": {
    name: "Filtering Rows",
    description: "Filter, slice, and subset rows",
    path: "examples/dataframe/06-filtering-rows.test.ts",
    category: "manipulation",
  },
  "transforming-data": {
    name: "Transforming Data",
    description: "Using mutate to create and transform columns",
    path: "examples/dataframe/07-transforming-data.test.ts",
    category: "manipulation",
  },
  "sorting-arranging": {
    name: "Sorting & Arranging",
    description: "Sort DataFrames by columns",
    path: "examples/dataframe/08-sorting-arranging.test.ts",
    category: "manipulation",
  },
  "grouping-aggregation": {
    name: "Grouping & Aggregation",
    description: "GroupBy and summarize operations",
    path: "examples/dataframe/09-grouping-aggregation.test.ts",
    category: "aggregation",
  },
  "joining-dataframes": {
    name: "Joining DataFrames",
    description: "Inner, left, right, and outer joins",
    path: "examples/dataframe/10-joining-dataframes.test.ts",
    category: "combining",
  },
  "combining-dataframes": {
    name: "Combining DataFrames",
    description: "Bind rows and concatenate DataFrames",
    path: "examples/dataframe/11-combining-dataframes.test.ts",
    category: "combining",
  },
  "missing-data": {
    name: "Missing Data",
    description: "Handle null/undefined values with replaceNA",
    path: "examples/dataframe/12-missing-data.test.ts",
    category: "manipulation",
  },
  "reshaping-data": {
    name: "Reshaping Data",
    description: "Pivot longer, pivot wider, and transpose",
    path: "examples/dataframe/13-reshaping-data.test.ts",
    category: "reshaping",
  },
  "stats-descriptive": {
    name: "Descriptive Statistics",
    description: "Mean, median, mode, stdev, quantiles, ranking",
    path: "examples/dataframe/14-stats-descriptive.test.ts",
    category: "statistics",
  },
  "stats-compare-api": {
    name: "Statistical Testing (Compare API)",
    description: "Intent-driven statistical testing interface",
    path: "examples/dataframe/15-stats-compare-api.test.ts",
    category: "statistics",
  },
  "stats-distributions": {
    name: "Probability Distributions",
    description: "Normal, beta, gamma, t, chi-square, binomial, poisson, etc.",
    path: "examples/dataframe/16-stats-distributions.test.ts",
    category: "statistics",
  },
};

export function listExamples(category?: string): ExampleEntry[] {
  const examples = Object.values(EXAMPLES);
  if (category) {
    return examples.filter((ex) => ex.category === category);
  }
  return examples;
}

export function getExample(name: string): ExampleEntry | null {
  // Direct match
  if (EXAMPLES[name]) return EXAMPLES[name];

  // Fuzzy match (case-insensitive, with/without hyphens)
  const normalized = name.toLowerCase().replace(/[_\s]/g, "-");
  const match = Object.entries(EXAMPLES).find(([key, ex]) =>
    key === normalized ||
    ex.name.toLowerCase().replace(/[_\s&]/g, "-") === normalized
  );

  return match ? match[1] : null;
}
