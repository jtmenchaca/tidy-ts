// MCP client transports — the connection configuration for an MCPTool or
// MCPToolBox to reach its server.
//
// OAS defines six discriminated variants. The MCP TypeScript SDK
// (`@modelcontextprotocol/sdk`) only ships three transport classes:
//
//   - StdioClientTransport          ← StdioTransport
//   - SSEClientTransport            ← SSETransport / SSEmTLSTransport
//   - StreamableHTTPClientTransport ← StreamableHTTPTransport /
//                                     StreamableHTTPmTLSTransport /
//                                     RemoteTransport
//
// The mTLS variants reuse the base SSE/StreamableHTTP transports and
// inject a custom `fetch` (or `eventSourceInit.fetch`) backed by an
// mTLS-aware HTTPS agent. RemoteTransport is OAS's generic "remote MCP
// server" — we map it to StreamableHTTP since that's the modern wire
// protocol; authors who need SSE fall back via the OAS SSETransport
// variant explicitly.
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/mcp/client-transport.ts

import { z } from "zod";
import { ComponentBaseSchema } from "../component.ts";

const SessionParametersSchema = z.object({
  /** Per-call timeout. The SDK defaults to 60s; we match OAS's default. */
  readTimeoutSeconds: z.number().default(60.0),
});

const ClientTransportBaseSchema = ComponentBaseSchema.extend({
  sessionParameters: SessionParametersSchema.default({ readTimeoutSeconds: 60.0 }),
});

// ── Stdio ──────────────────────────────────────────────────────────────

export const StdioTransportSchema = ClientTransportBaseSchema.extend({
  componentType: z.literal("StdioTransport"),
  command: z.string(),
  args: z.array(z.string()).default([]),
  env: z.record(z.string(), z.string()).optional(),
  cwd: z.string().optional(),
});
export type StdioTransport = z.infer<typeof StdioTransportSchema>;

// ── HTTP family — shared base ──────────────────────────────────────────

const RemoteTransportBaseSchema = ClientTransportBaseSchema.extend({
  url: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
  /** Same wire role as `headers`, but UIs and logs are expected to redact
   *  these. Merged at runtime before the request. */
  sensitiveHeaders: z.record(z.string(), z.string()).optional(),
});

// ── SSE ────────────────────────────────────────────────────────────────

export const SSETransportSchema = RemoteTransportBaseSchema.extend({
  componentType: z.literal("SSETransport"),
});
export type SSETransport = z.infer<typeof SSETransportSchema>;

export const SSEmTLSTransportSchema = RemoteTransportBaseSchema.extend({
  componentType: z.literal("SSEmTLSTransport"),
  keyFile: z.string(),
  certFile: z.string(),
  caFile: z.string(),
});
export type SSEmTLSTransport = z.infer<typeof SSEmTLSTransportSchema>;

// ── StreamableHTTP ─────────────────────────────────────────────────────

export const StreamableHTTPTransportSchema = RemoteTransportBaseSchema.extend({
  componentType: z.literal("StreamableHTTPTransport"),
});
export type StreamableHTTPTransport = z.infer<typeof StreamableHTTPTransportSchema>;

export const StreamableHTTPmTLSTransportSchema = RemoteTransportBaseSchema.extend({
  componentType: z.literal("StreamableHTTPmTLSTransport"),
  keyFile: z.string(),
  certFile: z.string(),
  caFile: z.string(),
});
export type StreamableHTTPmTLSTransport = z.infer<typeof StreamableHTTPmTLSTransportSchema>;

// ── Generic remote ─────────────────────────────────────────────────────

export const RemoteTransportSchema = RemoteTransportBaseSchema.extend({
  componentType: z.literal("RemoteTransport"),
});
export type RemoteTransport = z.infer<typeof RemoteTransportSchema>;

// ── Union ──────────────────────────────────────────────────────────────

export const ClientTransportUnion = z.discriminatedUnion("componentType", [
  StdioTransportSchema,
  SSETransportSchema,
  SSEmTLSTransportSchema,
  StreamableHTTPTransportSchema,
  StreamableHTTPmTLSTransportSchema,
  RemoteTransportSchema,
]);
export type ClientTransport = z.infer<typeof ClientTransportUnion>;

// ── Factories ──────────────────────────────────────────────────────────

export function createStdioTransport({
  name,
  command,
  args,
  env,
  cwd,
  id,
  description,
  metadata,
  sessionParameters,
}: {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  sessionParameters?: { readTimeoutSeconds?: number };
}): StdioTransport {
  return Object.freeze(
    StdioTransportSchema.parse({
      componentType: "StdioTransport" as const,
      name, command, args, env, cwd,
      id, description, metadata, sessionParameters,
    }),
  );
}

interface RemoteOpts {
  name: string;
  url: string;
  headers?: Record<string, string>;
  sensitiveHeaders?: Record<string, string>;
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  sessionParameters?: { readTimeoutSeconds?: number };
}

interface MTLSOpts extends RemoteOpts {
  keyFile: string;
  certFile: string;
  caFile: string;
}

export function createSSETransport(opts: RemoteOpts): SSETransport {
  return Object.freeze(
    SSETransportSchema.parse({ componentType: "SSETransport" as const, ...opts }),
  );
}

export function createSSEmTLSTransport(opts: MTLSOpts): SSEmTLSTransport {
  return Object.freeze(
    SSEmTLSTransportSchema.parse({ componentType: "SSEmTLSTransport" as const, ...opts }),
  );
}

export function createStreamableHTTPTransport(opts: RemoteOpts): StreamableHTTPTransport {
  return Object.freeze(
    StreamableHTTPTransportSchema.parse({
      componentType: "StreamableHTTPTransport" as const, ...opts,
    }),
  );
}

export function createStreamableHTTPmTLSTransport(opts: MTLSOpts): StreamableHTTPmTLSTransport {
  return Object.freeze(
    StreamableHTTPmTLSTransportSchema.parse({
      componentType: "StreamableHTTPmTLSTransport" as const, ...opts,
    }),
  );
}

export function createRemoteTransport(opts: RemoteOpts): RemoteTransport {
  return Object.freeze(
    RemoteTransportSchema.parse({
      componentType: "RemoteTransport" as const, ...opts,
    }),
  );
}
