// The discriminated union of every node type the runner can dispatch
// on. Lives here (rather than in edge-helpers.ts) so consumers that
// need the type for reasons unrelated to edge traversal — the walker's
// dispatch, future per-node helpers, etc. — don't have to import from
// a module about edges.

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

/** Every node type the runner can dispatch on. The `componentType`
 *  literal on each variant acts as the discriminant — `switch`ing on
 *  `current.componentType` narrows to the specific node interface
 *  inside the walker. */
export type DispatchableNode =
  | StartNode
  | EndNode
  | AgentNode
  | SandboxAgentNode
  | BranchingNode
  | MapNode
  | ParallelMapNode
  | ParallelFlowNode
  | CatchExceptionNode
  | FlowNode;
