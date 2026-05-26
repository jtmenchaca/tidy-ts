// AgentNode executor.
//
// Pipeline:
//   1. Lookup `(agentNodeFingerprint, resolvedInput)` in the per-node
//      cache. On hit, record cached usage and return immediately —
//      we never enter the Agents SDK on a hit.
//   2. Render the agent's system prompt template against the input
//      row.
//   3. Compile the OAS agent into an SDK Agent via `buildSdkAgent`
//      (this attaches tools, hosted-tool entries, and live MCP
//      servers; capabilities flow through for SandboxAgent).
//   4. Run via `runSdkAgent` (rate-limited + retry-wrapped at the
//      invocation boundary).
//   5. Validate the SDK's final output against the agent's
//      `outputSchema` if one is set, then write to cache.

import {
  agentNodeFingerprint,
  resolveOutputSchema,
  writeNodeCache,
} from "../datastore.ts";
import { InputValidationError, OutputParseError } from "../errors.ts";
import { effectiveGenerationParameters } from "../param-resolution.ts";
import {
  qualifiedNodeName,
  type RunContext,
} from "../run-context.ts";
import { recordNodeUsage } from "../usage.ts";
import type { AgentNode } from "../../topology/nodes/agent-node.ts";
import { trySync } from "@tidy-ts/shims";

import { lookupNodeCache } from "./_cache-lookup.ts";
import { renderTemplate } from "./_prompt-render.ts";
import { withDefaultRetry } from "./_retry-policy.ts";
import {
  assertAgentRunnable,
  buildSdkAgent,
  runSdkAgent,
} from "./_sdk-bridge.ts";
import { ATTR as TRACE_ATTR } from "../tracing.ts";
import { context as otelContext, SpanStatusCode, trace as otelTrace } from "@opentelemetry/api";

export async function executeAgentNode(
  node: AgentNode,
  input: Record<string, unknown>,
  ctx: RunContext,
): Promise<Record<string, unknown> | string> {
  const agent = node.agent;
  assertAgentRunnable(agent);

  const override = ctx.overrides?.[node.name];
  const effectiveParams = effectiveGenerationParameters(agent.llmConfig, override);

  const resolved = resolveOutputSchema(agent);
  if (!resolved.ok) {
    throw new InputValidationError({
      message:
        `AgentNode '${node.name}' agent.outputSchema could not be lowered to JSON Schema: ${resolved.error.message}`,
      issues: resolved.error.cause,
    });
  }
  const { validate: validateAgentOutput } = resolved.value;

  const fingerprint = agentNodeFingerprint(node, effectiveParams);
  if (!fingerprint.ok) {
    throw new InputValidationError({
      message:
        `AgentNode '${node.name}' fingerprint could not be computed: ${fingerprint.error.message}`,
      issues: fingerprint.error.cause,
    });
  }

  // Cache lookup before the SDK is touched.
  let cacheKey: string | undefined;
  if (ctx.cache) {
    const cacheSlot = await lookupNodeCache(
      fingerprint.value,
      input,
      validateAgentOutput,
      "Cached agent output did not match agent.outputSchema.",
    );
    if (cacheSlot.value !== undefined) {
      recordNodeUsage(ctx.usageSink, {
        nodeName: qualifiedNodeName(ctx, node.name),
        componentType: "AgentNode",
        model: agent.llmConfig.modelId,
        latencyMs: 0,
        cached: true,
      });
      return cacheSlot.value;
    }
    cacheKey = cacheSlot.key;
  }

  const effectiveSystemPrompt = renderTemplate(agent.systemPromptTemplate, input);
  const built = await buildSdkAgent({ agent, ctx, effectiveSystemPrompt });

  // Wrap the SDK call in an OTel `invoke_agent` span. The SDK's own
  // `AgentSpan` (translated by the bridge) sits inside this — the
  // bridge sees `context.active()` is this wrapper and parents the
  // SDK spans accordingly.
  const wrapperSpan = ctx.trace.tracer.startSpan(
    `invoke_agent ${agent.name}`,
    {
      attributes: {
        [TRACE_ATTR.OPERATION_NAME]: "invoke_agent",
        [TRACE_ATTR.AGENT_NAME]: agent.name,
      },
    },
    ctx.trace.activeContext,
  );
  const wrapperContext = otelTrace.setSpan(ctx.trace.activeContext, wrapperSpan);

  const start = performance.now();
  try {
    const outcome = await otelContext.with(wrapperContext, () =>
      withDefaultRetry(
        () =>
          runSdkAgent({
            sdkAgent: built.sdkAgent,
            input,
            maxTurns: agent.maxToolTurns,
            otelTraceId: ctx.trace.traceId,
          }),
        ctx.retryConfig,
      ),
    );

    const finalOutput = decodeAgentFinalOutput(
      outcome.finalOutput,
      validateAgentOutput,
      (agent as Record<string, unknown>).outputSchemaJson !== undefined,
    );

    recordNodeUsage(ctx.usageSink, {
      nodeName: qualifiedNodeName(ctx, node.name),
      componentType: "AgentNode",
      model: agent.llmConfig.modelId,
      promptTokens: outcome.promptTokens || undefined,
      completionTokens: outcome.completionTokens || undefined,
      totalTokens: outcome.totalTokens || undefined,
      latencyMs: performance.now() - start,
      toolCalls: outcome.toolCalls,
      cached: false,
    });

    if (cacheKey !== undefined) {
      await writeNodeCache(cacheKey, finalOutput);
    }
    return finalOutput;
  } catch (e) {
    wrapperSpan.recordException({
      name: (e as Error).name,
      message: (e as Error).message,
    });
    wrapperSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: (e as Error).message,
    });
    throw e;
  } finally {
    wrapperSpan.end();
    await built.cleanup();
  }
}

/** Reconcile the SDK's final output with the agent's declared output
 *  schema.
 *
 *  - Live Zod schema: SDK already parsed against `outputType`; we
 *    revalidate to surface drift via our `OutputParseError`.
 *  - JSON-Schema only (deserialized via fromOAS): SDK returns the
 *    structured output as a JSON string; parse into an object.
 *  - Neither: return the freeform text (or JSON-stringified value). */
function decodeAgentFinalOutput(
  finalOutput: unknown,
  validate: ((raw: unknown) => Record<string, unknown> | string) | undefined,
  hasJsonSchema: boolean,
): Record<string, unknown> | string {
  if (finalOutput === undefined || finalOutput === null) return "";
  if (validate) {
    const validated = trySync({
      fn: () => validate(finalOutput),
      mapError: (e) =>
        new OutputParseError({
          message: "Agent final output did not match outputSchema.",
          issues: e,
        }),
    });
    if (!validated.ok) throw validated.error;
    return validated.value;
  }
  if (hasJsonSchema) {
    const text = typeof finalOutput === "string"
      ? finalOutput
      : JSON.stringify(finalOutput);
    const parsed = trySync({
      fn: () => JSON.parse(text),
      mapError: (e) =>
        new OutputParseError({
          message: "Agent JSON-schema output was not valid JSON.",
          raw: text,
          issues: e,
        }),
    });
    if (!parsed.ok) throw parsed.error;
    return parsed.value as Record<string, unknown>;
  }
  return typeof finalOutput === "string"
    ? finalOutput
    : finalOutput as Record<string, unknown>;
}
