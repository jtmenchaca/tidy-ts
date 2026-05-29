// ControlFlowEdge — declares which Node runs after which.
// DataFlowEdge — declares which output of one Node feeds which input of another.
// Mirrors Oracle OAS.
// Source: docs/reference/agent-spec/repo/tsagentspec/src/flows/edges/

import { z } from "zod";
import {
  type ComponentBase,
  ComponentBaseSchema,
  type ComponentWithIO,
} from "./component.ts";
import { NodeRefSchema } from "./node-union.ts";
import { findPropertyByTitle } from "./property.ts";

export const ControlFlowEdgeSchema = ComponentBaseSchema.extend({
  componentType: z.literal("ControlFlowEdge"),
  fromNode: NodeRefSchema,
  fromBranch: z.string().optional(),
  toNode: NodeRefSchema,
});

export type ControlFlowEdge = z.infer<typeof ControlFlowEdgeSchema>;

export function createControlFlowEdge({
  name,
  fromNode,
  toNode,
  fromBranch,
  id,
  description,
  metadata,
}: {
  name: string;
  fromNode: ComponentBase;
  toNode: ComponentBase;
  fromBranch?: string;
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): ControlFlowEdge {
  return Object.freeze(
    ControlFlowEdgeSchema.parse({
      name,
      fromNode,
      toNode,
      fromBranch,
      id,
      description,
      metadata,
      componentType: "ControlFlowEdge" as const,
    }),
  );
}

export const DataFlowEdgeSchema = ComponentBaseSchema.extend({
  componentType: z.literal("DataFlowEdge"),
  sourceNode: NodeRefSchema,
  sourceOutput: z.string(),
  destinationNode: NodeRefSchema,
  destinationInput: z.string(),
});

export type DataFlowEdge = z.infer<typeof DataFlowEdgeSchema>;

// ── Typed key extraction for sourceOutput / destinationInput ─────────────
//
// Each node attaches its Zod schemas to the runtime value (inputSchema /
// outputSchema). We read off those fields at the type level to constrain
// `sourceOutput` / `destinationInput` to actually-declared field names.
//
// StartNode/EndNode are asymmetric:
//   - StartNode exposes its `inputSchema` (the topology input) as outputs
//     to downstream nodes.
//   - EndNode receives its `outputSchema` (the topology output) as inputs
//     from upstream nodes.

// Use Zod's official inference (z.infer) so we work with z.ZodType, not just
// z.ZodObject. Wrap `undefined` away because schema fields are optional.
type ZodKeys<Z> = Z extends z.ZodType
  ? Extract<keyof z.infer<Z>, string>
  : string;

/** Helper: extract Zod-schema key set from a wrapper holding `inputSchema?`. */
type WrapperInputKeys<W> = W extends { inputSchema?: infer S }
  ? S extends z.ZodType ? ZodKeys<S> : string
  : string;

/** Helper: extract Zod-schema key set from a wrapper holding `outputSchema?`. */
type WrapperOutputKeys<W> = W extends { outputSchema?: infer S }
  ? S extends z.ZodType ? ZodKeys<S> : string
  : string;

/** Output keys exposed by a node to downstream DataFlowEdges. */
export type OutputKeysOf<N> = N extends { componentType: "StartNode" }
  ? WrapperInputKeys<N>
  : N extends { componentType: "EndNode" } ? never
  // AgentNode wraps an Agent; the agent's outputSchema is the source of keys.
  : N extends { componentType: "AgentNode"; agent: infer A } ? WrapperOutputKeys<A>
  // FlowNode wraps a Topology subflow; read the subflow's __output brand
  // (the phantom type that travels from the subflow's EndNode).
  : N extends { componentType: "FlowNode"; subflow: { __output?: infer O } }
    ? O extends Record<string, unknown> ? Extract<keyof O, string> : string
  // MapNode / ParallelMapNode reduce subflow outputs into the wrapper.
  // When `reducers` is declared, the OUTER output keys are the keys of
  // the reducers record (each entry renames an inner subflow key via
  // `{ from, method }`). Otherwise fall back to the subflow's __output
  // keys (same-name pass-through).
  : N extends {
    componentType: "MapNode" | "ParallelMapNode";
    subflow: { __output?: infer O };
    reducers?: infer R;
  } ? [R] extends [Record<string, unknown>]
      ? Extract<keyof R, string>
    : O extends Record<string, unknown> ? Extract<keyof O, string>
    : string
  // ParallelFlowNode merges multiple subflows; its outputs are the union of
  // each subflow's __output keys.
  : N extends {
    componentType: "ParallelFlowNode";
    subflows: ReadonlyArray<{ __output?: infer O }>;
  } ? O extends Record<string, unknown> ? Extract<keyof O, string> : string
  // CatchExceptionNode forwards the subflow's outputs and adds caught_exception_info.
  : N extends {
    componentType: "CatchExceptionNode";
    subflow: { __output?: infer O };
  } ? (O extends Record<string, unknown> ? Extract<keyof O, string> : string)
      | "caught_exception_info"
  : N extends { outputSchema?: infer S }
    ? S extends z.ZodType ? ZodKeys<S> : string
  : string;

/** Input keys a node accepts from upstream DataFlowEdges. */
export type InputKeysOf<N> = N extends { componentType: "EndNode" }
  ? WrapperOutputKeys<N>
  : N extends { componentType: "StartNode" } ? never
  // AgentNode wraps an Agent; the agent's inputSchema is the source of keys.
  : N extends { componentType: "AgentNode"; agent: infer A } ? WrapperInputKeys<A>
  // FlowNode wraps a Topology subflow; read the subflow's __input brand
  // (the phantom type that travels from the subflow's StartNode).
  : N extends { componentType: "FlowNode"; subflow: { __input?: infer I } }
    ? I extends Record<string, unknown> ? Extract<keyof I, string> : string
  : N extends { inputSchema?: infer S }
    ? S extends z.ZodType ? ZodKeys<S> : string
  : string;

export function createDataFlowEdge<
  Src extends ComponentWithIO,
  Dst extends ComponentWithIO,
>({
  name,
  sourceNode,
  sourceOutput,
  destinationNode,
  destinationInput,
  id,
  description,
  metadata,
}: {
  name: string;
  sourceNode: Src;
  sourceOutput: OutputKeysOf<Src>;
  destinationNode: Dst;
  destinationInput: InputKeysOf<Dst>;
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): DataFlowEdge {
  const src = findPropertyByTitle(sourceNode.outputs, sourceOutput);
  if (!src) {
    throw new Error(
      `Data edge '${name}': source node '${sourceNode.name}' has no output property '${sourceOutput}'.`,
    );
  }
  const dst = findPropertyByTitle(destinationNode.inputs, destinationInput);
  if (!dst) {
    throw new Error(
      `Data edge '${name}': destination node '${destinationNode.name}' has no input property '${destinationInput}'.`,
    );
  }
  return Object.freeze(
    DataFlowEdgeSchema.parse({
      name,
      sourceNode,
      sourceOutput,
      destinationNode,
      destinationInput,
      id,
      description,
      metadata,
      componentType: "DataFlowEdge" as const,
    }),
  );
}
