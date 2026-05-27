// Per-node cache lookup shared by AgentNode and SandboxAgentNode executors.
// Computes the cache key, reads the datastore, validates the cached
// output, and surfaces the captured conversation alongside it so the
// caller can replay chat / tool spans on a hit.
//
// Stored shape: `{ output, conversation }` envelope. The envelope was
// introduced when tracing needed cache hits to produce the same span
// tree as fresh runs — see the conversation-capture comments in
// `tracing.ts`. Legacy bare-output entries are not supported.

import { trySync } from "@tidy-ts/shims";

import { nodeCacheKey, readNodeCache } from "../datastore.ts";
import { OutputParseError } from "../errors.ts";
import type { ConversationCapture } from "../tracing.ts";

/** What we persist per cache entry. Plain object — round-trips through
 *  JSON-style datastores (SQLite, Redis) without further encoding. */
export interface CacheEnvelope {
  output: Record<string, unknown> | string;
  conversation: ConversationCapture;
}

/** Result of a per-node cache probe. `key` is always present so the
 *  caller can write back on miss; on hit, `output` is the validated
 *  payload and `conversation` is the SDK-captured chat / tool trace
 *  from the original run. */
export interface CacheSlot {
  key: string;
  output: Record<string, unknown> | string | undefined;
  conversation: ConversationCapture | undefined;
}

export async function lookupNodeCache(
  fingerprint: unknown,
  input: Record<string, unknown>,
  validate: ((raw: unknown) => Record<string, unknown> | string) | undefined,
  rescueMessage: string,
): Promise<CacheSlot> {
  const key = await nodeCacheKey(fingerprint, input);
  const cached = await readNodeCache(key);
  if (cached === undefined) {
    return { key, output: undefined, conversation: undefined };
  }
  const envelope = cached as CacheEnvelope;
  const rawOutput = envelope.output;
  const conversation = envelope.conversation;
  if (validate && typeof rawOutput !== "string") {
    const validated = trySync({
      fn: () => validate(rawOutput),
      mapError: (zerr) =>
        new OutputParseError({ message: rescueMessage, issues: zerr }),
    });
    if (!validated.ok) throw validated.error;
    return { key, output: validated.value, conversation };
  }
  return { key, output: rawOutput, conversation };
}
