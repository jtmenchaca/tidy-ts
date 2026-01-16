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
  io: getKeysByCategory(DOCS, "io"),
  stats: getKeysByCategory(DOCS, "stats"),
  llm: getKeysByCategory(DOCS, "llm"),
  shims: getKeysByCategory(DOCS, "shims"),
  all: Object.keys(DOCS),
};

// Human-readable category names (single source of truth)
export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  dataframe: "DataFrame Operations",
  stats: "Statistics Functions",
  io: "I/O Operations",
  llm: "LLM Utilities",
  shims: "Cross-Runtime Compatibility (Shims)",
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
