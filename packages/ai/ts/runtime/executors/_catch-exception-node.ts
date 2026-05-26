// CatchExceptionNode executor — runs a subflow and, on failure,
// routes to the `caught_exception_branch` with the error message in
// `caught_exception_info`. The error arm is the node's contract, not a
// last-resort fallback — `tryAsync` is the right shape.

import { tryAsync } from "@tidy-ts/shims";

import type { CatchExceptionNode } from "../../topology/nodes/catch-exception.ts";
import {
  CAUGHT_EXCEPTION_BRANCH,
  CAUGHT_EXCEPTION_INFO,
} from "../../topology/nodes/catch-exception.ts";
import type { Topology } from "../../topology/topology.ts";
import { type RunContext, withSubflow } from "../run-context.ts";

import { executeTopology } from "./walker.ts";

export async function executeCatchExceptionNode(
  node: CatchExceptionNode,
  input: Record<string, unknown>,
  ctx: RunContext,
): Promise<{ outputs: Record<string, unknown>; branch: string }> {
  const subflow = node.subflow as Topology;
  const innerCtx = withSubflow(ctx, node.name);
  const r = await tryAsync({
    fn: () => executeTopology(subflow, input, innerCtx),
    mapError: (e) => (e instanceof Error ? e.message : String(e)),
  });
  if (r.ok) {
    return {
      outputs: {
        ...(r.value as Record<string, unknown>),
        [CAUGHT_EXCEPTION_INFO]: null,
      },
      branch: "next",
    };
  }
  return {
    outputs: { [CAUGHT_EXCEPTION_INFO]: r.error },
    branch: CAUGHT_EXCEPTION_BRANCH,
  };
}
