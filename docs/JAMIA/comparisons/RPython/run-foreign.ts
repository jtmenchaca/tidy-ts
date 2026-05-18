/**
 * Run an inlined foreign-runtime script (Python or R) from inside a `.ts`
 * reproduction file. Returns the exit code and the last stderr line, which
 * are the two signals the JAMIA verifier classifies on.
 *
 * Each RPython reproduction is now a single self-contained `.ts` file that
 * inlines its original-language counterpart as a string and runs it through
 * this helper, then demonstrates the tidy-ts equivalent. Having one file
 * eliminates `.py`/`.ts` drift — the catch explanation lives next to the
 * catch line, the foreign reproduction lives in the same module.
 */

export interface ForeignRunResult {
  exitCode: number;
  lastStderrLine: string;
  stdout: string;
  stderr: string;
}

export function runForeign(
  runtime: "python" | "r",
  script: string,
): ForeignRunResult {
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
 * Print a one-line summary of a foreign run. Reproductions call this so the
 * verifier sees a uniform stdout shape across all files. The shape is:
 *
 *   [<runtime>] exit=<code> | <last stderr line>
 *
 * which is grep-able by the verifier and human-readable.
 */
export function printForeignResult(
  runtime: "python" | "r",
  result: ForeignRunResult,
): void {
  const label = runtime === "python" ? "pandas" : "R";
  console.log(`[${label}] exit=${result.exitCode} | ${result.lastStderrLine}`);
}
