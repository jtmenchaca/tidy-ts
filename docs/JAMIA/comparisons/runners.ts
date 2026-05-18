/**
 * Shared runners for JAMIA comparison-suite reproductions.
 *
 * Every scenario `.ts` file inlines its comparator implementations and prints
 * a uniform stdout shape that the verifier classifies on. There are three
 * runner shapes; all output the same line format:
 *
 *   [<comparator>] exit=<code> | <message>
 *
 * Where:
 *   - exit=0 + no warning   → silent continuation (the bug is present or absent
 *                              depending on whether the file's self-assertion
 *                              held; the verifier decides from the scenario's
 *                              recorded `Runtime consequence`).
 *   - exit=0 + structured warning on stderr (Python `UserWarning:` or R
 *     `Warning message:`) → runtime warning.
 *   - exit≠0                → runtime error.
 *
 * Three runner shapes:
 *   1. `runForeign(runtime, script)` — spawn `python3` or `Rscript`. The
 *      foreign code is inlined as a template literal and executed via `-c` /
 *      `-e`. Used for pandas, tidyverse, Polars, and any other library that
 *      runs in the Python or R subprocess.
 *   2. `runStaticChecker(checker, pythonScript)` — write the Python script
 *      to a temp file, invoke `mypy` or `pyright` against it, capture the
 *      exit code and a count of reported errors. Static checkers don't
 *      execute the program; they only type-check it.
 *   3. `printRuntimeOutcome(label, ok, message)` — no subprocess spawn.
 *      Used by comparators that run in the same Deno process (Arquero,
 *      Tidy-TS itself) to emit the uniform `[label] exit=N | ...` line.
 */

// ────────────────────────────────────────────────────────────────────────────
// Foreign runners: python / R subprocesses
// ────────────────────────────────────────────────────────────────────────────

export type ForeignRuntime = "python" | "r";

/**
 * `ComparatorLabel` is the name printed in the uniform stdout line. It is
 * distinct from the runtime: pandas, Polars, and the static checkers all
 * spawn `python3`, but each emits its own label so the verifier can
 * attribute the signal correctly.
 */
export type ComparatorLabel =
  | "pandas"
  | "tidyverse"
  | "Polars"
  | "mypy"
  | "pyright"
  | "Arquero"
  | "Tidy-TS";

export interface ForeignRunResult {
  exitCode: number;
  lastStderrLine: string;
  stdout: string;
  stderr: string;
}

export function runForeign(runtime: ForeignRuntime, script: string): ForeignRunResult {
  const cmd = runtime === "python" ? "python3" : "Rscript";
  const args = runtime === "python" ? ["-c", script] : ["-e", script];
  const proc = new Deno.Command(cmd, { args, stdout: "piped", stderr: "piped" });
  const { code, stdout, stderr } = proc.outputSync();
  const decoder = new TextDecoder();
  const stderrText = decoder.decode(stderr);
  const lastStderrLine = stderrText.trim().split("\n").at(-1) ?? "";
  return {
    exitCode: code,
    lastStderrLine,
    stdout: decoder.decode(stdout),
    stderr: stderrText,
  };
}

/**
 * Print a uniform `[label] exit=N | <message>` line for a foreign run.
 *
 * The `label` argument is the comparator name (`pandas`, `tidyverse`, `Polars`),
 * which the verifier parses out. The same `runForeign("python", ...)` call can
 * be labelled `pandas` or `Polars` depending on which library the script uses.
 */
export function printForeignResult(label: ComparatorLabel, result: ForeignRunResult): void {
  console.log(`[${label}] exit=${result.exitCode} | ${result.lastStderrLine}`);
}

// ────────────────────────────────────────────────────────────────────────────
// Static checkers: mypy / pyright on a Python script
// ────────────────────────────────────────────────────────────────────────────

export type StaticChecker = "mypy" | "pyright";

export interface StaticCheckerResult {
  exitCode: number;
  errorCount: number;
  summary: string;
  stdout: string;
  stderr: string;
}

/**
 * Run a static checker against an inlined Python script. The script is
 * written to a temp `.py` file, the checker is invoked, and the result is
 * captured. Temp file is cleaned up before returning.
 *
 * - mypy: invoked with `--strict --no-error-summary` for predictable output.
 *   Error count is parsed from lines matching `error:` in stdout.
 * - pyright: invoked with `--outputjson` for structured output. Error count
 *   parsed from the JSON `summary.errorCount` field.
 *
 * If the checker is not installed (`which` returns non-zero), exit code is
 * 127 and a `not installed` summary is recorded.
 */
export function runStaticChecker(checker: StaticChecker, pythonScript: string): StaticCheckerResult {
  if (!isInstalled(checker)) {
    return {
      exitCode: 127,
      errorCount: 0,
      summary: `${checker} not installed`,
      stdout: "",
      stderr: "",
    };
  }

  const tmp = Deno.makeTempFileSync({ suffix: ".py" });
  Deno.writeTextFileSync(tmp, pythonScript);

  let result: StaticCheckerResult;
  try {
    if (checker === "mypy") {
      const proc = new Deno.Command("mypy", {
        args: ["--strict", "--no-error-summary", tmp],
        stdout: "piped",
        stderr: "piped",
      });
      const { code, stdout, stderr } = proc.outputSync();
      const decoder = new TextDecoder();
      const stdoutText = decoder.decode(stdout);
      const stderrText = decoder.decode(stderr);
      const errorCount = countMatches(stdoutText, /^[^:]+:\d+:\s+error:/gm);
      const summary = errorCount === 0
        ? "no errors"
        : `${errorCount} error${errorCount === 1 ? "" : "s"}`;
      result = { exitCode: code, errorCount, summary, stdout: stdoutText, stderr: stderrText };
    } else {
      // pyright
      const proc = new Deno.Command("pyright", {
        args: ["--outputjson", tmp],
        stdout: "piped",
        stderr: "piped",
      });
      const { code, stdout, stderr } = proc.outputSync();
      const decoder = new TextDecoder();
      const stdoutText = decoder.decode(stdout);
      const stderrText = decoder.decode(stderr);
      let errorCount = 0;
      try {
        const parsed = JSON.parse(stdoutText) as { summary?: { errorCount?: number } };
        errorCount = parsed.summary?.errorCount ?? 0;
      } catch {
        errorCount = countMatches(stdoutText, /\berror\b/gi);
      }
      const summary = errorCount === 0
        ? "no errors"
        : `${errorCount} error${errorCount === 1 ? "" : "s"}`;
      result = { exitCode: code, errorCount, summary, stdout: stdoutText, stderr: stderrText };
    }
  } finally {
    try {
      Deno.removeSync(tmp);
    } catch {
      // ignore cleanup failure
    }
  }
  return result;
}

export function printStaticCheckerResult(checker: StaticChecker, result: StaticCheckerResult): void {
  console.log(`[${checker}] exit=${result.exitCode} | ${result.summary}`);
}

// ────────────────────────────────────────────────────────────────────────────
// In-process comparators: Arquero, Tidy-TS runtime-guard signals
// ────────────────────────────────────────────────────────────────────────────

/**
 * Emit the uniform `[label] exit=N | <message>` line for a comparator that
 * runs in the same Deno process. Used by Arquero (called as a native TS
 * import) and any Tidy-TS runtime-guard surface that emits an `[Arquero]` /
 * `[Tidy-TS-runtime]` style line directly.
 *
 * `ok=true` → exit=0 (clean) or exit=0-with-warning if `kind === "warning"`.
 * `ok=false` → exit=1 (the comparator threw).
 */
export function printRuntimeOutcome(
  label: ComparatorLabel,
  ok: boolean,
  message: string,
  kind: "clean" | "warning" = "clean",
): void {
  const exitCode = ok ? 0 : 1;
  const prefix = ok && kind === "warning" ? "Warning: " : "";
  console.log(`[${label}] exit=${exitCode} | ${prefix}${message}`);
}

/**
 * Wrap a synchronous in-process operation. If it throws, `[label] exit=1 |
 * <error.message>` is emitted. If it returns, `[label] exit=0 | <messageFn
 * result>` is emitted. Used by scenario files for Arquero blocks so they
 * don't have to write the try/catch inline.
 */
export function runInProcess<T>(
  label: ComparatorLabel,
  fn: () => T,
  messageFn: (value: T) => string,
): void {
  try {
    const value = fn();
    printRuntimeOutcome(label, true, messageFn(value));
  } catch (e) {
    const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
    printRuntimeOutcome(label, false, msg);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────────────────────

function isInstalled(cmd: string): boolean {
  try {
    const proc = new Deno.Command("which", { args: [cmd], stdout: "piped", stderr: "piped" });
    const { code } = proc.outputSync();
    return code === 0;
  } catch {
    return false;
  }
}

function countMatches(text: string, re: RegExp): number {
  const matches = text.match(re);
  return matches ? matches.length : 0;
}
