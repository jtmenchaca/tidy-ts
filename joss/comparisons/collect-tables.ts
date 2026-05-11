/**
 * Collect all comparison tables by running all tests in parallel via
 * `deno test --parallel` and extracting structured JSON from stdout.
 *
 * Usage: deno run -A joss/comparisons/collect-tables.ts
 *
 * Outputs: joss/comparisons/all-tables.json
 */

import type { ComparisonTableData } from "./test-helpers.ts";

const COMPARISONS_DIR = new URL(".", import.meta.url).pathname;

const TAG_START = "__TABLE_DATA__";
const TAG_END = "__END_TABLE_DATA__";

// Find all cat-* test files
const catDirs: string[] = [];
for await (const entry of Deno.readDir(COMPARISONS_DIR)) {
  if (entry.isDirectory && entry.name.startsWith("cat-")) {
    catDirs.push(`${COMPARISONS_DIR}${entry.name}/${entry.name}.test.ts`);
  }
}
catDirs.sort();

const cmd = new Deno.Command("deno", {
  args: [
    "test",
    "-A",
    "--v8-flags=--max-old-space-size=8192",
    "--parallel",
    ...catDirs,
  ],
  stdout: "piped",
  stderr: "piped",
});

console.log("Running all comparison tests in parallel...");
const { code, stdout, stderr } = await cmd.output();
const out = new TextDecoder().decode(stdout);
const err = new TextDecoder().decode(stderr);

if (code !== 0) {
  console.error("Tests failed:");
  console.error(err);
  Deno.exit(1);
}

// Extract all table data from output
const allTables: ComparisonTableData[] = [];
for (const line of out.split("\n")) {
  const startIdx = line.indexOf(TAG_START);
  if (startIdx === -1) continue;
  const jsonStart = startIdx + TAG_START.length;
  const endIdx = line.indexOf(TAG_END, jsonStart);
  if (endIdx === -1) continue;
  try {
    allTables.push(JSON.parse(line.slice(jsonStart, endIdx)));
  } catch {
    console.error("Failed to parse table JSON from line");
  }
}

allTables.sort((a, b) => a.title.localeCompare(b.title));

// Write JSON
const jsonPath = `${COMPARISONS_DIR}all-tables.json`;
await Deno.writeTextFile(jsonPath, JSON.stringify(allTables, null, 2) + "\n");

// Generate markdown
const md: string[] = ["# Error Class Comparison Tables\n"];

for (const table of allTables) {
  md.push(`## ${table.title}\n`);
  md.push("| Case | TS compile | TS runtime | TS result | Py runtime | Py result | R runtime | R result |");
  md.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const row of table.rows) {
    md.push(`| ${row.label} | ${row.tsCompile} | ${row.tsRuntime} | ${row.tsResult} | ${row.pyRuntime} | ${row.pyResult} | ${row.rRuntime} | ${row.rResult} |`);
  }
  md.push("");
}

const mdPath = `${COMPARISONS_DIR}all-tables.md`;
await Deno.writeTextFile(mdPath, md.join("\n") + "\n");

console.log(`Collected ${allTables.length} tables.`);
console.log(`Written to: ${jsonPath}`);
console.log(`Written to: ${mdPath}`);
