# Use the OpenAI Agents SDK as the runtime; keep OAS as the authoring layer

`@tidy-ts/ai` mirrors Oracle's Open Agent Spec (OAS) for structural primitives
(Topology, Node, Edge, Agent, Tool, Property, validation, OAS round-trip) and
uses the OpenAI Agents SDK (`@openai/agents`) as the execution substrate
(`Runner.run` is the agent loop). We made this choice because skills, sandbox,
capabilities, and `apply_patch` — the features the Agents SDK is actively
shipping — are too valuable to re-implement against the raw Responses API, and
the SDK supports non-OpenAI providers via a custom `ModelProvider` so we keep
Ollama / vLLM / OpenAI-compatible reach.

## Considered options

- **Hand-roll the loop.** Was the original design. Rejected because
  re-implementing skills, sandbox staging, capability lifecycles, and the
  per-turn hooks `@openai/agents` exposes would be substantial work and would
  drift from the SDK's ongoing bug fixes and feature additions.
- **OAS-only.** OAS has no `Skill`, `Manifest`, `Capability`, or `Sandbox`
  primitive yet. Mirroring those in OAS grammar and never executing through the
  SDK would leave us with declared-but-unimplemented surface.

## Consequences

- One vendor dependency in the runtime layer (`@openai/agents`).
- SandboxAgent / Capability / Manifest / Skill: OAS doesn't standardize these,
  and we use the SDK's shapes directly (re-exported from `@openai/agents` and
  `@openai/agents/sandbox`) rather than inventing parallel discriminated
  unions. See [ADR-0004](./0004-oas-faithful-with-sdk-shape-passthrough.md)
  for the rule and the bugs that drove it.
- Single execution pipeline: `LlmNode` and `AgentNode` both compile to an
  Agents-SDK `Agent` (with or without tools) and route through one
  `Runner.run` wrapper. No separate single-call code path. The new
  `SandboxAgentNode` (introduced in this adoption) compiles to an SDK
  `SandboxAgent` and runs through the same wrapper.
- The per-node cache wraps the whole invocation, not individual turns. On a
  hit we never enter the SDK; on a miss we run `Runner.run` end-to-end and
  store the final output. Partial-turn caching was rejected because agent
  tool calls (web search, MCP, RemoteTool fetches) are routinely
  nondeterministic.
- The rate limiter and retry policy gate at the invocation boundary
  (`Runner.run`), not individual LLM calls. The SDK owns inter-turn timing
  and surfaces transport errors that the retry policy can catch.
- `LlmConfig` collapses to one flat shape: `{ modelId, baseUrl?, apiKey?,
  defaultGenerationParameters? }`. The `OpenAIConfig` / `OpenAICompatibleConfig`
  / `OllamaConfig` / `VllmConfig` discriminated variants were removed in this
  adoption — they encoded authoring intent that wasn't load-bearing.
- `ClientTool` calls are implemented as SDK function tools whose
  `execute` body invokes the user-supplied `clientToolHandler`. The
  handler runs inline within the SDK turn loop — simpler than the
  `needsApproval` interrupt, and equivalent in behavior for the
  fulfill-and-return contract. Switching to the approval interrupt
  becomes the right move only if we need host-side approval gating.
- MCP support: hosted MCP uses the SDK's `hostedMcpTool`; local MCP servers
  use the SDK's `MCPServerStdio` / `MCPServerSse` rather than our previous
  pool around `@modelcontextprotocol/sdk`.
