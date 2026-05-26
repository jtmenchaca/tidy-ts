/**
 * Local comparison-suite verification runner.
 *
 * Sibling of `../RPython/verify.ts`. Walks every scenario `.ts` under
 * `local/cat-N-(slug)/scenarios/(id).ts`. Each scenario file inlines its comparator
 * implementations and prints the uniform stdout line shape:
 *
 *   [<comparator>] exit=<code> | <message>
 *
 * For each scenario the verifier:
 *   1. Runs `deno check` against the file to detect compile-time catches
 *      (`@ts-expect-error` directives honored for Tidy-TS; static checker
 *      reports for mypy/pyright).
 *   2. Runs `deno run -A` against the file. Parses stdout for every
 *      `[<comparator>] exit=N | <message>` line.
 *   3. For each (scenario × comparator) records THREE INDEPENDENT booleans:
 *        - compileCatchFired  — compiler/static checker flagged the code
 *        - runtimeCatchFired  — program stopped with an error at runtime
 *        - warningEmitted     — runtime printed a warning header
 *      These are not mutually exclusive. A Tidy-TS scenario can have both a
 *      compile-time catch AND a runtime catch (defense in depth).
 *
 *      Separately, a single-valued `detectionOutcome` enum is computed per the
 *      canonical glossary in `../CONTEXT.md` (compile → runtime-error →
 *      runtime-warning → silent → n/a), for places that need a single label.
 *      Manuscript tables read the booleans, not the enum.
 *
 * Writes `local/verification-report.{json,md}`.
 *
 * Usage:
 *   deno run -A docs/JAMIA/comparisons/local/verify-local.ts [--limit N]
 */

const LOCAL_DIR = new URL(".", import.meta.url).pathname;
const COMPARISONS_DIR = new URL("..", import.meta.url).pathname;

const COMPARATORS = [
  "pandas",
  "tidyverse",
  "Polars",
  "mypy",
  "pyright",
  "Arquero",
  "Tidy-TS",
] as const;
type Comparator = typeof COMPARATORS[number];

type DetectionOutcome =
  | "compile-time error"
  | "runtime error"
  | "runtime warning"
  | "silent continuation"
  | "not applicable";

type TsCheckStatus = "passes" | "fails" | "unused-expect-error";

interface Frontmatter {
  id?: string;
  category?: string;
  label?: string;
  intent?: string;
  raw: Record<string, string>;
}

interface SignalLine {
  comparator: Comparator;
  exitCode: number;
  message: string;
}

interface RunRecord {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * Three independent booleans per (scenario × comparator).
 * NOT mutually exclusive — a Tidy-TS scenario can have both compileCatchFired
 * AND runtimeCatchFired (defense in depth).
 */
interface CatchSignals {
  compileCatchFired: boolean;
  runtimeCatchFired: boolean;
  warningEmitted: boolean;
}

interface FileReport {
  path: string;
  category: number;
  frontmatter: Frontmatter;

  tsCheck: RunRecord;
  tsCheckStatus: TsCheckStatus;

  run: RunRecord;
  signals: Record<Comparator, SignalLine | null>;

  /** Independent booleans — the basis for manuscript tables. */
  catches: Record<Comparator, CatchSignals>;

  /**
   * Canonical single-valued detection outcome per `../CONTEXT.md`.
   * Priority: compile > runtime-error > runtime-warning > silent > n/a.
   * Useful for at-a-glance per-scenario classification, but manuscript
   * tables read the booleans, not this enum.
   */
  outcomes: Record<Comparator, DetectionOutcome>;
}

interface Report {
  metadata: {
    evaluationDate: string;
    pythonRuntime: string;
    rRuntime: string;
    denoRuntime: string;
    runnerScript: string;
    gitCommit: string;
  };
  files: FileReport[];
  summary: {
    totalFiles: number;
    /** Tally of the canonical single-valued enum. */
    perComparatorOutcomeCounts: Record<Comparator, Record<DetectionOutcome, number>>;
    tsCheckCounts: Record<TsCheckStatus, number>;
    /**
     * Independent boolean tallies. For each comparator: how many scenarios
     * fire the compile catch, runtime catch, or warning. These are NOT
     * mutually exclusive — a scenario can contribute to multiple columns.
     * This is the basis for the manuscript's Tables 2 and 3.
     */
    perComparatorCatchCounts: Record<
      Comparator,
      { compileCatchFired: number; runtimeCatchFired: number; warningEmitted: number }
    >;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Parsing
// ────────────────────────────────────────────────────────────────────────────

function parseFrontmatter(content: string): Frontmatter {
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
    const stripped = trimmed.replace(/^\*\s?/, "");
    const m = stripped.match(/^([A-Za-z][A-Za-z\s\-]+?):\s*(.+)$/);
    if (m) raw[m[1].trim()] = m[2].trim();
  }
  return {
    id: raw["ID"],
    category: raw["Category"],
    label: raw["Label"],
    intent: raw["Intent"],
    raw,
  };
}

function parseSignalLines(stdout: string): Record<Comparator, SignalLine | null> {
  const out: Record<Comparator, SignalLine | null> = Object.fromEntries(
    COMPARATORS.map((c) => [c, null]),
  ) as Record<Comparator, SignalLine | null>;

  const labelPattern = COMPARATORS.map((c) => c.replace(/[.\-]/g, "\\$&")).join("|");
  // `[ \t]*` instead of `\s*` so the regex does not cross newlines into the
  // next comparator's line when the current message is empty (e.g. silent
  // exit=0 produces `[pandas] exit=0 | ` followed immediately by `\n`).
  const re = new RegExp(`^\\[(${labelPattern})\\] exit=(-?\\d+)[ \\t]*\\|[ \\t]*(.*)$`, "gm");
  let match: RegExpExecArray | null;
  while ((match = re.exec(stdout)) !== null) {
    const comparator = match[1] as Comparator;
    out[comparator] = {
      comparator,
      exitCode: parseInt(match[2], 10),
      message: match[3].trim(),
    };
  }
  return out;
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
// Derivation: structural signals → detection outcomes
// ────────────────────────────────────────────────────────────────────────────

function isWarningMessage(message: string): boolean {
  // Python `UserWarning:`, `DeprecationWarning:`, R `Warning:` / `Warning message:`
  return /(?:^|\s)(?:User|Deprecation|Future|Runtime|Pending)?Warning(?:\s+message)?s?:\s+/i.test(
    message,
  ) || /^Warning:\s+/i.test(message);
}

function deriveOutcomeForForeign(signal: SignalLine | null): DetectionOutcome {
  if (signal === null) return "not applicable";
  if (signal.exitCode === 127) return "not applicable"; // tool not installed
  if (signal.exitCode !== 0) return "runtime error";
  if (signal.message && isWarningMessage(signal.message)) return "runtime warning";
  return "silent continuation";
}

function deriveOutcomeForStaticChecker(signal: SignalLine | null): DetectionOutcome {
  if (signal === null) return "not applicable";
  if (signal.exitCode === 127) return "not applicable"; // tool not installed
  // Static checkers don't run the program. A non-zero exit means the checker
  // reported at least one type error → compile-time error.
  // mypy: non-zero with `N error(s)` summary.
  // pyright: non-zero with errorCount > 0.
  // Exit 0 with "no errors" → silent (the checker didn't flag the bug).
  if (signal.exitCode !== 0) return "compile-time error";
  if (/no errors/i.test(signal.message)) return "silent continuation";
  return "silent continuation";
}

function deriveOutcomeForTidyTs(
  signal: SignalLine | null,
  tsCheckStatus: TsCheckStatus,
  tsContent: string,
): DetectionOutcome {
  // Compile-time catch takes precedence: an honored `@ts-expect-error` means
  // the compiler rejected the operation before it ran.
  if (tsCheckStatus === "passes" && tsFileHasExpectError(tsContent)) {
    return "compile-time error";
  }
  if (tsCheckStatus === "fails") {
    // Compile failed for some other reason — record as silent (not a designed catch).
    return "silent continuation";
  }
  // Otherwise look at the runtime signal.
  if (signal === null) return "not applicable";
  if (signal.exitCode !== 0) return "runtime error";
  if (signal.message && isWarningMessage(signal.message)) return "runtime warning";
  return "silent continuation";
}

function deriveOutcomesPerComparator(
  signals: Record<Comparator, SignalLine | null>,
  tsCheckStatus: TsCheckStatus,
  tsContent: string,
): Record<Comparator, DetectionOutcome> {
  return {
    pandas: deriveOutcomeForForeign(signals.pandas),
    tidyverse: deriveOutcomeForForeign(signals.tidyverse),
    Polars: deriveOutcomeForForeign(signals.Polars),
    mypy: deriveOutcomeForStaticChecker(signals.mypy),
    pyright: deriveOutcomeForStaticChecker(signals.pyright),
    Arquero: deriveOutcomeForForeign(signals.Arquero),
    "Tidy-TS": deriveOutcomeForTidyTs(signals["Tidy-TS"], tsCheckStatus, tsContent),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Independent catch signals per comparator.
// NOT mutually exclusive: a Tidy-TS scenario can have both compileCatchFired
// AND runtimeCatchFired. A tidyverse scenario can have warningEmitted=true
// AND runtimeCatchFired=false (warning that didn't halt) or both true (rare).
// ────────────────────────────────────────────────────────────────────────────

const EMPTY_CATCH: CatchSignals = {
  compileCatchFired: false,
  runtimeCatchFired: false,
  warningEmitted: false,
};

function catchesForForeign(signal: SignalLine | null): CatchSignals {
  // pandas / tidyverse / Polars / Arquero — no compile step.
  if (signal === null) return { ...EMPTY_CATCH };
  if (signal.exitCode === 127) return { ...EMPTY_CATCH };
  const runtimeCatchFired = signal.exitCode !== 0;
  const warningEmitted = !!signal.message && isWarningMessage(signal.message);
  return {
    compileCatchFired: false,
    runtimeCatchFired,
    warningEmitted,
  };
}

function catchesForStaticChecker(signal: SignalLine | null): CatchSignals {
  // mypy / pyright — pure compile-time tools; they don't run the program.
  if (signal === null) return { ...EMPTY_CATCH };
  if (signal.exitCode === 127) return { ...EMPTY_CATCH };
  return {
    compileCatchFired: signal.exitCode !== 0,
    runtimeCatchFired: false,
    warningEmitted: false,
  };
}

function catchesForTidyTs(
  signal: SignalLine | null,
  tsCheckStatus: TsCheckStatus,
  tsContent: string,
): CatchSignals {
  // Tidy-TS uniquely has BOTH a compile step (`deno check`) and a runtime
  // step (the scenario's runtime block, with `@ts-expect-error` silencing
  // the compiler so the bug runs anyway and the runtime guard can fire).
  const compileCatchFired = tsCheckStatus === "passes" && tsFileHasExpectError(tsContent);
  let runtimeCatchFired = false;
  let warningEmitted = false;
  if (signal !== null && signal.exitCode !== 127) {
    runtimeCatchFired = signal.exitCode !== 0;
    warningEmitted = !!signal.message && isWarningMessage(signal.message);
  }
  return { compileCatchFired, runtimeCatchFired, warningEmitted };
}

function deriveCatchesPerComparator(
  signals: Record<Comparator, SignalLine | null>,
  tsCheckStatus: TsCheckStatus,
  tsContent: string,
): Record<Comparator, CatchSignals> {
  return {
    pandas: catchesForForeign(signals.pandas),
    tidyverse: catchesForForeign(signals.tidyverse),
    Polars: catchesForForeign(signals.Polars),
    mypy: catchesForStaticChecker(signals.mypy),
    pyright: catchesForStaticChecker(signals.pyright),
    Arquero: catchesForForeign(signals.Arquero),
    "Tidy-TS": catchesForTidyTs(signals["Tidy-TS"], tsCheckStatus, tsContent),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// File discovery
// ────────────────────────────────────────────────────────────────────────────

interface ScenarioPath {
  path: string;
  category: number;
}

async function listScenarios(): Promise<ScenarioPath[]> {
  const out: ScenarioPath[] = [];
  for await (const catEntry of Deno.readDir(LOCAL_DIR)) {
    if (!catEntry.isDirectory) continue;
    const m = catEntry.name.match(/^cat-(\d+)-/);
    if (!m) continue;
    const category = parseInt(m[1], 10);
    const scenariosDir = `${LOCAL_DIR}${catEntry.name}/scenarios`;
    try {
      for await (const scenarioEntry of Deno.readDir(scenariosDir)) {
        if (!scenarioEntry.isFile) continue;
        if (!scenarioEntry.name.endsWith(".ts")) continue;
        out.push({
          path: `${scenariosDir}/${scenarioEntry.name}`,
          category,
        });
      }
    } catch {
      // missing scenarios dir; skip
    }
  }
  out.sort((a, b) => a.path.localeCompare(b.path));
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
  const all = await listScenarios();
  const scenarios = limit ? all.slice(0, limit) : all;
  if (limit) {
    console.log(
      `Running against first ${scenarios.length} of ${all.length} scenarios (--limit ${limit})\n`,
    );
  } else {
    console.log(`Running against ${scenarios.length} scenarios\n`);
  }

  const files: FileReport[] = [];

  for (const { path, category } of scenarios) {
    const tsContent = await Deno.readTextFile(path);
    const frontmatter = parseFrontmatter(tsContent);
    writeProgress(`  ${path.replace(COMPARISONS_DIR, "")} ... `);

    // 1. Compile-time signal — flake-retry once.
    let tsCheck = runCommand("deno", ["check", path]);
    let tsCheckStatus = classifyTsCheck(tsCheck);
    if (tsCheckStatus === "fails") {
      await new Promise((r) => setTimeout(r, 250));
      const retry = runCommand("deno", ["check", path]);
      if (classifyTsCheck(retry) === "passes") {
        tsCheck = retry;
        tsCheckStatus = "passes";
      }
    }

    // 2. Runtime signal — every comparator emits a [label] line.
    const run = runCommand("deno", ["run", "-A", path]);
    const signals = parseSignalLines(run.stdout);

    // 3. Derive per-comparator independent catch booleans AND the
    //    canonical single-valued detection outcome.
    const catches = deriveCatchesPerComparator(signals, tsCheckStatus, tsContent);
    const outcomes = deriveOutcomesPerComparator(signals, tsCheckStatus, tsContent);

    const tsCatch = catches["Tidy-TS"];
    console.log(
      `ts=${tsCheckStatus}  tidy-ts: compile=${tsCatch.compileCatchFired ? "Y" : "n"} runtime=${
        tsCatch.runtimeCatchFired ? "Y" : "n"
      }`,
    );

    files.push({
      path: path.replace(COMPARISONS_DIR, ""),
      category,
      frontmatter,
      tsCheck: trimRun(tsCheck),
      tsCheckStatus,
      run: trimRun(run),
      signals,
      catches,
      outcomes,
    });
  }

  // Build report
  const perComparatorOutcomeCounts = Object.fromEntries(
    COMPARATORS.map((c) => [c, emptyOutcomeTally()]),
  ) as Record<Comparator, Record<DetectionOutcome, number>>;
  for (const f of files) {
    for (const c of COMPARATORS) {
      perComparatorOutcomeCounts[c][f.outcomes[c]] += 1;
    }
  }
  const tsCheckCounts: Record<TsCheckStatus, number> = {
    passes: 0,
    fails: 0,
    "unused-expect-error": 0,
  };
  for (const f of files) tsCheckCounts[f.tsCheckStatus] += 1;

  // Independent catch-signal tallies. Per comparator, count how many
  // scenarios fire each of {compile, runtime, warning}. NOT mutually exclusive.
  const perComparatorCatchCounts = Object.fromEntries(
    COMPARATORS.map((c) => [c, { compileCatchFired: 0, runtimeCatchFired: 0, warningEmitted: 0 }]),
  ) as Record<
    Comparator,
    { compileCatchFired: number; runtimeCatchFired: number; warningEmitted: number }
  >;
  for (const f of files) {
    for (const c of COMPARATORS) {
      if (f.catches[c].compileCatchFired) perComparatorCatchCounts[c].compileCatchFired += 1;
      if (f.catches[c].runtimeCatchFired) perComparatorCatchCounts[c].runtimeCatchFired += 1;
      if (f.catches[c].warningEmitted) perComparatorCatchCounts[c].warningEmitted += 1;
    }
  }

  const metadata = {
    evaluationDate: new Date().toISOString().slice(0, 10),
    pythonRuntime: runtimeVersion("python3", ["--version"]),
    rRuntime: runtimeVersion("Rscript", ["--version"]).replace(/^.*?(\d+\.\d+\.\d+).*$/, "R $1"),
    denoRuntime: runtimeVersion("deno", ["--version"]),
    runnerScript: "docs/JAMIA/comparisons/local/verify-local.ts",
    gitCommit: gitCommit(),
  };

  const report: Report = {
    metadata,
    files,
    summary: {
      totalFiles: files.length,
      perComparatorOutcomeCounts,
      tsCheckCounts,
      perComparatorCatchCounts,
    },
  };

  await Deno.writeTextFile(
    `${LOCAL_DIR}verification-report.json`,
    JSON.stringify(report, null, 2),
  );
  await writeMarkdownReport(report);

  console.log(`\nWrote verification-report.{json,md} (${files.length} files)\n`);
  console.log(`Summary:`);
  console.log(`  .ts check: ${JSON.stringify(tsCheckCounts)}`);
  console.log(`\nIndependent catch signals (NOT mutually exclusive):`);
  console.log(`  ${"comparator".padEnd(10)}  compile  runtime  warning`);
  for (const c of COMPARATORS) {
    const t = perComparatorCatchCounts[c];
    console.log(
      `  ${c.padEnd(10)}  ${String(t.compileCatchFired).padStart(7)}  ${
        String(t.runtimeCatchFired).padStart(7)
      }  ${String(t.warningEmitted).padStart(7)}`,
    );
  }
}

function emptyOutcomeTally(): Record<DetectionOutcome, number> {
  return {
    "compile-time error": 0,
    "runtime error": 0,
    "runtime warning": 0,
    "silent continuation": 0,
    "not applicable": 0,
  };
}

function trimRun(run: RunRecord): RunRecord {
  return {
    exitCode: run.exitCode,
    stdout: run.stdout.slice(0, 4000),
    stderr: run.stderr.slice(0, 4000),
  };
}

function writeProgress(s: string): void {
  Deno.stdout.writeSync(new TextEncoder().encode(s));
}

const OUTCOME_SHORT: Record<DetectionOutcome, string> = {
  "compile-time error": "C",
  "runtime error": "RE",
  "runtime warning": "RW",
  "silent continuation": "S",
  "not applicable": "—",
};

async function writeMarkdownReport(report: Report) {
  const lines: string[] = [];
  lines.push("# Local Comparison Suite — Verification Report");
  lines.push("");
  lines.push("Generated by `docs/JAMIA/comparisons/local/verify-local.ts`.");
  lines.push("");
  lines.push("Each row reports the **detection outcome** for one scenario × comparator pair,");
  lines.push("derived from the uniform `[<comparator>] exit=N | <message>` line each scenario");
  lines.push("file prints, plus `deno check` for the Tidy-TS compile-time signal.");
  lines.push("");
  lines.push("Outcome key: `C` compile-time error · `RE` runtime error · `RW` runtime warning ·");
  lines.push("`S` silent continuation · `—` not applicable.");
  lines.push("");
  lines.push("## Metadata");
  lines.push("");
  lines.push(`- Evaluation date: ${report.metadata.evaluationDate}`);
  lines.push(`- Python: ${report.metadata.pythonRuntime}`);
  lines.push(`- R: ${report.metadata.rRuntime}`);
  lines.push(`- Deno: ${report.metadata.denoRuntime}`);
  lines.push(`- Runner: ${report.metadata.runnerScript} (commit ${report.metadata.gitCommit})`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total scenarios: ${report.summary.totalFiles}`);
  lines.push(`- \`.ts check\`: ${JSON.stringify(report.summary.tsCheckCounts)}`);
  lines.push("");
  lines.push("### Independent catch signals (NOT mutually exclusive)");
  lines.push("");
  lines.push(
    "For each (scenario × comparator), three booleans are recorded: whether the",
  );
  lines.push(
    "compile-time catch fired, whether the runtime catch fired, and whether a",
  );
  lines.push(
    "warning was emitted. A single scenario can contribute to multiple columns",
  );
  lines.push(
    "(e.g. a Tidy-TS scenario with both `@ts-expect-error` and a runtime guard).",
  );
  lines.push("");
  lines.push("| Comparator | Compile | Runtime | Warning |");
  lines.push("|---|---:|---:|---:|");
  for (const c of COMPARATORS) {
    const t = report.summary.perComparatorCatchCounts[c];
    lines.push(`| ${c} | ${t.compileCatchFired} | ${t.runtimeCatchFired} | ${t.warningEmitted} |`);
  }
  lines.push("");
  lines.push("### Canonical detection outcome (single-valued per CONTEXT.md)");
  lines.push("");
  lines.push(
    "Priority: compile > runtime-error > runtime-warning > silent > n/a. Each",
  );
  lines.push("scenario × comparator gets exactly one value.");
  lines.push("");
  lines.push("Outcome key: `C` compile-time error · `RE` runtime error · `RW` runtime warning ·");
  lines.push("`S` silent continuation · `—` not applicable.");
  lines.push("");
  lines.push("| Comparator | C | RE | RW | S | — |");
  lines.push("|---|---:|---:|---:|---:|---:|");
  for (const c of COMPARATORS) {
    const t = report.summary.perComparatorOutcomeCounts[c];
    lines.push(
      `| ${c} | ${t["compile-time error"]} | ${t["runtime error"]} | ${t["runtime warning"]} | ${
        t["silent continuation"]
      } | ${t["not applicable"]} |`,
    );
  }
  lines.push("");

  // Per-category tables
  const byCategory = new Map<number, FileReport[]>();
  for (const f of report.files) {
    const arr = byCategory.get(f.category) ?? [];
    arr.push(f);
    byCategory.set(f.category, arr);
  }
  const categoryNames: Record<number, string> = {
    1: "Column reference",
    2: "Value type",
    3: "Missing value",
    4: "Join",
    5: "Data loading / Schema composition",
  };
  for (const cat of [...byCategory.keys()].sort((a, b) => a - b)) {
    const rows = byCategory.get(cat)!.sort((a, b) =>
      (a.frontmatter.id ?? a.path).localeCompare(b.frontmatter.id ?? b.path)
    );
    lines.push(`## Category ${cat}: ${categoryNames[cat] ?? "(unknown)"} (${rows.length} scenarios)`);
    lines.push("");

    // Per-category independent catch tally
    lines.push("Independent catch signals (compile / runtime / warning per comparator):");
    lines.push("");
    const catComparatorTotals = Object.fromEntries(
      COMPARATORS.map((c) => [c, { compile: 0, runtime: 0, warning: 0 }]),
    ) as Record<Comparator, { compile: number; runtime: number; warning: number }>;
    for (const f of rows) {
      for (const c of COMPARATORS) {
        if (f.catches[c].compileCatchFired) catComparatorTotals[c].compile += 1;
        if (f.catches[c].runtimeCatchFired) catComparatorTotals[c].runtime += 1;
        if (f.catches[c].warningEmitted) catComparatorTotals[c].warning += 1;
      }
    }
    lines.push("| Comparator | Compile | Runtime | Warning |");
    lines.push("|---|---:|---:|---:|");
    for (const c of COMPARATORS) {
      const t = catComparatorTotals[c];
      lines.push(`| ${c} | ${t.compile} | ${t.runtime} | ${t.warning} |`);
    }
    lines.push("");

    // Per-scenario detail using the canonical enum
    lines.push("Per scenario (canonical detection outcome):");
    lines.push("");
    lines.push(`| ID | Label | ${COMPARATORS.join(" | ")} |`);
    lines.push(`|---|---|${COMPARATORS.map(() => "---").join("|")}|`);
    for (const f of rows) {
      const id = f.frontmatter.id ?? "?";
      const label = f.frontmatter.label ?? "?";
      const cells = COMPARATORS.map((c) => OUTCOME_SHORT[f.outcomes[c]]);
      lines.push(`| ${id} | ${label} | ${cells.join(" | ")} |`);
    }
    lines.push("");
  }

  // Per-scenario signal-line detail (for debugging)
  lines.push("## Per-scenario signal lines");
  lines.push("");
  lines.push("Raw `[<comparator>] exit=N | <message>` lines parsed from each scenario's stdout.");
  lines.push("");
  for (const f of report.files) {
    lines.push(`### \`${f.path}\``);
    lines.push("");
    for (const c of COMPARATORS) {
      const s = f.signals[c];
      if (s === null) {
        lines.push(`- **${c}**: (no signal line)`);
      } else {
        const msg = s.message.length > 160 ? s.message.slice(0, 157) + "..." : s.message;
        lines.push(`- **${c}**: exit=${s.exitCode} | ${msg}`);
      }
    }
    lines.push("");
  }

  await Deno.writeTextFile(`${LOCAL_DIR}verification-report.md`, lines.join("\n"));
}

if (import.meta.main) {
  await main();
}
