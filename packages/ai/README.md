# @tidy-ts/ai

[![JSR](https://jsr.io/badges/@tidy-ts/ai)](https://jsr.io/@tidy-ts/ai)
[![JSR Score](https://jsr.io/badges/@tidy-ts/ai/score)](https://jsr.io/@tidy-ts/ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A row-wise LLM verb for `mutateAsync`, built on top of typed DAG topologies modeled on Oracle's Open Agent Specification (OAS). Designed for research workflows: cite-able topologies, per-row provenance, intrinsic per-node caching, structured output via Zod.

```ts
import { createDataFrame } from "@tidy-ts/dataframe";
import { ai, createLlmNode, createStartNode, createEndNode,
         createControlFlowEdge, createTopology, createOpenAiConfig } from "@tidy-ts/ai";
import { z } from "zod";

const openai = createOpenAiConfig({ modelId: "gpt-5.4-nano" });

const InSchema  = z.object({ note: z.string() });
const OutSchema = z.object({
  severity: z.enum(["mild", "moderate", "severe"]),
  confidence: z.number().min(0).max(1),
});

const start = createStartNode({ name: "start", inputSchema: InSchema });
const llm   = createLlmNode({
  name: "extract",
  llmConfig: openai,
  promptTemplate: "Classify the severity of this note:\n{{note}}",
  inputSchema: InSchema,
  outputSchema: OutSchema,
});
const end   = createEndNode({ name: "end", outputSchema: OutSchema });

const EXTRACT = createTopology({
  id: "EXTRACT_SEVERITY",  // citable identifier (required)
  name: "EXTRACT_SEVERITY",
  version: "1.0.0",
  startNode: start,
  endNode: end,
  nodes: [start, llm, end],
  controlFlowConnections: [
    createControlFlowEdge({ name: "s->l", fromNode: start, toNode: llm }),
    createControlFlowEdge({ name: "l->e", fromNode: llm,   toNode: end }),
  ],
});

const notes = createDataFrame([
  { id: 1, note: "Patient reports severe chest pain radiating to the left arm." },
  { id: 2, note: "Reminder: please confirm your next appointment date." },
]);

const enriched = await notes.mutateAsync({
  severity: (r) => ai.evaluate({ topology: EXTRACT, input: { note: r.note } }),
});

for (const row of enriched.toRows()) {
  const { result, usage, provenance } = row.severity;
  console.log(row.id, result.severity, result.confidence,
              `cached: ${provenance.cachedNodes.length > 0}`,
              `tokens: ${usage.totalTokens}`);
}
```

## What you get

- **Structured output**: every `LlmNode` / `AgentNode` carries a Zod schema; the runner validates the response client-side and surfaces `OutputParseError` if it doesn't match.
- **Citable topologies**: `id` is required; `version` and `citation` are optional. `Provenance` on every row captures these plus the models that ran (or short-circuited from cache).
- **Per-node SQLite cache** (intrinsic, no opt-in): identical `(node fingerprint, resolved input)` → cache hit. Rerunning the same analysis pays zero tokens for unchanged calls; tweaking a single node's prompt only re-fires that node and any downstream nodes whose inputs change.
- **Process-wide rate limiter**: `setRateLimit({ maxConcurrent, rpm })` governs every LLM call across every topology. `mutateAsync`'s row-level concurrency multiplied with inner-node concurrency is clamped to the rate limiter's `maxConcurrent` so you don't blow your token budget.
- **Cross-runtime**: ships against `node:fs` and `node:sqlite`, so Deno (≥1.39), Node (≥22.5), and Bun (≥1.2) all work.

## Common patterns

### Avoid poisoning a column when one row fails

```ts
import { ai } from "@tidy-ts/ai";

const results = await ai.evaluateColumn({
  topology: EXTRACT,
  inputs: notes.toRows().map((r) => ({ note: r.note })),
  concurrency: 5,
});

// `results[i]` is a Result<WithUsage<O>, AIEvalError> — one bad row
// doesn't poison the rest, and you can split into success/failure columns.
```

### A/B test a temperature without busting the cache for other temperatures

```ts
const cold = await ai.evaluate({
  topology: EXTRACT,
  input: { note: "..." },
  overrides: { extract: { temperature: 0.1 } },
});

const warm = await ai.evaluate({
  topology: EXTRACT,
  input: { note: "..." },
  overrides: { extract: { temperature: 0.9 } },
});

// The two calls produce different cache keys, so the warm temperature
// doesn't overwrite the cold one's entry, and vice versa.
```

### Recover from row-level failures with `onError: "result"`

```ts
const enriched = await notes.mutateAsync({
  severity: (r) => ai.evaluate({
    topology: EXTRACT,
    input: { note: r.note },
    onError: "result",   // returns Result<T, AIEvalError> per cell
  }),
});

const failed = enriched.toRows().filter((r) => !r.severity.ok);
```

### Configure caching and rate-limiting up front

```ts
import { setDatastore, setRateLimit, memoryDatastore } from "@tidy-ts/ai";

// Default is sqliteDatastore({ path: ".tidy-ai-cache.db" }).
// CI? Use memoryDatastore() instead so nothing lands on disk.
setDatastore({ adapter: memoryDatastore() });

// 5 concurrent LLM calls in flight, 100 requests per rolling 60s.
setRateLimit({ maxConcurrent: 5, rpm: 100 });
```

### Validation runs automatically

`createTopology` runs `validateTopology` for you and throws on any error-severity issue (unreachable nodes, duplicate node names, missing prompt placeholders, etc.) — so misconfigured topologies fail at authoring time instead of on the first row of a 10k-row eval. You don't need to call `validateTopology` manually.

You'd call it manually only if you want to *inspect* issues without throwing (e.g., to surface warnings in a UI, or to build a topology under test that's deliberately broken). Two ways to do that:

```ts
// 1. Skip auto-validate, inspect issues yourself:
const topology = createTopology({ /* ... */, validate: false });
const issues = validateTopology(topology);
for (const i of issues) console.warn(`[${i.severity}] ${i.message}`);

// 2. Auto-validate logs error-severity to stderr instead of throwing:
createTopology({ /* ... */, validate: "warn" });
```

### Tests

If you write a test that calls `ai.evaluate`, use the `aiTest` helper instead of `Deno.test`. It installs a fresh `memoryDatastore` per test so cached state never leaks across tests:

```ts
import { aiTest } from "@tidy-ts/ai";

aiTest({
  name: "extracts severity",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const out = await ai.evaluate({ topology: EXTRACT, input: { note: "..." } });
    expect(out.result.severity).toBeDefined();
  },
});
```

## Node types

`LlmNode` (one LLM call), `AgentNode` (LLM with tool calls; multi-turn), `BranchingNode` (conditional routing), `MapNode` / `ParallelMapNode` (per-item subflows with reducers), `FlowNode` (1:1 composition of a published topology — typically a citable **Concept**), `CatchExceptionNode` (subflow + recovery branch), `ParallelFlowNode` (multiple independent subflows in parallel).

## Concepts

A **Concept** is a Topology with an author-set `id`, `version`, and (optionally) `citation`. Treat them like clinical value sets: published, versioned, citable workflows that downstream metrics and studies depend on. Embed one in a larger workflow with `createFlowNode({ subflow: CONCEPT })` and the FlowNode runs it inline, preserving its citable identity in the outer topology's call graph.

## Reference

- **Glossary** — [packages/ai/CONTEXT.md](./CONTEXT.md): authoritative definitions for every term in this README.
- **ADRs** — [packages/ai/docs/adr/](./docs/adr/): the *why* behind decisions (no back-compat, per-node cache, SQLite default).
- **OAS source mirror** — [packages/ai/docs/reference/agent-spec/](./docs/reference/agent-spec/): Oracle's TS SDK and the OAS technical report; we mirror their shapes where it earns its keep.
- **Full example** — [packages/ai/examples/full-featured.ts](./examples/full-featured.ts): citable concept embedded in a branching DAG, run row-wise over a DataFrame.

## Requirements

- `OPENAI_API_KEY` in env (or `.env` — the runner loads it on import).
- Deno ≥1.39, Node ≥22.5, or Bun ≥1.2.

## License

MIT
