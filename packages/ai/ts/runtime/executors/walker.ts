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

import { controlSuccessorOf, incomingDataEdgesOf } from "./_edge-helpers.ts";
import { executeAgentNode } from "./_agent-node.ts";
import { executeSandboxAgentNode } from "./_sandbox-agent-node.ts";
import { executeBranchingNode } from "./_branching-node.ts";
import { executeCatchExceptionNode } from "./_catch-exception-node.ts";
import { executeFlowNode } from "./_flow-node.ts";
import { executeMapNode } from "./_map-node.ts";
import { executeParallelFlowNode } from "./_parallel-flow-node.ts";
import { executeParallelMapNode } from "./_parallel-map-node.ts";

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

  let previousId: string = startNode.id;
  let current = controlSuccessorOf(topology, startNode.id);
  while (current) {
    if (current.componentType === "EndNode") {
      const incoming = incomingDataEdgesOf(topology, current.id);
      let finalOut: Record<string, unknown>;
      if (incoming.length > 0) {
        finalOut = {};
        for (const e of incoming) {
          const src = nodeOutputs.get(e.sourceId);
          if (!src) {
            throw new InputValidationError({
              message: `EndNode '${current.name}' references output of un-executed node.`,
            });
          }
          finalOut[e.destinationInput] = src[e.sourceOutput];
        }
      } else {
        finalOut = nodeOutputs.get(previousId) ?? {};
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
    let nodeInput: Record<string, unknown>;
    if (incoming.length > 0) {
      nodeInput = {};
      for (const e of incoming) {
        const src = nodeOutputs.get(e.sourceId);
        if (!src) {
          throw new InputValidationError({
            message: `Node '${current.name}' references output of un-executed node.`,
          });
        }
        nodeInput[e.destinationInput] = src[e.sourceOutput];
      }
    } else {
      nodeInput = nodeOutputs.get(previousId) ?? {};
    }

    let branchToFollow: string | undefined;
    let outValue: Record<string, unknown> | string;

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
      case "BranchingNode":
        branchToFollow = executeBranchingNode(current as BranchingNode, nodeInput);
        outValue = nodeInput;
        break;
      case "MapNode":
        outValue = await executeMapNode(current as MapNode, nodeInput, ctx);
        break;
      case "ParallelMapNode":
        outValue = await executeParallelMapNode(current as ParallelMapNode, nodeInput, ctx);
        break;
      case "ParallelFlowNode":
        outValue = await executeParallelFlowNode(current as ParallelFlowNode, nodeInput, ctx);
        break;
      case "CatchExceptionNode": {
        const r = await executeCatchExceptionNode(current as CatchExceptionNode, nodeInput, ctx);
        outValue = r.outputs;
        branchToFollow = r.branch;
        break;
      }
      case "FlowNode":
        outValue = await executeFlowNode(current as FlowNode, nodeInput, ctx);
        break;
      default:
        throw new InputValidationError({
          message:
            `Unsupported node type '${(current as { componentType: string }).componentType}' in topology.`,
        });
    }

    if (typeof outValue === "string") {
      const firstOut = (current.outputs as { title: string }[] | undefined)?.[0];
      nodeOutputs.set(current.id, firstOut ? { [firstOut.title]: outValue } : { value: outValue });
    } else {
      nodeOutputs.set(current.id, outValue);
    }

    previousId = current.id;
    current = controlSuccessorOf(topology, current.id, branchToFollow);
  }

  throw new InputValidationError({
    message: "Control flow ended without reaching an EndNode.",
  });
}
