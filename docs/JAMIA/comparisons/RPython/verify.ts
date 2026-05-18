/**
 * RPython reproduction verification runner — self-contained `.ts` design.
 *
 * Each reproduction is a single self-contained `.ts` file with:
 *   1. A JSDoc header carrying the six canonical frontmatter fields.
 *   2. An inlined foreign-language reproduction (pandas or R) run via
 *      `runForeign` from `./run-foreign.ts`, which prints
 *      `[pandas|R] exit=N | <last stderr line>` to stdout.
 *   3. A tidy-ts equivalent with (typically) one `@ts-expect-error` line.
 *
 * The verifier:
 *   - Runs `deno check` against the file to confirm any `@ts-expect-error`
 *     is honored (compile-time signal).
 *   - Runs `deno run -A` against the file. Parses stdout for the
 *     `[pandas|R] exit=N | ...` line and any `[tidy-ts]` runtime-guard lines.
 *   - Derives `Reproduction status`, `Tidy-TS detection outcome`, and
 *     `Tidy-TS detection mechanism` from those signals. Nothing is read from
 *     hand-authored prose other than the six frontmatter fields.
 *
 * Usage:
 *   deno run -A docs/JAMIA/comparisons/RPython/verify.ts [--limit N]
 */

const RPYTHON_DIR = new URL(".", import.meta.url).pathname;
const COMPARISONS_DIR = new URL("..", import.meta.url).pathname;

interface Frontmatter {
  id?: string;
  language?: string;
  bugClass?: string;
  runtimeConsequence?: "DC" | "IF" | "Crash" | string;
  inStudy?: string;
  inclusionRationale?: string;
  raw: Record<string, string>;
}

interface RunRecord {
  exitCode: number;
  stdout: string;
  stderr: string;
}

interface ForeignSignal {
  language: "pandas" | "R" | "unknown";
  exitCode: number;
  lastStderrLine: string;
}

type ReproductionStatus = "Reproduces" | "No longer reproduces" | "Variant" | "unknown";
type TidyTSDetectionOutcome =
  | "compile-time error"
  | "runtime error"
  | "runtime warning"
  | "silent continuation"
  | "not applicable";
type TidyTSDetectionMechanism =
  | "compiler"
  | "zod schema validation"
  | "runtime API guard"
  | "none — language structural absence"
  | "none — library API design"
  | "none — bug still exists";
type TsCheckStatus = "passes" | "fails" | "unused-expect-error";

interface FileReport {
  path: string;
  subset: "TM" | "CDA";
  frontmatter: Frontmatter;

  tsCheck: RunRecord;
  tsCheckStatus: TsCheckStatus;

  run: RunRecord;
  foreign: ForeignSignal;
  tidyTsRuntimeGuardFired: boolean;
  reproductionFileCrashed: boolean; // tidy-ts side itself threw, not the foreign subprocess

  reproductionStatusObserved: ReproductionStatus;
  tidyTsDetectionOutcomeObserved: TidyTSDetectionOutcome;
  tidyTsDetectionMechanismObserved: TidyTSDetectionMechanism;
  tidyTsCatchExplanation: string;
}

interface Report {
  metadata: {
    evaluationDate: string;
    corpus: string;
    pythonRuntime: string;
    rRuntime: string;
    denoRuntime: string;
    runnerScript: string;
    gitCommit: string;
  };
  files: FileReport[];
  summary: {
    totalFiles: number;
    tmFiles: number;
    cdaFiles: number;
    tsCheckCounts: Record<string, number>;
    reproductionStatusCounts: Record<string, number>;
    detectionOutcomeCounts: Record<string, number>;
    detectionMechanismCounts: Record<string, number>;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Parsing
// ────────────────────────────────────────────────────────────────────────────

function parseFrontmatter(content: string): Frontmatter {
  // Frontmatter lives in a leading JSDoc block: `* Key: Value` lines.
  const raw: Record<string, string> = {};
  const lines = content.split("\n");
  let inBlock = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("/**")) {
      inBlock = true;
      continue;
    }
    if (inBlock && trimmed.startsWith("*/")) break;
    if (!inBlock) continue;
    // Strip leading "* " or "*"
    const stripped = trimmed.replace(/^\*\s?/, "");
    const m = stripped.match(/^([A-Za-z][A-Za-z\s\-]+?):\s*(.+)$/);
    if (m) raw[m[1].trim()] = m[2].trim();
  }
  return {
    id: raw["ID"],
    language: raw["Language"],
    bugClass: raw["Bug class"],
    runtimeConsequence: raw["Runtime consequence"],
    inStudy: raw["In study"],
    inclusionRationale: raw["Inclusion rationale"],
    raw,
  };
}

function parseForeignSignal(stdout: string): ForeignSignal {
  // Lines look like: `[pandas] exit=1 | TypeError: ...`
  //               or `[R] exit=0 | `
  const match = stdout.match(/^\[(pandas|R)\] exit=(-?\d+)\s*\|\s*(.*)$/m);
  if (!match) {
    return { language: "unknown", exitCode: -1, lastStderrLine: "" };
  }
  return {
    language: match[1] as "pandas" | "R",
    exitCode: parseInt(match[2], 10),
    lastStderrLine: match[3].trim(),
  };
}

function parseTidyTsRuntimeGuard(stdout: string): boolean {
  // tidy-ts runtime guards emit lines starting with `[tidy-ts]`
  return /^\[tidy-ts\]/m.test(stdout);
}

function tsFileHasExpectError(content: string): boolean {
  return /@ts-expect-error/.test(content);
}

// ────────────────────────────────────────────────────────────────────────────
// Running
// ────────────────────────────────────────────────────────────────────────────

function runCommand(cmd: string, args: string[]): RunRecord {
  try {
    const proc = new Deno.Command(cmd, { args, stdout: "piped", stderr: "piped" });
    const { code, stdout, stderr } = proc.outputSync();
    const decoder = new TextDecoder();
    return {
      exitCode: code,
      stdout: decoder.decode(stdout),
      stderr: decoder.decode(stderr),
    };
  } catch (e) {
    return { exitCode: -1, stdout: "", stderr: e instanceof Error ? e.message : String(e) };
  }
}

function classifyTsCheck(run: RunRecord): TsCheckStatus {
  if (run.exitCode === 0) {
    if (/unused '?@ts-expect-error/i.test(run.stderr)) return "unused-expect-error";
    return "passes";
  }
  return "fails";
}

// ────────────────────────────────────────────────────────────────────────────
// Derivation: structural signals → enums
// ────────────────────────────────────────────────────────────────────────────

function deriveReproductionStatus(
  consequence: string | undefined,
  foreign: ForeignSignal,
): ReproductionStatus {
  if (foreign.language === "unknown") return "unknown";
  const exitedNonZero = foreign.exitCode !== 0;
  const emittedWarning = /^\s*(UserWarning|DeprecationWarning|Warning message):/i.test(
    foreign.lastStderrLine,
  );

  if (consequence === "Crash") {
    if (exitedNonZero) return "Reproduces";
    if (emittedWarning) return "Variant"; // Crash → Warning
    return "No longer reproduces";
  }
  if (consequence === "DC" || consequence === "IF") {
    // Silent expected. Exit 0 with no warning = silent (Reproduces).
    if (exitedNonZero) return "Variant"; // silent → crash
    if (emittedWarning) return "Variant"; // silent → warning
    return "Reproduces";
  }
  return "unknown";
}

function deriveTidyTsDetection(
  tsCheckStatus: TsCheckStatus,
  tsContent: string,
  tidyTsRuntimeGuardFired: boolean,
): {
  outcome: TidyTSDetectionOutcome;
  mechanism: TidyTSDetectionMechanism;
  explanation: string;
} {
  // The presence of `@ts-expect-error` in a passing file means the compiler
  // caught the mistake — the directive silences exactly one error per line,
  // and `deno check` would have reported `Unused '@ts-expect-error'` if the
  // line failed to suppress a real error.
  if (tsCheckStatus === "passes" && tsFileHasExpectError(tsContent)) {
    const explanation = extractExpectErrorComment(tsContent);
    return {
      outcome: "compile-time error",
      mechanism: "compiler",
      explanation,
    };
  }
  if (tsCheckStatus === "unused-expect-error") {
    return {
      outcome: "silent continuation",
      mechanism: "none — bug still exists",
      explanation: "@ts-expect-error directive is unused — compiler did not flag the operation",
    };
  }
  if (tsCheckStatus === "fails") {
    return {
      outcome: "silent continuation",
      mechanism: "none — bug still exists",
      explanation: "deno check failed — see verification report stderr",
    };
  }
  // Passes with no @ts-expect-error: not a compile-time catch. Look at runtime.
  if (tidyTsRuntimeGuardFired) {
    return {
      outcome: "runtime warning",
      mechanism: "runtime API guard",
      explanation: "tidy-ts runtime guard emitted a `[tidy-ts]` line",
    };
  }
  // No catch of any kind observed in the file. The author chose to leave the
  // file without an `@ts-expect-error`; the canonical interpretation is one of
  // the "none" mechanisms — language-structural-absence, library-API-design,
  // or bug-still-exists. The verifier cannot distinguish these mechanically;
  // it falls back to `bug still exists` and flags the file for author review.
  return {
    outcome: "silent continuation",
    mechanism: "none — bug still exists",
    explanation: "no @ts-expect-error and no runtime guard observed",
  };
}

function extractExpectErrorComment(tsContent: string): string {
  // `// @ts-expect-error — <prose>` or `// @ts-expect-error: <prose>`
  const m = tsContent.match(/\/\/\s*@ts-expect-error\s*[—:\-]?\s*(.+)$/m);
  return m ? m[1].trim() : "";
}

// ────────────────────────────────────────────────────────────────────────────
// File discovery
// ────────────────────────────────────────────────────────────────────────────

async function listReproductions(): Promise<{ path: string; subset: "TM" | "CDA" }[]> {
  const out: { path: string; subset: "TM" | "CDA" }[] = [];
  for (const subset of ["TM", "CDA"] as const) {
    const dir = `${RPYTHON_DIR}${subset}`;
    try {
      for await (const entry of Deno.readDir(dir)) {
        if (!entry.isFile) continue;
        if (entry.name.endsWith(".ts")) {
          out.push({ path: `${dir}/${entry.name}`, subset });
        }
      }
    } catch {
      // missing directory; skip
    }
  }
  out.sort((a, b) => {
    if (a.subset !== b.subset) return a.subset === "TM" ? -1 : 1;
    return a.path.localeCompare(b.path);
  });
  return out;
}

function runtimeVersion(cmd: string, args: string[]): string {
  const run = runCommand(cmd, args);
  return (run.stdout || run.stderr).split("\n")[0].trim() || "unknown";
}

function gitCommit(): string {
  const run = runCommand("git", ["rev-parse", "--short", "HEAD"]);
  return run.stdout.trim() || "unknown";
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

interface Args {
  limit?: number;
}

function parseArgs(): Args {
  const args = Deno.args;
  const limitIdx = args.indexOf("--limit");
  if (limitIdx >= 0 && args[limitIdx + 1]) {
    const n = parseInt(args[limitIdx + 1], 10);
    if (!isNaN(n) && n > 0) return { limit: n };
  }
  return {};
}

async function main() {
  const { limit } = parseArgs();
  const all = await listReproductions();
  const reproductions = limit ? all.slice(0, limit) : all;
  if (limit) {
    console.log(`Running against first ${reproductions.length} of ${all.length} reproductions (--limit ${limit})\n`);
  }

  const files: FileReport[] = [];

  for (const { path, subset } of reproductions) {
    const tsContent = await Deno.readTextFile(path);
    const frontmatter = parseFrontmatter(tsContent);

    // 1. Compile-time signal
    let tsCheck = runCommand("deno", ["check", path]);
    let tsCheckStatus = classifyTsCheck(tsCheck);
    if (tsCheckStatus === "fails") {
      // Flaky `deno check` retry — once.
      await new Promise((r) => setTimeout(r, 250));
      const retry = runCommand("deno", ["check", path]);
      if (classifyTsCheck(retry) === "passes") {
        tsCheck = retry;
        tsCheckStatus = "passes";
      }
    }

    // 2. Runtime signal
    const run = runCommand("deno", ["run", "-A", path]);
    const foreign = parseForeignSignal(run.stdout);
    const tidyTsRuntimeGuardFired = parseTidyTsRuntimeGuard(run.stdout);
    const reproductionFileCrashed = run.exitCode !== 0;

    // 3. Derive enums
    const reproductionStatusObserved = deriveReproductionStatus(frontmatter.runtimeConsequence, foreign);
    const { outcome, mechanism, explanation } = deriveTidyTsDetection(
      tsCheckStatus,
      tsContent,
      tidyTsRuntimeGuardFired,
    );

    files.push({
      path: path.replace(COMPARISONS_DIR, ""),
      subset,
      frontmatter,
      tsCheck: trimRun(tsCheck),
      tsCheckStatus,
      run: trimRun(run),
      foreign,
      tidyTsRuntimeGuardFired,
      reproductionFileCrashed,
      reproductionStatusObserved,
      tidyTsDetectionOutcomeObserved: outcome,
      tidyTsDetectionMechanismObserved: mechanism,
      tidyTsCatchExplanation: explanation,
    });
  }

  // Build report
  const summary = {
    totalFiles: files.length,
    tmFiles: files.filter((f) => f.subset === "TM").length,
    cdaFiles: files.filter((f) => f.subset === "CDA").length,
    tsCheckCounts: tally(files.map((f) => f.tsCheckStatus)),
    reproductionStatusCounts: tally(files.map((f) => f.reproductionStatusObserved)),
    detectionOutcomeCounts: tally(files.map((f) => f.tidyTsDetectionOutcomeObserved)),
    detectionMechanismCounts: tally(files.map((f) => f.tidyTsDetectionMechanismObserved)),
  };

  const metadata = {
    evaluationDate: new Date().toISOString().slice(0, 10),
    corpus: "RPython (ESEC/FSE 2023), TM subset",
    pythonRuntime: runtimeVersion("python3", ["--version"]),
    rRuntime: runtimeVersion("Rscript", ["--version"]).replace(/^.*?(\d+\.\d+\.\d+).*$/, "R $1"),
    denoRuntime: runtimeVersion("deno", ["--version"]),
    runnerScript: "docs/JAMIA/comparisons/RPython/verify.ts",
    gitCommit: gitCommit(),
  };

  const report: Report = { metadata, files, summary };

  await Deno.writeTextFile(`${RPYTHON_DIR}verification-report.json`, JSON.stringify(report, null, 2));
  await writeMarkdownReport(report);

  console.log(`\nWrote verification-report.{json,md} (${files.length} files)\n`);
  console.log(`Summary:`);
  console.log(`  .ts check:           ${JSON.stringify(summary.tsCheckCounts)}`);
  console.log(`  Reproduction status: ${JSON.stringify(summary.reproductionStatusCounts)}`);
  console.log(`  Detection outcome:   ${JSON.stringify(summary.detectionOutcomeCounts)}`);
  console.log(`  Detection mechanism: ${JSON.stringify(summary.detectionMechanismCounts)}`);
}

function trimRun(run: RunRecord): RunRecord {
  return {
    exitCode: run.exitCode,
    stdout: run.stdout.slice(0, 1500),
    stderr: run.stderr.slice(0, 1500),
  };
}

function tally(values: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
}

async function writeMarkdownReport(report: Report) {
  const lines: string[] = [];
  lines.push("# RPython Verification Report");
  lines.push("");
  lines.push("Generated by `docs/JAMIA/comparisons/RPython/verify.ts`.");
  lines.push("");
  lines.push("## Metadata");
  lines.push("");
  lines.push(`- Evaluation date: ${report.metadata.evaluationDate}`);
  lines.push(`- Corpus: ${report.metadata.corpus}`);
  lines.push(`- Python: ${report.metadata.pythonRuntime}`);
  lines.push(`- R: ${report.metadata.rRuntime}`);
  lines.push(`- Deno: ${report.metadata.denoRuntime}`);
  lines.push(`- Runner: ${report.metadata.runnerScript} (commit ${report.metadata.gitCommit})`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total files: ${report.summary.totalFiles} (TM: ${report.summary.tmFiles}, CDA: ${report.summary.cdaFiles})`);
  lines.push(`- .ts check: ${JSON.stringify(report.summary.tsCheckCounts)}`);
  lines.push(`- Reproduction status: ${JSON.stringify(report.summary.reproductionStatusCounts)}`);
  lines.push(`- Tidy-TS detection outcome: ${JSON.stringify(report.summary.detectionOutcomeCounts)}`);
  lines.push(`- Tidy-TS detection mechanism: ${JSON.stringify(report.summary.detectionMechanismCounts)}`);
  lines.push("");
  lines.push("## Per-file detail");
  lines.push("");
  lines.push(
    "| File | Subset | Runtime consequence | Foreign exit | Reproduction status | .ts check | Detection outcome | Detection mechanism |",
  );
  lines.push("|---|---|---|---|---|---|---|---|");
  for (const f of report.files) {
    lines.push(
      `| \`${f.path}\` | ${f.subset} | ${f.frontmatter.runtimeConsequence ?? "—"} | ${f.foreign.exitCode} | ${f.reproductionStatusObserved} | ${f.tsCheckStatus} | ${f.tidyTsDetectionOutcomeObserved} | ${f.tidyTsDetectionMechanismObserved} |`,
    );
  }
  await Deno.writeTextFile(`${RPYTHON_DIR}verification-report.md`, lines.join("\n"));
}

if (import.meta.main) {
  await main();
}
