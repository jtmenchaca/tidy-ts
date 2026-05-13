/**
 * Test helpers for running R and Python probe scripts and capturing
 * their structured JSON output.
 *
 * Each probe script attempts an erroneous operation and emits JSON:
 *   { "outcome": "error" | "warning" | "silent", "message": "...", "result": ... }
 */

export type Outcome = "error" | "warning" | "silent";

export interface ProbeResult {
  outcome: Outcome;
  message: string;
  result: unknown;
}

/** Run an R probe script and parse its JSON output. */
export function runRProbe(scriptPath: string): ProbeResult[] {
  const cmd = new Deno.Command("Rscript", {
    args: [scriptPath],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = cmd.outputSync();

  const out = new TextDecoder().decode(stdout).trim();
  const err = new TextDecoder().decode(stderr).trim();

  // R probe scripts should always succeed (exit 0) and emit JSON
  if (code !== 0) {
    throw new Error(`Rscript failed (${scriptPath}):\n${err}`);
  }

  return JSON.parse(out) as ProbeResult[];
}

/** Run a Python probe script and parse its JSON output. */
export function runPythonProbe(scriptPath: string): ProbeResult[] {
  const cmd = new Deno.Command("python3", {
    args: [scriptPath],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = cmd.outputSync();

  const out = new TextDecoder().decode(stdout).trim();
  const err = new TextDecoder().decode(stderr).trim();

  if (code !== 0) {
    throw new Error(`python3 failed (${scriptPath}):\n${err}`);
  }

  return JSON.parse(out) as ProbeResult[];
}

/** Capture the runtime outcome of a TS expression, matching the probe format. */
export function captureOutcome(fn: () => unknown): ProbeResult {
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map(String).join(" "));
  };
  try {
    const result = fn();
    if (warnings.length > 0) {
      return { outcome: "warning", message: warnings.join("; "), result };
    }
    return { outcome: "silent", message: "no error", result };
  } catch (e) {
    return { outcome: "error", message: (e as Error).message, result: null };
  } finally {
    console.warn = origWarn;
  }
}

/** Format a result value for table display (max 30 chars). */
function fmtResult(r: ProbeResult): string {
  if (r.outcome === "error") return "N/A";
  const v = r.result;
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  let s: string;
  if (typeof v === "object") {
    try { s = JSON.stringify(v); } catch { s = String(v); }
  } else {
    s = String(v);
  }
  return s.length > 30 ? s.slice(0, 27) + "..." : s;
}

export type CompileOutcome = "error" | "silent" | "—";

/** Structured row data for programmatic collection. */
export interface ComparisonRow {
  label: string;
  tsCompile: CompileOutcome | "—";
  tsRuntime: Outcome | "—";
  tsResult: string;
  pyRuntime: Outcome | "—";
  pyResult: string;
  pyPyright: Outcome | "—";
  pyMypy: Outcome | "—";
  pyPolars: Outcome | "—";
  pyPolarsResult: string;
  rRuntime: Outcome | "—";
  rResult: string;
}

export interface ComparisonTableData {
  title: string;
  rows: ComparisonRow[];
}

/** Print a comparison table across Tidy-TS, Python (runtime, static, polars), and R results. */
export function printComparisonTable({
  title,
  labels,
  tsCompile,
  tidyTS,
  python,
  pyright,
  mypy,
  polars,
  r,
}: {
  title: string;
  labels: string[];
  tsCompile: CompileOutcome[];
  tidyTS: ProbeResult[];
  python: ProbeResult[];
  pyright?: ProbeResult[];
  mypy?: ProbeResult[];
  polars?: ProbeResult[];
  r: ProbeResult[];
}): ComparisonTableData {
  const cols: Record<string, string> = {
    case: "Case",
    tsCompile: "TS compile",
    tsOutcome: "TS runtime",
    tsResult: "TS result",
    pyOutcome: "Py runtime",
    pyResult: "Py result",
    ...(pyright ? { pyPyright: "Pyright compile" } : {}),
    ...(mypy ? { pyMypy: "Mypy compile" } : {}),
    ...(polars ? { pyPolars: "Polars" } : {}),
    ...(polars ? { pyPolarsResult: "Polars result" } : {}),
    rOutcome: "R runtime",
    rResult: "R result",
  };

  // Build rows
  const rows = labels.map((label, i) => {
    const row: Record<string, string> = {
      case: label,
      tsCompile: tsCompile[i] ?? "—",
      tsOutcome: tidyTS[i]?.outcome ?? "—",
      tsResult: tidyTS[i] ? fmtResult(tidyTS[i]) : "—",
      pyOutcome: python[i]?.outcome ?? "—",
      pyResult: python[i] ? fmtResult(python[i]) : "—",
      rOutcome: r[i]?.outcome ?? "—",
      rResult: r[i] ? fmtResult(r[i]) : "—",
    };
    if (pyright) row.pyPyright = pyright[i]?.outcome ?? "—";
    if (mypy) row.pyMypy = mypy[i]?.outcome ?? "—";
    if (polars) {
      row.pyPolars = polars[i]?.outcome ?? "—";
      row.pyPolarsResult = polars[i] ? fmtResult(polars[i]) : "—";
    }
    return row;
  });

  // Compute column widths
  const keys = Object.keys(cols);
  const widths: Record<string, number> = {};
  for (const k of keys) {
    widths[k] = Math.max(cols[k].length, ...rows.map((r) => r[k]?.length ?? 0));
  }

  const pad = (s: string, w: number) => s + " ".repeat(w - s.length);
  const sep = keys.map((k) => "-".repeat(widths[k])).join(" | ");
  const header = keys.map((k) => pad(cols[k], widths[k])).join(" | ");

  console.log(`\n${title}`);
  console.log(header);
  console.log(sep);
  for (const row of rows) {
    console.log(keys.map((k) => pad(row[k] ?? "—", widths[k])).join(" | "));
  }
  console.log();

  // Emit structured data for programmatic collection
  const tableData: ComparisonTableData = {
    title,
    rows: labels.map((label, i) => ({
      label,
      tsCompile: (tsCompile[i] ?? "—") as CompileOutcome | "—",
      tsRuntime: (tidyTS[i]?.outcome ?? "—") as Outcome | "—",
      tsResult: tidyTS[i] ? fmtResult(tidyTS[i]) : "—",
      pyRuntime: (python[i]?.outcome ?? "—") as Outcome | "—",
      pyResult: python[i] ? fmtResult(python[i]) : "—",
      pyPyright: (pyright?.[i]?.outcome ?? "—") as Outcome | "—",
      pyMypy: (mypy?.[i]?.outcome ?? "—") as Outcome | "—",
      pyPolars: (polars?.[i]?.outcome ?? "—") as Outcome | "—",
      pyPolarsResult: polars?.[i] ? fmtResult(polars[i]) : "—",
      rRuntime: (r[i]?.outcome ?? "—") as Outcome | "—",
      rResult: r[i] ? fmtResult(r[i]) : "—",
    })),
  };

  console.log(`__TABLE_DATA__${JSON.stringify(tableData)}__END_TABLE_DATA__`);

  return tableData;
}

/**
 * Derive compile outcomes from @ts-expect-error annotations in the test file.
 * Reads the test file source, extracts the compile-time test block, and splits
 * it into per-label sections. A label is "error" if its section contains
 * @ts-expect-error, "silent" otherwise.
 */
export function deriveCompileOutcomes(
  importMetaUrl: string,
  labels: string[],
): CompileOutcome[] {
  const filePath = new URL("", importMetaUrl).pathname;
  const source = Deno.readTextFileSync(filePath);

  // Find the Deno.test block with "compile-time" in its name
  const compileTestMatch = /Deno\.test\([^)]*compile-time/.exec(source);
  if (!compileTestMatch) {
    return labels.map(() => "silent");
  }

  const blockStart = compileTestMatch.index;
  let depth = 0;
  let blockEnd = -1;
  for (let i = source.indexOf("{", blockStart); i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) {
        blockEnd = i;
        break;
      }
    }
  }

  const compileBlock = blockEnd > 0
    ? source.slice(blockStart, blockEnd + 1)
    : source.slice(blockStart);

  // Extract label prefixes (e.g., "15a" from "15a: access dropped col")
  const prefixes = labels.map((l) => l.match(/^(\d+\w)/)?.[1] ?? "");

  // Find each prefix's position in the compile block, then assign each line
  // range to the nearest preceding label prefix
  const positions = prefixes.map((p) =>
    p ? compileBlock.indexOf(p) : -1
  );

  return prefixes.map((prefix, i) => {
    if (positions[i] === -1) {
      throw new Error(
        `deriveCompileOutcomes: label prefix "${prefix}" (from "${labels[i]}") ` +
        `not found in compile-time test block. Add a section with this prefix ` +
        `to the compile-time test, or use "silent" explicitly in the tsCompile array.`,
      );
    }

    // Section runs from this prefix's position to the next prefix's position (or end)
    const sectionStart = positions[i];
    const sectionEnd = positions
      .filter((p, j) => j !== i && p > sectionStart)
      .reduce((min, p) => Math.min(min, p), compileBlock.length);

    const section = compileBlock.slice(sectionStart, sectionEnd);
    if (section.includes("compile: N/A")) return "—";
    return section.includes("@ts-expect-error") ? "error" : "silent";
  });
}

/** Resolve a path relative to the calling test file. */
export function probePath(importMetaUrl: string, relativePath: string): string {
  return new URL(relativePath, importMetaUrl).pathname;
}
