// SandboxAgent — an Agent extended with a workspace.
//
// OAS does not standardize SandboxAgent / Capability / Manifest / Skill, so
// per ADR-0004 we carry the Agents-SDK shapes verbatim rather than inventing
// a parallel discriminated union. `defaultManifest`, `capabilities`, `runAs`,
// and any skill payloads use the SDK's own types (re-exported from
// `@openai/agents/sandbox` and `@openai/agents`'s `capability.*` namespace).
//
// The bridge constructs an SDK `SandboxAgent` with these values verbatim —
// no translation, no factory call, no field renames. Authors get one
// vocabulary; SDK errors reference the exact fields they wrote.

import { z } from "zod";
import type { Capability, ManifestInput } from "@openai/agents/sandbox";
import { ComponentWithIOSchema } from "../component.ts";
import { type LlmConfig, LlmConfigSchema } from "../llm-config.ts";
import type { Property } from "../property.ts";
import type { Tool } from "../tools/index.ts";
import type { ToolBox } from "../tools/toolbox.ts";
import { zodObjectToProperties } from "../zod-to-properties.ts";

export const SandboxAgentSchema = ComponentWithIOSchema.extend({
  componentType: z.literal("SandboxAgent"),
  llmConfig: LlmConfigSchema,
  systemPromptTemplate: z.string(),
  // Sandbox-side fields are stored as `z.unknown()` because the SDK's
  // ManifestInput / Capability types include class instances and
  // discriminated-union payloads Zod can't validate structurally.
  // Type safety on these comes from the `SandboxAgent<I, O>` overlay
  // below, which carries the SDK-typed shape on top of the parsed
  // Zod object.
  defaultManifest: z.unknown().optional(),
  capabilities: z.unknown().optional(),
  runAs: z.string().optional(),
  maxToolTurns: z.number().int().positive().default(8),
});

declare const __sandboxI: unique symbol;
declare const __sandboxO: unique symbol;

export type SandboxAgent<I = unknown, O = unknown> =
  & z.infer<typeof SandboxAgentSchema>
  & {
    readonly [__sandboxI]?: I;
    readonly [__sandboxO]?: O;
    inputSchema: z.ZodType<I>;
    outputSchema: z.ZodType<O>;
    tools: Tool[];
    toolboxes: ToolBox[];
    /** SDK-shaped manifest input. See `@openai/agents/sandbox`. */
    defaultManifest?: ManifestInput;
    /** SDK Capability class instances (filesystem(), shell(),
     *  skills(...), memory(...), compaction(...)). Defaults to
     *  `[filesystem(), shell(), compaction()]` per the SDK when this
     *  field is left undefined at the SDK constructor. */
    capabilities?: Capability[];
  };

export function createSandboxAgent<I, O>({
  name,
  llmConfig,
  systemPromptTemplate,
  defaultManifest,
  capabilities,
  runAs,
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
  /** SDK ManifestInput — built with the SDK factories (`localDir`,
   *  `gitRepo`, `file`, etc.) re-exported from `@tidy-ts/ai`. */
  defaultManifest?: ManifestInput;
  /** SDK Capability instances — built via `capability.filesystem()` /
   *  `capability.shell()` / `capability.skills({...})` /
   *  `capability.memory({...})` / `capability.compaction({...})`. */
  capabilities?: Capability[];
  /** Free-form OS-style username forwarded to the sandbox client. */
  runAs?: string;
  inputSchema: z.ZodType<I>;
  outputSchema: z.ZodType<O>;
  tools?: Tool[];
  toolboxes?: ToolBox[];
  inputs?: Property[];
  outputs?: Property[];
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  maxToolTurns?: number;
}): SandboxAgent<I, O> {
  const resolvedInputs = inputs ?? zodObjectToProperties(inputSchema);
  const resolvedOutputs = outputs ?? zodObjectToProperties(outputSchema);

  const parsed = SandboxAgentSchema.parse({
    componentType: "SandboxAgent" as const,
    name,
    llmConfig,
    systemPromptTemplate,
    defaultManifest,
    capabilities,
    runAs,
    inputs: resolvedInputs,
    outputs: resolvedOutputs,
    id,
    description,
    metadata,
    maxToolTurns,
  });
  return Object.freeze({
    ...parsed,
    inputSchema,
    outputSchema,
    tools,
    toolboxes,
    defaultManifest,
    capabilities,
  }) as SandboxAgent<I, O>;
}
