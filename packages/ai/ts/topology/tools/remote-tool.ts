// RemoteTool — a tool the orchestrator executes by issuing an HTTP
// request, parameterized by the model's tool-call arguments.
//
// OAS models this as a fully-declared HTTP call with placeholder
// substitution: `url`, `httpMethod`, optional `data` (request body),
// `queryParams`, `headers`, and `sensitiveHeaders` (separated so a UI
// can redact them in display/logs). Any `{{ placeholder }}` in any of
// those fields is filled from the tool-call arguments at execution
// time. Inputs are auto-inferred from the placeholders the same way
// OAS's reference SDK does it.
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/tools/remote-tool.ts

import { z } from "zod";
import type { Property } from "../property.ts";
import { ToolBaseSchema } from "./tool-base.ts";

export const RemoteToolSchema = ToolBaseSchema.extend({
  componentType: z.literal("RemoteTool"),
  /** Full URL or URL template with `{{placeholder}}` substitutions. */
  url: z.string(),
  /** HTTP method as a string (GET, POST, PUT, DELETE, PATCH, …). Free-form
   *  per OAS — we don't enforce an enum so OAS round-trip stays loss-free. */
  httpMethod: z.string(),
  /** Optional OpenAPI / similar spec URI for the endpoint. Not used at
   *  runtime; preserved for OAS round-trip and downstream tooling. */
  apiSpecUri: z.string().optional(),
  /** Request body. Stringified to JSON if not already a string. Supports
   *  `{{placeholder}}` substitution recursively. */
  data: z.unknown().default({}),
  /** Query string parameters. */
  queryParams: z.record(z.string(), z.unknown()).default({}),
  /** Non-sensitive request headers. */
  headers: z.record(z.string(), z.unknown()).default({}),
  /** Sensitive request headers — same shape as `headers`, but UIs and logs
   *  are expected to redact these. Merged with `headers` before the fetch. */
  sensitiveHeaders: z.record(z.string(), z.unknown()).default({}),
});

export type RemoteTool = z.infer<typeof RemoteToolSchema>;

// ── Placeholder extraction (matches `template.ts` grammar) ─────────────

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z_$][\w$]*)\s*\}\}/g;

function extractPlaceholdersFromString(s: string): string[] {
  const out: string[] = [];
  for (const m of s.matchAll(PLACEHOLDER_RE)) out.push(m[1]);
  return out;
}

function extractPlaceholdersDeep(value: unknown): string[] {
  if (typeof value === "string") return extractPlaceholdersFromString(value);
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    const out = new Set<string>();
    for (const v of value) {
      for (const p of extractPlaceholdersDeep(v)) out.add(p);
    }
    return [...out];
  }
  if (typeof value === "object") {
    const out = new Set<string>();
    for (const [k, v] of Object.entries(value)) {
      for (const p of extractPlaceholdersDeep(k)) out.add(p);
      for (const p of extractPlaceholdersDeep(v)) out.add(p);
    }
    return [...out];
  }
  return [];
}

function inferRemoteToolInputs({
  url,
  httpMethod,
  apiSpecUri,
  data,
  queryParams,
  headers,
}: {
  url: string;
  httpMethod: string;
  apiSpecUri?: string;
  data?: unknown;
  queryParams?: Record<string, unknown>;
  headers?: Record<string, unknown>;
}): Property[] {
  const seen = new Set<string>();
  for (const candidate of [url, httpMethod, apiSpecUri ?? "", data ?? {}, queryParams ?? {}, headers ?? {}]) {
    for (const p of extractPlaceholdersDeep(candidate)) seen.add(p);
  }
  return [...seen].map((title) =>
    Object.freeze({
      jsonSchema: { title, type: "string" } as Record<string, unknown>,
      title,
      description: undefined,
      default: undefined,
      type: "string" as const,
    })
  );
}

export function createRemoteTool({
  name,
  url,
  httpMethod,
  description,
  id,
  metadata,
  apiSpecUri,
  data,
  queryParams,
  headers,
  sensitiveHeaders,
  inputs,
  outputs,
  requiresConfirmation,
}: {
  name: string;
  url: string;
  httpMethod: string;
  description?: string;
  id?: string;
  metadata?: Record<string, unknown>;
  apiSpecUri?: string;
  data?: unknown;
  queryParams?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  sensitiveHeaders?: Record<string, unknown>;
  inputs?: Property[];
  outputs?: Property[];
  requiresConfirmation?: boolean;
}): RemoteTool {
  const resolvedInputs = inputs ?? inferRemoteToolInputs({
    url, httpMethod, apiSpecUri, data, queryParams, headers,
  });
  return Object.freeze(
    RemoteToolSchema.parse({
      componentType: "RemoteTool" as const,
      name,
      url,
      httpMethod,
      description,
      id,
      metadata,
      apiSpecUri,
      data,
      queryParams,
      headers,
      sensitiveHeaders,
      inputs: resolvedInputs,
      outputs,
      requiresConfirmation,
    }),
  );
}

// ── Runtime helpers (used by the agent executor) ──────────────────────

/** Substitute `{{ name }}` in a string against an args map. Values that
 *  aren't strings are JSON-encoded. Missing keys are left as-is (the
 *  template literal stays in the output) so the failure mode is loud
 *  but doesn't blow up the request. */
function fillString(template: string, args: Record<string, unknown>): string {
  return template.replace(PLACEHOLDER_RE, (_, key) => {
    if (!(key in args)) return _;
    const v = args[key as keyof typeof args];
    return typeof v === "string" ? v : JSON.stringify(v);
  });
}

/** Apply `fillString` recursively to any JSON-shaped value. */
export function fillTemplate(
  value: unknown,
  args: Record<string, unknown>,
): unknown {
  if (typeof value === "string") return fillString(value, args);
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((v) => fillTemplate(v, args));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[fillString(k, args)] = fillTemplate(v, args);
    }
    return out;
  }
  return value;
}
