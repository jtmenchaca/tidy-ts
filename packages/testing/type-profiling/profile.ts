/**
 * Type profiling orchestrator for @tidy-ts/dataframe.
 *
 * 1. Runs tsc --extendedDiagnostics (summary metrics)
 * 2. Generates trace (trace.json + types.json)
 * 3. Runs Python analysis scripts on the trace data
 *
 * Usage:
 *   deno run -A packages/testing/type-profiling/profile.ts
 */

const DIR = "packages/testing/type-profiling";
const TRACE_DIR = `${DIR}/trace-output`;

const KEY_METRICS = [
  "Check time",
  "Instantiations",
  "Types",
  "Symbols",
  "Memory used",
  "Assignability cache size",
];

async function run(cmd: string[]) {
  const proc = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: "piped",
    stderr: "piped",
    env: { ...Deno.env.toObject(), NODE_OPTIONS: "--max-old-space-size=8192" },
  });
  const { stdout, stderr } = await proc.output();
  return new TextDecoder().decode(stdout) + new TextDecoder().decode(stderr);
}

async function runPassthrough(cmd: string[]) {
  const proc = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: "inherit",
    stderr: "inherit",
  });
  await proc.output();
}

// ── 1. Diagnostics ──────────────────────────────────────────────
console.log("Running tsc --extendedDiagnostics ...\n");

const diagOutput = await run([
  "npx", "tsc", "--noEmit", "--extendedDiagnostics",
  "-p", "packages/dataframe/deno.jsonc",
]);

const metricMap = new Map<string, string>();
for (const line of diagOutput.split("\n")) {
  for (const key of KEY_METRICS) {
    if (line.trim().startsWith(key)) {
      metricMap.set(key, line.split(":").slice(1).join(":").trim());
    }
  }
}

if (metricMap.size > 0) {
  const metrics = KEY_METRICS.filter((k) => metricMap.has(k));
  const w = Math.max(...metrics.map((k) => k.length));
  console.log("─".repeat(w + 20));
  for (const k of metrics) {
    console.log(`  ${k.padEnd(w + 2)} ${metricMap.get(k)}`);
  }
  console.log("─".repeat(w + 20));
} else {
  console.log("No metrics found. Raw output:\n");
  console.log(diagOutput);
}

// ── 2. Generate trace ───────────────────────────────────────────
await Deno.mkdir(TRACE_DIR, { recursive: true });
console.log("\nGenerating trace ...\n");
await run([
  "npx", "tsc", "--noEmit", "--generateTrace", TRACE_DIR,
  "--incremental", "false", "packages/dataframe/mod.ts",
]);

// ── 3. Run Python analysis ──────────────────────────────────────
console.log("Running analyze.py ...\n");
await runPassthrough(["python3", `${DIR}/analyze.py`]);

console.log("\n\nRunning analyze-deep.py ...\n");
await runPassthrough(["python3", `${DIR}/analyze-deep.py`]);

console.log("\n\nRunning analyze-deep2.py ...\n");
await runPassthrough(["python3", `${DIR}/analyze-deep2.py`]);

console.log("\nDone.");
