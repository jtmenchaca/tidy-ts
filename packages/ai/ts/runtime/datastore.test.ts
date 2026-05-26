import { ai, build } from "../../mod.ts";
import { expect } from "@std/expect";
// node:fs / node:path / node:os are used by the ai.datastore.sqlite tests to
// allocate a fresh tempdir per test and rm -rf it on completion. They are
// NOT remnants of the deleted fsDatastore — leave them in place.
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { z } from "zod";

import { agentNodeFingerprint, nodeCacheKey } from "./datastore.ts";
import { aiTest } from "./testing.ts";
import type { Result } from "@tidy-ts/shims";

// Tests in this file build topologies with representable Zod schemas, so
// `agentNodeFingerprint` always succeeds. Unwrap inline so the test stays
// readable; on the off chance a future test introduces an unrepresentable
// schema, this assertion fires loud rather than silently testing nothing.
function ok<T>(r: Result<T, unknown>): T {
  if (!r.ok) throw new Error(`unexpected Err: ${JSON.stringify(r.error)}`);
  return r.value;
}

const MODEL = "gpt-5.4-nano";
const openai = build.llmConfig({ modelId: MODEL });

const InSchema = z.object({ note: z.string() });
const OutSchema = z.object({
  severity: z.enum(["mild", "moderate", "severe"]),
  confidence: z.number().min(0).max(1),
});

function buildTopology(promptTemplate = "{{note}}") {
  const start = build.start({ name: "start", inputSchema: InSchema });
  const llm = build.agentNode({
    name: "extract",
    agent: build.agent({
      name: "extract",
      llmConfig: openai,
      systemPromptTemplate: promptTemplate,
      inputSchema: InSchema,
      outputSchema: OutSchema,
    }),
  });
  const end = build.end({ name: "end", outputSchema: OutSchema });
  const topology = build.create({
    id: "EXTRACT_SEVERITY",
    name: "EXTRACT_SEVERITY",
    version: "1.0.0",
    startNode: start,
    endNode: end,
    nodes: [start, llm, end],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->l", fromNode: start, toNode: llm }),
      build.controlFlowEdge({ name: "l->e", fromNode: llm, toNode: end }),
    ],
  });
  return { topology, llm };
}

// ─────────────────────────────────────────────────────────────────────────
// ai.datastore.memory: round-trip + LRU eviction + TTL.
// ─────────────────────────────────────────────────────────────────────────
Deno.test("ai.datastore.memory — set then get returns the value with timestamps", async () => {
  const ds = ai.datastore.memory();
  expect(await ds.get("k")).toBeUndefined();
  await ds.set("k", { x: 1 });
  const entry = await ds.get("k");
  expect(entry?.value).toEqual({ x: 1 });
  expect(typeof entry?.createdAt).toBe("number");
  expect(typeof entry?.lastUsedAt).toBe("number");
});

Deno.test("ai.datastore.memory — LRU evicts the oldest when size exceeds maxSize", async () => {
  const ds = ai.datastore.memory({ maxSize: 2 });
  await ds.set("a", "A");
  await ds.set("b", "B");
  await ds.set("c", "C"); // evicts "a"
  expect(await ds.get("a")).toBeUndefined();
  expect((await ds.get("b"))?.value).toBe("B");
  expect((await ds.get("c"))?.value).toBe("C");
});

Deno.test("ai.datastore.memory — get bumps recency so the touched entry survives eviction", async () => {
  const ds = ai.datastore.memory({ maxSize: 2 });
  await ds.set("a", "A");
  await ds.set("b", "B");
  // Touch "a" — now "b" is the LRU candidate.
  expect((await ds.get("a"))?.value).toBe("A");
  await ds.set("c", "C"); // evicts "b"
  expect((await ds.get("b"))).toBeUndefined();
  expect((await ds.get("a"))?.value).toBe("A");
  expect((await ds.get("c"))?.value).toBe("C");
});

Deno.test("ai.datastore.memory — TTL expiry on read drops the entry", async () => {
  // maxLifetime is in seconds; 0 means anything older than 0ms is expired.
  const ds = ai.datastore.memory({ maxLifetime: 0 });
  await ds.set("k", "v");
  // Spin one event-loop tick so Date.now() advances at least 1ms.
  await new Promise((r) => setTimeout(r, 5));
  expect(await ds.get("k")).toBeUndefined();
});

Deno.test("ai.datastore.memory — delete removes the entry", async () => {
  const ds = ai.datastore.memory();
  await ds.set("k", "v");
  await ds.delete("k");
  expect(await ds.get("k")).toBeUndefined();
});

// ─────────────────────────────────────────────────────────────────────────
// ai.datastore.sqlite: round-trip across instances, TTL, LRU, concurrent writes.
// ─────────────────────────────────────────────────────────────────────────
Deno.test("ai.datastore.sqlite — set + get round-trips through the database file", async () => {
  const dbPath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "ai-ds-")),
    "cache.db",
  );
  try {
    const a = ai.datastore.sqlite({ path: dbPath });
    await a.set("k", { x: 1, y: [2, 3] });

    // A fresh adapter opening the same DB file sees the entry — proves it
    // hit disk and isn't an in-process cache.
    const b = ai.datastore.sqlite({ path: dbPath });
    const entry = await b.get("k");
    expect(entry?.value).toEqual({ x: 1, y: [2, 3] });
    expect(typeof entry?.createdAt).toBe("number");
    expect(typeof entry?.lastUsedAt).toBe("number");
  } finally {
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  }
});

Deno.test("ai.datastore.sqlite — TTL expiry deletes the row", async () => {
  const dbPath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "ai-ds-")),
    "cache.db",
  );
  try {
    const a = ai.datastore.sqlite({ path: dbPath, maxLifetime: 0 });
    await a.set("k", "v");
    await new Promise((r) => setTimeout(r, 5));
    expect(await a.get("k")).toBeUndefined();
    // A second get also returns undefined (row was actually deleted, not
    // just hidden by the TTL check).
    expect(await a.get("k")).toBeUndefined();
  } finally {
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  }
});

Deno.test("ai.datastore.sqlite — LRU evicts the oldest entries when row count exceeds maxSize", async () => {
  const dbPath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "ai-ds-")),
    "cache.db",
  );
  try {
    // evictionInterval: 1 so each write triggers an eviction pass — the
    // production default amortizes over 64 writes, so a 3-write test
    // would otherwise never evict.
    const a = ai.datastore.sqlite({ path: dbPath, maxSize: 2, evictionInterval: 1 });
    await a.set("a", "A");
    // Tiny pause so last_used_at differs between writes.
    await new Promise((r) => setTimeout(r, 2));
    await a.set("b", "B");
    await new Promise((r) => setTimeout(r, 2));
    await a.set("c", "C"); // evicts "a"
    expect(await a.get("a")).toBeUndefined();
    expect((await a.get("b"))?.value).toBe("B");
    expect((await a.get("c"))?.value).toBe("C");
  } finally {
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  }
});

Deno.test("ai.datastore.sqlite — get bumps recency so the touched entry survives eviction", async () => {
  const dbPath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "ai-ds-")),
    "cache.db",
  );
  try {
    const a = ai.datastore.sqlite({ path: dbPath, maxSize: 2, evictionInterval: 1 });
    await a.set("a", "A");
    await new Promise((r) => setTimeout(r, 2));
    await a.set("b", "B");
    await new Promise((r) => setTimeout(r, 2));
    // Touch "a" — now "b" is the LRU candidate.
    expect((await a.get("a"))?.value).toBe("A");
    await new Promise((r) => setTimeout(r, 2));
    await a.set("c", "C"); // evicts "b"
    expect(await a.get("b")).toBeUndefined();
    expect((await a.get("a"))?.value).toBe("A");
    expect((await a.get("c"))?.value).toBe("C");
  } finally {
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  }
});

Deno.test("ai.datastore.sqlite — concurrent writes from the same adapter all land safely", async () => {
  // WAL mode + atomic INSERT…ON CONFLICT serializes parallel writes from
  // mutateAsync rows inside SQLite, so all 50 entries land.
  const dbPath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "ai-ds-")),
    "cache.db",
  );
  try {
    const a = ai.datastore.sqlite({ path: dbPath });
    const writes = Array.from({ length: 50 }, (_, i) =>
      a.set(`k${i}`, { i }));
    await Promise.all(writes);
    for (let i = 0; i < 50; i++) {
      expect((await a.get(`k${i}`))?.value).toEqual({ i });
    }
  } finally {
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Per-node cache integration: pre-seeded entries skip the LLM.
// ─────────────────────────────────────────────────────────────────────────
aiTest({
  name: "per-node cache — pre-seeded entry skips the LLM call",
  async fn(t) {
    const { topology, llm } = buildTopology();
    const input = { note: "test" };
    const key = await nodeCacheKey(ok(agentNodeFingerprint(llm, null)), input);
    const fake = { severity: "moderate" as const, confidence: 0.7 };
    await t.datastore.set(key, fake);

    const out = await ai.evaluate({ topology, input });
    expect(out.result).toEqual(fake);
    // The cached node reports zero latency and zero tokens.
    expect(out.usage.totalLatencyMs).toBe(0);
    expect(out.usage.totalTokens).toBe(0);
    expect(out.provenance.cachedNodes).toEqual(["extract"]);
    expect(out.provenance.models).toEqual([]);
    expect(out.usage.perNode[0].cached).toBe(true);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Cross-topology reuse: two topologies that share an LlmNode config + the
// same input share a cache entry. This is the K1-keying decision (ADR 0002).
// ─────────────────────────────────────────────────────────────────────────
aiTest({
  name: "per-node cache — identical node config + input share a key across topologies",
  async fn(t) {
    const { topology: tA, llm: llmA } = buildTopology();
    // Same prompt + model + schema → same fingerprint.
    const { topology: tB, llm: llmB } = buildTopology();
    const input = { note: "shared" };

    expect(JSON.stringify(ok(agentNodeFingerprint(llmA, null))))
      .toBe(JSON.stringify(ok(agentNodeFingerprint(llmB, null))));

    const key = await nodeCacheKey(ok(agentNodeFingerprint(llmA, null)), input);
    const fake = { severity: "mild" as const, confidence: 0.1 };
    await t.datastore.set(key, fake);

    const outA = await ai.evaluate({ topology: tA, input });
    const outB = await ai.evaluate({ topology: tB, input });
    expect(outA.result).toEqual(fake);
    expect(outB.result).toEqual(fake);
    expect(outA.provenance.cachedNodes).toEqual(["extract"]);
    expect(outB.provenance.cachedNodes).toEqual(["extract"]);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Fingerprint sensitivity: changing the prompt produces a different key.
// ─────────────────────────────────────────────────────────────────────────
Deno.test("per-node cache — different prompts produce different keys", async () => {
  const { llm: a } = buildTopology("Original prompt: {{note}}");
  const { llm: b } = buildTopology("Updated prompt: {{note}}");
  const input = { note: "x" };
  const ka = await nodeCacheKey(ok(agentNodeFingerprint(a, null)), input);
  const kb = await nodeCacheKey(ok(agentNodeFingerprint(b, null)), input);
  expect(ka).not.toBe(kb);
});

Deno.test("per-node cache — same input in different key orders produces the same key", async () => {
  const { llm } = buildTopology();
  const k1 = await nodeCacheKey(
    ok(agentNodeFingerprint(llm, null)),
    { note: "n", extra: "x" } as Record<string, unknown>,
  );
  const k2 = await nodeCacheKey(
    ok(agentNodeFingerprint(llm, null)),
    { extra: "x", note: "n" } as Record<string, unknown>,
  );
  expect(k1).toBe(k2);
});

// ─────────────────────────────────────────────────────────────────────────
// Generation overrides: changing temperature/topP/maxTokens at the call
// site produces a different cache key, so A/B tests don't collide.
// ─────────────────────────────────────────────────────────────────────────
Deno.test("per-node cache — generation overrides change the cache key", async () => {
  const { llm } = buildTopology();
  const input = { note: "x" };
  const baseline = await nodeCacheKey(ok(agentNodeFingerprint(llm, null)), input);
  const withTemp = await nodeCacheKey(
    ok(agentNodeFingerprint(llm, { temperature: 0.7 })),
    input,
  );
  const withTempAndTopP = await nodeCacheKey(
    ok(agentNodeFingerprint(llm, { temperature: 0.7, topP: 0.9 })),
    input,
  );
  expect(baseline).not.toBe(withTemp);
  expect(withTemp).not.toBe(withTempAndTopP);
  expect(baseline).not.toBe(withTempAndTopP);
});

aiTest({
  name: "evaluateColumn — runs many inputs in order, surfaces per-row Result",
  async fn(t) {
    // Use an llmConfig pointing at a closed local port. Rows 0 and 1
    // hit the pre-seeded cache and never touch the network; row 2 has
    // no cache entry, fires a real request, and gets ECONNREFUSED —
    // surfaced as one row's Result.error while rows 0/1 still resolve
    // ok. Runs identically with or without OPENAI_API_KEY because
    // nothing reaches OpenAI.
    const offlineConfig = build.llmConfig({
      modelId: "offline-mock",
      baseUrl: "http://127.0.0.1:1/v1",
      apiKey: "ignored",
    });
    const start = build.start({ name: "start", inputSchema: InSchema });
    const llm = build.agentNode({
      name: "extract",
      agent: build.agent({
        name: "extract",
        llmConfig: offlineConfig,
        systemPromptTemplate: "{{note}}",
        inputSchema: InSchema,
        outputSchema: OutSchema,
      }),
    });
    const end = build.end({ name: "end", outputSchema: OutSchema });
    const topology = build.create({
      id: "EXTRACT_SEVERITY_OFFLINE",
      name: "EXTRACT_SEVERITY_OFFLINE",
      startNode: start,
      endNode: end,
      nodes: [start, llm, end],
      controlFlowConnections: [
        build.controlFlowEdge({ name: "s->l", fromNode: start, toNode: llm }),
        build.controlFlowEdge({ name: "l->e", fromNode: llm, toNode: end }),
      ],
    });

    const inputs = [
      { note: "a" },
      { note: "b" },
      { note: "c" },
    ];

    // Pre-seed rows 0 and 1 — they short-circuit on the cache and
    // never hit the network. Row 2 has no entry; it must fail.
    for (const input of inputs.slice(0, 2)) {
      const key = await nodeCacheKey(ok(agentNodeFingerprint(llm, null)), input);
      await t.datastore.set(key, {
        severity: "mild" as const,
        confidence: input.note === "a" ? 0.1 : 0.2,
      });
    }

    const results = await ai.evaluateColumn({
      topology,
      inputs,
      // Constrain retries: default retry would otherwise keep banging
      // on the closed port. One attempt is enough to prove the surface.
      retry: { backoff: "linear", maxRetries: 0 },
    });

    // Three results, in order.
    expect(results.length).toBe(3);
    // Rows 0 and 1 succeed from cache.
    expect(results[0].ok).toBe(true);
    expect(results[1].ok).toBe(true);
    if (results[0].ok) {
      expect((results[0].value as { result: { confidence: number } }).result.confidence).toBe(0.1);
    }
    if (results[1].ok) {
      expect((results[1].value as { result: { confidence: number } }).result.confidence).toBe(0.2);
    }
    // Row 2 fires a real request against the closed port; it must
    // resolve to an error result, leaving rows 0 and 1 unaffected.
    expect(results[2].ok).toBe(false);
    if (!results[2].ok) {
      expect(results[2].error.name).toBeDefined();
    }
  },
});

aiTest({
  name: "per-node cache — override-keyed pre-seed only hits when the override matches",
  async fn(t) {
    const { topology, llm } = buildTopology();
    const input = { note: "hello" };
    const override = { temperature: 0.7 };

    // Seed an entry under the override-bearing key.
    const key = await nodeCacheKey(ok(agentNodeFingerprint(llm, override)), input);
    const fake = { severity: "moderate" as const, confidence: 0.8 };
    await t.datastore.set(key, fake);

    // Call WITH the override → cache hit, no API call.
    const withOverride = await ai.evaluate({
      topology,
      input,
      overrides: { extract: override },
    });
    expect(withOverride.result).toEqual(fake);
    expect(withOverride.provenance.cachedNodes).toEqual(["extract"]);

    // Same override but a different value → different key → not in the cache.
    const otherOverrideKey = await nodeCacheKey(
      ok(agentNodeFingerprint(llm, { temperature: 0.2 })),
      input,
    );
    expect(otherOverrideKey).not.toBe(key);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// Real-API: populate the cache, second call short-circuits with cachedNodes.
// ─────────────────────────────────────────────────────────────────────────
aiTest({
  name: "per-node cache — real call populates the datastore; second call hits without tokens",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const { topology } = buildTopology();
    const input = { note: "Patient reports mild headache." };

    const first = await ai.evaluate({ topology, input });
    expect(first.usage.totalTokens).toBeGreaterThan(0);
    expect(first.provenance.cachedNodes).toEqual([]);

    const second = await ai.evaluate({ topology, input });
    expect(second.result).toEqual(first.result);
    expect(second.usage.totalTokens).toBe(0);
    expect(second.usage.totalLatencyMs).toBe(0);
    expect(second.provenance.cachedNodes).toEqual(["extract"]);
  },
});

// ─────────────────────────────────────────────────────────────────────────
// cache: false — pre-seeded entry is ignored AND no entry is written back.
// Real-API gated because the only way to prove "lookup skipped" is to see
// the LLM actually run (i.e., the result is NOT the pre-seeded fake) and
// the only way to prove "write skipped" is to see the datastore empty
// where a normal run would have written.
// ─────────────────────────────────────────────────────────────────────────
aiTest({
  name: "ai.evaluate cache: false — ignores pre-seeded entry and writes nothing",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn(t) {
    const { topology, llm } = buildTopology();
    const input = { note: "Patient reports moderate fatigue." };
    const key = await nodeCacheKey(ok(agentNodeFingerprint(llm, null)), input);

    // Seed with a deliberately implausible answer so we can tell whether
    // the runner read it. A real classifier would never produce
    // confidence=0.001 against this note.
    const sentinel = { severity: "severe" as const, confidence: 0.001 };
    await t.datastore.set(key, sentinel);

    const out = await ai.evaluate({ topology, input, cache: false });

    // Lookup was skipped: the run hit the real API, not the sentinel.
    expect(out.result).not.toEqual(sentinel);
    expect(out.provenance.cachedNodes).toEqual([]);
    expect(out.usage.totalTokens).toBeGreaterThan(0);

    // Write was skipped: the datastore still holds the sentinel, not the
    // fresh response.
    const stillSeeded = await t.datastore.get(key);
    expect(stillSeeded?.value).toEqual(sentinel);
  },
});

// Same shape, expressed as a structural assertion against the public
// option: cache: true (the default) and cache: false produce two
// independent runtime behaviors. This one does NOT need the real API
// because we verify the call-shape, not the LLM output.
aiTest({
  name: "ai.evaluate cache: false — usage.cached is never true under this flag",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn(t) {
    const { topology, llm } = buildTopology();
    const input = { note: "x" };
    const key = await nodeCacheKey(ok(agentNodeFingerprint(llm, null)), input);
    const fake = { severity: "mild" as const, confidence: 0.2 };
    await t.datastore.set(key, fake);

    // Sanity: with the default cache (read enabled), the seeded entry IS used.
    const cached = await ai.evaluate({ topology, input });
    expect(cached.result).toEqual(fake);
    expect(cached.usage.perNode[0].cached).toBe(true);

    // With cache: false, the same call against the same seeded entry
    // bypasses it and runs fresh.
    const fresh = await ai.evaluate({ topology, input, cache: false });
    expect(fresh.usage.perNode[0].cached).toBe(false);
    expect(fresh.usage.perNode[0].latencyMs).toBeGreaterThan(0);
  },
});
