// Process-wide datastore for the per-node cache.
//
// Every AgentNode (including SandboxAgentNode) execution is keyed on
// (node fingerprint, resolved input) and looked up here before the LLM
// call. Successful node executions write (key, output) back; failures
// write nothing.
//
// Two dimensions of eviction:
//   - maxSize: LRU cap on entry count.
//   - maxLifetime: TTL in seconds.
//
// Scope: per-process. setDatastore({ adapter }) plugs a custom adapter
// (e.g. Redis-backed for multi-process), or setDatastore({ maxLifetime?,
// maxSize?, path? }) tunes the default sqliteDatastore.
//
// Two built-ins:
//   - sqliteDatastore({ path, maxLifetime?, maxSize? }) — the default.
//     One row per entry, WAL mode for atomic concurrent writes, one
//     indexed UPDATE per cache hit. Backed by node:sqlite, which Deno
//     (≥1.39), Node (≥22.5), and Bun (≥1.2) all ship.
//   - memoryDatastore() — per-process Map, useful for CI.

import * as fs from "node:fs";
import * as path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { AgentNode } from "../topology/nodes/agent-node.ts";
import { z } from "zod";
import {
  type AppError,
  defineError,
  ok,
  type Result,
  trySync,
} from "@tidy-ts/shims";
import { canonicalize, sha256Hex } from "../internal/canonical.ts";

// ── Public interface ────────────────────────────────────────────────────

export interface DatastoreEntry {
  value: unknown;
  /** ms since epoch when the entry was first written. */
  createdAt: number;
  /** ms since epoch when the entry was last read. Updated on cache hits. */
  lastUsedAt: number;
}

export interface DatastoreAdapter {
  get(key: string): Promise<DatastoreEntry | undefined>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface DatastoreConfig {
  /** Custom adapter. If provided, maxLifetime / maxSize / path are ignored —
   *  the adapter owns its own eviction policy and storage location. */
  adapter?: DatastoreAdapter;
  /** Built-in eviction: max lifetime in seconds. Default: 4 hours (matches OAS). */
  maxLifetime?: number;
  /** Built-in eviction: max entries. Default: 10_000 (matches OAS). */
  maxSize?: number;
  /** SQLite database path for the default adapter. Default: ".tidy-ai-cache.db". */
  path?: string;
}

const DEFAULT_MAX_LIFETIME_SECONDS = 4 * 60 * 60;
const DEFAULT_MAX_SIZE = 10_000;
const DEFAULT_SQLITE_PATH = ".tidy-ai-cache.db";
const DEFAULT_EVICTION_INTERVAL = 64;

// ── Built-in adapters ───────────────────────────────────────────────────

/** In-memory datastore with LRU + TTL. */
export function memoryDatastore({
  maxLifetime = DEFAULT_MAX_LIFETIME_SECONDS,
  maxSize = DEFAULT_MAX_SIZE,
}: {
  maxLifetime?: number;
  maxSize?: number;
} = {}): DatastoreAdapter {
  const store = new Map<string, DatastoreEntry>();
  const lifetimeMs = maxLifetime * 1000;

  return {
    // deno-lint-ignore require-await
    async get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (Date.now() - entry.createdAt > lifetimeMs) {
        store.delete(key);
        return undefined;
      }
      // LRU: re-insert to bump recency.
      store.delete(key);
      entry.lastUsedAt = Date.now();
      store.set(key, entry);
      return entry;
    },
    // deno-lint-ignore require-await
    async set(key, value) {
      const now = Date.now();
      store.delete(key);
      store.set(key, { value, createdAt: now, lastUsedAt: now });
      while (store.size > maxSize) {
        const oldest = store.keys().next().value;
        if (oldest === undefined) break;
        store.delete(oldest);
      }
    },
    // deno-lint-ignore require-await
    async delete(key) {
      store.delete(key);
    },
  };
}

/** SQLite-backed datastore. One row per cache entry; WAL mode so
 *  concurrent rows from `mutateAsync` can write safely. TTL is enforced
 *  on read (returns undefined and deletes the row); LRU eviction is a
 *  single DELETE after each write when the table exceeds maxSize.
 *
 *  Uses node:sqlite directly — works in Deno (≥1.39), Node (≥22.5), and
 *  Bun (≥1.2) without a runtime shim. */
export function sqliteDatastore({
  path: dbPath = DEFAULT_SQLITE_PATH,
  maxLifetime = DEFAULT_MAX_LIFETIME_SECONDS,
  maxSize = DEFAULT_MAX_SIZE,
  evictionInterval = DEFAULT_EVICTION_INTERVAL,
}: {
  path?: string;
  maxLifetime?: number;
  maxSize?: number;
  /** How many writes to absorb before running a count+evict pass.
   *  Larger values amortize the count cost but allow the table to
   *  briefly grow past `maxSize`. Default: 64. Tests that want strict
   *  eviction set this to 1. */
  evictionInterval?: number;
} = {}): DatastoreAdapter {
  // Ensure the parent directory exists when the user gives a nested path.
  const dir = path.dirname(dbPath);
  if (dir && dir !== "." && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(dbPath);
  // WAL: readers don't block writers, writers don't block readers.
  // synchronous=NORMAL: durable across crashes, fast across power-loss
  // scenarios that nobody runs an LLM cache through anyway.
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec(
    "CREATE TABLE IF NOT EXISTS entries (" +
      "k TEXT PRIMARY KEY, " +
      "v TEXT NOT NULL, " +
      "created_at INTEGER NOT NULL, " +
      "last_used_at INTEGER NOT NULL" +
      ")",
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS entries_last_used_at " +
      "ON entries (last_used_at)",
  );

  const lifetimeMs = maxLifetime * 1000;

  const selectStmt = db.prepare(
    "SELECT v, created_at, last_used_at FROM entries WHERE k = ?",
  );
  const touchStmt = db.prepare(
    "UPDATE entries SET last_used_at = ? WHERE k = ?",
  );
  const deleteStmt = db.prepare("DELETE FROM entries WHERE k = ?");
  const upsertStmt = db.prepare(
    "INSERT INTO entries (k, v, created_at, last_used_at) VALUES (?, ?, ?, ?) " +
      "ON CONFLICT(k) DO UPDATE SET " +
      "v = excluded.v, " +
      "created_at = excluded.created_at, " +
      "last_used_at = excluded.last_used_at",
  );
  const countStmt = db.prepare("SELECT COUNT(*) AS n FROM entries");
  const evictStmt = db.prepare(
    "DELETE FROM entries WHERE k IN (" +
      "SELECT k FROM entries ORDER BY last_used_at ASC LIMIT ?" +
      ")",
  );

  // Amortize the LRU bookkeeping: only count + evict once every N writes.
  // Small enough that the table never grows materially past maxSize, large
  // enough that hot writes don't all pay the count cost.
  let writesSinceEviction = 0;

  return {
    // deno-lint-ignore require-await
    async get(key) {
      const row = selectStmt.get(key) as
        | { v: string; created_at: number; last_used_at: number }
        | undefined;
      if (!row) return undefined;
      if (Date.now() - row.created_at > lifetimeMs) {
        deleteStmt.run(key);
        return undefined;
      }
      const now = Date.now();
      touchStmt.run(now, key);
      return {
        value: JSON.parse(row.v),
        createdAt: row.created_at,
        lastUsedAt: now,
      };
    },
    // deno-lint-ignore require-await
    async set(key, value) {
      const now = Date.now();
      upsertStmt.run(key, JSON.stringify(value), now, now);
      // Eviction is amortized: rather than COUNT + DELETE on every write,
      // we only check once every EVICTION_CHECK_INTERVAL writes. With the
      // default cap of 10_000 and the default interval of 64 the table
      // can briefly grow to 10_064 before eviction trims it back. That
      // overshoot is cheap (~6KB of JSON) compared to running a count +
      // index sort on every cache hit during a 10k-row eval.
      writesSinceEviction++;
      if (writesSinceEviction >= evictionInterval) {
        writesSinceEviction = 0;
        const row = countStmt.get() as { n: number };
        if (row.n > maxSize) {
          evictStmt.run(row.n - maxSize);
        }
      }
    },
    // deno-lint-ignore require-await
    async delete(key) {
      deleteStmt.run(key);
    },
  };
}

// ── Process-wide singleton ──────────────────────────────────────────────

let _adapter: DatastoreAdapter | null = null;

/** Install a datastore. Pass `{ adapter }` for a custom one, or
 *  `{ maxLifetime?, maxSize?, path? }` to tune the default sqliteDatastore. */
export function setDatastore(config: DatastoreConfig = {}): void {
  if (config.adapter) {
    _adapter = config.adapter;
    return;
  }
  _adapter = sqliteDatastore({
    path: config.path ?? DEFAULT_SQLITE_PATH,
    maxLifetime: config.maxLifetime ?? DEFAULT_MAX_LIFETIME_SECONDS,
    maxSize: config.maxSize ?? DEFAULT_MAX_SIZE,
  });
}

/** Tear down the installed datastore. Tests call this in afterEach.
 *  Note: this does not touch the MCP client pool — that's owned by
 *  `executors/_mcp-client.ts` and cleaned up via `clearMcpPool()`.
 *  `aiTest` wires both into its teardown. */
export function clearDatastore(): void {
  _adapter = null;
}

/** Snapshot the currently-installed adapter without installing the lazy
 *  default. Useful for save/restore patterns (the test isolation helper
 *  uses this to put the user's adapter back after a test). Returns
 *  `null` when nothing has been installed yet. */
export function currentDatastore(): DatastoreAdapter | null {
  return _adapter;
}

/** Internal: lazily install the default sqliteDatastore on first use. */
function getDatastore(): DatastoreAdapter {
  if (_adapter === null) {
    _adapter = sqliteDatastore({ path: DEFAULT_SQLITE_PATH });
  }
  return _adapter;
}

// ── Node fingerprints ───────────────────────────────────────────────────

// Resolved generation parameters used by the fingerprint: callers pass
// the *already-merged* params (node defaults + per-call overrides), so
// the fingerprint reflects what the call actually used. Same shape as
// GenerationOverride (see param-resolution.ts) — both alias the
// canonical GenerationParameters.
import type { GenerationParameters } from "./param-resolution.ts";
export type EffectiveGenerationParameters = GenerationParameters;

/** Resolved view of a node-or-agent's output schema.
 *
 *  `jsonSchema` is the lowered JSON-Schema view used by both the API
 *  request body and the cache fingerprint. `undefined` means "no schema
 *  declared — return free-text."
 *
 *  `validate` is the live-Zod re-parse used to reject stale cached
 *  outputs and to assert at runtime that the model produced what the
 *  schema promised. `undefined` means "no live Zod attached — trust the
 *  API's strict-mode JSON Schema validation." */
export interface ResolvedOutputSchema {
  jsonSchema: unknown | undefined;
  validate:
    | ((raw: unknown) => Record<string, unknown> | string)
    | undefined;
}

/** Raised when `z.toJSONSchema` can't lower a Zod schema (recursive
 *  schemas, custom transforms, etc.). Surfaces at the topology boundary
 *  so a misconfigured schema fails the run rather than silently
 *  fingerprinting as a generic-unrepresentable collision. */
export const SchemaLoweringError = defineError(
  "SchemaLoweringError",
  ({ message }: { message: string; cause?: unknown }) => message,
);
export type SchemaLoweringError = AppError<
  "SchemaLoweringError",
  { message: string; cause?: unknown }
>;

/** Single source of truth for lowering a Zod schema to JSON Schema.
 *  Returns `Result<lowered, SchemaLoweringError>` so the failure is
 *  visible at every call site and never silently collapses to a single
 *  collision marker (the old `__unrepresentable__: true` was wrong:
 *  every unrepresentable schema across a topology would share the same
 *  fingerprint and thus the same cache entry). */
export function zodToJsonSchema(
  zodSchema: z.ZodType,
): Result<unknown, SchemaLoweringError> {
  return trySync({
    fn: () => z.toJSONSchema(zodSchema),
    mapError: (cause) =>
      new SchemaLoweringError({
        message: cause instanceof Error
          ? `Zod schema could not be lowered to JSON Schema: ${cause.message}`
          : "Zod schema could not be lowered to JSON Schema.",
        cause,
      }),
  });
}

/** Single source of truth for the dual schema path (`outputSchema` Zod vs.
 *  deserialized `outputSchemaJson`). Every node executor and the
 *  fingerprint should call this — no other code should branch on which
 *  shape is present.
 *
 *  Accepts `unknown` because the typed-overlay vs schema-inferred mismatch
 *  on every node type (`outputSchema: z.ZodType<O>` in the TS type vs
 *  `z.unknown()` in the Zod schema) made every caller write the same
 *  cast. The runtime shape check here is the honest version: pull the
 *  two optional properties off and branch on what's present.
 *
 *  Returns `Err` only when a live Zod schema is attached but can't be
 *  lowered to JSON Schema. The runner propagates the error as an
 *  `InputValidationError` at execution time; the validator catches it
 *  at `createTopology` time. */
export function resolveOutputSchema(
  node: unknown,
): Result<ResolvedOutputSchema, SchemaLoweringError> {
  const n = (node ?? {}) as {
    outputSchema?: z.ZodType;
    outputSchemaJson?: unknown;
  };
  if (n.outputSchema) {
    const zodSchema = n.outputSchema;
    const lowered = zodToJsonSchema(zodSchema);
    if (!lowered.ok) return lowered;
    return ok({
      jsonSchema: lowered.value,
      validate: (raw) => zodSchema.parse(raw) as Record<string, unknown> | string,
    });
  }
  return ok({
    jsonSchema: n.outputSchemaJson,
    validate: undefined,
  });
}

/** Per-tool fingerprint. Discriminated by `kind` so caches don't
 *  collide across tool variants of the same name. Per-kind:
 *
 *    server  — name, description, paramsSchema (lowered to JSON Schema).
 *    client  — name, description, paramsSchema.
 *    remote  — name, description, url, httpMethod, queryParam KEYS,
 *              header KEYS, data shape. Header VALUES (especially
 *              sensitiveHeaders) are not included — they change per
 *              environment and aren't semantic to the call.
 *    builtin — name, description, toolType, configuration.
 *    mcp     — name, description, transport identity (componentType +
 *              command/args/url) but not header values.
 *
 *  Toolboxes are NOT fingerprinted by their expanded tool list (which
 *  would require a live server connection at fingerprint time); the
 *  box's transport identity + filter are captured instead. */
interface ToolFingerprint {
  kind: "server" | "client" | "remote" | "builtin" | "mcp" | "toolbox";
  name: string;
  description: string | null;
  detail: unknown;
}

// deno-lint-ignore no-explicit-any
type AnyTool = Record<string, any>;

/** Tool fingerprint. Propagates Zod lowering failure — callers (the
 *  agent fingerprint and the agent executor) decide how to surface it. */
function fingerprintTool(
  tool: AnyTool,
): Result<ToolFingerprint, SchemaLoweringError> {
  const name = tool.name as string;
  const description = (tool.description ?? null) as string | null;
  const componentType = tool.componentType as string;

  switch (componentType) {
    case "ServerTool":
    case "ClientTool": {
      if (!tool.paramsSchema) {
        return ok({
          kind: componentType === "ServerTool" ? "server" : "client",
          name,
          description,
          detail: { paramsSchemaJson: null },
        });
      }
      const lowered = zodToJsonSchema(tool.paramsSchema as z.ZodType);
      if (!lowered.ok) return lowered;
      return ok({
        kind: componentType === "ServerTool" ? "server" : "client",
        name,
        description,
        detail: { paramsSchemaJson: lowered.value },
      });
    }
    case "RemoteTool": {
      const headerKeys = Object.keys(tool.headers ?? {}).sort();
      const sensitiveHeaderKeys = Object.keys(tool.sensitiveHeaders ?? {}).sort();
      const queryKeys = Object.keys(tool.queryParams ?? {}).sort();
      return ok({
        kind: "remote",
        name,
        description,
        detail: {
          url: tool.url ?? null,
          httpMethod: tool.httpMethod ?? null,
          dataShape: tool.data ?? null,
          headerKeys,
          sensitiveHeaderKeys,
          queryKeys,
        },
      });
    }
    case "BuiltinTool": {
      return ok({
        kind: "builtin",
        name,
        description,
        detail: {
          toolType: tool.toolType,
          configuration: tool.configuration ?? null,
        },
      });
    }
    case "MCPTool": {
      const transport = tool.clientTransport as AnyTool | undefined;
      return ok({
        kind: "mcp",
        name,
        description,
        detail: {
          transportType: transport?.componentType ?? null,
          command: transport?.command ?? null,
          args: transport?.args ?? null,
          url: transport?.url ?? null,
        },
      });
    }
    default: {
      return ok({
        kind: "server",
        name,
        description,
        detail: { componentType, raw: null },
      });
    }
  }
}

/** Toolbox fingerprint. A box is a deferred list of tools — at
 *  authoring time we don't know which concrete tools it'll surface, so
 *  capture the box's identity (transport + filter) and the agent's
 *  runtime resolution will re-list at execution. */
function fingerprintToolbox(box: AnyTool): ToolFingerprint {
  const transport = box.clientTransport as AnyTool | undefined;
  // Normalize toolFilter entries so a bare-string entry and an
  // McpToolSpec entry naming the same tool produce identical keys.
  const filter = (box.toolFilter as Array<string | AnyTool> | undefined)?.map(
    (entry) => (typeof entry === "string" ? entry : (entry?.name as string)),
  );
  return {
    kind: "toolbox",
    name: box.name as string,
    description: (box.description ?? null) as string | null,
    detail: {
      componentType: box.componentType,
      transportType: transport?.componentType ?? null,
      command: transport?.command ?? null,
      args: transport?.args ?? null,
      url: transport?.url ?? null,
      toolFilter: filter ?? null,
    },
  };
}

/** Fingerprint of an AgentNode — the parts that affect what the call
 *  produces: model, prompt template, generation parameters, output
 *  schema, and the agent's tools + toolboxes. Toolbox-resolved tools
 *  (live MCP listTools output) are NOT in the fingerprint because
 *  they're discovered at runtime per agent invocation. The box's
 *  identity (transport + filter) IS in the key, so re-pointing the box
 *  at a different server produces a different cache key. */
export function agentNodeFingerprint(
  node: AgentNode,
  effectiveParameters: EffectiveGenerationParameters | null,
): Result<unknown, SchemaLoweringError> {
  const agent = node.agent;
  const resolved = resolveOutputSchema(agent);
  if (!resolved.ok) return resolved;
  const toolFingerprints: ToolFingerprint[] = [];
  for (const t of agent.tools ?? []) {
    const fp = fingerprintTool(t as AnyTool);
    if (!fp.ok) return fp;
    toolFingerprints.push(fp.value);
  }
  const toolboxFingerprints: ToolFingerprint[] = [];
  for (const box of agent.toolboxes ?? []) {
    toolboxFingerprints.push(fingerprintToolbox(box as AnyTool));
  }
  return ok({
    componentType: "AgentNode",
    modelId: agent.llmConfig.modelId,
    baseUrl: agent.llmConfig.baseUrl ?? null,
    systemPromptTemplate: agent.systemPromptTemplate,
    generationParameters: effectiveParameters,
    maxToolTurns: agent.maxToolTurns,
    outputSchemaJson: resolved.value.jsonSchema ?? null,
    tools: toolFingerprints,
    toolboxes: toolboxFingerprints,
  });
}

// ── Cache key + read/write surface for the runner ───────────────────────

/** Compute the cache key for a given node fingerprint + resolved input.
 *  Separator is `\x00` (NUL) — JSON string output can't contain a literal
 *  NUL byte (it's always escaped as ` `), so the boundary between
 *  fingerprint and input is unambiguous regardless of payload content. A
 *  literal `|` would be ambiguous when either side contained a `|`. */
const CACHE_KEY_SEPARATOR = "\x00";
export async function nodeCacheKey(
  fingerprint: unknown,
  resolvedInput: unknown,
): Promise<string> {
  const text = canonicalize(fingerprint) + CACHE_KEY_SEPARATOR +
    canonicalize(resolvedInput);
  return await sha256Hex(text);
}

/** Look up a cached output. Returns `undefined` on miss / TTL expiry. */
export async function readNodeCache(
  key: string,
): Promise<unknown | undefined> {
  const entry = await getDatastore().get(key);
  return entry?.value;
}

/** Persist a cached output. */
export async function writeNodeCache(
  key: string,
  value: unknown,
): Promise<void> {
  await getDatastore().set(key, value);
}
