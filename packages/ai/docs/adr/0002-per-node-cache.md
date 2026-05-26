---
status: accepted
---

# Per-node cache, process-wide datastore, no opt-in

Caching moves from a topology-level `CacheAdapter` passed to `ai.evaluate` to a per-node cache that is intrinsic to `LlmNode` and `AgentNode` execution. Every LLM call goes through the cache — there is no `cache` field on nodes, no `cache` parameter on `evaluate`, no opt-out. The datastore is bound process-wide (mirroring the rate limiter) via `setDatastore({ adapter, maxLifetime, maxSize, path })`; the default is `sqliteDatastore({ path: ".tidy-ai-cache.db" })` — WAL-mode SQLite via `node:sqlite`, one row per cache entry, atomic concurrent writes.

The cache key per call is `SHA-256(canonical(node fingerprint), canonical(resolved node input))`. The fingerprint contains only what affects the call's output — model id, prompt/system templates, generation parameters, output JSON schema, and (for `AgentNode`) tool `{name, description, paramsSchemaJson}`. Tool `execute` is not fingerprinted because functions aren't content-addressable; an author who changes a tool implementation without changing its schema must clear the datastore.

## Why no opt-in flag

The package is pre-1.0 and greenfield. A research-grade row-wise verb that talks to a paid LLM API should not let users accidentally pay twice for the same call. Making caching a per-node `cache?: { ... }` field — even with a sensible default — invites two failure modes: authors who forget to set it, and authors who think they set it and didn't. Caching is intrinsic to the runtime, not an authoring decision.

## Why per-node, not topology-level

Topology-level caching only fires on end-to-end success. A 10-node DAG that fails at node 8 re-pays for nodes 1-7 on rerun. A `MapNode` that fails on item 73 of 100 re-pays for items 1-72. For research-grade work that iterates on prompts and runs over thousands of rows, this is the wrong grain. Per-node caching falls out of the DAG walker: each `executeLlmNode` / `executeAgentNode` call checks the datastore first.

## Why process-wide datastore, not per-topology

The datastore is a runtime binding (where do bytes live), not part of the topology's authored identity. Putting it on the topology would mean it has to round-trip through `toOAS`/`fromOAS`, and OAS has no top-level cache concept (it puts cache config on the one transform — `MessageSummarizationTransform` — where it's intrinsic to the work). Mirroring the rate limiter's `setRateLimit` shape keeps "runtime knobs" in one shape and "topology shapes" in another.

## Why cross-topology reuse (K1 keying)

The cache key uses only `(node fingerprint, resolved input)` — not the topology id, not the upstream path. Two different topologies that contain an `LlmNode` with the same prompt, model, and schema share cache entries. This is the Concept vocabulary paying off: a published `EXTRACT_SYMPTOM_SEVERITY` concept embedded in two different studies' topologies actually shares cached evaluations across both. Topology-keyed caching would silently re-run every embedded concept per study.

## What's retired

- `CacheAdapter` interface and the `memoryCache` / `fsCache` factories.
- `cacheKey`, `cachedUsageReport`, the `cache` field on every `EvaluateOptions*` variant.
- The "topology fingerprint" concept — replaced by per-node fingerprints.
- The cache lookup block in `evaluate` at the top of the run; that logic moves into `executeLlmNode` and `executeAgentNode`.

## What's added

- `DatastoreAdapter` interface, `sqliteDatastore({ path, maxLifetime?, maxSize? })` (the default, backed by `node:sqlite`), and `memoryDatastore()` (per-process Map, for CI).
- `setDatastore(...)` / `clearDatastore()` process-wide singleton, parallel to `setRateLimit` / `clearRateLimit`.
- Per-node fingerprints encoded in `topology/nodes/*` next to each node type.
- `Provenance.cachedNodes: string[]` (replacing the topology-level `cached: boolean`).
- `NodeUsage.cached: boolean` per entry; cached entries report zero tokens and zero latency.

## Considered alternatives

- **Keep the topology-level cache.** Rejected: it pays nothing back on partial failures or on prompt iteration, which is exactly when researchers run the verb most.
- **Opt-in per node-instance (`cache?: { ... }` field).** Rejected: introduces a second axis of authoring decisions that has no semantic content — every author wants their LLM calls cached. The flag is noise.
- **Per-node `cache` field with implicit default-on.** Rejected for the same reason as opt-in: the field would always be set, so it's not a field, it's runtime behavior.
- **K2 (recursive upstream-hash chaining).** Rejected: kills cross-topology reuse and means topology refactors that don't change LLM behavior bust every downstream cache.
- **In-memory default datastore (matching OAS).** Rejected: OAS's cache is for within-conversation message summarization (short-lived); ours is for research runs (long-lived). The defaults should match the use case, not the upstream literally.
- **`fsDatastore` (one JSON file per key).** Rejected: couldn't handle concurrent writes from `mutateAsync` cleanly (`enforceCap` raced with mid-flight writes), and every cache hit had to rewrite a JSON file just to bump `lastUsedAt`. `sqliteDatastore` is one WAL transaction per write and one indexed `UPDATE` per hit.
