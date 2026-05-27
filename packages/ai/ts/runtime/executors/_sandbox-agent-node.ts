// SandboxAgentNode executor.
//
// Same outer pipeline as AgentNode (cache → render → compile → run →
// validate → cache write), but compiles into an SDK SandboxAgent
// rather than a plain Agent and routes through `runSdkSandboxAgent`.
// The SandboxAgent's manifest + capabilities flow into the SDK at
// construction time; the SDK's default sandbox client (UnixLocal) is
// used unless the run-time context selects a different one.

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
import type { SandboxAgentNode } from "../../topology/nodes/sandbox-agent-node.ts";
import { trySync } from "@tidy-ts/shims";

import { type CacheEnvelope, lookupNodeCache } from "./_cache-lookup.ts";
import { renderTemplate } from "./_prompt-render.ts";
import { withDefaultRetry } from "./_retry-policy.ts";
import {
  assertAgentRunnable,
  buildSdkSandboxAgent,
  runSdkSandboxAgent,
} from "./_sdk-bridge.ts";
import {
  ATTR as TRACE_ATTR,
  type ConversationCapture,
  replayCapturedConversation,
  TIDY_ATTR,
} from "../tracing.ts";
import { context as otelContext, SpanStatusCode, trace as otelTrace } from "@opentelemetry/api";

export async function executeSandboxAgentNode(
  node: SandboxAgentNode,
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
        `SandboxAgentNode '${node.name}' agent.outputSchema could not be lowered to JSON Schema: ${resolved.error.message}`,
      issues: resolved.error.cause,
    });
  }
  const { validate } = resolved.value;

  // The fingerprint helper expects an `AgentNode`-shaped value.
  // Structurally a SandboxAgentNode matches (it has agent.llmConfig
  // + agent.tools + agent.maxToolTurns), so casting is safe — the
  // fingerprint reads field names common to both.
  // deno-lint-ignore no-explicit-any
  const fingerprint = agentNodeFingerprint(node as any, effectiveParams);
  if (!fingerprint.ok) {
    throw new InputValidationError({
      message:
        `SandboxAgentNode '${node.name}' fingerprint could not be computed: ${fingerprint.error.message}`,
      issues: fingerprint.error.cause,
    });
  }

  let cacheKey: string | undefined;
  if (ctx.cache) {
    const cacheSlot = await lookupNodeCache(
      fingerprint.value,
      input,
      validate,
      "Cached sandbox agent output did not match agent.outputSchema.",
    );
    if (cacheSlot.output !== undefined) {
      const cachedSystemPrompt = renderTemplate(agent.systemPromptTemplate, input);
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
          anchorTimeMs: performance.timeOrigin + performance.now(),
        });
      }
      cachedSpan.end();
      recordNodeUsage(ctx.usageSink, {
        nodeName: qualifiedNodeName(ctx, node.name),
        componentType: "SandboxAgentNode",
        model: agent.llmConfig.modelId,
        latencyMs: 0,
        cached: true,
      });
      return cacheSlot.output;
    }
    cacheKey = cacheSlot.key;
  }

  const effectiveSystemPrompt = renderTemplate(agent.systemPromptTemplate, input);
  const built = await buildSdkSandboxAgent({
    agent,
    ctx,
    effectiveSystemPrompt,
  });

  // OTel `invoke_agent` wrapper — same scheme as plain AgentNode. The
  // SDK bridge in tracing.ts parents the SDK's own spans under this.
  const wrapperSpan = ctx.trace.tracer.startSpan(
    `invoke_agent ${agent.name}`,
    {
      attributes: {
        [TRACE_ATTR.OPERATION_NAME]: "invoke_agent",
        [TRACE_ATTR.AGENT_NAME]: agent.name,
        // Agent's resolved input — what the data-flow edges fed in.
        [TIDY_ATTR.INPUT]: JSON.stringify(input ?? null),
        [TIDY_ATTR.CACHED]: false,
        [TIDY_ATTR.SYSTEM_PROMPT]: effectiveSystemPrompt,
      },
    },
    ctx.trace.activeContext,
  );
  const wrapperContext = otelTrace.setSpan(ctx.trace.activeContext, wrapperSpan);
  ctx.trace.pushParent(wrapperContext);
  const conversation: ConversationCapture = ctx.trace.beginCapture();

  const start = performance.now();
  try {
    const outcome = await otelContext.with(wrapperContext, () =>
      withDefaultRetry(
        () =>
          runSdkSandboxAgent({
            sdkAgent: built.sdkAgent,
            input,
            maxTurns: agent.maxToolTurns,
            otelTraceId: ctx.trace.traceId,
            sandboxClient: ctx.sandboxClient,
          }),
        ctx.retryConfig,
      ),
    );

    let finalOutput: Record<string, unknown> | string;
    if (validate) {
      const validated = trySync({
        fn: () => validate(outcome.finalOutput),
        mapError: (e) =>
          new OutputParseError({
            message: "Sandbox agent final output did not match outputSchema.",
            issues: e,
          }),
      });
      if (!validated.ok) throw validated.error;
      finalOutput = validated.value;
    } else if ((agent as Record<string, unknown>).outputSchemaJson) {
      const text = typeof outcome.finalOutput === "string"
        ? outcome.finalOutput
        : JSON.stringify(outcome.finalOutput);
      const parsed = trySync({
        fn: () => JSON.parse(text),
        mapError: (e) =>
          new OutputParseError({
            message: "Sandbox agent JSON-schema output was not valid JSON.",
            raw: text,
            issues: e,
          }),
      });
      if (!parsed.ok) throw parsed.error;
      finalOutput = parsed.value as Record<string, unknown>;
    } else {
      finalOutput = typeof outcome.finalOutput === "string"
        ? outcome.finalOutput
        : JSON.stringify(outcome.finalOutput ?? "");
    }

    // Attach the agent's resolved output to the wrapper span so the
    // trace's `output` column reflects what the agent returned.
    wrapperSpan.setAttribute(TIDY_ATTR.OUTPUT, JSON.stringify(finalOutput ?? null));

    recordNodeUsage(ctx.usageSink, {
      nodeName: qualifiedNodeName(ctx, node.name),
      componentType: "SandboxAgentNode",
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
