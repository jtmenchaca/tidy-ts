/**
 * Audit every rendered fixture. Spawns the auditor against each
 * `.viz.html` in turn and prints one line per fixture summarizing
 * errors + warnings.
 *
 * Run:
 *   node packages/ai/examples/viz-fixtures/_audit-all.mjs
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const auditor = join(__dirname, "..", "full-featured.viz.audit.mjs");

const fixtures = [
  "single-llm",
  "control-only",
  "long-field-names",
  "many-branches",
  "no-fields",
  "multiple-ends",
  "sibling-fan-in",
  "subflow-catch",
  "subflow-flow",
  "nested-subflows",
  "agent-with-tools",
  "agent-with-toolbox",
  "agent-long-descriptions",
  "sandbox-agent",
  "map-over-list",
  "parallel-flows",
  "composite-pipeline",
  "wide-and-deep",
];

const rows = [];
for (const f of fixtures) {
  const html = `viz-fixtures/${f}.viz.html`;
  const r = spawnSync("node", [auditor, html], {
    encoding: "utf-8",
    cwd: join(__dirname, ".."),
  });
  const out = (r.stdout || "") + (r.stderr || "");
  const m = out.match(/ISSUES: (\d+) error\(s\), (\d+) warning\(s\)/);
  const errors = m ? parseInt(m[1], 10) : -1;
  const warnings = m ? parseInt(m[2], 10) : -1;
  const issueLines = [];
  for (const line of out.split("\n")) {
    const im = line.match(/\[(ERROR|WARNING)\] (\S+): (.+)/);
    if (im) issueLines.push(`     [${im[1]}] ${im[2]}: ${im[3]}`);
  }
  rows.push({ fixture: f, errors, warnings, issues: issueLines });
}

console.log("\n── AUDIT SUMMARY ───────────────────────────────────────────────");
console.log(
  "fixture".padEnd(22) +
    " " +
    "errors".padStart(8) +
    " " +
    "warnings".padStart(10),
);
console.log("─".repeat(50));
for (const { fixture, errors, warnings } of rows) {
  const e = String(errors).padStart(8);
  const w = String(warnings).padStart(10);
  console.log(`${fixture.padEnd(22)} ${e} ${w}`);
}

console.log("\n── ISSUES ──────────────────────────────────────────────────────");
for (const { fixture, issues } of rows) {
  if (issues.length === 0) continue;
  console.log(`\n  ${fixture}:`);
  for (const line of issues) console.log(line);
}
