/**
 * RPython reproduction frontmatter migration.
 *
 * Walks every `.py`/`.R` reproduction in `RPython/TM/` (and the 3 illustrative
 * CDA files where canonical frontmatter exists) and brings each one to the
 * three-field schema defined in INCLUSION_EVALUATION.md:
 *
 *   - Tidy-TS detection outcome
 *   - Tidy-TS detection mechanism
 *   - Tidy-TS catch explanation
 *
 * Also:
 *   - Replaces `Reproduction status: Live | Fixed | N/A` with the new enum
 *     (`Reproduces` | `No longer reproduces` | `Variant`), preferring the
 *     verification report's observed status when available.
 *   - Removes the legacy `Type system catch` field, copying its value into the
 *     new `Tidy-TS catch explanation` field.
 *
 * Mechanism inference is best-effort and conservative. Cases the script cannot
 * confidently classify are written with `Tidy-TS detection mechanism: TODO` and
 * surfaced in the migration report for author review.
 *
 * Usage:
 *   deno run -A docs/JAMIA/comparisons/RPython/migrate-frontmatter.ts [--dry-run] [--limit N]
 */

const RPYTHON_DIR = new URL(".", import.meta.url).pathname;
const COMPARISONS_DIR = new URL("..", import.meta.url).pathname;

type Frontmatter = {
  raw: Record<string, string>;
  // Track field order so we can write back the same way
  order: string[];
  // Hash-comment style for Python, # for R — these are identical actually
  commentPrefix: string;
  bodyStart: number; // line index where body begins
};

type Args = { dryRun: boolean; limit?: number };

function parseArgs(): Args {
  const args = Deno.args;
  const dryRun = args.includes("--dry-run");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 && args[limitIdx + 1] ? parseInt(args[limitIdx + 1], 10) : undefined;
  return { dryRun, limit: !isNaN(limit ?? NaN) ? limit : undefined };
}

function parseFrontmatter(content: string): Frontmatter | null {
  const lines = content.split("\n");
  const raw: Record<string, string> = {};
  const order: string[] = [];
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("#")) {
      const m = line.match(/^#\s*([A-Za-z][A-Za-z\s\-]+?):\s*(.+)$/);
      if (m) {
        raw[m[1].trim()] = m[2].trim();
        order.push(m[1].trim());
        bodyStart = i + 1;
        continue;
      }
      // Comment line with no key:value — still part of the header zone
      bodyStart = i + 1;
      continue;
    }
    // First non-comment line ends the frontmatter
    break;
  }
  if (Object.keys(raw).length === 0) return null;
  return { raw, order, commentPrefix: "#", bodyStart };
}

type VerificationReport = {
  files: Array<{
    path: string;
    reproductionStatusObserved?: string;
    verificationStatus: string;
    frontmatter: { raw: Record<string, string> };
  }>;
};

async function loadVerificationReport(): Promise<VerificationReport | null> {
  try {
    const text = await Deno.readTextFile(`${RPYTHON_DIR}verification-report.json`);
    return JSON.parse(text) as VerificationReport;
  } catch {
    return null;
  }
}

/**
 * Infer the Tidy-TS detection mechanism by inspecting the paired `.ts` file.
 * Returns one of the six mechanism enum values, or `null` if the script cannot
 * classify confidently (TODO for author review).
 */
function inferMechanism(tsContent: string | null): {
  mechanism: string | null;
  rationale: string;
} {
  if (tsContent === null) {
    return { mechanism: null, rationale: "no .ts file found" };
  }
  const hasExpectError = /@ts-expect-error/.test(tsContent);
  const usesReadCSV = /readCSV\s*\(/.test(tsContent);
  const usesZodSchema = /z\.object|z\.string|z\.number|ZodSchema/.test(tsContent);
  const usesAppend = /\.append\s*\(/.test(tsContent);
  const claimsStructurallyAbsent = /structurally absent|does not exist|bug class.*doesn'?t exist/i.test(tsContent);
  const claimsBugStillExists = /bug still exists|tidy-?ts (also )?reproduces/i.test(tsContent);
  const claimsLanguageSemantics = /language semantics|operator semantics|no operator overloading/i.test(tsContent);
  const claimsAPIDesign = /api (design|choice)|api uses|.replaceAll|always does substrings/i.test(tsContent);

  if (claimsBugStillExists) {
    return { mechanism: "none — bug still exists", rationale: "docstring claims tidy-ts reproduces the failure" };
  }
  if (claimsLanguageSemantics) {
    return { mechanism: "none — language structural absence", rationale: "docstring cites language semantics / no overloading" };
  }
  if (claimsAPIDesign) {
    return { mechanism: "none — library API design", rationale: "docstring cites different API design" };
  }
  if (claimsStructurallyAbsent && !hasExpectError) {
    return { mechanism: null, rationale: "claims structurally absent without specifying language vs API — needs author review" };
  }
  if (usesAppend && !hasExpectError) {
    return { mechanism: "runtime API guard", rationale: ".ts uses df.append() without @ts-expect-error" };
  }
  if (usesReadCSV && usesZodSchema && !hasExpectError) {
    return { mechanism: "zod schema validation", rationale: ".ts uses readCSV with Zod schema; runtime catch" };
  }
  if (hasExpectError) {
    return { mechanism: "compiler", rationale: ".ts has @ts-expect-error" };
  }
  return { mechanism: null, rationale: "no clear signal in .ts — needs author review" };
}

function inferOutcomeFromMechanism(mechanism: string | null): string | null {
  switch (mechanism) {
    case "compiler":
      return "compile-time error";
    case "zod schema validation":
    case "runtime API guard":
      return "runtime error";
    case "none — language structural absence":
    case "none — library API design":
      return "not applicable";
    case "none — bug still exists":
      return "silent continuation";
    default:
      return null;
  }
}

function normalizeReproductionStatus(claimed: string | undefined): string {
  if (!claimed) return "";
  const c = claimed.toLowerCase();
  if (c.startsWith("live")) return "Reproduces";
  if (c.startsWith("fixed")) return "No longer reproduces";
  if (c.startsWith("variant")) return "Variant";
  if (c.startsWith("reproduces")) return "Reproduces";
  if (c.startsWith("no longer")) return "No longer reproduces";
  return claimed; // unchanged if already in target form
}

type FileMigration = {
  path: string;
  oldFields: Record<string, string>;
  newFields: Record<string, string>;
  needsAuthorReview: boolean;
  reviewReasons: string[];
};

async function migrateFile(
  reproPath: string,
  verifiedStatus: string | undefined,
): Promise<FileMigration | null> {
  const content = await Deno.readTextFile(reproPath);
  const fm = parseFrontmatter(content);
  if (!fm) return null;

  const lines = content.split("\n");
  const tsPath = reproPath.replace(/\.(py|R)$/, ".ts");
  let tsContent: string | null = null;
  try {
    tsContent = await Deno.readTextFile(tsPath);
  } catch {
    tsContent = null;
  }

  // Build the new frontmatter
  const newFields: Record<string, string> = {};
  // Carry forward identity fields
  for (const k of ["ID", "Language", "Bug class", "Runtime consequence", "In study", "Inclusion rationale"]) {
    if (fm.raw[k]) newFields[k] = fm.raw[k];
  }

  const inStudy = fm.raw["In study"]?.toLowerCase();
  const isIncluded = inStudy === "yes";

  const reviewReasons: string[] = [];
  let needsAuthorReview = false;

  if (isIncluded) {
    // Reproduction status — prefer verification report when available
    const claimed = fm.raw["Reproduction status"];
    const observed = verifiedStatus && verifiedStatus !== "unknown" ? verifiedStatus : undefined;
    const normalized = observed ?? normalizeReproductionStatus(claimed);
    if (normalized) {
      newFields["Reproduction status"] = normalized;
      if (observed && claimed && normalizeReproductionStatus(claimed) !== observed) {
        reviewReasons.push(`Reproduction status changed from claimed "${claimed}" to observed "${observed}"`);
      }
    } else {
      needsAuthorReview = true;
      reviewReasons.push("No reproduction status available");
    }

    // The three Tidy-TS fields
    const legacy = fm.raw["Type system catch"];
    const { mechanism, rationale } = inferMechanism(tsContent);
    if (mechanism) {
      newFields["Tidy-TS detection mechanism"] = mechanism;
      const outcome = inferOutcomeFromMechanism(mechanism);
      if (outcome) newFields["Tidy-TS detection outcome"] = outcome;
    } else {
      newFields["Tidy-TS detection mechanism"] = "TODO";
      newFields["Tidy-TS detection outcome"] = "TODO";
      needsAuthorReview = true;
      reviewReasons.push(`Mechanism inference: ${rationale}`);
    }
    if (legacy) {
      newFields["Tidy-TS catch explanation"] = legacy;
    } else if (fm.raw["Tidy-TS catch explanation"]) {
      newFields["Tidy-TS catch explanation"] = fm.raw["Tidy-TS catch explanation"];
    } else {
      newFields["Tidy-TS catch explanation"] = "TODO";
      needsAuthorReview = true;
      reviewReasons.push("No catch explanation in legacy or new field");
    }
  }
  // Excluded snippets carry only the identity fields; nothing else needed.

  // Build the new comment block
  const newHeader: string[] = [];
  for (const k of [
    "ID",
    "Language",
    "Bug class",
    "Runtime consequence",
    "In study",
    "Inclusion rationale",
    "Reproduction status",
    "Tidy-TS detection outcome",
    "Tidy-TS detection mechanism",
    "Tidy-TS catch explanation",
  ]) {
    if (newFields[k]) newHeader.push(`# ${k}: ${newFields[k]}`);
  }
  // Reattach body
  const body = lines.slice(fm.bodyStart).join("\n");
  const newContent = newHeader.join("\n") + "\n" + body;

  return {
    path: reproPath,
    oldFields: fm.raw,
    newFields,
    needsAuthorReview,
    reviewReasons,
  };

  // Note: write happens in main()
}

async function applyMigration(reproPath: string, migration: FileMigration) {
  const content = await Deno.readTextFile(reproPath);
  const fm = parseFrontmatter(content);
  if (!fm) return;
  const lines = content.split("\n");
  const newHeader: string[] = [];
  for (const k of [
    "ID",
    "Language",
    "Bug class",
    "Runtime consequence",
    "In study",
    "Inclusion rationale",
    "Reproduction status",
    "Tidy-TS detection outcome",
    "Tidy-TS detection mechanism",
    "Tidy-TS catch explanation",
  ]) {
    if (migration.newFields[k]) newHeader.push(`# ${k}: ${migration.newFields[k]}`);
  }
  const body = lines.slice(fm.bodyStart).join("\n");
  const newContent = newHeader.join("\n") + "\n" + body;
  await Deno.writeTextFile(reproPath, newContent);
}

async function listReproductions(): Promise<{ path: string; subset: "TM" | "CDA" }[]> {
  const out: { path: string; subset: "TM" | "CDA" }[] = [];
  for (const subset of ["TM", "CDA"] as const) {
    const dir = `${RPYTHON_DIR}${subset}`;
    try {
      for await (const entry of Deno.readDir(dir)) {
        if (!entry.isFile) continue;
        if (entry.name.endsWith(".py") || entry.name.endsWith(".R")) {
          out.push({ path: `${dir}/${entry.name}`, subset });
        }
      }
    } catch {
      // skip
    }
  }
  out.sort((a, b) => {
    if (a.subset !== b.subset) return a.subset === "TM" ? -1 : 1;
    return a.path.localeCompare(b.path);
  });
  return out;
}

async function main() {
  const args = parseArgs();
  const allFiles = await listReproductions();
  const files = args.limit ? allFiles.slice(0, args.limit) : allFiles;
  const report = await loadVerificationReport();

  const verifiedByPath = new Map<string, string>();
  if (report) {
    for (const f of report.files) {
      if (f.reproductionStatusObserved) {
        verifiedByPath.set(f.path, f.reproductionStatusObserved);
      }
    }
  }

  const migrations: FileMigration[] = [];
  for (const { path } of files) {
    const relativePath = path.replace(COMPARISONS_DIR, "");
    const verified = verifiedByPath.get(relativePath);
    const migration = await migrateFile(path, verified);
    if (migration) migrations.push(migration);
  }

  const needsReview = migrations.filter((m) => m.needsAuthorReview);
  console.log(`\nProcessed ${migrations.length} files`);
  console.log(`  Needs author review: ${needsReview.length}`);
  console.log(`  Ready to apply: ${migrations.length - needsReview.length}`);

  if (args.dryRun) {
    console.log("\n(dry-run; no files modified)");
    // Write a migration report for inspection
    const reportLines: string[] = [];
    reportLines.push("# Frontmatter Migration Report (dry-run)");
    reportLines.push("");
    reportLines.push(`Total files: ${migrations.length}`);
    reportLines.push(`Needs author review: ${needsReview.length}`);
    reportLines.push("");
    reportLines.push("## Author review required");
    reportLines.push("");
    for (const m of needsReview) {
      reportLines.push(`### \`${m.path.replace(COMPARISONS_DIR, "")}\``);
      reportLines.push("");
      for (const reason of m.reviewReasons) {
        reportLines.push(`- ${reason}`);
      }
      reportLines.push("");
    }
    await Deno.writeTextFile(`${RPYTHON_DIR}migration-report.md`, reportLines.join("\n"));
    console.log(`\nWrote migration-report.md`);
  } else {
    for (const m of migrations) {
      await applyMigration(m.path, m);
    }
    console.log("\nMigration applied. Author should review files marked TODO.");
  }
}

if (import.meta.main) {
  await main();
}
