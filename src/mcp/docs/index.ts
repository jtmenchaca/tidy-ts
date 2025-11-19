import { statsDocs } from "./stats.ts";
import { dataframeDocs } from "./dataframe.ts";
import { ioDocs } from "./io.ts";
import { llmDocs } from "./llm.ts";
import { shimsDocs } from "./shims.ts";
import type { DocEntry } from "./mcp-types.ts";

export const DOCS: Record<string, DocEntry> = {
  // DataFrame methods
  ...dataframeDocs,

  // I/O functions
  ...ioDocs,

  // Statistics functions
  ...statsDocs,

  // LLM utilities
  ...llmDocs,

  // Cross-runtime shims
  ...shimsDocs,
};

// Category groupings for list-operations
export const CATEGORIES = {
  dataframe: [
    "print",
    "createDataFrame",
    "select",
    "drop",
    "filter",
    "slice",
    "sliceHead",
    "sliceTail",
    "sliceMax",
    "sliceMin",
    "sliceSample",
    "mutate",
    "arrange",
    "distinct",
    "rename",
    "extract",
    "extractHead",
    "extractTail",
    "extractNth",
    "extractSample",
    "extractUnique",
    "groupBy",
    "summarize",
    "count",
    "ungroup",
    "innerJoin",
    "leftJoin",
    "rightJoin",
    "outerJoin",
    "asofJoin",
    "pivotLonger",
    "pivotWider",
    "transpose",
    "unnest",
    "bindRows",
    "concatDataFrames",
    "downsample",
    "upsample",
    "replaceNA",
    "removeNA",
    "removeNull",
    "removeUndefined",
    "fillForward",
    "fillBackward",
    "interpolate",
    "profile",
    "graph",
  ],
  io: [
    "readCSV",
    "readCSVMetadata",
    "writeCSV",
    "readXLSX",
    "readXLSXMetadata",
    "writeXLSX",
    "readJSON",
    "writeJSON",
    "readParquet",
    "writeParquet",
    "readArrow",
  ],
  stats: [
    // Descriptive statistics
    "mean",
    "median",
    "mode",
    "sum",
    "max",
    "min",
    "stdev",
    "variance",
    "quantile",
    "quartiles",
    "iqr",
    "range",
    "product",
    // Window/cumulative functions
    "cumsum",
    "cummean",
    "cumprod",
    "cummax",
    "cummin",
    "rolling",
    "lag",
    "lead",
    "forwardFill",
    "backwardFill",
    "interpolate",
    // Aggregation functions
    "first",
    "last",
    // Ranking functions
    "rank",
    "denseRank",
    "percentileRank",
    // Utility functions
    "chunk",
    "batch",
    // Transformation functions
    "normalize",
    "round",
    "percent",
    // Utility functions
    "unique",
    "covariance",
    // Statistical tests
    "tTest",
    "compareAPI",
    // Distributions
    "normalDist",
  ],
  llm: [
    "LLMEmbed",
    "LLMRespond",
    "LLMCompareEmbeddings",
  ],
  shims: [
    // Runtime Detection
    "getCurrentRuntime",
    "currentRuntime",
    // File System Operations
    "readFile",
    "readTextFile",
    "writeFile",
    "writeTextFile",
    "mkdir",
    "stat",
    "remove",
    "open",
    "readFileSync",
    "writeFileSync",
    "writeTextFileSync",
    // Path Utilities
    "resolve",
    "dirname",
    "fileURLToPath",
    "pathToFileURL",
    // Environment Variables
    "env",
    // Process Management
    "args",
    "getArgs",
    "exit",
    "importMeta",
    // Testing Framework
    "test",
    // Error Types
    "UnavailableAPIError",
    "UnsupportedRuntimeError",
  ],
  all: Object.keys(DOCS),
};

export function getOperationsByCategory(category: string): DocEntry[] {
  const keys = CATEGORIES[category as keyof typeof CATEGORIES] ||
    CATEGORIES.all;
  return keys.map((key) => DOCS[key]).filter(Boolean);
}

export function getDocumentation(topic: string): DocEntry | null {
  // Normalize topic (handle both "mean" and "s.mean")
  const normalized = topic.replace(/^s\./, "");

  // Direct match
  if (DOCS[topic]) return DOCS[topic];
  if (DOCS[normalized]) return DOCS[normalized];

  // Fuzzy match (case-insensitive)
  const lowerTopic = topic.toLowerCase();
  const match = Object.entries(DOCS).find(([key, doc]) =>
    key.toLowerCase() === lowerTopic || doc.name.toLowerCase() === lowerTopic
  );

  return match ? match[1] : null;
}
