// @tidy-ts/ai — opinionated, OAS-aligned build authoring + a row-wise
// `ai.evaluate` verb that runs topologies against the OpenAI Agents SDK.
//
// The public surface is five namespaces:
//
//   - `ai`        — verbs (`evaluate`, `evaluateColumn`, `embed`,
//                  `compareEmbeddings`) plus the runtime hooks
//                  (`ai.errors`, `ai.datastore`, `ai.rateLimit`).
//   - `build`  — OAS-grammar authoring: `build.create(...)`,
//                  `build.agent(...)`, `build.start(...)`, etc.
//   - `tool`      — tool authoring: `tool.server(...)`, `tool.client(...)`,
//                  `tool.remote(...)`, `tool.builtin(...)`, `tool.box(...)`.
//   - `mcp`       — MCP wiring: `mcp.tool(...)`, `mcp.spec(...)`, and the
//                  `mcp.transport.*` factories.
//   - `sandbox`   — workspace primitives + SDK passthroughs:
//                  `sandbox.UnixLocalClient`, `sandbox.capability.*`,
//                  `sandbox.dir(...)`, `sandbox.file(...)`,
//                  `sandbox.gitRepo(...)`, `sandbox.localDir(...)`,
//                  `sandbox.localFile(...)`, `sandbox.lazySkillSource(...)`.
//
// Only three types are reachable as type aliases on these namespaces:
// `ai.AiEvalError`, `build.Topology`, and `tool.ClientToolHandler`.
// Everything else (schemas, generation-parameter shapes, internal
// component bases) lives inside the package and isn't reachable.

// ── ai namespace ────────────────────────────────────────────────────────
import {
  evaluate as _evaluate,
  evaluateColumn as _evaluateColumn,
} from "./ts/runtime/evaluate.ts";

import {
  compareEmbeddings as _compareEmbeddings,
  embed as _embed,
} from "./ts/runtime/embed.ts";

import {
  AgentTurnLimitError,
  type AiEvalError as _AiEvalError,
  InputValidationError,
  LlmTransportError,
  OutputParseError,
  ToolError,
} from "./ts/runtime/errors.ts";

import {
  clearDatastore,
  memoryDatastore,
  setDatastore,
  sqliteDatastore,
} from "./ts/runtime/datastore.ts";

import {
  clearRateLimit,
  getRateLimit,
  setRateLimit,
} from "./ts/runtime/rate-limit.ts";

// ── build namespace ──────────────────────────────────────────────────
import {
  createTopology as _createTopology,
  type Topology as _Topology,
} from "./ts/topology/topology.ts";
import { createLlmConfig as _createLlmConfig } from "./ts/topology/llm-config.ts";
import { createAgent as _createAgent } from "./ts/topology/agent.ts";
import { createSandboxAgent as _createSandboxAgent } from "./ts/topology/sandbox/sandbox-agent.ts";
import { createStartNode as _createStartNode } from "./ts/topology/nodes/start.ts";
import { createEndNode as _createEndNode } from "./ts/topology/nodes/end.ts";
import { createAgentNode as _createAgentNode } from "./ts/topology/nodes/agent-node.ts";
import { createSandboxAgentNode as _createSandboxAgentNode } from "./ts/topology/nodes/sandbox-agent-node.ts";
import {
  createBranchingNode as _createBranchingNode,
  DEFAULT_BRANCH as _DEFAULT_BRANCH,
} from "./ts/topology/nodes/branching.ts";
import {
  CAUGHT_EXCEPTION_BRANCH as _CAUGHT_EXCEPTION_BRANCH,
  createCatchExceptionNode as _createCatchExceptionNode,
} from "./ts/topology/nodes/catch-exception.ts";
import { createFlowNode as _createFlowNode } from "./ts/topology/nodes/flow.ts";
import { createMapNode as _createMapNode } from "./ts/topology/nodes/map.ts";
import { createParallelMapNode as _createParallelMapNode } from "./ts/topology/nodes/parallel-map.ts";
import { createParallelFlowNode as _createParallelFlowNode } from "./ts/topology/nodes/parallel-flow.ts";
import {
  createControlFlowEdge as _createControlFlowEdge,
  createDataFlowEdge as _createDataFlowEdge,
} from "./ts/topology/edges.ts";
import {
  fromOAS as _fromOAS,
  toOAS as _toOAS,
} from "./ts/topology/oas.ts";
import { validateTopology as _validateTopology } from "./ts/topology/validate.ts";

// ── tool namespace ──────────────────────────────────────────────────────
import { createServerTool as _createServerTool } from "./ts/topology/tools/server-tool.ts";
import { createClientTool as _createClientTool } from "./ts/topology/tools/client-tool.ts";
import { createRemoteTool as _createRemoteTool } from "./ts/topology/tools/remote-tool.ts";
import { createBuiltinTool as _createBuiltinTool } from "./ts/topology/tools/builtin-tool.ts";
import { createMcpToolBox as _createMcpToolBox } from "./ts/topology/tools/toolbox.ts";
import type { ClientToolHandler as _ClientToolHandler } from "./ts/runtime/run-context.ts";

// ── mcp namespace ───────────────────────────────────────────────────────
import {
  createMcpTool as _createMcpTool,
  createMcpToolSpec as _createMcpToolSpec,
} from "./ts/topology/mcp/mcp-tool.ts";
import {
  createRemoteTransport as _createRemoteTransport,
  createSSEmTLSTransport as _createSSEmTLSTransport,
  createSSETransport as _createSSETransport,
  createStdioTransport as _createStdioTransport,
  createStreamableHTTPmTLSTransport as _createStreamableHTTPmTLSTransport,
  createStreamableHTTPTransport as _createStreamableHTTPTransport,
} from "./ts/topology/mcp/client-transport.ts";

// ── sandbox namespace ───────────────────────────────────────────────────
import {
  capability as _capability,
  dir as _dir,
  file as _file,
  gitRepo as _gitRepo,
  localDir as _localDir,
  localDirLazySkillSource as _localDirLazySkillSource,
  localFile as _localFile,
  UnixLocalSandboxClient as _UnixLocalSandboxClient,
} from "./ts/topology/sandbox/index.ts";

// ─── Exported namespaces ────────────────────────────────────────────────

/**
 * `ai.*` — the verbs you call to run a build and the runtime hooks.
 *
 * - `ai.evaluate({ build, input })` — run a build on one input.
 * - `ai.evaluateColumn({ build, inputs })` — run a build over many
 *   inputs without letting per-row failures poison the batch.
 * - `ai.embed("text")` — get a vector for one text.
 * - `ai.compareEmbeddings({ query, candidates })` — rank candidates by
 *   similarity to the query.
 * - `ai.errors.*` — the five typed errors `evaluate(..., { result: true })`
 *   can return (`AgentTurnLimitError`, `InputValidationError`,
 *   `LlmTransportError`, `OutputParseError`, `ToolError`).
 * - `ai.datastore.{memory, sqlite, set, clear}` — opt into a non-default cache.
 * - `ai.rateLimit.{set, get, clear}` — opt into a process-wide rate limit.
 */
export const ai = Object.freeze({
  evaluate: _evaluate,
  evaluateColumn: _evaluateColumn,
  embed: _embed,
  compareEmbeddings: _compareEmbeddings,
  errors: Object.freeze({
    AgentTurnLimitError,
    InputValidationError,
    LlmTransportError,
    OutputParseError,
    ToolError,
  }),
  datastore: Object.freeze({
    memory: memoryDatastore,
    sqlite: sqliteDatastore,
    set: setDatastore,
    clear: clearDatastore,
  }),
  rateLimit: Object.freeze({
    set: setRateLimit,
    get: getRateLimit,
    clear: clearRateLimit,
  }),
});

export namespace ai {
  /** Discriminated union of every error `ai.evaluate(..., { result: true })`
   *  can put in `.error`. Type-narrow on `.kind`. */
  export type AiEvalError = _AiEvalError;
}

/**
 * `build.*` — OAS-grammar authoring of executable graphs.
 *
 * - `build.create({ id, name, startNode, endNode, nodes, ... })` — assemble.
 * - `build.llmConfig({ modelId })` — model binding.
 * - `build.start(...)` / `build.end(...)` — graph endpoints.
 * - `build.agent(...)` / `build.agentNode(...)` — agent definition + node.
 * - `build.sandboxAgent(...)` / `build.sandboxAgentNode(...)` — agent
 *   with a workspace.
 * - `build.branching(...)` / `build.catchException(...)` — control flow.
 * - `build.flow(...)` / `build.map(...)` / `build.parallelMap(...)` /
 *   `build.parallelFlow(...)` — subflows.
 * - `build.controlFlowEdge(...)` / `build.dataFlowEdge(...)` — edges.
 * - `build.validate(t)` — pre-flight check (also runs automatically inside
 *   `build.create`).
 * - `build.toOAS(t)` / `build.fromOAS(json)` — OAS JSON round-trip.
 * - `build.DEFAULT_BRANCH` / `build.CAUGHT_EXCEPTION_BRANCH` — branch labels.
 */
export const build = Object.freeze({
  create: _createTopology,
  llmConfig: _createLlmConfig,
  start: _createStartNode,
  end: _createEndNode,
  agent: _createAgent,
  agentNode: _createAgentNode,
  sandboxAgent: _createSandboxAgent,
  sandboxAgentNode: _createSandboxAgentNode,
  branching: _createBranchingNode,
  catchException: _createCatchExceptionNode,
  flow: _createFlowNode,
  map: _createMapNode,
  parallelMap: _createParallelMapNode,
  parallelFlow: _createParallelFlowNode,
  controlFlowEdge: _createControlFlowEdge,
  dataFlowEdge: _createDataFlowEdge,
  validate: _validateTopology,
  toOAS: _toOAS,
  fromOAS: _fromOAS,
  DEFAULT_BRANCH: _DEFAULT_BRANCH,
  CAUGHT_EXCEPTION_BRANCH: _CAUGHT_EXCEPTION_BRANCH,
});

export namespace build {
  /** The runnable graph value `build.create({...})` returns. Used when
   *  hoisting a build to a named variable or passing it across modules. */
  export type Topology<I = unknown, O = unknown> = _Topology<I, O>;
}

/**
 * `tool.*` — build the tools an agent can call.
 *
 * - `tool.server(...)` — body runs in your process during the agent loop.
 * - `tool.client(...)` — body runs on the user's side via
 *   `ai.evaluate({ clientToolHandler })`.
 * - `tool.remote(...)` — body is a templated HTTP call.
 * - `tool.builtin(...)` — one of the OpenAI builtins (e.g. web_search).
 * - `tool.box(...)` — exposes a whole MCP server's tools to the agent.
 */
export const tool = Object.freeze({
  server: _createServerTool,
  client: _createClientTool,
  remote: _createRemoteTool,
  builtin: _createBuiltinTool,
  box: _createMcpToolBox,
});

export namespace tool {
  /** Signature of the handler passed as
   *  `ai.evaluate({ clientToolHandler })`. Only needed if you hoist the
   *  handler to a named function; inlining infers the type. */
  export type ClientToolHandler = _ClientToolHandler;
}

/**
 * `mcp.*` — MCP transports + per-tool wiring.
 *
 * - `mcp.tool(...)` — a single MCP tool (rare; usually `tool.box` is better).
 * - `mcp.spec(...)` — declare a filter entry for `tool.box`'s `toolFilter`.
 * - `mcp.transport.{stdio, sse, http, sseMtls, httpMtls, remote}` —
 *   build the transport an MCP `tool.box` or `mcp.tool` talks over.
 */
export const mcp = Object.freeze({
  tool: _createMcpTool,
  spec: _createMcpToolSpec,
  transport: Object.freeze({
    stdio: _createStdioTransport,
    sse: _createSSETransport,
    http: _createStreamableHTTPTransport,
    sseMtls: _createSSEmTLSTransport,
    httpMtls: _createStreamableHTTPmTLSTransport,
    remote: _createRemoteTransport,
  }),
});

/**
 * `sandbox.*` — workspace primitives a `build.sandboxAgent` uses.
 *
 * - `new sandbox.UnixLocalClient()` — run sandbox agents on the local Unix FS.
 * - `sandbox.capability.{filesystem, shell, skills, memory, compaction}` —
 *   capabilities passed to `build.sandboxAgent({ capabilities: [...] })`.
 * - `sandbox.dir({ children })` / `sandbox.file({ content })` — in-memory
 *   manifest entries.
 * - `sandbox.gitRepo({ repo, ref?, subpath? })` — clone a repo at session start.
 * - `sandbox.localDir({ src })` / `sandbox.localFile({ src })` — mirror a
 *   host path into the workspace.
 * - `sandbox.lazySkillSource({ src, baseDir? })` — source for
 *   `sandbox.capability.skills({ lazyFrom })`.
 */
export const sandbox = Object.freeze({
  UnixLocalClient: _UnixLocalSandboxClient,
  capability: _capability,
  dir: _dir,
  file: _file,
  gitRepo: _gitRepo,
  localDir: _localDir,
  localFile: _localFile,
  lazySkillSource: _localDirLazySkillSource,
});
