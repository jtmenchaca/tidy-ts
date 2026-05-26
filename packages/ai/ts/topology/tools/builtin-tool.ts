// BuiltinTool — a provider-side hosted tool the model invokes server-side.
//
// Examples (OpenAI): `web_search` / `web_search_preview`, `file_search`,
// `code_interpreter`, `image_generation`, `mcp` (remote MCP server).
// These tools run inside OpenAI's infrastructure; the orchestrator never
// sees a `tool_call` for them and never has to execute anything locally.
// Our job is to declare them and let them passthrough into the OpenAI
// `tools[]` request entry verbatim.
//
// Constraint: most hosted tools are Responses-API-only. `code_interpreter`
// works on both Chat Completions and Responses; the rest will be rejected
// by Chat Completions. We do not enforce that at construction time
// (provider compatibility shifts; the OAS schema is provider-neutral).
// The agent executor surfaces the API error if the model isn't
// compatible.
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/tools/builtin-tool.ts

import { z } from "zod";
import type { Property } from "../property.ts";
import { ToolBaseSchema } from "./tool-base.ts";

export const BuiltinToolSchema = ToolBaseSchema.extend({
  componentType: z.literal("BuiltinTool"),
  /** Provider-side identifier. For OpenAI, matches the `type` field of
   *  the `tools[]` entry: "web_search", "web_search_preview",
   *  "file_search", "code_interpreter", "image_generation", "mcp",
   *  "computer_use", "local_shell", "tool_search". The runner does not
   *  enumerate these — it just passes the string through. */
  toolType: z.string(),
  /** Provider-side configuration that rides alongside `type` in the
   *  `tools[]` entry. E.g., `{ vector_store_ids: ["vs_..."] }` for
   *  `file_search`; `{ user_location: {...}, filters: {...} }` for
   *  `web_search`; `{ container: { type: "auto" } }` for
   *  `code_interpreter`. */
  configuration: z.record(z.string(), z.unknown()).optional(),
  /** OAS-defined; used by enterprise orchestrators to route the tool
   *  to a specific executor. Has no OpenAI wire equivalent and is
   *  ignored when building the OpenAI request. Preserved here for
   *  OAS round-trip. */
  executorName: z.union([z.string(), z.array(z.string())]).optional(),
  /** OAS-defined version pin for the tool implementation. Preserved for
   *  OAS round-trip; not sent to OpenAI. */
  toolVersion: z.string().optional(),
});

export type BuiltinTool = z.infer<typeof BuiltinToolSchema>;

export function createBuiltinTool({
  name,
  toolType,
  description,
  id,
  metadata,
  configuration,
  executorName,
  toolVersion,
  inputs,
  outputs,
  requiresConfirmation,
}: {
  name: string;
  toolType: string;
  description?: string;
  id?: string;
  metadata?: Record<string, unknown>;
  configuration?: Record<string, unknown>;
  executorName?: string | string[];
  toolVersion?: string;
  inputs?: Property[];
  outputs?: Property[];
  requiresConfirmation?: boolean;
}): BuiltinTool {
  return Object.freeze(
    BuiltinToolSchema.parse({
      componentType: "BuiltinTool" as const,
      name,
      toolType,
      description,
      id,
      metadata,
      configuration,
      executorName,
      toolVersion,
      inputs,
      outputs,
      requiresConfirmation,
    }),
  );
}
