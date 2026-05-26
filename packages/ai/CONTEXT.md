# tidy-ts AI package

Terms for the `@tidy-ts/ai` package — the row-wise AI verb that runs structured LLM-based workflows inside `mutateAsync`. The **authoring layer** is Oracle's Open Agent Specification (OAS) wherever OAS standardizes a concept (Topology, Node, Edge, Property, LlmConfig, Tools, McpTool, ToolBox, ClientTransport). Where OAS hasn't standardized a concept the OpenAI Agents SDK has identified as important (SandboxAgent, Capability, Manifest, Skill), we re-export the SDK's primitives directly under OAS-style factories — no parallel discriminated union, no wire-shape invention. The **execution layer** is the Agents SDK (`@openai/agents`): `Runner.run(agent, input)` is the multi-turn engine, and the SDK's custom-model-provider hook keeps Ollama / vLLM / OpenAI-compatible reach. See [ADR-0003](./docs/adr/0003-openai-agents-sdk-as-runtime.md) for the runtime adoption and [ADR-0004](./docs/adr/0004-oas-faithful-with-sdk-shape-passthrough.md) for the authoring-layer split rule.

## Language

**Topology**:
A directed graph of typed nodes and edges that defines an AI workflow, modeled on Oracle's Open Agent Specification (OAS). A topology has declared inputs and outputs, an internal node set, control-flow edges (what runs next) and data-flow edges (which output feeds which input). Authored by users as a constant and imported where needed. Topologies are parametric in their input and output types (`Topology<I, O>`) — the type parameters are threaded through phantom tags so `ai.evaluate({ topology, input })` infers both sides without manual generics.
_Avoid_: scaffold, workflow, pipeline, graph, chain.

**Node**:
A typed unit of work inside a Topology. Implemented node types (in current code): `StartNode<I>`, `EndNode<O>`, `LlmNode<I, O>` (single LLM call with structured output), `AgentNode<I, O>` (LLM with tools, multi-turn), `BranchingNode` (conditional routing), `MapNode<SubI, SubO>` (per-item subflow with reducers), `ParallelMapNode<SubI, SubO>` (same as MapNode but concurrent with a `concurrency` cap), `ParallelFlowNode` (multiple independent subflows running concurrently, outputs merged), `CatchExceptionNode<SubI, SubO>` (runs a subflow and routes to `caught_exception_branch` on failure), `FlowNode<SubI, SubO>` (1:1 composition — embed a published Topology as a single node inside another). Each node carries `name`, OAS `inputs`/`outputs` Property lists, and (when applicable) Zod schemas the runner uses for validation. OAS-side Property lists are auto-derived from Zod schemas via `zodObjectToProperties` — authors write Zod once.
_Avoid_: step, stage.

**Control-flow edge**:
An edge that declares which Node runs after which. Carries `from_node`, `to_node`, and an optional `from_branch`. Separate from data flow.
_Avoid_: transition, sequencing edge.

**Data-flow edge**:
An edge that declares which output of one Node feeds which input of another. Carries `source_node`, `source_output`, `destination_node`, `destination_input`. Separate from control flow.
_Avoid_: dependency edge, wire.

**`ai.evaluate`**:
The row-wise verb. Called inside `mutateAsync`: `ai.evaluate({ topology, input })`. Returns a `Promise` of the topology's declared output type. The single user-facing entry point for running a Topology on a per-row input. Accepts `retry: AiEvalRetryConfig`, `onError: "throw" | "result"`, `includeUsage: boolean`, `overrides: Record<string, GenerationOverride>` (per-node generation-parameter overrides keyed by `node.name`), and `cache: boolean` (default `true`; pass `false` to skip both the per-node lookup and the post-success write for this call).
_Avoid_: ai.run, ai.invoke, ai.call.

**`ai.evaluateColumn`**:
Row-wise batch verb. Calls `ai.evaluate` over an array of inputs with bounded concurrency and returns one `Result<T, AiEvalError>` per input in original order. Per-row failures don't poison the batch, so a downstream `mutateAsync` can split into success/failure columns or report partial completion. Concurrency defaults to `inputs.length` and is clamped to the rate limiter's `maxConcurrent` when one is installed (same clamp as `ParallelMapNode`). Forwards the `cache: boolean` flag to every per-row `ai.evaluate` call — a 10k-row batch with `cache: false` fires 10k API calls per LlmNode/AgentNode.
_Avoid_: ai.batch, ai.map.

**Generation override (`GenerationOverride`)**:
Per-call generation-parameter override keyed by `node.name` in `ai.evaluate({ overrides })`. Shape mirrors `LlmGenerationConfig` (`temperature`, `maxTokens`, `topP`) but with every field optional — undefined fields fall through to the node's `defaultGenerationParameters`. Overrides are folded into the per-node cache key, so different override values produce separate cache entries (no stale-result poisoning when A/B testing temperatures). Names not present in the topology are silently ignored.
_Avoid_: generation params, params, knobs.

**Concept (vocabulary framing)**:
A published, named, versioned, citable AI workflow — the AI-side analog to a clinical value set. Concepts are reusable across studies and metrics; metric runs cite them the way they cite ICD-10 value sets. In this package, a concept *is* a Topology constant the user authors and exports. The package does not provide a `defineConcept` factory; a concept is a Topology with `id`, `version`, and (optionally) `citation` set on `createTopology`. Downstream consumers embed a concept via `createFlowNode({ subflow })` and the FlowNode runs the concept inline, preserving its citable identity on the Topology value.
_Avoid_: scaffold, prompt template, recipe.

**Citable identity (`id` + `version` + `citation`)**:
Identity fields on a Topology. `id` is **required** at `createTopology` — a stable string (e.g., `"EXTRACT_SYMPTOM_SEVERITY"`, SCREAMING_SNAKE_CASE by convention) that downstream consumers can cite. `version` (semver-like) and `citation` (free-form methods-section string, e.g., `"Menchaca et al., 2026"`) are optional. The runner does not inspect these fields — they exist so a Topology value can be cited verbatim. Required because auto-generating a UUID for an unset id would silently produce an unciteable identity; failing loud at authoring time is honest. (Node-level `id` fields still auto-generate UUIDs — only the Topology itself needs an author-set identifier.)

**Model binding (`LlmConfig`)**:
The provider configuration used to run an `LlmNode` or `Agent`. One flat shape: `{ modelId, baseUrl?, apiKey?, defaultGenerationParameters? }`. `defaultGenerationParameters` carries `temperature`, `maxTokens`, `topP`, plus passthrough provider-specific fields. The execution adapter converts an `LlmConfig` into an Agents-SDK `ModelProvider` at run time — OpenAI when `baseUrl` is unset, a custom provider pointing at `baseUrl` when set. The split-by-provider variants (`OpenAIConfig`, `OllamaConfig`, `VllmConfig`, `OpenAICompatibleConfig`) were dropped in the Agents-SDK adoption; they encoded authoring intent that wasn't load-bearing.
_Avoid_: model string, default model, model preset, OpenAIConfig, OllamaConfig.

**`@tidy-ts/shims` `Result`**:
The error variant used when `ai.evaluate` is called with `onError: "result"`. Returns `Result<T, AiEvalError>`. Default (no `onError`) is a hard reject — failures throw and propagate up through `mutateAsync`.
_Avoid_: maybe, either, option.

**`@tidy-ts/shims` `RetryConfig`**:
The retry strategy `ai.evaluate` uses. Opt-in: pass `retry: RetryConfig` to `ai.evaluate`. The runner's `defaultShouldRetry` retries `LlmTransportError` and refuses to retry `InputValidationError`, `OutputParseError`, or `ToolError` (the latter because tool failures are frequently deterministic — opting in to tool retry requires a custom `shouldRetry`). Retries wrap both the LLM transport calls and tool executions inside `AgentNode`.

**Tool variants** (`ServerTool` / `ClientTool` / `RemoteTool` / `BuiltinTool` / `McpTool`):
A discriminated union (`componentType`) of tool kinds an Agent can call, mirroring OAS's `tools/` modules faithfully. All variants share `name`, `description`, optional `inputs`/`outputs` Property lists, and `requiresConfirmation`. The bridge lowers each into the SDK's tool surface at execution time.

- **`ServerTool<P, R>`**: A callable function the orchestrator executes locally. Adds `paramsSchema` (Zod), optional `resultSchema` (Zod), and `execute: (params: P) => R | Promise<R>`. The only kind with a real function attached — OAS round-trip can't preserve `execute`, so deserialized topologies throw a "re-attach" error if their ServerTools are invoked before the caller re-binds an executable.
- **`ClientTool<P, R>`**: A declaration-only tool — no `execute`. When the model emits a `tool_call` for one, the runner hands the call to `ai.evaluate({ clientToolHandler })`. Use case: browser-side topologies where the tool body (file picker, DOM access, geolocation) lives outside the orchestrator.
- **`RemoteTool`**: A tool the runner executes by issuing an HTTP request. Carries `url`, `httpMethod`, optional `data` / `queryParams` / `headers` / `sensitiveHeaders`. Any `{{placeholder}}` in any of those fields is filled from the model's tool-call args at execution time. `sensitiveHeaders` is shape-identical to `headers` but expected to be redacted in UIs / logs.
- **`BuiltinTool`**: A provider-side hosted tool (`web_search`, `file_search`, `code_interpreter`, `image_generation`, `mcp`). Carries `toolType` (passed through verbatim as the OpenAI `tools[]` entry's `type`) and arbitrary `configuration`. Provider compatibility (e.g. hosted tools needing the OpenAI Responses API) is surfaced as the underlying SDK transport error at run time — no tidy-ts-side gating.
- **`McpTool`**: A tool exposed by a remote MCP server, declared by name with a `clientTransport`. The bridge instantiates the corresponding SDK MCP server class (`MCPServerStdio` / `MCPServerSSE` / `MCPServerStreamableHttp`) per OAS transport variant, attaches it to the SDK Agent's `mcpServers`, and lets the SDK handle listTools / callTool.

_Avoid_: function, action, capability.

**Toolbox / `MCPToolBox`**:
A named, reusable group of tools an Agent imports as one reference. At authoring time it's a declaration of a `clientTransport` plus an optional `toolFilter` (allowlist of bare names or `McpToolSpec` objects). At run time the agent executor expands each box: list tools, drop the ones the filter rejects, and treat each surviving entry as an `McpTool` for the rest of the loop. Box-expanded tools share the box's transport (one MCP client across the whole box) and inherit `requiresConfirmation`. Only `MCPToolBox` exists today; the `ToolBoxUnion` is left open for future OAS-defined box kinds.
_Avoid_: tool group, tool pack.

**`ClientTransport`**:
The connection configuration an `McpTool` or `MCPToolBox` uses to reach its MCP server. Six discriminated variants mirroring OAS: `StdioTransport` (process + stdin/stdout), `SSETransport` and `SSEmTLSTransport` (legacy SSE wire), `StreamableHTTPTransport` and `StreamableHTTPmTLSTransport` (the modern HTTP wire), and `RemoteTransport` (OAS's generic "remote MCP server"; routed through StreamableHTTP). The mTLS variants reuse the base SSE / StreamableHTTP classes and inject a custom `fetch` backed by an mTLS-aware HTTPS agent — the SDK doesn't ship dedicated mTLS classes. Identical transport configs are pooled across an `ai.evaluate` run (see `clearMcpPool`).
_Avoid_: connection config, MCP endpoint.

**`ClientToolHandler`**:
The callback `ai.evaluate({ clientToolHandler })` supplies to fulfill `ClientTool` calls. Signature: `({ name, arguments }) => unknown | Promise<unknown>`. Implementation: the bridge compiles each `ClientTool` into an SDK `tool({ execute })` whose body calls the handler — so fulfilment happens inline inside the SDK turn loop, no approval interrupt. The handler's result is JSON-encoded (or passed through if already a string) and fed back as the tool result. Without a handler, an emitted ClientTool call throws `ToolError`. Shared across all rows in an `evaluateColumn` batch — concurrency-safe handlers are the caller's responsibility.

**Agent**:
A plain LLM-with-tools primitive: `systemPromptTemplate`, `llmConfig`, optional `tools` (heterogeneous Tool union — Server/Client/Remote/Builtin/Mcp), optional `toolboxes` (currently only `MCPToolBox`), optional `inputSchema`/`outputSchema`, optional `maxToolTurns` cap (default 8). Reused inside a topology via `AgentNode`. Has **no filesystem, no shell, no workspace** — for those, use `SandboxAgent`. Execution runs through the Agents SDK's `Runner.run(...)` and uses the SDK's hosted-tool support when `BuiltinTool`s are present; the per-call cache wraps the entire invocation (see [Node cache → Granularity](#)).
_Avoid_: assistant, chatbot.

**SandboxAgent**:
An `Agent` extended with a workspace. Adds `defaultManifest` (a `Manifest` declaring files / directories / git repos staged into the sandbox before the run starts), `capabilities` (a list of `Capability` instances — defaults to `[capability.filesystem(), capability.shell(), capability.compaction()]`), and optional `runAs` (a free-form OS-style username string passed to the sandbox client). Reused inside a topology via `SandboxAgentNode`. **Skills only matter on this variant** because a skill is read through workspace tools — without a workspace there's nowhere for the skill files to live. The Agents SDK runs a `SandboxAgent` through a `SandboxClient` (`UnixLocalSandboxClient`, plus connectors for E2B / Daytona / Modal / Cloudflare / Vercel / Runloop / Blaxel) — selected per call via `ai.evaluate({ sandboxClient })`.
_Avoid_: workspace agent, computer agent, code agent.

**Capability**:
Sandbox-native behavior attached to a `SandboxAgent`. Five built-ins from the Agents SDK, used as-is: `capability.filesystem()` (file editing tools), `capability.shell()` (shell command tool), `capability.skills({ skills, lazyFrom?, index?, skillsPath? })` (skill discovery + progressive disclosure), `capability.memory({ read?, generate?, layout?, store? })` (memory artifacts in the workspace), `capability.compaction({ policy? })` (context trimming). Authors construct these via the `capability.*` namespace re-exported from `@openai/agents`; the SDK's `SandboxAgent` defaults already include `filesystem`, `shell`, and `compaction` so authors typically only add `skills` and/or `memory` explicitly. Capabilities differ from Tools: a Tool is a single callable the model invokes; a Capability is a bundle of sandbox-shaped behavior that may inject prompt content, add multiple tools, or shape the workspace setup.
_Avoid_: feature, addon, sandbox tool.

**Manifest / `Entry`**:
The declaration of what files exist in a `SandboxAgent`'s workspace at run time. A `Manifest` is `{ entries: Record<workspacePath, Entry>, environment?, users?, groups?, extraPathGrants? }`. Each `Entry` is one of the Agents SDK's typed sources, constructed via the factories re-exported from `@openai/agents/sandbox`: `file({ content })`, `dir({ children })`, `localFile({ src })`, `localDir({ src })`, `gitRepo({ repo, ref?, subpath? })`, plus the various mount factories for S3 / GCS / Azure / R2. Discriminator field is `type` (e.g. `"local_dir"`, `"git_repo"`, `"file"`) — the SDK's shape, not an invented `componentType`. Sandbox clients materialize entries into the workspace before the run starts.
_Avoid_: workspace config, mount, file map, InlineFile (the SDK calls that `file({ content })`).

**Skill**:
A reusable bit of model-readable expertise — typically a directory with a `SKILL.md` entrypoint plus optional `scripts/` / `templates/` / `examples/`. Loaded via the SDK's `capability.skills(...)`: at agent start the SDK injects a short index of skill *names and descriptions* into the system prompt; the model decides whether to read a specific skill body via the filesystem / shell tools when relevant. We use the Agents SDK's `SkillDescriptor` shape directly (`{ name, description, content, scripts?, references?, assets?, compatibility?, deferred? }`) — there is no tidy-ts-side wrapper because OAS hasn't standardized Skills yet and inventing one would diverge from the SDK without adding semantics. Skills only matter on a `SandboxAgent` because they're read through workspace tools.
_Avoid_: macro, recipe, playbook, prompt fragment, InlineSkill, LocalSkill, SkillReference (those are OpenAI Responses-API wire shapes — different layer).

**`AiEvalError`**:
The error union returned in `Result` mode (`onError: "result"`). Discriminated by `name`: `"InputValidationError" | "LlmTransportError" | "OutputParseError" | "ToolError"`. All variants are produced via `defineError` from `@tidy-ts/shims`, so a `shouldRetry` callback receives a properly-narrowed union (no `as` cast needed) when typed against `AiEvalError`.

**`UsageReport` / `NodeUsage`**:
Telemetry surfaced by default from `ai.evaluate`. Default return shape is `{ result, usage, provenance }` instead of bare `result` — pass `includeUsage: false` to strip the wrapper. `UsageReport` carries `totalLatencyMs`, `totalPromptTokens`, `totalCompletionTokens`, `totalTokens`, and a `perNode: NodeUsage[]` breakdown. Per-node entries carry `nodeName`, `componentType`, `model`, latency, token counts (and `toolCalls` for `AgentNode`), and `cached: boolean`. Token counts are normalized across the OpenAI Responses API (`input_tokens`/`output_tokens`) and the Chat Completions API (`prompt_tokens`/`completion_tokens`). Cached entries report `cached: true` with `latencyMs: 0` and undefined token counts (the cached run's tokens belong to the original execution, not this one).
_Avoid_: stats, metrics.

**`Provenance`**:
Citation-quality identity of a single `ai.evaluate` run. Surfaced on every `WithUsage<T>` as `provenance: { topology, models, runAt, cachedNodes }`. `topology` carries the topology's `name` and the optional `id`/`version`/`citation` set by the author. `models` is the distinct list of models invoked during the run, in first-seen order. `runAt` is an ISO timestamp from the start of this call. `cachedNodes: string[]` is the names of LLM/Agent nodes whose outputs came from the datastore — a run can be partly cached (e.g., nodes 1-3 cached, node 4 fresh after a prompt tweak). Useful for methods-section reporting: a 10k-row eval can record "this used `EXTRACT_SYMPTOM_SEVERITY v1.0.0` against `gpt-5.4-nano` at 2026-05-21" per row, and which sub-calls were materialized vs. served from cache.
_Avoid_: trace, audit, metadata.

**Concurrency cap**:
Per-node concurrency limit on `ParallelMapNode.concurrency` and `ParallelFlowNode.concurrency`. Both wire through `@tidy-ts/shims`'s `parallel` / `batch` primitives — the same machinery `mutateAsync` uses for row-level fan-out. The cap is an *inner* concurrency budget; the *outer* `mutateAsync` budget controls how many rows are in flight at once. The runner clamps the inner cap to `Math.min(authorCap, rateLimiter.maxConcurrent)` when a rate limiter is installed, so an outer N × inner M can't spawn N·M in-flight tasks that all immediately block on the limiter (memory blowup, inverted intent). When no rate limiter is set or `maxConcurrent` is unset, the author's cap is used as-is. The same clamp applies to `ai.evaluateColumn`'s concurrency.

**Caught-exception branch / `caught_exception_info`**:
The string literal branch name `"caught_exception_branch"` is reserved as the OAS-defined failure outlet of `CatchExceptionNode`. On success, the node routes to the `"next"` branch and writes `caught_exception_info: null`. On failure, it routes to `"caught_exception_branch"` and writes the error message as `caught_exception_info: string`. Topology authors must declare both outgoing `ControlFlowEdge`s with explicit `fromBranch` labels.

**`validateTopology` / `TopologyIssue`**:
A pure-function structural checker for an authored Topology. Returns an array of `TopologyIssue` (`{ severity, code, message, nodeName?, edgeName? }`). Catches duplicate node names, unreachable nodes, dangling data-flow edges, missing prompt placeholders, JSON-Schema type mismatches across connected data-flow edges, BranchingNode mapping values without matching outgoing `fromBranch`, and CatchExceptionNode without both `"next"` and `"caught_exception_branch"` edges. `createTopology` runs this automatically and throws on any error-severity issue (controlled by `validate: "throw" | "warn" | false`, default `"throw"`) — so misconfigured topologies fail at authoring time, not on the first row of a 10k-row eval. Tests that deliberately construct broken topologies pass `validate: false`.

**`DatastoreAdapter` / `sqliteDatastore` / `memoryDatastore`**:
The storage surface for per-node caching. Adapter interface: `{ get(key) → Promise<DatastoreEntry | undefined>; set(key, value) → Promise<void>; delete(key) → Promise<void> }`. `DatastoreEntry = { value: unknown; createdAt: number; lastUsedAt: number }`. Two built-ins: `sqliteDatastore({ path, maxLifetime?, maxSize? })` (the default — one row per entry in a single SQLite file, WAL mode for atomic concurrent writes, single-`UPDATE` recency bumps on hits) and `memoryDatastore()` (per-process `Map` with LRU + TTL, for CI). Both run in Deno (≥1.39), Node (≥22.5), and Bun (≥1.2) because `node:sqlite` is a cross-runtime primitive. Custom adapters (Redis, Postgres) implement the same interface. Bound process-wide via `setDatastore({ adapter, maxLifetime, maxSize, path })`, parallel in shape to `setRateLimit`. Default datastore is `sqliteDatastore({ path: ".tidy-ai-cache.db" })`. `clearDatastore()` disposes the binding for tests. Mirrors OAS's datastore role on `MessageSummarizationTransform`, but lifts it from a per-transform field to a process-wide runtime knob.
_Avoid_: cache adapter, cache store, cache backend.

**Node cache**:
Caching is intrinsic to `LlmNode` and `AgentNode` execution. There is no `cache` field on nodes (the per-call opt-out is `ai.evaluate({ cache: false })`, see below) — every LLM call is keyed on `SHA-256(canonical(node fingerprint), canonical(resolved input))`, looked up in the process-wide datastore, and only invokes the API on miss. Successful node executions write `(key, output)` back to the datastore before control passes downstream; failed nodes write nothing. Cache hits skip the rate limiter and report `cached: true` with zero tokens / zero latency in their `NodeUsage` entry. Across-topology reuse is intentional: identical `LlmNode` configs (same model, prompt, schema, generation params) with the same resolved input share entries across studies.

**Granularity (`AgentNode` / `LlmNode`)**: The cache wraps the *whole invocation*, not individual turns. On a hit we never enter the Agents SDK; on a miss we run `Runner.run(...)` to completion and store the final output. Per-turn caching was rejected because agent tool calls are routinely nondeterministic (web_search, MCP servers, RemoteTool fetches) — partial caching there would silently mix old and new tool results into the same reasoning chain. **`LlmNode` and `AgentNode` share one execution pipeline**: both compile into an Agents-SDK `Agent` (LlmNode with no tools + an `outputType` Zod, AgentNode with tools + capabilities) and run through the same `Runner.run` wrapper. There is no separate single-call code path.

Pass `cache: false` to `ai.evaluate` (or `ai.evaluateColumn`) to skip both the lookup and the post-success write for that call. The run leaves no trace in the datastore and reads no stale entries; every LlmNode/AgentNode fires a fresh API request. Use this when input semantics have drifted in a way the fingerprint can't see (the input field's *meaning* changed but the JSON shape didn't), or when debugging a workflow against a stale entry. There is no per-node opt-out — the flag is whole-topology, by call. For permanent "no caching" install a no-op `DatastoreAdapter` via `setDatastore({ adapter })`.
_Avoid_: cache layer, cache field, memoization.

**Node fingerprint**:
The half of the cache key that captures "what would this call do." Per node type: `LlmNode` → `{componentType, modelId, promptTemplate, systemPrompt, generationParameters, outputSchemaJson}`. `AgentNode` → `{componentType, modelId, systemPromptTemplate, generationParameters, outputSchemaJson, tools: [{name, description, paramsSchemaJson}]}`. Excluded everywhere: node `id` (non-semantic UUID), `name` (label), `inputs`/`outputs` Property lists (derived from schemas). Tool `execute` callbacks are excluded because functions aren't content-addressable — an author who changes a tool body without changing its schema must clear the datastore to invalidate stale agent outputs. There is no topology-level cache key.
_Avoid_: node hash, cache hash, node signature.

**Rate limiter (`setRateLimit` / `RateLimitAdapter`)**:
Process-wide gate around every **agent invocation** (one `Runner.run` call) and every `ai.embed` call. Two built-in dimensions: `maxConcurrent` (semaphore-style cap on simultaneous in-flight invocations) and `rpm` (sliding 60-second request budget — counts each invocation as one). Custom adapters implement `acquire(): Promise<() => void>` — the returned function releases the slot. `clearRateLimit()` disposes the limiter, cancelling pending RPM timers and unblocking any concurrency-waiters. Scope is the JS process; multi-process distributed rate limiting would require a custom adapter (e.g., Redis-backed). **Granularity note**: the Agents SDK owns individual LLM calls inside an invocation; if the underlying provider rate-limits, the SDK surfaces a transport error that retry catches. We gate at the invocation boundary because that's the only knob the SDK exposes and because it's the honest unit of throughput ("4 rows in flight" beats "4 model calls anywhere across the world").
_Avoid_: throttle, quota, semaphore (those describe one dimension; "rate limiter" covers both).

**Embeddings (`ai.embed` / `ai.compareEmbeddings`)**:
Vector representations of text for similarity work — chunking, dedupe, retrieval, classification. `ai.embed(text)` returns `number[]`; `ai.embed([texts])` returns `number[][]` in input order. Default model is `text-embedding-3-large` (3072 dims); `text-embedding-3-small` (1536 dims) and `text-embedding-ada-002` are also supported. `ai.compareEmbeddings({ query, candidates, n? })` ranks candidates by Euclidean distance (smaller = more similar) and returns `{ index, embedding, distance }` per candidate. Both functions honor the process-wide rate limiter via `withRateLimit`.
_Avoid_: vectorize, encode.

**OAS round-trip (`toOAS` / `fromOAS`)**:
JSON serialization compatible with Oracle's Open Agent Spec shape. `toOAS(topology)` produces a plain JSON-stringify-able object with `componentType: "Topology"`, an `agentspecVersion` envelope, and `$component_ref` pointers for all edge endpoints (no embedded node copies). `fromOAS(json)` rebuilds the Topology — but with two unavoidable losses: (1) Zod schemas reconstruct as JSON Schema blobs under `*SchemaJson` fields (Zod can't ingest arbitrary JSON Schema), so client-side Zod re-validation is skipped in the runner; (2) tool `execute` callbacks don't serialize, so a deserialized AgentNode-with-tools throws unless the caller re-attaches an implementation. The runner accepts either a live `outputSchema` (Zod) or a deserialized `outputSchemaJson` (JSON Schema) for structured-output API calls.
_Avoid_: serialize, save (those are too generic).

**Test policy / `aiTest`**:
Tests hit the real OpenAI API using `gpt-5.4-nano`. There is no mock layer. Assertions are structural (shape/range/enum membership), not exact-string. Tests require `OPENAI_API_KEY` in the env. Any test that calls `ai.evaluate` (real-API or pre-seeded) MUST use the `aiTest` helper instead of `Deno.test` — it installs a fresh `memoryDatastore` for the test body and replaces it with an empty one after, so per-node cache state never leaks across tests or test files. The test body receives the installed adapter as `t.datastore` for pre-seeding. Pure-adapter tests that don't go through `ai.evaluate` (e.g., direct `sqliteDatastore` / `memoryDatastore` exercises) stay on `Deno.test`. `.tidy-ai-cache.db` and its WAL/SHM sidecars are gitignored at the repo root so the SQLite default can't accidentally be committed.
_Avoid_: Deno.test for `ai.evaluate` tests (always use `aiTest`).

## Relationships

- A **Topology** declares typed `inputs` and `outputs` via Zod schemas on its `startNode` and `endNode`.
- A **Topology** contains one or more **Nodes** connected by **Control-flow edges** and **Data-flow edges**.
- An **Agent** is composed of an LLM configuration plus zero or more **Tools**. Agents are wrapped in an `AgentNode` to appear inside a Topology.
- A **MapNode** runs a nested **Topology** (the `subflow`) once per element of its iterated input, then reduces.
- A **ParallelMapNode** is a **MapNode** whose iterations run concurrently under a **Concurrency cap**.
- A **ParallelFlowNode** runs multiple independent **Topologies** concurrently on the same input and merges outputs.
- A **CatchExceptionNode** wraps a nested **Topology** and exposes two outgoing branches: `"next"` (success) and the **Caught-exception branch** (failure).
- A **FlowNode** embeds a **Topology** (typically a published **Concept** with a **Citable identity**) inline as a single node, preserving the subflow's identity in the outer topology's call graph.
- A **BranchingNode** reads a single string input and chooses the outgoing **Control-flow edge** whose `fromBranch` matches the mapped value.
- **`validateTopology`** consumes a **Topology** and emits **`TopologyIssue`** entries describing structural problems — meant to run before the first LLM call.
- Every `LlmNode` and `AgentNode` execution is cached against the process-wide **Datastore** (see `setDatastore`) keyed on the **Node fingerprint** + canonicalized resolved input. On hit, the runner skips the rate limiter and the API call, and the cached node's `NodeUsage` entry reports `cached: true` with zero tokens. There is no topology-level cache.
- The **Rate limiter** wraps every LLM call inside `ai.evaluate` (LlmNode + AgentNode) **and every embedding call** (`ai.embed`). One process-wide instance governs all topologies and embedding requests.
- A **Topology** can be exported via **`toOAS`** and re-imported via **`fromOAS`**. Schemas survive as JSON Schema; tool `execute` callbacks do not — they must be re-attached.
- Every `ai.evaluate` result with `includeUsage: true` (the default) carries a **`Provenance`** record alongside `usage`. Provenance pulls the topology's `id`/`name`/`version`/`citation` and the invoked models at run time, and lists the names of any nodes whose outputs came from the **Datastore** in `cachedNodes`.
- **`ai.embed`** and **`ai.compareEmbeddings`** are companion verbs on the `ai` namespace for vector-similarity work. They live in `runtime/embed.ts` next to the evaluate runner and share the rate limiter.
- `ai.evaluate` takes one **Topology** and one row's input, runs it, and returns the declared output value (or `Result<T, AiEvalError>` if `onError: "result"` is set). `ai.evaluateColumn` is the batch form: it calls `ai.evaluate` over many inputs under a bounded concurrency cap (clamped by the rate limiter) and returns one `Result` per input.
- A **Generation override** passed to `ai.evaluate({ overrides: { [nodeName]: { ... } } })` is folded into the per-node cache key, so A/B testing temperatures or `maxTokens` creates separate cache entries instead of overwriting one another.
- A **Topology** can be cited as a **Concept** when it is named, versioned, and depended on by downstream metrics/studies. The package itself does not enforce concept-hood; concept identity is a usage pattern.
- **Model binding** happens at the `ai.evaluate` call site (via the topology's nodes' `model` fields), never as a hidden default inside the runner.

## Example dialogue

> **Dev:** "I want to extract symptom severity from clinical notes inside a `mutateAsync`. Do I define a concept?"
> **Domain expert:** "No — you author a **Topology**. Export it as a constant. Its citation identity comes from the constant's name and version. When you call `ai.evaluate({ topology, input })`, you bind a model at that call site."
>
> **Dev:** "So the Topology doesn't pick a model?"
> **Domain expert:** "Right. **Model binding** is at the call site. The Topology is model-agnostic. Two independent axes: the Topology's version pins the workflow, the model bound at the call site pins which model ran. A paper's methods section cites both."
>
> **Dev:** "What if one row's LLM call fails?"
> **Domain expert:** "By default, `ai.evaluate` rejects and `mutateAsync` propagates the failure. If you want recoverable failures, pass `onError: \"result\"` and the column type becomes `Result<T, AiEvalError>`."

## Flagged ambiguities

- "Scaffold" was used early in design discussions for the user-facing primitive — resolved: the user-facing primitive is a **Topology**. The legacy `create*Scaffold` exports and the `scaffolds/` directory have been removed entirely.
- "Concept" was at one point proposed to be created via a `defineConcept` factory verb — resolved: there is no factory. A concept is a Topology constant the user authors directly. Concepts are a vocabulary pattern, not a package primitive.

## Package layout

Two top-level source directories, both barreled by `packages/ai/mod.ts`. **Structural layer is OAS-shaped, runtime layer is the `@openai/agents` SDK** (see [ADR-0003](./docs/adr/0003-openai-agents-sdk-as-runtime.md)).

- `ts/topology/` — OAS authoring primitives (no behavior). Top-level files: `component.ts`, `property.ts`, `edges.ts`, `topology.ts`, `agent.ts`, `validate.ts`, `oas.ts`, `zod-to-properties.ts`, `llm-config.ts` (one flat shape — `modelId` + `baseUrl?` + `apiKey?` + `defaultGenerationParameters?`). Four subdirectories:
  - `nodes/` — one file per node type: `start.ts`, `end.ts`, `llm.ts`, `agent-node.ts`, `sandbox-agent-node.ts`, `branching.ts`, `catch-exception.ts`, `flow.ts`, `map.ts`, `parallel-map.ts`, `parallel-flow.ts`.
  - `tools/` — one file per OAS-standardized tool variant: `tool-base.ts`, `server-tool.ts`, `client-tool.ts`, `remote-tool.ts`, `builtin-tool.ts`, `toolbox.ts`, plus `index.ts` exposing the `ToolUnion`. The legacy `tools.ts` is a thin re-export shim.
  - `mcp/` — `client-transport.ts` for the six OAS transport variants and `mcp-tool.ts` for `McpTool` / `McpToolSpec`.
  - `sandbox/` — `sandbox-agent.ts` is the only file here; it carries SDK-shaped `defaultManifest` / `capabilities` / `runAs` fields and uses the Agents SDK's `Manifest`, `Capability`, and `SkillDescriptor` types verbatim. `capability.*`, `localDir` / `gitRepo` / `file` / mount factories, and skill construction are re-exported from `@openai/agents` and `@openai/agents/sandbox` — see [ADR-0004](./docs/adr/0004-oas-faithful-with-sdk-shape-passthrough.md).

  Pure values and type definitions; nothing here calls an LLM.

- `ts/runtime/` — execution-time concerns. Top-level files: `evaluate.ts` (the row-wise verb), `embed.ts` (`ai.embed` + `ai.compareEmbeddings`), `datastore.ts` (the per-node cache + adapters), `errors.ts` (the `AiEvalError` variants, including SDK-error translation in `toAiEvalError`), `rate-limit.ts` (the invocation-boundary gate), `usage.ts` (the `UsageReport` / `Provenance` shapes), `param-resolution.ts` (`GenerationParameters` merging + inner-concurrency clamp), `run-context.ts` (per-run state + `ClientToolHandler`), `_env.ts` (`.env` loader, side-effect import), `testing.ts` (the `aiTest` helper).

  The `executors/` subdirectory holds one executor per dispatched node type, plus shared helpers. Non-entrypoint files are `_`-prefixed:
  - **SDK bridge**: `_sdk-bridge.ts` — the single point where OAS-shaped agents compile to SDK-side `Agent` / `SandboxAgent` and run through `Runner.run`. Owns tool lowering (Server → SDK function tool, Client → function tool with handler injection, Remote → function tool with placeholder fetch, Builtin → hosted-tool passthrough, McpTool / MCPToolBox → live `MCPServerStdio` / `MCPServerSSE` / `MCPServerStreamableHttp` instances attached to the SDK Agent's `mcpServers`), output-type resolution (Zod or JSON Schema), and usage normalization. Sandbox `capabilities`, `defaultManifest`, and skill payloads pass through verbatim because they're already SDK-shaped. The *only* file in the package that imports from `@openai/agents` directly.
  - **Per-node executors**: `_llm-node.ts`, `_agent-node.ts`, `_sandbox-agent-node.ts`, `_branching-node.ts`, `_flow-node.ts`, `_map-node.ts`, `_parallel-flow-node.ts`, `_parallel-map-node.ts`, `_catch-exception-node.ts`.
  - **Shared helpers**: `_cache-lookup.ts`, `_edge-helpers.ts`, `_map-reduce.ts`, `_node-types.ts`, `_prompt-render.ts`, `_retry-policy.ts`.
  - **Entry point**: `walker.ts` is non-prefixed because it's what `evaluate.ts` calls (`executeTopology`).

  `evaluate.ts` side-effect-imports `_env.ts` at module init so `OPENAI_API_KEY` is available without shell-exporting it.

Tests live next to their source (`runtime/*.test.ts`, `topology/*.test.ts`). Real-API tests are gated by `OPENAI_API_KEY`; structural tests run offline.

## Reference materials

Oracle Open Agent Specification source is mirrored locally at `docs/reference/agent-spec/`:

- `repo/tsagentspec/src` — Oracle's TypeScript SDK (canonical shapes to mirror).
- `repo/pyagentspec/src` — Python SDK (secondary reference).
- `technical-report.pdf` — arXiv technical report (prose narrative).
