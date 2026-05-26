// Toolbox — a named, reusable group of tools an Agent imports as one
// reference. OAS currently defines exactly one toolbox variant: the
// `MCPToolBox`, which exposes a server's tools subject to an optional
// allowlist filter. The discriminated union is left open so future OAS
// versions can add more box kinds without breaking existing OAS JSON.
//
// At run time, the agent executor resolves each box into a list of
// concrete tools (for MCPToolBox: connect via the transport, listTools,
// keep entries matching `toolFilter`, then treat each one as an McpTool).
// Boxes have no `execute` boundary of their own; resolution produces
// per-tool entries that go through the normal tool dispatch.
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/tools/toolbox.ts

import { z } from "zod";
import { ComponentBaseSchema } from "../component.ts";
import {
  type ClientTransport,
  ClientTransportUnion,
} from "../mcp/client-transport.ts";
import { McpToolSpecSchema } from "../mcp/mcp-tool.ts";

// ── MCPToolBox ─────────────────────────────────────────────────────────

export const MCPToolBoxSchema = ComponentBaseSchema.extend({
  componentType: z.literal("MCPToolBox"),
  clientTransport: ClientTransportUnion,
  /** Optional allowlist. Entries can be:
   *   - a bare string (the tool's name on the server), or
   *   - an `McpToolSpec` (carries name + I/O Properties for callers that
   *     want to materialize the box's tools without a live connection).
   *  When omitted, every tool the server exposes is admitted. */
  toolFilter: z.array(z.union([McpToolSpecSchema, z.string()])).optional(),
  requiresConfirmation: z.boolean().default(false),
});

export type MCPToolBox = z.infer<typeof MCPToolBoxSchema>;

export function createMcpToolBox({
  name,
  clientTransport,
  description,
  id,
  metadata,
  toolFilter,
  requiresConfirmation,
}: {
  name: string;
  clientTransport: ClientTransport;
  description?: string;
  id?: string;
  metadata?: Record<string, unknown>;
  toolFilter?: Array<z.infer<typeof McpToolSpecSchema> | string>;
  requiresConfirmation?: boolean;
}): MCPToolBox {
  return Object.freeze(
    MCPToolBoxSchema.parse({
      componentType: "MCPToolBox" as const,
      name,
      clientTransport,
      description,
      id,
      metadata,
      toolFilter,
      requiresConfirmation,
    }),
  );
}

// ── Union ──────────────────────────────────────────────────────────────

export const ToolBoxUnion = z.discriminatedUnion("componentType", [
  MCPToolBoxSchema,
]);

export type ToolBox = z.infer<typeof ToolBoxUnion>;
