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

import { type CacheEnvelope, lookupNodeCache } from "./_cache-lookup.ts";
import { renderTemplate } from "./_prompt-render.ts";
import { withDefaultRetry } from "./_retry-policy.ts";
import {
  assertAgentRunnable,
  buildSdkAgent,
  runSdkAgent,
} from "./_sdk-bridge.ts";
import {
  ATTR as TRACE_ATTR,
  type ConversationCapture,
  replayCapturedConversation,
  TIDY_ATTR,
} from "../tracing.ts";
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
    if (cacheSlot.output !== undefined) {
      // The original render is what the model saw; recompute it so the
      // synthetic span carries the same `systemPrompt` attribute a
      // fresh run would. (The template + input that produced this
      // cache entry are pinned by the fingerprint, so the render is
      // deterministic across hits.)
      const cachedSystemPrompt = renderTemplate(agent.systemPromptTemplate, input);
      // Emit the `invoke_agent` wrapper span. Then, before ending it,
      // replay the captured chat / tool spans under it so the trace
      // tree shows the same shape as a fresh run — same model, same
      // messages, same tool calls.
      const cachedSpan = ctx.trace.tracer.startSpan(
        `invoke_agent ${agent.name}`,
        {
          attributes: {
            [TRACE_ATTR.OPERATION_NAME]: "invoke_agent",
            [TRACE_ATTR.AGENT_NAME]: agent.name,
            [TIDY_ATTR.INPUT]: JSON.stringify(input ?? null),
            [TIDY_ATTR.OUTPUT]: JSON.stringify(cacheSlot.output ?? null),
            [TIDY_ATTR.CACHED]: true,
            [TIDY_ATTR.SYSTEM_PROMPT]: cachedSystemPrompt,
          },
        },
        ctx.trace.activeContext,
      );
      if (cacheSlot.conversation) {
        const wrapperContext = otelTrace.setSpan(
          ctx.trace.activeContext,
          cachedSpan,
        );
        replayCapturedConversation({
          tracer: ctx.trace.tracer,
          parent: wrapperContext,
          conversation: cacheSlot.conversation,
          // Anchor synthetic spans to "now" so they nest inside the
          // wrapper span in the transcript instead of appearing as
          // pre-workflow events at the original-call timestamp.
          anchorTimeMs: performance.timeOrigin + performance.now(),
        });
      }
      cachedSpan.end();
      recordNodeUsage(ctx.usageSink, {
        nodeName: qualifiedNodeName(ctx, node.name),
        componentType: "AgentNode",
        model: agent.llmConfig.modelId,
        latencyMs: 0,
        cached: true,
      });
      return cacheSlot.output;
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
        // Agent's resolved input — what the data-flow edges fed in.
        [TIDY_ATTR.INPUT]: JSON.stringify(input ?? null),
        [TIDY_ATTR.CACHED]: false,
        // Rendered system prompt that goes to the model as
        // `instructions` — the SDK's tracing payload doesn't expose
        // this, so we attach it on the wrapper for full conversation
        // reconstruction.
        [TIDY_ATTR.SYSTEM_PROMPT]: effectiveSystemPrompt,
      },
    },
    ctx.trace.activeContext,
  );
  const wrapperContext = otelTrace.setSpan(ctx.trace.activeContext, wrapperSpan);
  // Make this wrapper the parent for any SDK-emitted spans (chat /
  // execute_tool / handoff) the bridge translates during this agent's
  // run. Pop in the finally below so nested agents are paired correctly.
  ctx.trace.pushParent(wrapperContext);
  // Allocate a conversation buffer the SDK→OTel bridge writes into for
  // every translated response / function span this agent emits. We
  // read it back after `Runner.run` returns and store it in the cache
  // envelope so a future cache hit can replay the same conversation.
  const conversation: ConversationCapture = ctx.trace.beginCapture();

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

    // Attach the agent's resolved output to the wrapper span so the
    // trace's `output` column reflects what the agent returned.
    wrapperSpan.setAttribute(TIDY_ATTR.OUTPUT, JSON.stringify(finalOutput ?? null));

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
      const envelope: CacheEnvelope = { output: finalOutput, conversation };
      await writeNodeCache(cacheKey, envelope);
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
    ctx.trace.endCapture();
    ctx.trace.popParent();
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
