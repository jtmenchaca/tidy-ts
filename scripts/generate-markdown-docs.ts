/**
 * Generate markdown documentation from MCP DocEntry objects
 * Run with: deno run -A scripts/generate-markdown-docs.ts
 */

import {
  CATEGORIES,
  CATEGORY_DISPLAY_NAMES,
  DOCS,
} from "../packages/mcp/docs/index.ts";
import type { DocEntry } from "../packages/mcp/docs/mcp-types.ts";

const OUTPUT_DIR = "./docs/api";

function docEntryToMarkdown(entry: DocEntry): string {
  const lines: string[] = [];

  lines.push(`## ${entry.name}`);
  lines.push("");
  lines.push(entry.description);
  lines.push("");

  // Signature
  lines.push("### Signature");
  lines.push("");
  lines.push("```typescript");
  lines.push(entry.signature);
  lines.push("```");
  lines.push("");

  // Imports
  if (entry.imports && entry.imports.length > 0) {
    lines.push("### Import");
    lines.push("");
    lines.push("```typescript");
    entry.imports.forEach((imp) => lines.push(imp));
    lines.push("```");
    lines.push("");
  }

  // Parameters
  if (entry.parameters && entry.parameters.length > 0) {
    lines.push("### Parameters");
    lines.push("");
    entry.parameters.forEach((param) => {
      lines.push(`- ${param}`);
    });
    lines.push("");
  }

  // Returns
  if (entry.returns) {
    lines.push("### Returns");
    lines.push("");
    lines.push(entry.returns);
    lines.push("");
  }

  // Examples
  if (entry.examples && entry.examples.length > 0) {
    lines.push("### Examples");
    lines.push("");
    lines.push("```typescript");
    entry.examples.forEach((ex) => lines.push(ex));
    lines.push("```");
    lines.push("");
  }

  // Best Practices
  if (entry.bestPractices && entry.bestPractices.length > 0) {
    lines.push("### Best Practices");
    lines.push("");
    entry.bestPractices.forEach((bp) => {
      lines.push(`- ${bp}`);
    });
    lines.push("");
  }

  // Anti-patterns
  if (entry.antiPatterns && entry.antiPatterns.length > 0) {
    lines.push("### Anti-patterns");
    lines.push("");
    entry.antiPatterns.forEach((ap) => {
      lines.push(`- ${ap}`);
    });
    lines.push("");
  }

  // Related
  if (entry.related && entry.related.length > 0) {
    lines.push("### Related");
    lines.push("");
    lines.push(entry.related.map((r) => `\`${r}\``).join(", "));
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  return lines.join("\n");
}

function generateCategoryMarkdown(
  category: string,
  displayName: string,
  keys: string[],
): string {
  const lines: string[] = [];

  lines.push(`# ${displayName}`);
  lines.push("");
  lines.push(`> Auto-generated from tidy-ts MCP documentation`);
  lines.push("");

  // Table of contents
  lines.push("## Table of Contents");
  lines.push("");
  keys.forEach((key) => {
    const doc = DOCS[key];
    if (doc) {
      lines.push(
        `- [${doc.name}](#${doc.name.toLowerCase().replace(/\./g, "")})`,
      );
    }
  });
  lines.push("");
  lines.push("---");
  lines.push("");

  // Each entry
  keys.forEach((key) => {
    const doc = DOCS[key];
    if (doc) {
      lines.push(docEntryToMarkdown(doc));
    }
  });

  return lines.join("\n");
}

async function main() {
  // Ensure output directory exists
  await Deno.mkdir(OUTPUT_DIR, { recursive: true });

  // Generate markdown for each category
  const categoryMapping: Record<string, string> = {
    dataframe: "dataframe",
    stats: "stats",
    io: "io",
    llm: "llm",
    shims: "shims",
  };

  for (const [category, filename] of Object.entries(categoryMapping)) {
    const keys = CATEGORIES[category as keyof typeof CATEGORIES];
    const displayName = CATEGORY_DISPLAY_NAMES[category] || category;

    if (keys && keys.length > 0) {
      const markdown = generateCategoryMarkdown(category, displayName, keys);
      const filepath = `${OUTPUT_DIR}/${filename}.md`;
      await Deno.writeTextFile(filepath, markdown);
      console.log(`Generated: ${filepath} (${keys.length} entries)`);
    }
  }

  // Generate index/README
  const indexLines: string[] = [];
  indexLines.push("# Tidy-TS API Documentation");
  indexLines.push("");
  indexLines.push("> Auto-generated from tidy-ts MCP documentation");
  indexLines.push("");
  indexLines.push("## Packages");
  indexLines.push("");
  indexLines.push(
    "- **[@tidy-ts/dataframe](https://jsr.io/@tidy-ts/dataframe)** - Core DataFrame library",
  );
  indexLines.push(
    "- **[@tidy-ts/shims](https://jsr.io/@tidy-ts/shims)** - Cross-runtime compatibility",
  );
  indexLines.push(
    "- **[@tidy-ts/ai](https://jsr.io/@tidy-ts/ai)** - AI/LLM utilities",
  );
  indexLines.push(
    "- **[@tidy-ts/parquet](https://jsr.io/@tidy-ts/parquet)** - Parquet file I/O",
  );
  indexLines.push(
    "- **[@tidy-ts/arrow](https://jsr.io/@tidy-ts/arrow)** - Arrow IPC file I/O",
  );
  indexLines.push("");
  indexLines.push("## API Reference");
  indexLines.push("");

  for (
    const [category, displayName] of Object.entries(CATEGORY_DISPLAY_NAMES)
  ) {
    const keys = CATEGORIES[category as keyof typeof CATEGORIES];
    if (keys && keys.length > 0) {
      indexLines.push(
        `- [${displayName}](./api/${category}.md) (${keys.length} functions)`,
      );
    }
  }

  indexLines.push("");
  indexLines.push("## Quick Start");
  indexLines.push("");
  indexLines.push("```typescript");
  indexLines.push(
    'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
  );
  indexLines.push("");
  indexLines.push("const df = createDataFrame([");
  indexLines.push('  { name: "Alice", age: 30, score: 85 },');
  indexLines.push('  { name: "Bob", age: 25, score: 92 },');
  indexLines.push('  { name: "Charlie", age: 35, score: 78 },');
  indexLines.push("]);");
  indexLines.push("");
  indexLines.push("// Analyze data");
  indexLines.push("const result = df");
  indexLines.push("  .filter((r) => r.age > 25)");
  indexLines.push("  .mutate({ grade: (r) => r.score >= 90 ? 'A' : 'B' })");
  indexLines.push('  .arrange("score", "desc");');
  indexLines.push("");
  indexLines.push('result.print("Analysis Results");');
  indexLines.push("```");
  indexLines.push("");

  await Deno.writeTextFile("./docs/README.md", indexLines.join("\n"));
  console.log("Generated: ./docs/README.md");

  console.log("\nDone! Markdown docs generated in ./docs/");
}

main();
