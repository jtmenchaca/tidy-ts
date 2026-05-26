// Tools barrel — re-exports every tool variant plus the discriminated
// union the Agent's `tools` array is typed against.
//
// The shape mirrors OAS so a `Tool` instance carries a `componentType`
// discriminator that the agent executor's tool dispatch reads. New tool
// kinds added in future OAS versions slot into this union; the executor
// switches on `componentType`.

import { z } from "zod";
import { BuiltinToolSchema } from "./builtin-tool.ts";
import { ClientToolSchema } from "./client-tool.ts";
import { McpToolSchema } from "../mcp/mcp-tool.ts";
import { RemoteToolSchema } from "./remote-tool.ts";
import { ServerToolSchema } from "./server-tool.ts";

/** Discriminated union of every Tool variant the runtime can dispatch.
 *  Schema validation is structural only — `ServerTool.execute` is
 *  attached as a non-schema property and survives the discriminator
 *  check by virtue of the executor's runtime branch on `componentType`. */
export const ToolUnion = z.discriminatedUnion("componentType", [
  ServerToolSchema,
  ClientToolSchema,
  RemoteToolSchema,
  BuiltinToolSchema,
  McpToolSchema,
]);

// The static type used by Agent.tools[]. ServerTool / ClientTool are
// parameterized on `<P, R>` so concrete narrow types (e.g.,
// ServerTool<{ a: number }, { value: number }>) flow through the
// per-tool call site; here we widen those slots to `any` so a
// heterogeneous list with mixed concrete P/R stays assignable. The
// per-tool typed surface still works at the tool's own call site
// (`createServerTool({ paramsSchema: Z, execute: ({a,b}) => ... })`),
// which is where the safety matters.
//
// deno-lint-ignore no-explicit-any
type AnyServerTool = import("./server-tool.ts").ServerTool<any, any>;
// deno-lint-ignore no-explicit-any
type AnyClientTool = import("./client-tool.ts").ClientTool<any, any>;

export type Tool =
  | AnyServerTool
  | AnyClientTool
  | import("./remote-tool.ts").RemoteTool
  | import("./builtin-tool.ts").BuiltinTool
  | import("../mcp/mcp-tool.ts").McpTool;

// ── Re-exports ─────────────────────────────────────────────────────────

export { type ToolBase, ToolBaseSchema } from "./tool-base.ts";

export {
  createServerTool,
  // Back-compat alias for the original `createTool` name.
  createTool,
  type ServerTool,
  ServerToolSchema,
} from "./server-tool.ts";

export {
  type ClientTool,
  ClientToolSchema,
  createClientTool,
} from "./client-tool.ts";

export {
  createRemoteTool,
  fillTemplate,
  type RemoteTool,
  RemoteToolSchema,
} from "./remote-tool.ts";

export {
  type BuiltinTool,
  BuiltinToolSchema,
  createBuiltinTool,
} from "./builtin-tool.ts";

export {
  createMcpToolBox,
  type MCPToolBox,
  MCPToolBoxSchema,
  type ToolBox,
  ToolBoxUnion,
} from "./toolbox.ts";
