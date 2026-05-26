// SDK bridge — single point where our OAS-shaped authoring layer compiles
// into the @openai/agents runtime surface and runs.
//
// Responsibilities:
//   1. Lower an OAS `LlmConfig` into the SDK's model handle (string when
//      pointing at the default OpenAI endpoint, a custom OpenAI client
//      when a `baseUrl` is set — Ollama / vLLM / LiteLLM proxies, etc.).
//   2. Lower OAS tool variants (ServerTool / ClientTool / RemoteTool /
//      BuiltinTool / McpTool) into SDK tool entries (`tool(...)`,
//      `hostedMcpTool`, hosted webSearch/fileSearch/codeInterpreter
//      tools when present in the OpenAI extension).
//   3. Lower OAS MCPToolBox into SDK `MCPServerStdio` /
//      `MCPServerStreamableHttp` / `MCPServerSSE`, returning a
//      lifecycle handle the caller closes after `Runner.run`.
//   4. Run an SDK Agent via `Runner.run`, wrapped by our rate limiter
//      and retry policy, and normalize the SDK's Usage into our
//      NodeUsage shape.
//
// The bridge is the only place in the package that imports from
// `@openai/agents`. Anything that needs to know about Agents-SDK
// primitives goes through here.

// deno-lint-ignore-file no-explicit-any
import {
  Agent as SdkAgent,
  hostedMcpTool,
  MCPServerSSE,
  MCPServerStdio,
  MCPServerStreamableHttp,
  type MCPServer,
  OpenAIChatCompletionsModel,
  OpenAIResponsesModel,
  Runner,
  tool as sdkTool,
  withTrace as sdkWithTrace,
} from "@openai/agents";
import OpenAI from "openai";
import type { z } from "zod";

// We do NOT call `setTracingDisabled(true)` here: the SDK's tracing
// pipeline is how we receive per-turn span data (translated to OTel by
// `runtime/tracing.ts`). The SDK's *default* exporter, which posts to
// OpenAI's Traces backend, is what we want to suppress — that's
// controlled separately via the `OPENAI_AGENTS_DISABLE_TRACING` env
// var, which our `_env.ts` sets to `1`. The SDK then still fires
// in-process `onSpanEnd` events to registered processors (our bridge),
// but skips the network export loop.

import type { Agent } from "../../topology/agent.ts";
import type { LlmConfig } from "../../topology/llm-config.ts";
import { fillTemplate } from "../../topology/tools/remote-tool.ts";
import type { BuiltinTool } from "../../topology/tools/builtin-tool.ts";
import type { ClientTool } from "../../topology/tools/client-tool.ts";
import type { McpTool } from "../../topology/mcp/mcp-tool.ts";
import type { ClientTransport } from "../../topology/mcp/client-transport.ts";
import type { RemoteTool } from "../../topology/tools/remote-tool.ts";
import type { ServerTool } from "../../topology/tools/server-tool.ts";
import type { MCPToolBox } from "../../topology/tools/toolbox.ts";
import type { SandboxAgent } from "../../topology/sandbox/sandbox-agent.ts";
import {
  effectiveGenerationParameters,
  type GenerationParameters,
} from "../param-resolution.ts";
import {
  type ClientToolHandler,
  type RunContext,
} from "../run-context.ts";
import {
  InputValidationError,
  ToolError,
} from "../errors.ts";
import { withRateLimit } from "../rate-limit.ts";

// ── Model handle ───────────────────────────────────────────────────────

/** Build the SDK's `model` argument from an OAS `LlmConfig`.
 *
 *  - No `baseUrl`: pass the model id string and let the SDK use its
 *    default OpenAI client (configured via `OPENAI_API_KEY`).
 *  - `baseUrl` set: install a custom OpenAI client pointing at the URL
 *    via `setDefaultOpenAIClient` (process-wide), then return the
 *    string. Authors with multiple base URLs in flight should ensure
 *    one LlmConfig wins or accept the last-wins behavior — the SDK
 *    only has a single default client slot today.
 *
 *  Returns the string the SDK Agent's `model` field accepts. */
/** Build the SDK's `model` argument from an OAS `LlmConfig`.
 *
 *  - No `baseUrl` and no `apiKey`: pass the model id string and let
 *    the SDK use its default OpenAI client (configured via
 *    `OPENAI_API_KEY`).
 *  - Otherwise: construct a per-config `OpenAIResponsesModel` or
 *    `OpenAIChatCompletionsModel` bound to a fresh `OpenAI` client.
 *    This is the only safe way to support multiple `LlmConfig`s in
 *    one process — `setDefaultOpenAIClient` is a global singleton
 *    and would let one bad baseUrl poison subsequent runs.
 *
 *  Returns whatever the SDK Agent's `model` field accepts (string or
 *  Model instance). */
export function resolveModelHandle(llmConfig: LlmConfig): string | unknown {
  if (!llmConfig.baseUrl && !llmConfig.apiKey) return llmConfig.modelId;
  // pnpm hoists two `openai` versions (one from a workspace pin, one
  // dragged in by `@openai/agents`). The SDK structurally accepts any
  // `openai`-shape client; cast at the boundary.
  const client = new OpenAI({
    ...(llmConfig.baseUrl ? { baseURL: llmConfig.baseUrl } : {}),
    apiKey: llmConfig.apiKey ?? "EMPTY",
  }) as any;
  // Default to the Responses API — same as the SDK's own default
  // OpenAIProvider. Authors who need Chat Completions can construct
  // their own Model via `setOpenAIAPI("chat_completions")` globally
  // (out-of-scope here; the use case is rare and provider-specific).
  return new OpenAIResponsesModel(client, llmConfig.modelId);
}

// Used by _llm-node.ts via re-export so the per-LLM call site doesn't
// reimplement the same lowering.
export { OpenAIChatCompletionsModel, OpenAIResponsesModel };

// ── Tool lowering ──────────────────────────────────────────────────────

/** Map an OAS BuiltinTool's `toolType` to an SDK hosted-tool entry. The
 *  SDK exposes typed factories (`webSearchTool`, `fileSearchTool`,
 *  `codeInterpreterTool`) but they're in the OpenAI extension package
 *  and not all variants are typed equally — we go through the SDK's
 *  raw `HostedTool` shape so unknown `toolType` strings still pass
 *  through. */
function builtinToHostedTool(b: BuiltinTool): unknown {
  return {
    type: b.toolType as any,
    ...(b.configuration ?? {}),
  };
}

/** Build an SDK function-tool for a ServerTool. The model calls it
 *  and the SDK invokes our `execute` callback inside the Runner. */
function serverToSdkTool(t: ServerTool): unknown {
  return sdkTool({
    name: t.name,
    description: t.description ?? "",
    parameters: (t.paramsSchema ?? undefined) as unknown as z.ZodObject<any>,
    execute: async (params: unknown) => {
      const out = await Promise.resolve(t.execute(params));
      return typeof out === "string" ? out : JSON.stringify(out);
    },
  });
}

/** Build an SDK function-tool for a ClientTool. The SDK's
 *  `needsApproval: true` mechanism pauses the run; our adapter calls
 *  the user-supplied `clientToolHandler` and then resumes — but in
 *  this simpler shape we encode the handler invocation as a plain
 *  `execute` callback. The `needsApproval` interrupt model is only
 *  needed when host-side approval is part of the contract. For now,
 *  treat ClientTool as a function-tool whose body calls the handler. */
function clientToSdkTool(
  t: ClientTool,
  handler: ClientToolHandler | undefined,
): unknown {
  return sdkTool({
    name: t.name,
    description: t.description ?? "",
    parameters: (t.paramsSchema ?? undefined) as unknown as z.ZodObject<any>,
    execute: async (params: unknown) => {
      if (!handler) {
        throw new ToolError({
          message:
            `Agent invoked ClientTool '${t.name}' but no clientToolHandler was supplied to ai.evaluate().`,
          tool: t.name,
        });
      }
      const out = await Promise.resolve(handler({
        name: t.name,
        arguments: (params ?? {}) as Record<string, unknown>,
      }));
      return typeof out === "string" ? out : JSON.stringify(out);
    },
  });
}

/** Build an SDK function-tool for a RemoteTool. The `execute`
 *  callback fills placeholders, issues the HTTP request, and feeds
 *  the response back to the model. */
function remoteToSdkTool(t: RemoteTool): unknown {
  return sdkTool({
    name: t.name,
    description: t.description ?? "",
    parameters: undefined,
    execute: async (params: unknown) => {
      const args = (params ?? {}) as Record<string, unknown>;
      const url = fillTemplate(t.url, args) as string;
      const query = fillTemplate(t.queryParams ?? {}, args) as Record<string, unknown>;
      const headers = fillTemplate(t.headers ?? {}, args) as Record<string, unknown>;
      const sensitive = fillTemplate(t.sensitiveHeaders ?? {}, args) as Record<string, unknown>;
      const data = fillTemplate(t.data ?? null, args);

      const u = new URL(url);
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        u.searchParams.set(k, typeof v === "string" ? v : JSON.stringify(v));
      }

      const finalHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(headers)) {
        if (v === undefined || v === null) continue;
        finalHeaders[k] = typeof v === "string" ? v : JSON.stringify(v);
      }
      for (const [k, v] of Object.entries(sensitive)) {
        if (v === undefined || v === null) continue;
        finalHeaders[k] = typeof v === "string" ? v : JSON.stringify(v);
      }

      const methodUpper = t.httpMethod.toUpperCase();
      const hasBody = data !== null && data !== undefined &&
        methodUpper !== "GET" && methodUpper !== "HEAD";
      let body: string | undefined;
      if (hasBody) {
        body = typeof data === "string" ? data : JSON.stringify(data);
        if (!Object.keys(finalHeaders).some((k) => k.toLowerCase() === "content-type")) {
          finalHeaders["content-type"] = "application/json";
        }
      }

      const res = await fetch(u.toString(), {
        method: t.httpMethod,
        headers: finalHeaders,
        body,
      });
      const text = await res.text();
      if (!res.ok) {
        throw new ToolError({
          message: `RemoteTool '${t.name}' returned HTTP ${res.status}: ${text.slice(0, 200)}`,
          tool: t.name,
        });
      }
      try {
        return JSON.stringify(JSON.parse(text));
      } catch {
        return text;
      }
    },
  });
}

// ── MCP lowering ───────────────────────────────────────────────────────

/** Build an SDK MCP server from an OAS ClientTransport.
 *  Caller owns the lifecycle — `server.connect()` is called inside
 *  `buildMcpServers`; `server.close()` must be called after the run. */
function transportToMcpServer(
  transport: ClientTransport,
  name: string,
): MCPServer {
  switch (transport.componentType) {
    case "StdioTransport":
      return new MCPServerStdio({
        command: transport.command,
        args: transport.args,
        env: transport.env,
        cwd: transport.cwd,
        name,
        cacheToolsList: true,
      });
    case "SSETransport":
    case "SSEmTLSTransport":
      return new MCPServerSSE({
        url: transport.url,
        name,
        cacheToolsList: true,
      });
    case "StreamableHTTPTransport":
    case "StreamableHTTPmTLSTransport":
    case "RemoteTransport":
      return new MCPServerStreamableHttp({
        url: transport.url,
        name,
        cacheToolsList: true,
      });
  }
}

/** Connect every McpTool's transport and every MCPToolBox's transport.
 *  Returns the live MCPServer list (for the SDK Agent's `mcpServers`
 *  field) and a `close` function the caller invokes after the run. */
export async function buildMcpServers(
  mcpTools: McpTool[],
  toolboxes: MCPToolBox[],
): Promise<{ servers: MCPServer[]; close: () => Promise<void> }> {
  const servers: MCPServer[] = [];
  for (const t of mcpTools) {
    const s = transportToMcpServer(t.clientTransport, t.name);
    await s.connect();
    servers.push(s);
  }
  for (const box of toolboxes) {
    const s = transportToMcpServer(box.clientTransport, box.name);
    await s.connect();
    servers.push(s);
  }
  return {
    servers,
    close: async () => {
      for (const s of servers) {
        try {
          await s.close();
        } catch {
          // Best-effort cleanup; don't poison the close of others.
        }
      }
    },
  };
}

// ── Agent compilation ──────────────────────────────────────────────────

export interface BuiltSdkAgent {
  sdkAgent: SdkAgent<unknown, any>;
  /** Cleanup for MCP server lifecycle. Always call after `Runner.run`. */
  cleanup: () => Promise<void>;
}

/** Compile an OAS Agent into an SDK Agent ready for `Runner.run`. */
export async function buildSdkAgent({
  agent,
  ctx,
  effectiveSystemPrompt,
}: {
  agent: Agent;
  ctx: RunContext;
  /** Pre-rendered system prompt (placeholders already filled). */
  effectiveSystemPrompt: string;
}): Promise<BuiltSdkAgent> {
  const tools = agent.tools ?? [];

  // Partition by kind. Server/Client/Remote become function tools the
  // SDK calls. Builtin becomes a hosted-tool entry. Mcp and toolboxes
  // become live MCP servers attached to the SDK Agent's `mcpServers`.
  const sdkTools: unknown[] = [];
  const mcpTools: McpTool[] = [];
  const toolboxes: MCPToolBox[] = [];

  for (const t of tools) {
    switch (t.componentType) {
      case "ServerTool":
        sdkTools.push(serverToSdkTool(t as ServerTool));
        break;
      case "ClientTool":
        sdkTools.push(
          clientToSdkTool(t as ClientTool, ctx.clientToolHandler),
        );
        break;
      case "RemoteTool":
        sdkTools.push(remoteToSdkTool(t as RemoteTool));
        break;
      case "BuiltinTool": {
        const bt = t as BuiltinTool;
        // Two routes: hosted MCP servers get the `hostedMcpTool` factory
        // (SDK-typed); everything else passes through as a raw hosted
        // tool entry the SDK forwards to the Responses API.
        if (bt.toolType === "mcp" || bt.toolType === "hosted_mcp") {
          const cfg = bt.configuration ?? {};
          // SDK accepts `"always"` literal or `{ never: { toolNames } } |
          // { always: { toolNames } }` object — passthrough whatever the
          // author put in `configuration.require_approval`.
          const hostedArgs: any = {
            serverLabel: cfg.server_label as string,
            serverUrl: cfg.server_url as string,
          };
          if (cfg.require_approval !== undefined) {
            hostedArgs.requireApproval = cfg.require_approval;
          }
          sdkTools.push(hostedMcpTool(hostedArgs));
        } else {
          sdkTools.push(builtinToHostedTool(bt));
        }
        break;
      }
      case "MCPTool":
        mcpTools.push(t as McpTool);
        break;
    }
  }
  for (const box of agent.toolboxes ?? []) {
    if (box.componentType === "MCPToolBox") {
      toolboxes.push(box as MCPToolBox);
    }
  }

  const { servers, close } = await buildMcpServers(mcpTools, toolboxes);

  const llmConfig = agent.llmConfig;
  const model = resolveModelHandle(llmConfig);

  const override = ctx.overrides?.[agent.name];
  const params = effectiveGenerationParameters(llmConfig, override);

  // The SDK Agent type's outputType is a phantom slot; cast at the
  // boundary so the runtime accepts a Zod schema or `undefined`.
  const sdkAgent = new SdkAgent({
    name: agent.name,
    instructions: effectiveSystemPrompt,
    model: model as any,
    modelSettings: paramsToModelSettings(params),
    tools: sdkTools as any,
    mcpServers: servers,
    outputType: resolveOutputType(agent),
  });

  return { sdkAgent, cleanup: close };
}

/** Resolve the SDK `outputType` field from an OAS Agent. Live Zod
 *  schema wins; falls back to the deserialized JSON Schema (which the
 *  SDK accepts as `{ type: "json_schema", name, strict, schema }`).
 *  Returns `undefined` when neither is present — the SDK then returns
 *  freeform text. */
function resolveOutputType(agent: Agent | SandboxAgent): any {
  if (agent.outputSchema) return agent.outputSchema;
  const json = (agent as Record<string, unknown>).outputSchemaJson;
  if (json) {
    return {
      type: "json_schema",
      name: agent.name,
      strict: true,
      schema: json,
    };
  }
  return undefined;
}

function paramsToModelSettings(
  params: GenerationParameters | null,
): Record<string, unknown> {
  if (!params) return {};
  const out: Record<string, unknown> = {};
  if (params.temperature !== undefined) out.temperature = params.temperature;
  if (params.maxTokens !== undefined) out.maxTokens = params.maxTokens;
  if (params.topP !== undefined) out.topP = params.topP;
  return out;
}

// ── Runner invocation ──────────────────────────────────────────────────

export interface SdkRunOutcome {
  finalOutput: unknown;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  toolCalls: number;
}

/** Run an SDK Agent inside our rate limiter; normalize the result into
 *  the shape our NodeUsage telemetry expects.
 *
 *  `extraRunOptions` is merged into the SDK's `Runner.run(...)` options
 *  bag alongside `maxTurns` — used by the sandbox path to thread a
 *  `sandbox: { client }` selector. The plain-agent path leaves it
 *  unset.
 *
 *  `otelTraceId` is the 32-hex W3C trace id of the enclosing
 *  `ai.evaluate`'s OTel trace. We hand the SDK the matching
 *  `trace_<otelTraceId>` value via `withTrace(...)` so every SDK span
 *  emitted under this `Runner.run` shares the OTel root trace. The SDK
 *  bridge in `runtime/tracing.ts` filters incoming spans on this id, so
 *  concurrent evaluates don't cross-pollinate. */
export async function runSdkAgent({
  sdkAgent,
  input,
  maxTurns,
  otelTraceId,
  extraRunOptions,
}: {
  sdkAgent: SdkAgent<unknown, any>;
  input: string | Record<string, unknown>;
  maxTurns: number;
  otelTraceId: string;
  extraRunOptions?: Record<string, unknown>;
}): Promise<SdkRunOutcome> {
  const runner = new Runner();

  // Stringify object inputs — the SDK's `run` accepts either a string
  // or a list of input items; for our row-wise verb the input is
  // always a structured object that should be JSON-serialized for the
  // model to consume.
  const inputArg = typeof input === "string" ? input : JSON.stringify(input);

  const runOpts = { maxTurns, ...(extraRunOptions ?? {}) };
  // Wrap in the SDK's `withTrace` with our OTel trace id so the SDK's
  // own trace gets the same id and the bridge can correlate spans.
  const result: any = await sdkWithTrace(
    `trace_${otelTraceId}`,
    () => withRateLimit(() => runner.run(sdkAgent, inputArg, runOpts as any)),
  );

  // SDK 0.11 surfaces the run's accumulated usage on
  // `result.state._context.usage`. Cast at the boundary so we don't
  // have to mirror the SDK's internal generics.
  const usage = (result.state as unknown as {
    _context?: { usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number } };
  })._context?.usage;

  // Tool-call count from the raw item list.
  const rawItems = (result.newItems ?? []) as Array<{ type?: string }>;
  const toolCalls = rawItems.filter((i) => i?.type === "tool_call_item").length;

  return {
    finalOutput: result.finalOutput,
    promptTokens: usage?.inputTokens ?? 0,
    completionTokens: usage?.outputTokens ?? 0,
    totalTokens: usage?.totalTokens ?? 0,
    toolCalls,
  };
}

// ── Surface a typed InputValidationError when an Agent has nothing the SDK can run ──

export function assertAgentRunnable(agent: Agent | SandboxAgent): void {
  if (!agent.llmConfig?.modelId) {
    throw new InputValidationError({
      message: `Agent '${agent.name}' has no llmConfig.modelId.`,
    });
  }
}

// ── SandboxAgent compilation ───────────────────────────────────────────

export interface BuiltSdkSandboxAgent {
  sdkAgent: unknown;
  cleanup: () => Promise<void>;
}

/** Compile an OAS SandboxAgent into an SDK SandboxAgent.
 *
 *  Per ADR-0004: OAS doesn't standardize SandboxAgent / Capability /
 *  Manifest / Skill, so our `SandboxAgent` value already carries
 *  SDK-shaped `defaultManifest` / `capabilities` / `runAs` fields
 *  verbatim. No lowering — we hand them straight to the SDK
 *  constructor.
 *
 *  We load `@openai/agents/sandbox` dynamically so the non-sandbox
 *  path doesn't pull in workspace-staging machinery the plain Agent
 *  doesn't need. */
export async function buildSdkSandboxAgent({
  agent,
  ctx,
  effectiveSystemPrompt,
}: {
  agent: SandboxAgent;
  ctx: RunContext;
  effectiveSystemPrompt: string;
}): Promise<BuiltSdkSandboxAgent> {
  const sandboxMod = await import("@openai/agents/sandbox");
  const SandboxAgentCtor = (sandboxMod as Record<string, any>).SandboxAgent;
  if (!SandboxAgentCtor) {
    throw new InputValidationError({
      message:
        "SandboxAgent constructor not found on @openai/agents/sandbox.",
    });
  }

  const tools = agent.tools ?? [];
  const sdkTools: unknown[] = [];
  const mcpTools: McpTool[] = [];
  const toolboxes: MCPToolBox[] = [];

  for (const t of tools) {
    switch (t.componentType) {
      case "ServerTool":
        sdkTools.push(serverToSdkTool(t as ServerTool));
        break;
      case "ClientTool":
        sdkTools.push(
          clientToSdkTool(t as ClientTool, ctx.clientToolHandler),
        );
        break;
      case "RemoteTool":
        sdkTools.push(remoteToSdkTool(t as RemoteTool));
        break;
      case "BuiltinTool": {
        const bt = t as BuiltinTool;
        if (bt.toolType === "mcp" || bt.toolType === "hosted_mcp") {
          const cfg = bt.configuration ?? {};
          const hostedArgs: any = {
            serverLabel: cfg.server_label as string,
            serverUrl: cfg.server_url as string,
          };
          if (cfg.require_approval !== undefined) {
            hostedArgs.requireApproval = cfg.require_approval;
          }
          sdkTools.push(hostedMcpTool(hostedArgs));
        } else {
          sdkTools.push(builtinToHostedTool(bt));
        }
        break;
      }
      case "MCPTool":
        mcpTools.push(t as McpTool);
        break;
    }
  }
  for (const box of agent.toolboxes ?? []) {
    if (box.componentType === "MCPToolBox") {
      toolboxes.push(box as MCPToolBox);
    }
  }

  const { servers, close } = await buildMcpServers(mcpTools, toolboxes);

  const llmConfig = agent.llmConfig;
  const model = resolveModelHandle(llmConfig);
  const override = ctx.overrides?.[agent.name];
  const params = effectiveGenerationParameters(llmConfig, override);

  const sdkAgent = new SandboxAgentCtor({
    name: agent.name,
    instructions: effectiveSystemPrompt,
    model: model as any,
    modelSettings: paramsToModelSettings(params),
    tools: sdkTools as any,
    mcpServers: servers,
    outputType: resolveOutputType(agent),
    // SDK-shaped passthrough — see ADR-0004.
    defaultManifest: agent.defaultManifest,
    capabilities: agent.capabilities,
    runAs: agent.runAs,
  });

  return { sdkAgent, cleanup: close };
}

/** Run a SandboxAgent via the SDK's runner. Same wrapping as
 *  `runSdkAgent` — rate-limited at the invocation boundary, usage
 *  normalized to our NodeUsage shape. When `sandboxClient` is set,
 *  it's threaded into the SDK's `sandbox: { client }` run option;
 *  otherwise the SDK uses its default `UnixLocalSandboxClient`. */
export async function runSdkSandboxAgent({
  sdkAgent,
  input,
  maxTurns,
  otelTraceId,
  sandboxClient,
}: {
  sdkAgent: unknown;
  input: string | Record<string, unknown>;
  maxTurns: number;
  otelTraceId: string;
  sandboxClient: unknown | undefined;
}): Promise<SdkRunOutcome> {
  const extraRunOptions = sandboxClient !== undefined
    ? { sandbox: { client: sandboxClient } }
    : undefined;
  return await runSdkAgent({
    sdkAgent: sdkAgent as SdkAgent<unknown, any>,
    input,
    maxTurns,
    otelTraceId,
    extraRunOptions,
  });
}
