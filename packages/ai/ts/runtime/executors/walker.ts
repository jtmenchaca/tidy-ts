// `executeTopology` — the DAG walker. Validates startNode input, walks
// control-flow edges, dispatches to the right per-node executor, and
// returns the EndNode's resolved output. Every executor in this folder
// is reachable through this dispatch.

import { z } from "zod";

import type { Topology } from "../../topology/topology.ts";
import type { AgentNode } from "../../topology/nodes/agent-node.ts";
import type { SandboxAgentNode } from "../../topology/nodes/sandbox-agent-node.ts";
import type { BranchingNode } from "../../topology/nodes/branching.ts";
import type { MapNode } from "../../topology/nodes/map.ts";
import type { ParallelMapNode } from "../../topology/nodes/parallel-map.ts";
import type { ParallelFlowNode } from "../../topology/nodes/parallel-flow.ts";
import type { CatchExceptionNode } from "../../topology/nodes/catch-exception.ts";
import type { FlowNode } from "../../topology/nodes/flow.ts";
import type { StartNode } from "../../topology/nodes/start.ts";
import type { EndNode } from "../../topology/nodes/end.ts";

import { InputValidationError, OutputParseError } from "../errors.ts";
import type { RunContext } from "../run-context.ts";
import { TIDY_ATTR } from "../tracing.ts";
import { context as otelContext, SpanStatusCode, trace as otelTrace } from "@opentelemetry/api";

import { controlSuccessorOf, incomingDataEdgesOf } from "./_edge-helpers.ts";
import { executeAgentNode } from "./_agent-node.ts";
import { executeSandboxAgentNode } from "./_sandbox-agent-node.ts";
import { executeBranchingNode } from "./_branching-node.ts";
import { executeCatchExceptionNode } from "./_catch-exception-node.ts";
import { executeFlowNode } from "./_flow-node.ts";
import { executeMapNode } from "./_map-node.ts";
import { executeParallelFlowNode } from "./_parallel-flow-node.ts";
import { executeParallelMapNode } from "./_parallel-map-node.ts";

/** OAS componentType → tidy_ts.ai.operation.name discriminator value
 *  for control-flow spans. Returns null for non-control-flow nodes
 *  (StartNode / EndNode / AgentNode / SandboxAgentNode) which are
 *  handled elsewhere (markers + agent-node executors with their own
 *  span emission). */
function controlFlowOpName(componentType: string): string | null {
  switch (componentType) {
    case "MapNode": return "map";
    case "ParallelMapNode": return "parallel_map";
    case "ParallelFlowNode": return "parallel_flow";
    case "BranchingNode": return "branch";
    case "CatchExceptionNode": return "catch_exception";
    case "FlowNode": return "subflow";
    default: return null;
  }
}

/** Open an OTel wrapper span for a control-flow node, run the body
 *  inside its context (so SDK spans + nested wrappers parent
 *  correctly), then attach the node's output and close. Pairs the
 *  parent-stack push/pop so the SDK→OTel bridge resolves spans under
 *  this control-flow span. */
async function runWithControlFlowSpan(
  ctx: RunContext,
  opName: string,
  current: { componentType: string; name: string },
  nodeInput: Record<string, unknown>,
  body: () => Promise<Record<string, unknown> | string>,
): Promise<Record<string, unknown> | string> {
  const span = ctx.trace.tracer.startSpan(
    `${opName} ${current.name}`,
    {
      attributes: {
        [TIDY_ATTR.OPERATION_NAME]: opName,
        [TIDY_ATTR.NODE_NAME]: current.name,
        [TIDY_ATTR.INPUT]: JSON.stringify(nodeInput ?? null),
      },
    },
    ctx.trace.activeContext,
  );
  const wrapperContext = otelTrace.setSpan(ctx.trace.activeContext, span);
  ctx.trace.pushParent(wrapperContext);
  try {
    const out = await otelContext.with(wrapperContext, body);
    span.setAttribute(TIDY_ATTR.OUTPUT, JSON.stringify(out ?? null));
    return out;
  } catch (e) {
    span.recordException({
      name: (e as Error).name,
      message: (e as Error).message,
    });
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (e as Error).message,
    });
    throw e;
  } finally {
    ctx.trace.popParent();
    span.end();
  }
}

export async function executeTopology<O>(
  topology: Topology<unknown, O>,
  input: Record<string, unknown>,
  ctx: RunContext,
): Promise<O> {
  // `topology.startNode` types as `Record<string, unknown>` because
  // NodeRefSchema is intentionally permissive (see
  // topology/node-union.ts for the rationale — tighter validation
  // would strip the live Zod overlays that the runner reads). The
  // overlay-bearing fields (`inputSchema` here) are runtime-typed
  // through this cast.
  const startNode = topology.startNode as StartNode & {
    inputSchema?: z.ZodType;
  };
  if (startNode.inputSchema) {
    const r = startNode.inputSchema.safeParse(input);
    if (!r.success) {
      throw new InputValidationError({
        message: `Topology input did not match startNode.inputSchema.`,
        issues: r.error,
      });
    }
  }

  const nodeOutputs = new Map<string, Record<string, unknown>>();
  nodeOutputs.set(startNode.id, input);

  let current = controlSuccessorOf(topology, startNode.id);
  while (current) {
    if (current.componentType === "EndNode") {
      const incoming = incomingDataEdgesOf(topology, current.id);
      const finalOut: Record<string, unknown> = {};
      for (const e of incoming) {
        const src = nodeOutputs.get(e.sourceId);
        if (!src) {
          throw new InputValidationError({
            message: `EndNode '${current.name}' references output of un-executed node.`,
          });
        }
        finalOut[e.destinationInput] = src[e.sourceOutput];
      }

      const endNode = current as EndNode<O> & { outputSchemaJson?: unknown };
      if (endNode.outputSchema) {
        const parsed = endNode.outputSchema.safeParse(finalOut);
        if (!parsed.success) {
          throw new OutputParseError({
            message: "Topology final output did not match endNode.outputSchema.",
            issues: parsed.error,
          });
        }
        return parsed.data;
      }
      return finalOut as O;
    }

    const incoming = incomingDataEdgesOf(topology, current.id);
    const nodeInput: Record<string, unknown> = {};
    for (const e of incoming) {
      const src = nodeOutputs.get(e.sourceId);
      if (!src) {
        throw new InputValidationError({
          message: `Node '${current.name}' references output of un-executed node.`,
        });
      }
      nodeInput[e.destinationInput] = src[e.sourceOutput];
    }

    let branchToFollow: string | undefined;
    let outValue: Record<string, unknown> | string;

    // Wrap control-flow nodes in OTel spans so the trace tree mirrors
    // the topology shape. AgentNode / SandboxAgentNode have their own
    // wrappers further down (with typed I/O + cache attribution), so
    // we pass through to them untouched.
    const node = current; // closure-stable alias for the wrapped body
    const cfOp = controlFlowOpName(node.componentType);
    if (cfOp) {
      outValue = await runWithControlFlowSpan(
        ctx,
        cfOp,
        node,
        nodeInput,
        async () => {
          switch (node.componentType) {
            case "BranchingNode":
              branchToFollow = executeBranchingNode(node as BranchingNode, nodeInput);
              return nodeInput;
            case "MapNode":
              return await executeMapNode(node as MapNode, nodeInput, ctx);
            case "ParallelMapNode":
              return await executeParallelMapNode(node as ParallelMapNode, nodeInput, ctx);
            case "ParallelFlowNode":
              return await executeParallelFlowNode(node as ParallelFlowNode, nodeInput, ctx);
            case "CatchExceptionNode": {
              const r = await executeCatchExceptionNode(node as CatchExceptionNode, nodeInput, ctx);
              branchToFollow = r.branch;
              return r.outputs;
            }
            case "FlowNode":
              return await executeFlowNode(node as FlowNode, nodeInput, ctx);
            default:
              throw new InputValidationError({
                message:
                  `Unsupported node type '${(node as { componentType: string }).componentType}' in topology.`,
              });
          }
        },
      );
    } else {
      switch (current.componentType) {
        case "AgentNode":
          outValue = await executeAgentNode(current as AgentNode, nodeInput, ctx);
          break;
        case "SandboxAgentNode":
          outValue = await executeSandboxAgentNode(
            current as SandboxAgentNode,
            nodeInput,
            ctx,
          );
          break;
        default:
          throw new InputValidationError({
            message:
              `Unsupported node type '${(current as { componentType: string }).componentType}' in topology.`,
          });
      }
    }

    if (typeof outValue === "string") {
      const firstOut = (current.outputs as { title: string }[] | undefined)?.[0];
      nodeOutputs.set(current.id, firstOut ? { [firstOut.title]: outValue } : { value: outValue });
    } else {
      nodeOutputs.set(current.id, outValue);
    }

    current = controlSuccessorOf(topology, current.id, branchToFollow);
  }

  throw new InputValidationError({
    message: "Control flow ended without reaching an EndNode.",
  });
}
