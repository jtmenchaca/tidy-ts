// McpTool — a single tool exposed by an MCP server, declared by name.
// McpToolSpec — the lightweight name/IO descriptor used inside an
// `MCPToolBox.toolFilter` list to restrict which tools the box surfaces.
//
// At authoring time the McpTool is a declaration only. At run time the
// agent executor uses the attached `clientTransport` to connect, fetches
// the tool's JSON-Schema-shaped `inputSchema` from the server, and calls
// `client.callTool({ name, arguments })`. The result is serialized into
// the chat history as the tool message.
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/mcp/mcp-tool.ts

import { z } from "zod";
import { ComponentWithIOSchema } from "../component.ts";
import type { Property } from "../property.ts";
import { ToolBaseSchema } from "../tools/tool-base.ts";
import { type ClientTransport, ClientTransportUnion } from "./client-transport.ts";

// ── McpTool ────────────────────────────────────────────────────────────

export const McpToolSchema = ToolBaseSchema.extend({
  componentType: z.literal("MCPTool"),
  clientTransport: ClientTransportUnion,
});

export type McpTool = z.infer<typeof McpToolSchema>;

export function createMcpTool({
  name,
  clientTransport,
  description,
  id,
  metadata,
  inputs,
  outputs,
  requiresConfirmation,
}: {
  name: string;
  clientTransport: ClientTransport;
  description?: string;
  id?: string;
  metadata?: Record<string, unknown>;
  inputs?: Property[];
  outputs?: Property[];
  requiresConfirmation?: boolean;
}): McpTool {
  return Object.freeze(
    McpToolSchema.parse({
      componentType: "MCPTool" as const,
      name,
      clientTransport,
      description,
      id,
      metadata,
      inputs,
      outputs,
      requiresConfirmation,
    }),
  );
}

// ── McpToolSpec (filter entry inside an MCPToolBox) ───────────────────

export const McpToolSpecSchema = ComponentWithIOSchema.extend({
  componentType: z.literal("MCPToolSpec"),
  requiresConfirmation: z.boolean().default(false),
});

export type McpToolSpec = z.infer<typeof McpToolSpecSchema>;

export function createMcpToolSpec({
  name,
  description,
  id,
  metadata,
  inputs,
  outputs,
  requiresConfirmation,
}: {
  name: string;
  description?: string;
  id?: string;
  metadata?: Record<string, unknown>;
  inputs?: Property[];
  outputs?: Property[];
  requiresConfirmation?: boolean;
}): McpToolSpec {
  return Object.freeze(
    McpToolSpecSchema.parse({
      componentType: "MCPToolSpec" as const,
      name,
      description,
      id,
      metadata,
      inputs,
      outputs,
      requiresConfirmation,
    }),
  );
}
