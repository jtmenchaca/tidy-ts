// LLM configuration — provider-agnostic model binding for Agent.
//
// One flat shape: { modelId, baseUrl?, apiKey?, defaultGenerationParameters? }.
// The execution adapter (runtime/_sdk-bridge.ts) converts an LlmConfig into
// an Agents-SDK `ModelProvider` at run time — OpenAI when baseUrl is unset,
// a custom provider pointing at baseUrl when set. The split-by-provider
// variants (OpenAIConfig, OpenAICompatibleConfig, OllamaConfig, VllmConfig)
// were dropped in the @openai/agents adoption — see ADR-0003.

import { z } from "zod";
import { ComponentBaseSchema } from "./component.ts";

// ── Generation parameters ───────────────────────────────────────────────
//
// Plain config object (NOT a Component). Attached to a provider config as
// `defaultGenerationParameters`. `.passthrough()` lets provider-specific
// fields ride along without breaking the schema.

export const LlmGenerationConfigSchema = z
  .object({
    maxTokens: z.number().int().optional(),
    temperature: z.number().optional(),
    topP: z.number().optional(),
  })
  .passthrough();

export type LlmGenerationConfig = z.infer<typeof LlmGenerationConfigSchema>;

// ── Provider configuration ──────────────────────────────────────────────

export const LlmConfigSchema = ComponentBaseSchema.extend({
  componentType: z.literal("LlmConfig"),
  /** Model identifier the provider understands (e.g. `"gpt-5.4"`,
   *  `"llama3:8b"`). Threaded straight to the Agents SDK as the
   *  `model` field. */
  modelId: z.string(),
  /** Optional OpenAI-API-compatible base URL. When set, the adapter
   *  builds an OpenAI client pointing at this URL instead of
   *  `https://api.openai.com`. Use for Ollama (`http://localhost:11434/v1`),
   *  vLLM, LiteLLM proxies, etc. */
  baseUrl: z.string().optional(),
  /** Provider API key. When omitted, the adapter falls back to
   *  `OPENAI_API_KEY` for the default provider, or whatever auth the
   *  custom base URL expects. */
  apiKey: z.string().optional(),
  /** Default generation parameters (`temperature`, `maxTokens`, `topP`,
   *  plus passthrough provider-specific fields). Per-call overrides
   *  via `ai.evaluate({ overrides })` are merged on top of these. */
  defaultGenerationParameters: LlmGenerationConfigSchema.optional(),
});

export type LlmConfig = z.infer<typeof LlmConfigSchema>;

// ── Factory ─────────────────────────────────────────────────────────────

export function createLlmConfig({
  modelId,
  name,
  id,
  description,
  metadata,
  baseUrl,
  apiKey,
  defaultGenerationParameters,
}: {
  modelId: string;
  /** Defaults to modelId for ergonomics. */
  name?: string;
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  baseUrl?: string;
  apiKey?: string;
  defaultGenerationParameters?: LlmGenerationConfig;
}): LlmConfig {
  return Object.freeze(
    LlmConfigSchema.parse({
      componentType: "LlmConfig" as const,
      modelId,
      name: name ?? modelId,
      id,
      description,
      metadata,
      baseUrl,
      apiKey,
      defaultGenerationParameters,
    }),
  );
}
