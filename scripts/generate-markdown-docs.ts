/**
 * Generate markdown documentation from MCP DocEntry objects
 *
 * Generates nested markdown structure mirroring packages/mcp/docs/:
 *   packages/mcp/docs/stats-tests/t-tests.ts → docs/api/stats-tests/t-tests.md
 *
 * Run with: deno run -A scripts/generate-markdown-docs.ts
 */

import { walk } from "@std/fs/walk";
import { basename, join, relative } from "@std/path";
import {
  CATEGORIES,
  CATEGORY_DISPLAY_NAMES,
  DOCS,
} from "../packages/mcp/docs/index.ts";
import type { DocEntry } from "../packages/mcp/docs/mcp-types.ts";

const OUTPUT_DIR = "./docs/api";
const MCP_DOCS_DIR = "./packages/mcp/docs";

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

/**
 * Generate markdown for a single topic file containing multiple DocEntries
 */
function generateTopicMarkdown(
  topicName: string,
  entries: DocEntry[],
): string {
  const lines: string[] = [];

  // Title from topic name (e.g., "t-tests" → "T-Tests", "csv" → "CSV")
  const titleOverrides: Record<string, string> = {
    csv: "CSV",
    json: "JSON",
    xlsx: "XLSX",
  };
  const title = titleOverrides[topicName] ??
    topicName
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`> Auto-generated from tidy-ts MCP documentation`);
  lines.push("");

  // Table of contents (only if multiple entries)
  if (entries.length > 1) {
    lines.push("## Table of Contents");
    lines.push("");
    entries.forEach((doc) => {
      const anchor = doc.name.toLowerCase().replace(/\./g, "").replace(
        /\s+/g,
        "-",
      );
      lines.push(`- [${doc.name}](#${anchor})`);
    });
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Each entry
  entries.forEach((doc) => {
    lines.push(docEntryToMarkdown(doc));
  });

  return lines.join("\n");
}

/**
 * Generate markdown for a category (used for flat structure fallback)
 */
function generateCategoryMarkdown(
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
      const anchor = doc.name.toLowerCase().replace(/\./g, "").replace(
        /\s+/g,
        "-",
      );
      lines.push(`- [${doc.name}](#${anchor})`);
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

/**
 * Discover topic files from MCP docs directory structure
 * Returns map of relative paths to their exported doc names
 */
async function discoverTopicFiles(): Promise<
  Map<string, { category: string; topic: string }>
> {
  const topicFiles = new Map<string, { category: string; topic: string }>();

  for await (
    const entry of walk(MCP_DOCS_DIR, {
      exts: [".ts"],
      skip: [/index\.ts$/, /mcp-types\.ts$/],
    })
  ) {
    const relPath = relative(MCP_DOCS_DIR, entry.path);
    const parts = relPath.split("/");

    // Only process files in subdirectories (category/topic.ts)
    if (parts.length === 2) {
      const category = parts[0];
      const topic = basename(parts[1], ".ts");
      topicFiles.set(relPath, { category, topic });
    }
  }

  return topicFiles;
}

/**
 * Load doc entries from a specific topic file
 */
async function loadTopicDocs(
  topicPath: string,
): Promise<DocEntry[]> {
  try {
    const fullPath = join(MCP_DOCS_DIR, topicPath);
    const module = await import(Deno.realPathSync(fullPath));

    // Find the exported docs object (e.g., tTestDocs, csvDocs)
    const entries: DocEntry[] = [];
    for (const [key, value] of Object.entries(module)) {
      if (
        key.endsWith("Docs") && typeof value === "object" && value !== null
      ) {
        // This is a docs object like { "s.test.t.oneSample": DocEntry, ... }
        for (
          const docEntry of Object.values(value as Record<string, unknown>)
        ) {
          if (isDocEntry(docEntry)) {
            entries.push(docEntry);
          }
        }
      }
    }

    return entries;
  } catch {
    return [];
  }
}

function isDocEntry(obj: unknown): obj is DocEntry {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "name" in obj &&
    "description" in obj &&
    "signature" in obj
  );
}

/**
 * Group DOCS entries by their category for flat structure fallback
 */
function groupDocsByCategory(): Map<string, DocEntry[]> {
  const grouped = new Map<string, DocEntry[]>();

  for (const doc of Object.values(DOCS)) {
    const category = doc.category || "other";
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(doc);
  }

  return grouped;
}

async function main() {
  console.log("Generating markdown documentation...\n");

  // Ensure output directory exists
  await Deno.mkdir(OUTPUT_DIR, { recursive: true });

  // Try to discover nested topic files
  const topicFiles = await discoverTopicFiles();
  const generatedCategories = new Set<string>();

  if (topicFiles.size > 0) {
    console.log(`Found ${topicFiles.size} topic files in nested structure\n`);

    // Generate nested markdown files
    for (const [relPath, { category, topic }] of topicFiles) {
      const entries = await loadTopicDocs(relPath);

      if (entries.length > 0) {
        // Create category directory
        const categoryDir = join(OUTPUT_DIR, category);
        await Deno.mkdir(categoryDir, { recursive: true });

        // Generate markdown
        const markdown = generateTopicMarkdown(topic, entries);
        const outputPath = join(categoryDir, `${topic}.md`);
        await Deno.writeTextFile(outputPath, markdown);
        console.log(`Generated: ${outputPath} (${entries.length} entries)`);

        generatedCategories.add(category);
      }
    }
  }

  // Fallback: Generate flat category files for categories without nested structure
  const docsByCategory = groupDocsByCategory();

  for (const [category, entries] of docsByCategory) {
    // Skip if we already generated nested files for this category
    if (generatedCategories.has(category)) {
      continue;
    }

    const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
    const keys = entries.map((e) => e.name);

    if (keys.length > 0) {
      const markdown = generateCategoryMarkdown(displayName, keys);
      const filepath = `${OUTPUT_DIR}/${category}.md`;
      await Deno.writeTextFile(filepath, markdown);
      console.log(`Generated: ${filepath} (${keys.length} entries) [flat]`);
    }
  }

  // Generate category index files for nested categories
  for (const category of generatedCategories) {
    const categoryDir = join(OUTPUT_DIR, category);
    const displayName = CATEGORY_DISPLAY_NAMES[category] || category;

    // List all .md files in the category
    const mdFiles: string[] = [];
    for await (const entry of Deno.readDir(categoryDir)) {
      if (
        entry.isFile && entry.name.endsWith(".md") && entry.name !== "index.md"
      ) {
        mdFiles.push(entry.name);
      }
    }

    if (mdFiles.length > 0) {
      const indexLines: string[] = [];
      indexLines.push(`# ${displayName}`);
      indexLines.push("");
      indexLines.push("> Auto-generated index");
      indexLines.push("");

      // Display name overrides for acronyms (e.g. csv → CSV)
      const displayOverrides: Record<string, string> = {
        csv: "CSV",
        json: "JSON",
        xlsx: "XLSX",
      };
      mdFiles.sort().forEach((file) => {
        const name = basename(file, ".md");
        const title = displayOverrides[name] ??
          name
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        indexLines.push(`- [${title}](./${file})`);
      });
      indexLines.push("");

      await Deno.writeTextFile(
        join(categoryDir, "index.md"),
        indexLines.join("\n"),
      );
      console.log(`Generated: ${join(categoryDir, "index.md")} (index)`);
    }
  }

  // Generate main README
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
    "- **[@tidy-ts/parquet](https://jsr.io/@tidy-ts/parquet)** - Parquet file I/O",
  );
  indexLines.push(
    "- **[@tidy-ts/arrow](https://jsr.io/@tidy-ts/arrow)** - Arrow IPC file I/O",
  );
  indexLines.push("");
  indexLines.push("## API Reference");
  indexLines.push("");

  // List nested categories first
  for (const category of Array.from(generatedCategories).sort()) {
    const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
    indexLines.push(`- [${displayName}](./api/${category}/index.md)`);
  }

  // Then flat categories
  for (
    const [category, displayName] of Object.entries(CATEGORY_DISPLAY_NAMES)
  ) {
    if (generatedCategories.has(category)) continue;

    const keys = CATEGORIES[category as keyof typeof CATEGORIES];
    if (keys && keys.length > 0) {
      indexLines.push(
        `- [${displayName}](./api/${category}.md) (${keys.length} functions)`,
      );
    }
  }

  indexLines.push("");
  indexLines.push("## Additional");
  indexLines.push("");
  indexLines.push("- [Benchmark results](./api/benchmark-results.md)");
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
  indexLines.push('  .mutate({ grade: (r) => r.score >= 90 ? "A" : "B" })');
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
