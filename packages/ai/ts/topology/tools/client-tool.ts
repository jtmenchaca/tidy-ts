// ClientTool — a tool whose execution lives outside the orchestrator.
//
// When the model emits a tool_call for a ClientTool, the runner does not
// invoke any function — instead it hands the call to the caller's
// `clientToolHandler` (an option on `ai.evaluate`). Typical use cases:
//
//   - Browser-side topologies where the orchestrator runs in a server but
//     the tool body (file picker, geolocation, DOM access) must run in
//     the user's tab and the result come back over a transport.
//   - Topologies driving a desktop agent loop where the user approves /
//     edits / re-runs tool calls.
//
// Like ServerTool, declarations carry `paramsSchema`/`resultSchema` so
// the agent's OpenAI `tools[]` entry is well-typed. Unlike ServerTool,
// there is no `execute` — the orchestrator never owns the body.
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/tools/client-tool.ts

import { z } from "zod";
import type { Property } from "../property.ts";
import { zodObjectToProperties } from "../zod-to-properties.ts";
import { ToolBaseSchema } from "./tool-base.ts";

export const ClientToolSchema = ToolBaseSchema.extend({
  componentType: z.literal("ClientTool"),
});

declare const __ctP: unique symbol;
declare const __ctR: unique symbol;

export type ClientTool<P = unknown, R = unknown> =
  & z.infer<typeof ClientToolSchema>
  & {
    readonly [__ctP]?: P;
    readonly [__ctR]?: R;
    paramsSchema?: z.ZodType<P>;
    resultSchema?: z.ZodType<R>;
  };

export function createClientTool<P = unknown, R = unknown>({
  name,
  description,
  paramsSchema,
  resultSchema,
  inputs,
  outputs,
  id,
  metadata,
  requiresConfirmation,
}: {
  name: string;
  description?: string;
  paramsSchema?: z.ZodType<P>;
  resultSchema?: z.ZodType<R>;
  inputs?: Property[];
  outputs?: Property[];
  id?: string;
  metadata?: Record<string, unknown>;
  requiresConfirmation?: boolean;
}): ClientTool<P, R> {
  const resolvedInputs = inputs ??
    (paramsSchema ? zodObjectToProperties(paramsSchema) : []);
  const resolvedOutputs = outputs ??
    (resultSchema ? zodObjectToProperties(resultSchema) : []);

  const parsed = ClientToolSchema.parse({
    name,
    description,
    id,
    metadata,
    inputs: resolvedInputs,
    outputs: resolvedOutputs,
    requiresConfirmation,
    componentType: "ClientTool" as const,
  });
  return Object.freeze({
    ...parsed,
    paramsSchema,
    resultSchema,
  }) as ClientTool<P, R>;
}
