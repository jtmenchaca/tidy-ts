// Shared base for every Tool variant.
//
// OAS keeps a `ToolBase` so all tools (Server / Client / Remote / Builtin /
// MCP) share the same `inputs`/`outputs`/`requiresConfirmation` shape and
// can live in a single discriminated union. We mirror that here so an
// `Agent.tools` array can hold a mixed bag and the executor only needs to
// know the discriminator (`componentType`) to dispatch.
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/tools/tool.ts

import { z } from "zod";
import { ComponentWithIOSchema } from "../component.ts";

export const ToolBaseSchema = ComponentWithIOSchema.extend({
  /** Whether a human should approve a call to this tool before the runner
   *  executes it. OAS-defined but the runner currently does not enforce
   *  it — agent loops run automatically. Surfaces in OAS round-trip so
   *  external orchestrators (e.g., human-in-the-loop UIs) can respect it. */
  requiresConfirmation: z.boolean().default(false),
});

export type ToolBase = z.infer<typeof ToolBaseSchema>;
