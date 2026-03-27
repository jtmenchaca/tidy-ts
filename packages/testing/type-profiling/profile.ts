/**
 * Type profiling utility for @tidy-ts/dataframe.
 * Runs diagnostics, generates a trace, and analyzes hotspots.
 *
 * Usage:
 *   deno run -A packages/testing/type-profiling/profile.ts
 */

const ROOT = "/Users/jtmenchaca/tidy-ts/";
const TRACE_DIR = "packages/testing/type-profiling/trace-output";

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

function short(path: string) {
  return path.replace(ROOT, "").replace(/^\/users\/jtmenchaca\/tidy-ts\//, "");
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
  for (const k of metrics) console.log(`  ${k.padEnd(w + 2)} ${metricMap.get(k)}`);
  console.log("─".repeat(w + 20));
}

// ── 2. Generate trace ───────────────────────────────────────────
await Deno.mkdir(TRACE_DIR, { recursive: true });
console.log("\nGenerating trace ...\n");
await run([
  "npx", "tsc", "--noEmit", "--generateTrace", TRACE_DIR,
  "--incremental", "false", "packages/dataframe/mod.ts",
]);

// ── 3. Parse trace.json ─────────────────────────────────────────
const events: TraceEvent[] = JSON.parse(
  await Deno.readTextFile(`${TRACE_DIR}/trace.json`),
);

type TraceEvent = {
  ph: string;
  cat?: string;
  name?: string;
  ts: number;
  dur?: number;
  args?: Record<string, unknown>;
};

// 3a. Slowest files to check
const checkStack: [string, number][] = [];
const checkFiles = new Map<string, number>();
for (const e of events) {
  if (e.cat === "check" && e.name === "checkSourceFile") {
    const path = (e.args?.path as string) ?? "";
    if (e.ph === "B") checkStack.push([path, e.ts]);
    else if (e.ph === "E" && checkStack.length) {
      const [p, t] = checkStack.pop()!;
      checkFiles.set(p, (checkFiles.get(p) ?? 0) + (e.ts - t) / 1000);
    }
  }
}

console.log("=== Slowest files to check ===");
const sortedFiles = [...checkFiles.entries()]
  .filter(([p]) => !p.includes("node_modules"))
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);
for (const [path, dur] of sortedFiles) {
  console.log(`  ${dur.toFixed(0).padStart(6)}ms  ${short(path)}`);
}

// 3b. Expensive type comparisons
const typeIds = new Set<number>();
const comparisons: [number, Record<string, unknown>][] = [];
for (const e of events) {
  if (e.name === "structuredTypeRelatedTo" && e.ph === "X") {
    const dur = (e.dur ?? 0) / 1000;
    if (dur >= 10) {
      comparisons.push([dur, e.args ?? {}]);
      typeIds.add(e.args?.sourceId as number);
      typeIds.add(e.args?.targetId as number);
    }
  }
}
comparisons.sort((a, b) => b[0] - a[0]);

// Resolve type IDs from types.json
const typeNames = new Map<number, string>();
if (typeIds.size > 0) {
  const typesData: { id: number; display?: string; symbolName?: string; intrinsicName?: string }[] =
    JSON.parse(await Deno.readTextFile(`${TRACE_DIR}/types.json`));
  for (const t of typesData) {
    if (typeIds.has(t.id)) {
      const name = t.symbolName ?? t.intrinsicName ?? t.display?.slice(0, 80) ?? "???";
      typeNames.set(t.id, name);
    }
  }
}

console.log("\n=== Expensive type comparisons (≥10ms) ===");
for (const [dur, args] of comparisons.slice(0, 10)) {
  const src = typeNames.get(args.sourceId as number) ?? String(args.sourceId);
  const tgt = typeNames.get(args.targetId as number) ?? String(args.targetId);
  console.log(`  ${dur.toFixed(0).padStart(6)}ms  ${src} vs ${tgt}`);
}

// 3c. Expensive expressions
const exprs: [number, Record<string, unknown>][] = [];
for (const e of events) {
  if (e.name === "checkExpression" && e.ph === "X") {
    const dur = (e.dur ?? 0) / 1000;
    if (dur >= 10) exprs.push([dur, e.args ?? {}]);
  }
}
exprs.sort((a, b) => b[0] - a[0]);

console.log("\n=== Expensive expressions (≥10ms) ===");
for (const [dur, args] of exprs.slice(0, 10)) {
  const path = short((args.path as string) ?? "");
  const pos = args.pos ?? "?";
  const end = args.end ?? "?";
  console.log(`  ${dur.toFixed(0).padStart(6)}ms  ${path} (pos ${pos}-${end})`);
}

console.log("\nDone.");
