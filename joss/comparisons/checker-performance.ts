/**
 * Type-Checker Performance Measurement for Tidy-TS
 *
 * Measures TypeScript compile-time cost for:
 *  1. The type-guarantee audit file (conditional, mapped, template-literal types)
 *  2. Representative pipelines at varying schema widths
 *  3. Representative pipelines at varying chain lengths
 *
 * The chain-depth tests also reveal the TypeScript recursion limit for chained
 * mutate calls (~33 consecutive .mutate() calls before TS2589).
 *
 * Usage: deno run -A joss/comparisons/checker-performance.ts
 *
 * Output: tab-separated results suitable for inclusion in paper tables.
 */

const AUDIT_FILE = "joss/comparisons/type-guarantee-audit.types.test.ts";
const TRIALS = 5;

interface TimingResult {
  label: string;
  file: string;
  durations: number[];
  medianMs: number;
  iqrMs: [number, number];
  status: "pass" | "fail";
  errors?: number;
  diagnosticCode?: string;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function iqr(values: number[]): [number, number] {
  const sorted = [...values].sort((a, b) => a - b);
  const q1Idx = Math.floor(sorted.length / 4);
  const q3Idx = Math.floor((3 * sorted.length) / 4);
  return [sorted[q1Idx], sorted[q3Idx]];
}

async function timeCheck(
  label: string,
  filePath: string,
  trials: number,
): Promise<TimingResult> {
  const durations: number[] = [];
  let lastStatus: "pass" | "fail" = "pass";
  let lastErrors: number | undefined;
  let diagnosticCode: string | undefined;

  for (let i = 0; i < trials; i++) {
    const start = performance.now();
    const cmd = new Deno.Command("deno", {
      args: ["check", filePath],
      stdout: "piped",
      stderr: "piped",
    });
    const output = await cmd.output();
    durations.push(Math.round(performance.now() - start));
    const stderr = new TextDecoder().decode(output.stderr);

    if (!output.success) {
      lastStatus = "fail";
      const errorMatch = stderr.match(/Found (\d+) error/);
      lastErrors = errorMatch ? Number(errorMatch[1]) : undefined;
      const tsMatch = stderr.match(/TS(\d+)/);
      diagnosticCode = tsMatch ? `TS${tsMatch[1]}` : undefined;
    }
  }

  return {
    label,
    file: filePath,
    durations,
    medianMs: median(durations),
    iqrMs: iqr(durations),
    status: lastStatus,
    errors: lastErrors,
    diagnosticCode,
  };
}

function generateWidePipeline(numColumns: number): string {
  const cols = Array.from({ length: numColumns }, (_, i) => `col${i}`);
  // Deterministic values — seeded by column index
  const rowData = cols.map((c, i) => `${c}: ${(i + 1) * 0.1}`).join(", ");
  const mutates = cols
    .slice(0, Math.min(5, numColumns))
    .map((c) => `  ${c}_sq: (r) => r.${c} * r.${c},`)
    .join("\n");

  return `
import { createDataFrame, stats } from "@tidy-ts/dataframe";

const df = createDataFrame([{ ${rowData} }]);

const result = df
  .mutate({
${mutates}
  })
  .filter((r) => r.col0 > 0)
  .select(${cols.slice(0, 3).map((c) => `"${c}"`).join(", ")})
  .summarise({
    total: (g) => stats.sum(g.col0),
    count: (g) => g.nrows(),
  });
`;
}

function generateDeepPipeline(chainLength: number): string {
  const mutateSteps = Array.from(
    { length: chainLength },
    (_, i) => `.mutate({ step${i}: (r) => r.value + ${i} })`,
  ).join("\n  ");

  return `
import { createDataFrame, stats } from "@tidy-ts/dataframe";

const df = createDataFrame([{ id: 1, value: 100 }]);

const result = df
  ${mutateSteps}
  .filter((r) => r.value > 0);
`;
}

async function getEnvironment(): Promise<Record<string, string>> {
  const denoVersion = Deno.version;
  const tsCmd = new Deno.Command("deno", {
    args: ["eval", "console.log(Deno.version.typescript)"],
    stdout: "piped",
    stderr: "piped",
  });
  const tsOut = await tsCmd.output();
  const tsVersion = new TextDecoder().decode(tsOut.stdout).trim();

  return {
    deno: denoVersion.deno,
    v8: denoVersion.v8,
    typescript: tsVersion || denoVersion.typescript,
    os: Deno.build.os,
    arch: Deno.build.arch,
  };
}

async function main() {
  const env = await getEnvironment();
  console.log("Environment:");
  for (const [k, v] of Object.entries(env)) {
    console.log(`  ${k}: ${v}`);
  }
  console.log(`  trials: ${TRIALS}`);
  console.log();

  const results: TimingResult[] = [];

  // 1. Audit file (cold check — first run)
  console.log("Checking audit file (cold)...");
  const coldResult = await timeCheck("audit-cold", AUDIT_FILE, 1);
  results.push(coldResult);

  // 2. Audit file (warm — repeated trials)
  console.log(`Checking audit file (warm, ${TRIALS} trials)...`);
  results.push(await timeCheck("audit-warm", AUDIT_FILE, TRIALS));

  // 3. Schema width: 5, 10, 20, 50, 100, 200 columns
  for (const width of [5, 10, 20, 50, 100, 200]) {
    const label = `wide-${width}col`;
    const path = `/tmp/checker-perf-${label}.ts`;
    await Deno.writeTextFile(path, generateWidePipeline(width));
    console.log(`Checking ${label}...`);
    results.push(await timeCheck(label, path, TRIALS));
  }

  // 4. Chain depth: 5, 10, 20, 30, 33, 35, 40, 50 steps
  //    The boundary around 33 is where TypeScript hits TS2589
  for (const depth of [5, 10, 20, 30, 33, 35, 40, 50]) {
    const label = `deep-${depth}step`;
    const path = `/tmp/checker-perf-${label}.ts`;
    await Deno.writeTextFile(path, generateDeepPipeline(depth));
    console.log(`Checking ${label}...`);
    results.push(await timeCheck(label, path, TRIALS));
  }

  // Output
  console.log("\n" + "=".repeat(80));
  console.log("Type-Checker Performance Results");
  console.log("=".repeat(80));
  console.log(
    ["Label", "Status", "Median (ms)", "IQR (ms)", "Trials", "Errors", "Diag"]
      .join("\t"),
  );
  console.log("-".repeat(80));
  for (const r of results) {
    const errStr = r.errors !== undefined ? String(r.errors) : "";
    const diagStr = r.diagnosticCode ?? "";
    const iqrStr = `${r.iqrMs[0]}–${r.iqrMs[1]}`;
    console.log(
      [r.label, r.status, r.medianMs, iqrStr, r.durations.length, errStr, diagStr].join("\t"),
    );
  }
  console.log("=".repeat(80));

  // Summary
  const passing = results.filter((r) => r.status === "pass");
  const failing = results.filter((r) => r.status === "fail");
  console.log(`\n${passing.length} passed, ${failing.length} failed`);
  if (failing.length > 0) {
    console.log("Failed:");
    for (const f of failing) {
      console.log(
        `  ${f.label}: ${f.errors ?? "unknown"} errors${f.diagnosticCode ? ` (${f.diagnosticCode})` : ""}`,
      );
    }
  }

  // Chain depth limit finding
  const deepResults = results.filter((r) => r.label.startsWith("deep-"));
  const lastPass = deepResults.filter((r) => r.status === "pass").pop();
  const firstFail = deepResults.find((r) => r.status === "fail");
  if (lastPass && firstFail) {
    const passDepth = parseInt(lastPass.label.replace("deep-", ""));
    const failDepth = parseInt(firstFail.label.replace("deep-", ""));
    const diag = firstFail.diagnosticCode ?? "TS2589";
    console.log(
      `\nChain depth limit: ${passDepth} consecutive .mutate() calls pass, ${failDepth} fails (${diag})`,
    );
  }
}

main();
