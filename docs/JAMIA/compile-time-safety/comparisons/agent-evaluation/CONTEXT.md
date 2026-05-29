# agent-evaluation

Three small `@tidy-ts/ai` topologies that hand the `tidy-ts-best-practices`
skill to an OpenAI-backed agent and ask it to author a short tidy-ts
TypeScript script. Each run produces:

  - a generated `.ts` file under `runs/`
  - an action-log JSON file under `logs/`

Sibling of `packages/testing/skills/tidy-ts-best-practices/` — that
directory contains scripts a human (or an agent dispatched by the
`create-agent-test-tidy-ts` skill) wrote by hand to exercise the skill;
this directory is the in-product version where a `@tidy-ts/ai` agent
inside a Topology writes them itself.

## NOT FOR AGENT EXECUTION

Every example in `examples/` calls the OpenAI API and writes files. An
automated Claude Code session (`CLAUDE_CODE=1`) must not run them.

Both guardrails are in place:

  1. Each example file starts with a banner spelling this out.
  2. `_shared.ts::shouldSkipRun()` is called before any API work and
     exits 0 if either `OPENAI_API_KEY` is missing or `CLAUDE_CODE=1`.

Run manually from the repo root:

    OPENAI_API_KEY=sk-... deno run -A \
      docs/JAMIA/comparisons/agent-evaluation/examples/descriptive.ts

## Topology shape (all three examples)

Identical 3-node DAG so the only variable across runs is the task text
and the agent's freedom to compose tidy-ts:

    start(skillText, task, targetFilename)
       └─► agent(systemPrompt = preamble + {{skillText}} + {{task}};
                tool = writeTidyTsScript)
              └─► end(filename, path, summary)

The `skillText` field on the start input is passed through to the agent
node (no explicit data-flow edge needed — the walker forwards the
predecessor's outputs when no incoming edges exist). The agent's
`systemPromptTemplate` interpolates `{{skillText}}` directly, so the
agent is operating against the same documentation a human teammate
would read.

`ai.evaluate`'s `overrides` field is *generation parameters*
(temperature, maxTokens), NOT prompt variables — that's why skill text
must flow through the input rather than via overrides.

## The `writeTidyTsScript` tool

A ServerTool defined in `_shared.ts::createWriteTidyTsScriptTool`. It
accepts `{ filename, content, rationale }`, writes the content to
`runs/{filename}` via `@tidy-ts/shims` `writeTextFile`, and pushes a
`ToolInvocation` record into a per-run array the example later folds
into the action log.

The agent is instructed to call it exactly once per task.

## Action log (current shape and known gaps)

Each example writes `logs/<example>-<runAt>.json` matching the
`ActionLog` interface in `_shared.ts`. Today it contains:

  - `topology`, `runAt`, `cachedNodes`, `models` — from `Provenance`.
  - `usage` — the per-node `UsageReport` (model, tokens, latency, tool-
    call count, cached flag).
  - `toolInvocations` — captured locally by the tool's `execute`: the
    params the agent passed, the result, the start timestamp and
    latency.
  - `transcript: null` — placeholder.

### Follow-up: full transcript logging

The runtime does not yet emit a chronological event stream per agent
turn. The fields we want but cannot fill today:

  - Per LLM turn: the rendered system prompt, every assistant message
    (content + tool_calls), every tool response message, per-turn
    tokens and latency.
  - Per branch decision: which branch was chosen and the mapping.
  - Per data-flow edge: the resolved value moved between nodes.

The action-log schema is already shaped to receive these via the
`transcript` field — when the runtime starts emitting events the shape
stays stable and existing log files keep parsing.

Files to touch when adding this:

  - `packages/ai/ts/runtime/usage.ts` — extend `NodeUsage` (or add a
    sibling `NodeTranscript` type) to hold ordered events; export from
    `runtime/index.ts`.
  - `packages/ai/ts/runtime/executors/_agent-node.ts` — emit events on
    each turn and each tool dispatch (`messages.push` sites already
    have the data; add a `recordNodeEvent` helper alongside
    `recordNodeUsage`).
  - `packages/ai/ts/runtime/executors/_llm-node.ts`,
    `_branching-node.ts`, walker data-flow assignments — same pattern.
  - `docs/JAMIA/comparisons/agent-evaluation/examples/_shared.ts` —
    pull the new field into `ActionLog.transcript` and remove the
    `null` placeholder.

## Layout

    agent-evaluation/
      CONTEXT.md              ← this file
      stub.ts                 ← empty placeholder; kept for now
      examples/               ← the three topology runners (NOT for agents)
        _shared.ts
        descriptive.ts
        hypothesis-test.ts
        glm.ts
      runs/                   ← agent-generated `.ts` files land here
      logs/                   ← per-run action logs land here
