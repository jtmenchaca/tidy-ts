// CatchExceptionNode — runs a subflow; if it throws, routes control flow
// down the `caught_exception_branch` outgoing edge instead of the default.
// The exception's message is exposed as `caught_exception_info` in the
// node's outputs (null on success).
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/flows/nodes/catch-exception-node.ts

import { z } from "zod";
import { NodeBaseSchema } from "../component.ts";
import type { Property } from "../property.ts";
import type { Topology } from "../topology.ts";

export const CAUGHT_EXCEPTION_BRANCH = "caught_exception_branch";
export const DEFAULT_NEXT_BRANCH = "next";
export const CAUGHT_EXCEPTION_INFO = "caught_exception_info";

export const CatchExceptionNodeSchema = NodeBaseSchema.extend({
  componentType: z.literal("CatchExceptionNode"),
  subflow: z.unknown(),
});

declare const __ceI: unique symbol;
declare const __ceO: unique symbol;

export type CatchExceptionNode<SubI = unknown, SubO = unknown> =
  & z.infer<typeof CatchExceptionNodeSchema>
  & {
    readonly [__ceI]?: SubI;
    readonly [__ceO]?: SubO;
    subflow: Topology<SubI, SubO>;
  };

function caughtExceptionInfoProperty(): Property {
  return Object.freeze({
    jsonSchema: {
      title: CAUGHT_EXCEPTION_INFO,
      anyOf: [{ type: "string" }, { type: "null" }],
      default: null,
    },
    title: CAUGHT_EXCEPTION_INFO,
    description: undefined,
    default: null,
    type: undefined,
  });
}

export function createCatchExceptionNode<SubI, SubO>({
  name,
  subflow,
  inputs,
  outputs,
  id,
  description,
  metadata,
}: {
  name: string;
  subflow: Topology<SubI, SubO>;
  inputs?: Property[];
  outputs?: Property[];
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): CatchExceptionNode<SubI, SubO> {
  const resolvedInputs = inputs ?? (subflow.inputs ?? []);
  const subOutputs = (subflow.outputs ?? []) as Property[];
  const resolvedOutputs = outputs ?? [
    ...subOutputs,
    caughtExceptionInfoProperty(),
  ];
  const branches = [CAUGHT_EXCEPTION_BRANCH, DEFAULT_NEXT_BRANCH];

  const parsed = CatchExceptionNodeSchema.parse({
    name,
    subflow,
    inputs: resolvedInputs,
    outputs: resolvedOutputs,
    branches,
    id,
    description,
    metadata,
    componentType: "CatchExceptionNode" as const,
  });
  return Object.freeze({ ...parsed, subflow }) as CatchExceptionNode<SubI, SubO>;
}
