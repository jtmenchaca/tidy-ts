/**
 * Drift check: compare the features tracked in `coverage.md` against the
 * actual headings in the `tidy-ts-best-practices` skill's rule files.
 *
 * Run when:
 *  - the matrix feels stale
 *  - a rule file was added / removed / restructured
 *
 *   deno run -A packages/testing/skills/tidy-ts-best-practices/drift-check.ts
 *
 * Reports:
 *   - rule-file headings that are NOT in coverage.md (matrix missing rows)
 *   - matrix rows that no longer match any rule-file heading (stale rows)
 *
 * The matrix groups features by rule file, so we walk rule files and check
 * that each `## ` or `### ` heading appears under the corresponding section
 * heading in coverage.md.
 */

import { walk } from "jsr:@std/fs/walk";

const RULES_DIR =
  "/Users/jtmenchaca/tidy-ts/.claude/skills/tidy-ts-best-practices/rules";
const COVERAGE_FILE =
  "/Users/jtmenchaca/tidy-ts/packages/testing/skills/tidy-ts-best-practices/coverage.md";

// Headings that are organizational, not testable features.
const SKIP_HEADINGS = new Set([
  "Anti-patterns",
  "Anti-patterns at a glance",
  "Notes",
  "Decision guide",
  "When to use what",
  "When to use `s.compare.*` vs `s.test.*`",
  "When to reach for Result vs throwing",
  "Common combinations",
  "Universal result shape",
  "Inputs",
  "Inside `summarize`",
  "Cardinal rule: use `s.*` aggregations",
  "Two overloads",
  "Semantics",
]);

async function ruleFileHeadings(): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  for await (const entry of walk(RULES_DIR, { exts: [".md"], includeDirs: false })) {
    const name = entry.path.split("/").pop()!;
    const text = await Deno.readTextFile(entry.path);
    const headings: string[] = [];
    for (const line of text.split("\n")) {
      const m = line.match(/^(##+)\s+(.+?)\s*$/);
      if (!m) continue;
      const text = m[2].trim();
      if (SKIP_HEADINGS.has(text)) continue;
      headings.push(text);
    }
    out.set(name, headings);
  }
  return out;
}

function coverageRowsByFile(text: string): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  let current: string | null = null;
  // Stop walking when we hit non-matrix sections (chronological log, pinned
  // regressions, etc.) — they have their own table shapes that aren't
  // rule-file features.
  const NON_MATRIX_HEADERS = new Set([
    "## Chronological log",
    "## Pinned regressions",
  ]);
  for (const line of text.split("\n")) {
    if (NON_MATRIX_HEADERS.has(line.trim())) break;
    const sectionMatch = line.match(/^###\s+([a-z0-9_.-]+\.md)\s*$/);
    if (sectionMatch) {
      current = sectionMatch[1];
      out.set(current, new Set());
      continue;
    }
    if (!current) continue;
    // Table rows: `| Feature name | … |`
    const rowMatch = line.match(/^\|\s+([^|]+?)\s+\|/);
    if (rowMatch) {
      const featureCell = rowMatch[1];
      if (
        featureCell === "Feature" ||
        featureCell.startsWith("---") ||
        featureCell.startsWith(":-")
      ) continue;
      out.get(current)!.add(featureCell);
    }
  }
  return out;
}

const fileHeadings = await ruleFileHeadings();
const coverageText = await Deno.readTextFile(COVERAGE_FILE);
const covered = coverageRowsByFile(coverageText);

let missingCount = 0;
let staleCount = 0;

console.log("Drift check: rule-file headings vs coverage.md matrix\n");

for (const [file, headings] of fileHeadings) {
  const coveredFeatures = covered.get(file) ?? new Set<string>();
  const missing: string[] = [];
  for (const h of headings) {
    // Fuzzy match: coverage row may abbreviate the rule heading (e.g.
    // "CSV (readCSV, peekCSV, writeCSV)" covers the rule heading "CSV").
    const hit = [...coveredFeatures].some((c) =>
      c === h ||
      c.toLowerCase().startsWith(h.toLowerCase() + " ") ||
      c.toLowerCase().startsWith(h.toLowerCase() + "(") ||
      h.toLowerCase().startsWith(c.toLowerCase() + " ")
    );
    if (!hit) missing.push(h);
  }
  if (missing.length > 0) {
    console.log(`  ${file}: ${missing.length} heading(s) not in matrix`);
    for (const m of missing) console.log(`    - ${m}`);
    missingCount += missing.length;
  }
}

console.log();

// Stale rows: matrix has a row for a file that doesn't exist, or a row whose
// label doesn't appear (even fuzzily) as a heading in that file. The first
// case is obviously dead; the second often indicates a heading rename.
for (const [file, features] of covered) {
  const headings = fileHeadings.get(file);
  if (!headings) {
    console.log(`  ${file}: matrix has rows but no rule file exists`);
    staleCount += features.size;
    continue;
  }
  const headingSet = new Set(headings.map((h) => h.toLowerCase()));
  const stale: string[] = [];
  for (const f of features) {
    const f0 = f.toLowerCase();
    const hit = [...headingSet].some((h) =>
      h === f0 ||
      f0.startsWith(h + " ") ||
      f0.startsWith(h + "(") ||
      h.startsWith(f0 + " ")
    );
    if (!hit) stale.push(f);
  }
  if (stale.length > 0) {
    console.log(`  ${file}: ${stale.length} matrix row(s) with no matching heading`);
    for (const s of stale) console.log(`    - ${s}`);
    staleCount += stale.length;
  }
}

console.log();
if (missingCount === 0 && staleCount === 0) {
  console.log("✓ Matrix is in sync with rule files.");
} else {
  console.log(
    `Drift detected: ${missingCount} missing row(s), ${staleCount} stale row(s).`,
  );
  console.log("Update coverage.md and re-run.");
}
