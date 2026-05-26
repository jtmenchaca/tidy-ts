import { statsDocs } from "./stats/index.ts";
import { dataframeDocs } from "./dataframe/index.ts";
import { graphDocs } from "./graph/index.ts";
import { ioDocs } from "./io/index.ts";
import { shimsDocs } from "./shims/index.ts";
import { statsDistributionsDocs } from "./stats-distributions/index.ts";
import { statsTestsDocs } from "./stats-tests/index.ts";
import { statsCompareDocs } from "./stats-compare/index.ts";
import type { DocEntry } from "./mcp-types.ts";

export const DOCS: Record<string, DocEntry> = {
  // DataFrame methods
  ...dataframeDocs,

  // Charting via @tidy-ts/graph
  ...graphDocs,

  // I/O functions
  ...ioDocs,

  // Statistics functions
  ...statsDocs,

  // Probability distributions
  ...statsDistributionsDocs,

  // Statistical tests
  ...statsTestsDocs,

  // Group comparison API
  ...statsCompareDocs,

  // Cross-runtime shims
  ...shimsDocs,
};

// Derive category lists from doc entries (single source of truth)
function getKeysByCategory(
  docs: Record<string, DocEntry>,
  category: string,
): string[] {
  return Object.entries(docs)
    .filter(([_, doc]) => doc.category === category)
    .map(([key]) => key);
}

// Category groupings for list-operations (derived from doc entries)
export const CATEGORIES = {
  dataframe: getKeysByCategory(DOCS, "dataframe"),
  graph: getKeysByCategory(DOCS, "graph"),
  io: getKeysByCategory(DOCS, "io"),
  stats: getKeysByCategory(DOCS, "stats"),
  "stats-distributions": getKeysByCategory(DOCS, "stats-distributions"),
  "stats-tests": getKeysByCategory(DOCS, "stats-tests"),
  "stats-compare": getKeysByCategory(DOCS, "stats-compare"),
  shims: getKeysByCategory(DOCS, "shims"),
  all: Object.keys(DOCS),
};

// Human-readable category names (single source of truth)
export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  dataframe: "DataFrame Operations",
  graph: "Charting & Visualization (@tidy-ts/graph)",
  stats: "Statistics Functions",
  "stats-distributions": "Probability Distributions",
  "stats-tests": "Statistical Tests",
  "stats-compare": "Group Comparison API",
  io: "I/O Operations",
  shims: "Cross-Runtime Compatibility (Shims)",
};

export function getOperationsByCategory(category: string): DocEntry[] {
  const keys = CATEGORIES[category as keyof typeof CATEGORIES] ||
    CATEGORIES.all;
  return keys.map((key) => DOCS[key]).filter(Boolean);
}

export function getDocumentation(topic: string): DocEntry | null {
  // Normalize topic (e.g. "mean", "s.mean", "stats.glm" → lookup key "glm")
  const normalized = topic.replace(/^s\./, "").replace(/^stats\./, "");

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
