// Agent component — an LLM with system prompt, tools, and optional
// structured output schemas. Mirrors Oracle OAS's Agent shape.
//
// An Agent's `tools` is a heterogeneous list of tool variants
// (ServerTool / ClientTool / RemoteTool / BuiltinTool / McpTool). The
// agent's `toolboxes` is a list of toolboxes (currently only MCPToolBox)
// the executor expands into concrete tools at run time. Both attach to
// the OpenAI Chat-Completions `tools[]` request body — the executor's
// tool-call dispatch switches on each tool's `componentType`.
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/agents/agent.ts

import { z } from "zod";
import { ComponentWithIOSchema } from "./component.ts";
import { type LlmConfig, LlmConfigSchema } from "./llm-config.ts";
import type { Property } from "./property.ts";
import type { Tool } from "./tools/index.ts";
import type { ToolBox } from "./tools/toolbox.ts";
import { zodObjectToProperties } from "./zod-to-properties.ts";

export const AgentSchema = ComponentWithIOSchema.extend({
  componentType: z.literal("Agent"),
  llmConfig: LlmConfigSchema,
  systemPromptTemplate: z.string(),
  /** Maximum number of LLM↔tool-call round-trips before the runner gives
   *  up with `MaxTurnsExceededError`. Research agents that fetch many
   *  papers may need this raised; chat-y agents are fine at the default.
   *  Passed straight through to the Agents-SDK Runner's `maxTurns`. */
  maxToolTurns: z.number().int().positive().default(8),
});

declare const __agentI: unique symbol;
declare const __agentO: unique symbol;

// `tools` and `toolboxes` are typed against the structural floor (`Tool`
// / `ToolBox`) — concrete variants slot in without losing their per-tool
// param/result types at their own call sites.
export type Agent<I = unknown, O = unknown> = z.infer<typeof AgentSchema> & {
  readonly [__agentI]?: I;
  readonly [__agentO]?: O;
  inputSchema?: z.ZodType<I>;
  outputSchema?: z.ZodType<O>;
  tools: Tool[];
  toolboxes: ToolBox[];
};

export function createAgent<I = unknown, O = unknown>({
  name,
  llmConfig,
  systemPromptTemplate,
  inputSchema,
  outputSchema,
  tools = [],
  toolboxes = [],
  inputs,
  outputs,
  id,
  description,
  metadata,
  maxToolTurns,
}: {
  name: string;
  llmConfig: LlmConfig;
  systemPromptTemplate: string;
  inputSchema?: z.ZodType<I>;
  outputSchema?: z.ZodType<O>;
  /** Tools the agent can call. Heterogeneous: any combination of
   *  ServerTool, ClientTool, RemoteTool, BuiltinTool, McpTool. */
  tools?: Tool[];
  /** Toolboxes the agent expands at run time. Currently only
   *  MCPToolBox — connects to the configured MCP server and surfaces
   *  every tool that passes `toolFilter` (or every tool, when no
   *  filter is set). */
  toolboxes?: ToolBox[];
  inputs?: Property[];
  outputs?: Property[];
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  /** Override the default 8-turn LLM↔tool-call ceiling. */
  maxToolTurns?: number;
}): Agent<I, O> {
  const resolvedInputs = inputs ??
    (inputSchema ? zodObjectToProperties(inputSchema) : []);
  const resolvedOutputs = outputs ??
    (outputSchema ? zodObjectToProperties(outputSchema) : []);

  const parsed = AgentSchema.parse({
    name,
    llmConfig,
    systemPromptTemplate,
    inputs: resolvedInputs,
    outputs: resolvedOutputs,
    id,
    description,
    metadata,
    maxToolTurns,
    componentType: "Agent" as const,
  });
  return Object.freeze({
    ...parsed,
    inputSchema,
    outputSchema,
    tools,
    toolboxes,
  }) as Agent<I, O>;
}
