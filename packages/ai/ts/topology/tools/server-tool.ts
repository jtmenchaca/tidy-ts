// ServerTool — a tool the orchestrator executes locally.
//
// OAS's ServerTool is declaration-only (name + I/O Properties). We extend
// it with the runtime boundary the orchestrator needs: a Zod `paramsSchema`
// for inbound validation, an optional `resultSchema`, and an `execute`
// callback. This is the OAS variant that has a real function attached;
// the others (Client / Remote / Builtin / MCP) defer execution elsewhere.
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/tools/server-tool.ts

import { z } from "zod";
import type { Property } from "../property.ts";
import { zodObjectToProperties } from "../zod-to-properties.ts";
import { ToolBaseSchema } from "./tool-base.ts";

export const ServerToolSchema = ToolBaseSchema.extend({
  componentType: z.literal("ServerTool"),
});

// Phantom carriers preserve the per-tool P/R types through the
// agent's heterogeneous `tools: ServerTool<any, any>[]` array — the
// per-tool call site (where the author calls `tool.execute`) still
// sees concrete types, but a mixed array stays assignable.
declare const __toolP: unique symbol;
declare const __toolR: unique symbol;

export type ServerTool<P = unknown, R = unknown> =
  & z.infer<typeof ServerToolSchema>
  & {
    readonly [__toolP]?: P;
    readonly [__toolR]?: R;
    paramsSchema?: z.ZodType<P>;
    resultSchema?: z.ZodType<R>;
    execute: (params: P) => R | Promise<R>;
  };

export function createServerTool<P = unknown, R = unknown>({
  name,
  description,
  paramsSchema,
  resultSchema,
  execute,
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
  execute: (params: P) => R | Promise<R>;
  inputs?: Property[];
  outputs?: Property[];
  id?: string;
  metadata?: Record<string, unknown>;
  requiresConfirmation?: boolean;
}): ServerTool<P, R> {
  const resolvedInputs = inputs ??
    (paramsSchema ? zodObjectToProperties(paramsSchema) : []);
  const resolvedOutputs = outputs ??
    (resultSchema ? zodObjectToProperties(resultSchema) : []);

  const parsed = ServerToolSchema.parse({
    name,
    description,
    id,
    metadata,
    inputs: resolvedInputs,
    outputs: resolvedOutputs,
    requiresConfirmation,
    componentType: "ServerTool" as const,
  });
  return Object.freeze({
    ...parsed,
    paramsSchema,
    resultSchema,
    execute,
  }) as ServerTool<P, R>;
}

/** Back-compat alias for the original `createTool` name. The new code
 *  prefers `createServerTool` to match OAS naming, but existing call
 *  sites can keep using `createTool` without a rename. */
export const createTool = createServerTool;
