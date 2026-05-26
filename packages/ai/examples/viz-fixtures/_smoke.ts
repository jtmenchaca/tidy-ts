// Smoke test: import each fixture and confirm createTopology accepted it.
// Run from the repo root:
//   deno run -A packages/ai/examples/viz-fixtures/_smoke.ts
const fixtures = [
  "./single-llm.ts",
  "./control-only.ts",
  "./long-field-names.ts",
  "./many-branches.ts",
  "./no-fields.ts",
  "./multiple-ends.ts",
  "./sibling-fan-in.ts",
  "./subflow-catch.ts",
  "./subflow-flow.ts",
  "./nested-subflows.ts",
  "./agent-with-tools.ts",
  "./agent-with-toolbox.ts",
  "./agent-long-descriptions.ts",
  "./sandbox-agent.ts",
  "./map-over-list.ts",
  "./parallel-flows.ts",
  "./composite-pipeline.ts",
  "./wide-and-deep.ts",
];

for (const f of fixtures) {
  try {
    const mod = await import(new URL(f, import.meta.url).href);
    const topo = mod.default;
    console.log(
      `${f.padEnd(28)} OK  id=${topo.id ?? "(none)"}  nodes=${topo.nodes.length}`,
    );
  } catch (e) {
    console.error(
      `${f.padEnd(28)} FAIL: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}
