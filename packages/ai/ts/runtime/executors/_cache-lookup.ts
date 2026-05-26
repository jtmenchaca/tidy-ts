// Per-node cache lookup shared by AgentNode and SandboxAgentNode executors.
// Computes the cache key, reads the datastore, and (when a live Zod
// validator is attached) re-validates the cached value before returning
// it — so a tightened schema since the entry was written surfaces as
// an `OutputParseError` rather than a stale pass.

import { trySync } from "@tidy-ts/shims";

import { nodeCacheKey, readNodeCache } from "../datastore.ts";
import { OutputParseError } from "../errors.ts";

/** Result of a per-node cache probe. `key` is always present so the
 *  caller can write back on miss; `value` is the cached payload on hit,
 *  or `undefined` on miss. */
export interface CacheSlot {
  key: string;
  value: Record<string, unknown> | string | undefined;
}

export async function lookupNodeCache(
  fingerprint: unknown,
  input: Record<string, unknown>,
  validate: ((raw: unknown) => Record<string, unknown> | string) | undefined,
  rescueMessage: string,
): Promise<CacheSlot> {
  const key = await nodeCacheKey(fingerprint, input);
  const cached = await readNodeCache(key);
  if (cached === undefined) return { key, value: undefined };
  if (validate && typeof cached !== "string") {
    const validated = trySync({
      fn: () => validate(cached),
      mapError: (zerr) =>
        new OutputParseError({ message: rescueMessage, issues: zerr }),
    });
    if (!validated.ok) throw validated.error;
    return { key, value: validated.value };
  }
  return { key, value: cached as Record<string, unknown> | string };
}
