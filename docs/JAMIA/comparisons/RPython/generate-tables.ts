/**
 * Generate corroboration tables for the JAMIA External Validation section.
 *
 * Reads:
 *   1. The six canonical frontmatter fields from each reproduction `.ts` file's
 *      JSDoc header (ID, Language, Bug class, Runtime consequence, In study,
 *      Inclusion rationale).
 *   2. The verification report (`verification-report.json`) for the derived
 *      fields: Reproduction status, Tidy-TS detection outcome, Tidy-TS detection
 *      mechanism, Tidy-TS catch explanation.
 *
 * Writes:
 *   - `corroboration-summary.json` — machine-readable summary for the manuscript.
 *   - Generated section in `INCLUSION_EVALUATION.md` between
 *     `<!-- BEGIN GENERATED -->` and `<!-- END GENERATED -->` markers.
 *
 * Scope: TM subset only. CDA reproductions reported separately as
 * illustrative-only per CONTEXT.md.
 *
 * Usage:
 *   deno run -A docs/JAMIA/comparisons/RPython/generate-tables.ts
 */

const RPYTHON_DIR = new URL(".", import.meta.url).pathname;
const COMPARISONS_DIR = new URL("..", import.meta.url).pathname;
const TM_JSON = `${RPYTHON_DIR}TM_snippets.json`;

const CATEGORIES = [
  "Column reference",
  "Value type",
  "Missing value",
  "Join",
  "Data loading",
  "Schema composition",
] as const;

const BUG_CLASS_TO_CATEGORY: Record<string, typeof CATEGORIES[number]> = {
  "Column ref": "Column reference",
  "Column reference": "Column reference",
  "Value type": "Value type",
  "Nullable": "Missing value",
  "Missing value": "Missing value",
  "Join": "Join",
  "Data loading": "Data loading",
  "Schema composition": "Schema composition",
};

const MECHANISMS = [
  "compiler",
  "zod schema validation",
  "runtime API guard",
  "none — language structural absence",
  "none — library API design",
  "none — bug still exists",
] as const;

interface VerificationFile {
  path: string;
  subset: "TM" | "CDA";
  frontmatter: {
    id?: string;
    language?: string;
    bugClass?: string;
    runtimeConsequence?: string;
    inStudy?: string;
    inclusionRationale?: string;
  };
  reproductionStatusObserved: string;
  tidyTsDetectionOutcomeObserved: string;
  tidyTsDetectionMechanismObserved: string;
  tidyTsCatchExplanation: string;
  tsCheckStatus: string;
  foreign: { language: string; exitCode: number; lastStderrLine: string };
}

interface VerificationReport {
  metadata: {
    evaluationDate: string;
    corpus: string;
    pythonRuntime: string;
    rRuntime: string;
    denoRuntime: string;
    runnerScript: string;
    gitCommit: string;
  };
  files: VerificationFile[];
}

async function loadVerificationReport(): Promise<VerificationReport> {
  const path = `${RPYTHON_DIR}verification-report.json`;
  const text = await Deno.readTextFile(path);
  return JSON.parse(text) as VerificationReport;
}

async function loadCorpusSize(): Promise<number> {
  try {
    const text = await Deno.readTextFile(TM_JSON);
    const snippets = JSON.parse(text);
    return Array.isArray(snippets) ? snippets.length : 164;
  } catch {
    return 164;
  }
}

function tally<T extends string>(values: (string | undefined)[], keys: readonly T[]): Record<T, number> {
  const out = Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;
  for (const v of values) {
    if (v && (keys as readonly string[]).includes(v)) {
      out[v as T] = (out[v as T] ?? 0) + 1;
    }
  }
  return out;
}

function buildSummary(report: VerificationReport, corpusTotal: number) {
  const tm = report.files.filter((f) => f.subset === "TM");
  const cda = report.files.filter((f) => f.subset === "CDA");
  const included = tm.filter((f) => f.frontmatter.inStudy?.toLowerCase() === "yes");

  const byCategory: Record<string, VerificationFile[]> = Object.fromEntries(
    CATEGORIES.map((c) => [c, [] as VerificationFile[]]),
  );
  const unmapped: Record<string, number> = {};
  for (const f of included) {
    const canonical = BUG_CLASS_TO_CATEGORY[f.frontmatter.bugClass ?? ""];
    if (canonical) byCategory[canonical].push(f);
    else if (f.frontmatter.bugClass) unmapped[f.frontmatter.bugClass] = (unmapped[f.frontmatter.bugClass] ?? 0) + 1;
  }

  const perCategoryMechanism = Object.fromEntries(
    CATEGORIES.map((c) => [c, tally(byCategory[c].map((f) => f.tidyTsDetectionMechanismObserved), MECHANISMS)]),
  );

  return {
    metadata: report.metadata,
    inclusionFunnel: {
      corpus: corpusTotal,
      tmReproductionsOnDisk: tm.length,
      included: included.length,
      excluded: corpusTotal - tm.length,
      cdaIllustrativeReproductions: cda.length,
    },
    categoryDistribution: Object.fromEntries(CATEGORIES.map((c) => [c, byCategory[c].length])),
    unmappedBugClasses: unmapped,
    perCategoryMechanism,
    reproductionStatus: tally(
      included.map((f) => f.reproductionStatusObserved),
      ["Reproduces", "No longer reproduces", "Variant"] as const,
    ),
    detectionOutcome: tally(
      included.map((f) => f.tidyTsDetectionOutcomeObserved),
      [
        "compile-time error",
        "runtime error",
        "runtime warning",
        "silent continuation",
        "not applicable",
      ] as const,
    ),
    included: included.map((f) => ({
      id: f.frontmatter.id,
      language: f.frontmatter.language,
      category: BUG_CLASS_TO_CATEGORY[f.frontmatter.bugClass ?? ""] ?? f.frontmatter.bugClass,
      runtimeConsequence: f.frontmatter.runtimeConsequence,
      reproductionStatus: f.reproductionStatusObserved,
      detectionOutcome: f.tidyTsDetectionOutcomeObserved,
      detectionMechanism: f.tidyTsDetectionMechanismObserved,
      catchExplanation: f.tidyTsCatchExplanation,
      filePath: f.path,
    })),
    cdaIllustrative: cda.map((f) => ({
      id: f.frontmatter.id,
      language: f.frontmatter.language,
      filePath: f.path,
    })),
  };
}

function renderMarkdown(summary: ReturnType<typeof buildSummary>): string {
  const lines: string[] = [];
  lines.push("<!-- BEGIN GENERATED: do not edit between this marker and END GENERATED. Regenerate with `deno run -A docs/JAMIA/comparisons/RPython/generate-tables.ts`. -->");
  lines.push("");
  lines.push("## Reproducibility metadata");
  lines.push("");
  lines.push(`- Evaluation date: ${summary.metadata.evaluationDate}`);
  lines.push(`- Corpus: ${summary.metadata.corpus} (${summary.inclusionFunnel.corpus} snippets)`);
  lines.push(`- Python: ${summary.metadata.pythonRuntime}`);
  lines.push(`- R: ${summary.metadata.rRuntime}`);
  lines.push(`- Deno: ${summary.metadata.denoRuntime}`);
  lines.push(`- Runner: ${summary.metadata.runnerScript} (commit ${summary.metadata.gitCommit})`);
  lines.push("");
  lines.push("## Inclusion funnel");
  lines.push("");
  lines.push("| Stage | Count |");
  lines.push("|---|---:|");
  lines.push(`| TM corpus | ${summary.inclusionFunnel.corpus} |`);
  lines.push(`| Reproductions on disk (TM) | ${summary.inclusionFunnel.tmReproductionsOnDisk} |`);
  lines.push(`| Included (\`In study: Yes\`) | ${summary.inclusionFunnel.included} |`);
  lines.push(`| Excluded (no reproduction file; see Evaluation table below) | ${summary.inclusionFunnel.excluded} |`);
  lines.push(`| CDA illustrative-only | ${summary.inclusionFunnel.cdaIllustrativeReproductions} |`);
  lines.push("");
  lines.push("## Category distribution (included only)");
  lines.push("");
  lines.push("| Category | Count |");
  lines.push("|---|---:|");
  for (const c of CATEGORIES) {
    lines.push(`| ${c} | ${summary.categoryDistribution[c]} |`);
  }
  if (Object.keys(summary.unmappedBugClasses).length > 0) {
    lines.push("");
    lines.push("**Unmapped bug classes (review needed):**");
    for (const [bc, n] of Object.entries(summary.unmappedBugClasses)) {
      lines.push(`- ${bc}: ${n}`);
    }
  }
  lines.push("");
  lines.push("## Per-category Tidy-TS detection mechanism");
  lines.push("");
  const mechHeader = ["Category", ...MECHANISMS];
  lines.push(`| ${mechHeader.join(" | ")} |`);
  lines.push(`| ${mechHeader.map(() => "---").join(" | ")} |`);
  for (const c of CATEGORIES) {
    const cells = [c, ...MECHANISMS.map((m) => String(summary.perCategoryMechanism[c][m]))];
    lines.push(`| ${cells.join(" | ")} |`);
  }
  lines.push("");
  lines.push("## Reproduction status (included only)");
  lines.push("");
  lines.push("| Status | Count |");
  lines.push("|---|---:|");
  for (const k of ["Reproduces", "No longer reproduces", "Variant"]) {
    lines.push(`| ${k} | ${summary.reproductionStatus[k as keyof typeof summary.reproductionStatus]} |`);
  }
  lines.push("");
  lines.push("## Tidy-TS detection outcome (included only)");
  lines.push("");
  lines.push("| Outcome | Count |");
  lines.push("|---|---:|");
  for (const k of ["compile-time error", "runtime error", "runtime warning", "silent continuation", "not applicable"]) {
    lines.push(`| ${k} | ${summary.detectionOutcome[k as keyof typeof summary.detectionOutcome]} |`);
  }
  lines.push("");
  lines.push("<!-- END GENERATED -->");
  return lines.join("\n");
}

async function writeIntoInclusionEval(markdown: string) {
  const path = `${RPYTHON_DIR}INCLUSION_EVALUATION.md`;
  const current = await Deno.readTextFile(path);
  const beginRe = /<!-- BEGIN GENERATED[\s\S]*?<!-- END GENERATED -->/;
  let updated: string;
  if (beginRe.test(current)) {
    updated = current.replace(beginRe, markdown);
  } else {
    const evalIdx = current.indexOf("## Evaluation");
    if (evalIdx >= 0) {
      updated = current.slice(0, evalIdx) + markdown + "\n\n---\n\n" + current.slice(evalIdx);
    } else {
      updated = current + "\n\n" + markdown + "\n";
    }
  }
  await Deno.writeTextFile(path, updated);
}

async function main() {
  const report = await loadVerificationReport();
  const corpusTotal = await loadCorpusSize();
  const summary = buildSummary(report, corpusTotal);

  await Deno.writeTextFile(
    `${RPYTHON_DIR}corroboration-summary.json`,
    JSON.stringify(summary, null, 2),
  );

  const md = renderMarkdown(summary);
  await writeIntoInclusionEval(md);

  console.log("Wrote corroboration-summary.json");
  console.log("Updated INCLUSION_EVALUATION.md generated section");
  console.log(`\nFunnel: ${summary.inclusionFunnel.included} included / ${summary.inclusionFunnel.excluded} excluded`);
  console.log(`Categories: ${JSON.stringify(summary.categoryDistribution)}`);
  const mechanismTotals: Record<string, number> = {};
  for (const row of Object.values(summary.perCategoryMechanism)) {
    for (const [k, v] of Object.entries(row)) {
      mechanismTotals[k] = (mechanismTotals[k] ?? 0) + (v as number);
    }
  }
  console.log(`Mechanisms (totals): ${JSON.stringify(mechanismTotals)}`);
}

if (import.meta.main) {
  await main();
}
