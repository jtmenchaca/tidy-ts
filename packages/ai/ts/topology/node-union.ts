// Node-reference schemas, kept in one place so `topology.ts` and
// `edges.ts` agree on the shape.
//
// Why `z.record(...)` instead of a `z.discriminatedUnion(...)` of the
// individual node schemas: freshly-authored nodes carry overlay fields
// (`inputSchema: ZodType`, `outputSchema: ZodType`, `subflow: Topology`,
// `agent: Agent`) that the per-node Zod schemas declare as `z.unknown()`
// — Zod can't structurally validate live Zod schemas or topology
// references, only that they're present. If we used the strict union
// here, `TopologySchema.parse(...)` would **strip** those overlays
// during parse (Zod's default), breaking the executor's ability to
// reach `node.outputSchema` for client-side Zod validation.
//
// Structural well-formedness — every node has a known `componentType`,
// inputs/outputs are property-list shapes, etc. — is enforced by
// `validateTopology` instead, which `createTopology` runs automatically
// at construction time.

import { z } from "zod";

import { AgentNodeSchema } from "./nodes/agent-node.ts";
import { BranchingNodeSchema } from "./nodes/branching.ts";
import { CatchExceptionNodeSchema } from "./nodes/catch-exception.ts";
import { EndNodeSchema } from "./nodes/end.ts";
import { FlowNodeSchema } from "./nodes/flow.ts";
import { MapNodeSchema } from "./nodes/map.ts";
import { ParallelFlowNodeSchema } from "./nodes/parallel-flow.ts";
import { ParallelMapNodeSchema } from "./nodes/parallel-map.ts";
import { SandboxAgentNodeSchema } from "./nodes/sandbox-agent-node.ts";
import { StartNodeSchema } from "./nodes/start.ts";

/** The permissive reference shape used by `TopologySchema` and the edge
 *  schemas. Keeps overlay fields intact on parse; structural validity is
 *  enforced by `validateTopology`. */
export const NodeRefSchema = z.record(z.string(), z.unknown());

/** Every known node `componentType` literal — used by `validateTopology`
 *  to reject topologies that contain nodes the runner can't dispatch on. */
export const DISPATCHABLE_NODE_TYPES = new Set<string>([
  StartNodeSchema.shape.componentType.value,
  EndNodeSchema.shape.componentType.value,
  AgentNodeSchema.shape.componentType.value,
  SandboxAgentNodeSchema.shape.componentType.value,
  BranchingNodeSchema.shape.componentType.value,
  MapNodeSchema.shape.componentType.value,
  ParallelMapNodeSchema.shape.componentType.value,
  ParallelFlowNodeSchema.shape.componentType.value,
  CatchExceptionNodeSchema.shape.componentType.value,
  FlowNodeSchema.shape.componentType.value,
]);
