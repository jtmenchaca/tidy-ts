// Render every fixture by invoking the viz on each.
// Run:
//   deno run -A packages/ai/examples/viz-fixtures/_render-all.ts
import { dirname, fromFileUrl, join, relative } from "@std/path";

const fixtures = [
  "single-llm.ts",
  "control-only.ts",
  "long-field-names.ts",
  "many-branches.ts",
  "no-fields.ts",
  "multiple-ends.ts",
  "sibling-fan-in.ts",
  "subflow-catch.ts",
  "subflow-flow.ts",
  "nested-subflows.ts",
  "agent-with-tools.ts",
  "agent-with-toolbox.ts",
  "agent-long-descriptions.ts",
  "sandbox-agent.ts",
  "map-over-list.ts",
  "parallel-flows.ts",
  "composite-pipeline.ts",
  "wide-and-deep.ts",
];

const here = dirname(fromFileUrl(import.meta.url));
const examplesDir = dirname(here);
const viz = join(examplesDir, "full-featured.viz.ts");

for (const f of fixtures) {
  const fixturePath = join(here, f);
  const rel = relative(examplesDir, fixturePath);
  const cmd = new Deno.Command("deno", {
    args: ["run", "-A", viz, rel],
    cwd: examplesDir,
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await cmd.output();
  const out = new TextDecoder().decode(stdout).trim();
  const err = new TextDecoder().decode(stderr).trim();
  if (code === 0) {
    console.log(`${f.padEnd(24)} ${out}`);
  } else {
    console.error(`${f.padEnd(24)} FAIL (code ${code})\n${err}`);
  }
}
