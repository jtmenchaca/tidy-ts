// Resolution helpers for per-call parameters that get computed from
// (node config × overrides × ambient runtime state). Consumed by the
// executor + cache fingerprint layers; not part of the run-context
// state itself.

import type { LlmConfig } from "../topology/llm-config.ts";
import { getRateLimit } from "./rate-limit.ts";

/** Canonical per-call generation-parameter shape. Used everywhere — the
 *  author-supplied `GenerationOverride` and the runtime-resolved
 *  `EffectiveGenerationParameters` both alias this. One set of fields,
 *  one name, no drift. */
export interface GenerationParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/** Per-node generation parameter override passed to
 *  `ai.evaluate({ overrides })`. Same shape as `GenerationParameters`;
 *  the alias documents the intent (author input, can be partial). */
export type GenerationOverride = GenerationParameters;

/** Merge a node's `defaultGenerationParameters` with a per-call override,
 *  field-by-field. Override values win; `undefined` falls through. Result
 *  is the canonical camelCase shape — the API boundary handles the
 *  snake_case lowering inline, and the fingerprint hashes this exact
 *  object so a temperature change always produces a new cache key.
 *
 *  Returns `null` when no parameter is set at either layer, so the
 *  fingerprint doesn't carry an empty object that would still hash
 *  differently from absence. */
export function effectiveGenerationParameters(
  cfg: LlmConfig,
  override: GenerationParameters | undefined,
): GenerationParameters | null {
  const g = cfg.defaultGenerationParameters;
  const temperature = override?.temperature ?? g?.temperature;
  const maxTokens = override?.maxTokens ?? g?.maxTokens;
  const topP = override?.topP ?? g?.topP;
  if (temperature === undefined && maxTokens === undefined && topP === undefined) {
    return null;
  }
  const out: GenerationParameters = {};
  if (temperature !== undefined) out.temperature = temperature;
  if (maxTokens !== undefined) out.maxTokens = maxTokens;
  if (topP !== undefined) out.topP = topP;
  return out;
}

/** Clamp a topology-author's inner concurrency cap (ParallelMapNode /
 *  ParallelFlowNode / `evaluateColumn`) to the smaller of (cap, the rate
 *  limiter's `maxConcurrent`). Without this, an outer `mutateAsync`
 *  budget of N combined with an inner cap of M can spawn N×M in-flight
 *  tasks that all immediately block on the rate limiter — wasting memory
 *  and inverting the rate limit's intent. If no rate limiter is installed
 *  or no `maxConcurrent` is set, returns the cap unchanged. */
export function effectiveInnerConcurrency(authorCap: number): number {
  const rl = getRateLimit();
  const ceiling = rl?.maxConcurrent;
  if (!ceiling || ceiling <= 0) return authorCap;
  return Math.min(authorCap, ceiling);
}
