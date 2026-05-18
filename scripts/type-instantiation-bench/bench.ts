#!/usr/bin/env -S deno run -A
/**
 * TypeScript instantiation benchmark: paired control vs full scenarios + baselines.
 *
 * Requires `packages/dataframe/dist/index.d.ts` (run `pnpm build:npm` if missing).
 *
 * Usage:
 *   deno run -A scripts/type-instantiation-bench/bench.ts
 *   deno run -A scripts/type-instantiation-bench/bench.ts --iterations 7
 *   deno run -A scripts/type-instantiation-bench/bench.ts --trace
 *
 * `--trace` writes traces under `scripts/type-instantiation-bench/_trace_last/` for
 * `join-stress-full` vs `type-only` (analyze with `@typescript/analyze-trace`).
 */
import { dirname, fromFileUrl, join } from "jsr:@std/path@1.0.8";

const scriptDir = dirname(fromFileUrl(import.meta.url));
const repoRoot = join(scriptDir, "..", "..");
const scenariosDir = join(scriptDir, "scenarios");

type Metrics = {
  instantiations: number;
  types: number;
  checkMs: number;
};

function parseDiagnostics(text: string): Metrics {
  const inst = text.match(/Instantiations:\s+(\d+)/);
  const types = text.match(/Types:\s+(\d+)/);
  const check = text.match(/Check time:\s+([\d.]+)s/);
  if (!inst || !types || !check) {
    throw new Error(`Could not parse tsc diagnostics:\n${text.slice(-2000)}`);
  }
  return {
    instantiations: Number(inst[1]),
    types: Number(types[1]),
    checkMs: Number(check[1]) * 1000,
  };
}

function median(values: number[]): number {
  if (values.length === 0) throw new Error("median of empty");
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

async function writeTempTsconfig(filesAbs: string[]): Promise<string> {
  const dir = await Deno.makeTempDir({ prefix: "tidy-ts-inst-" });
  const tsconfigPath = join(dir, "tsconfig.json");
  const body = {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      baseUrl: ".",
      paths: {
        "@tidy-ts/dataframe": [
          join(repoRoot, "packages/dataframe/dist/index.d.ts"),
        ],
      },
    },
    files: filesAbs,
  };
  await Deno.writeTextFile(tsconfigPath, JSON.stringify(body, null, 2));
  return dir;
}

async function runTsc(
  filesAbs: string[],
  extraArgs: string[],
): Promise<{ metrics: Metrics; output: string }> {
  const tmpDir = await writeTempTsconfig(filesAbs);
  try {
    const tsconfigPath = join(tmpDir, "tsconfig.json");
    const cmd = new Deno.Command("pnpm", {
      args: [
        "exec",
        "tsc",
        "-p",
        tsconfigPath,
        "--extendedDiagnostics",
        "--pretty",
        "false",
        ...extraArgs,
      ],
      cwd: repoRoot,
      stdout: "piped",
      stderr: "piped",
    });
    const { code, stdout, stderr } = await cmd.output();
    const output = new TextDecoder().decode(stdout) +
      new TextDecoder().decode(stderr);
    if (code !== 0) {
      throw new Error(`tsc exit ${code}\n${output}`);
    }
    return { metrics: parseDiagnostics(output), output };
  } finally {
    await Deno.remove(tmpDir, { recursive: true });
  }
}

async function measureFile(
  relativeScenarioPath: string,
  iterations: number,
  extraArgs: string[],
): Promise<Metrics> {
  const abs = join(scenariosDir, relativeScenarioPath);
  const inst: number[] = [];
  const types: number[] = [];
  const check: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const { metrics } = await runTsc([abs], extraArgs);
    inst.push(metrics.instantiations);
    types.push(metrics.types);
    check.push(metrics.checkMs);
  }
  return {
    instantiations: Math.round(median(inst)),
    types: Math.round(median(types)),
    checkMs: median(check),
  };
}

const measuredCache = new Map<string, Metrics>();

/** Cached: same control file (e.g. join-control) reused across pairs. */
async function measureCached(
  relativeScenarioPath: string,
  iterations: number,
): Promise<Metrics> {
  const hit = measuredCache.get(relativeScenarioPath);
  if (hit) return hit;
  const m = await measureFile(relativeScenarioPath, iterations, []);
  measuredCache.set(relativeScenarioPath, m);
  return m;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function fmtDelta(n: number): string {
  const sign = n > 0 ? "+" : "";
  return sign + fmt(Math.round(n));
}

type Pair = {
  name: string;
  control: string;
  full: string;
};

const baselineFiles = [
  ["type-only", "type-only.ts"],
  ["df-minimal", "df-minimal.ts"],
] as const;

const pairs: Pair[] = [
  { name: "mutate ×20", control: "mutate-control.ts", full: "mutate-full.ts" },
  {
    name: "innerJoin ×10 conflicts",
    control: "join-control.ts",
    full: "join-full.ts",
  },
  {
    name: "innerJoin + suffix options",
    control: "join-control.ts",
    full: "join-suffix-full.ts",
  },
  {
    name: "innerJoin ×20 conflicts (stress)",
    control: "join-stress-control.ts",
    full: "join-stress-full.ts",
  },
  {
    name: "transpose rows=20",
    control: "transpose-control.ts",
    full: "transpose-full.ts",
  },
  {
    name: "mutateColumns 5×3",
    control: "mutate-columns-control.ts",
    full: "mutate-columns-full.ts",
  },
  {
    name: "pivotWider +12 expected",
    control: "pivot-control.ts",
    full: "pivot-full.ts",
  },
  {
    name: "mutateAsync→filter",
    control: "promised-control.ts",
    full: "promised-full.ts",
  },
];

function parseArgs(): { iterations: number; trace: boolean } {
  const argv = Deno.args;
  let iterations = 5;
  let trace = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--iterations" && argv[i + 1]) {
      iterations = Math.max(1, Number(argv[i + 1]) | 0);
      i++;
    }
    if (argv[i] === "--trace") trace = true;
  }
  return { iterations, trace };
}

const { iterations, trace } = parseArgs();

const dfDecl = join(repoRoot, "packages/dataframe/dist/index.d.ts");
try {
  await Deno.stat(dfDecl);
} catch {
  console.error(
    `Missing ${dfDecl}\nRun: pnpm build:npm`,
  );
  Deno.exit(1);
}

const traceDir = join(scriptDir, "_trace_last");

console.log(`repo: ${repoRoot}`);
console.log(`iterations (median): ${iterations}`);
console.log(`dataframe types: packages/dataframe/dist/index.d.ts`);
console.log("");

console.log("── Baselines (single file, no pair delta)");
for (const [label, file] of baselineFiles) {
  const m = await measureFile(file, iterations, []);
  console.log(
    `  ${label.padEnd(22)} inst=${fmt(m.instantiations)} types=${
      fmt(m.types)
    } check=${m.checkMs.toFixed(0)}ms`,
  );
}

console.log("");
console.log(
  "── Pair deltas (median). Δ = full − control — isolates cost of the verb/type elaboration.",
);
console.log(
  `${"scenario".padEnd(34)} ${"Δinst".padStart(12)} ${"Δtypes".padStart(12)} ${
    "Δcheck".padStart(12)
  }`,
);
console.log("-".repeat(74));

const deltas: { name: string; dInst: number }[] = [];

for (const p of pairs) {
  const c = await measureCached(p.control, iterations);
  const f = await measureCached(p.full, iterations);
  const dInst = f.instantiations - c.instantiations;
  const dTypes = f.types - c.types;
  const dCheck = f.checkMs - c.checkMs;
  deltas.push({ name: p.name, dInst });
  const checkStr = `${dCheck >= 0 ? "+" : ""}${dCheck.toFixed(0)}ms`;
  console.log(
    `${p.name.padEnd(34)} ${fmtDelta(dInst).padStart(12)} ${
      fmtDelta(dTypes).padStart(12)
    } ${checkStr.padStart(12)}`,
  );
}

console.log("");
console.log("── Rank by Δinst (marginal instantiations, median)");
deltas.sort((a, b) => b.dInst - a.dInst);
for (let i = 0; i < deltas.length; i++) {
  console.log(`  ${i + 1}. ${deltas[i]!.name} — ${fmt(deltas[i]!.dInst)}`);
}

if (trace) {
  console.log("");
  console.log(
    "── generateTrace (single cold run each, for @typescript/analyze-trace)",
  );
  try {
    await Deno.remove(traceDir, { recursive: true });
  } catch {
    // ignore
  }
  const traceJoin = join(traceDir, "join-stress");
  const traceType = join(traceDir, "type-only");
  await Deno.mkdir(traceJoin, { recursive: true });
  await Deno.mkdir(traceType, { recursive: true });
  await runTsc([join(scenariosDir, "join-stress-full.ts")], [
    "--generateTrace",
    traceJoin,
  ]);
  await runTsc([join(scenariosDir, "type-only.ts")], [
    "--generateTrace",
    traceType,
  ]);
  console.log(`  ${traceJoin}`);
  console.log(`  ${traceType}`);
}
