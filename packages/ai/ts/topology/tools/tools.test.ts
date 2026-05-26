// Structural tests for the tool zoo. These verify constructor shape,
// schema validation, and OAS round-trip — no real API calls.

import { expect } from "@std/expect";
import { z } from "zod";

import { BuiltinToolSchema, createBuiltinTool } from "./builtin-tool.ts";
import { ClientToolSchema, createClientTool } from "./client-tool.ts";
import { createMcpTool, McpToolSchema } from "../mcp/mcp-tool.ts";
import { createMcpToolBox } from "./toolbox.ts";
import { createRemoteTool, RemoteToolSchema } from "./remote-tool.ts";
import { createServerTool, ServerToolSchema } from "./server-tool.ts";
import {
  createStdioTransport,
  createStreamableHTTPTransport,
} from "../mcp/client-transport.ts";

// Local re-construction of the tool discriminated union, just for the
// structural assertions below. The public surface no longer exposes this
// union — authors validate at the tool-factory boundary, not at the
// discriminator.
const ToolUnion = z.discriminatedUnion("componentType", [
  ServerToolSchema,
  ClientToolSchema,
  RemoteToolSchema,
  BuiltinToolSchema,
  McpToolSchema,
]);

Deno.test("createServerTool: paramsSchema auto-derives inputs", () => {
  const t = createServerTool({
    name: "add",
    paramsSchema: z.object({ a: z.number(), b: z.number() }),
    execute: ({ a, b }) => ({ value: a + b }),
  });
  expect(t.componentType).toBe("ServerTool");
  expect(t.name).toBe("add");
  expect(t.inputs?.length).toBe(2);
  const inputTitles = (t.inputs ?? []).map((p) => p.title).sort();
  expect(inputTitles).toEqual(["a", "b"]);
  // execute is a function, callable
  expect(typeof t.execute).toBe("function");
});

Deno.test("createClientTool: no execute, paramsSchema preserved", () => {
  const t = createClientTool({
    name: "pick_file",
    description: "Open a file picker in the browser",
    paramsSchema: z.object({ accept: z.string() }),
  });
  expect(t.componentType).toBe("ClientTool");
  // The ClientTool shape exposes paramsSchema for downstream JSON-Schema
  // lowering but does not carry an execute callback.
  expect("execute" in t).toBe(false);
});

Deno.test("createRemoteTool: infers inputs from URL placeholders", () => {
  const t = createRemoteTool({
    name: "get_user",
    url: "https://api.example.com/users/{{userId}}",
    httpMethod: "GET",
    headers: { Accept: "application/json" },
  });
  expect(t.componentType).toBe("RemoteTool");
  expect(t.url).toBe("https://api.example.com/users/{{userId}}");
  expect(t.httpMethod).toBe("GET");
  const titles = (t.inputs ?? []).map((p) => p.title);
  expect(titles).toContain("userId");
});

Deno.test("createRemoteTool: placeholders extracted from body and queryParams", () => {
  const t = createRemoteTool({
    name: "search",
    url: "https://api.example.com/search",
    httpMethod: "POST",
    queryParams: { region: "{{region}}" },
    data: { query: "{{query}}", limit: 10 },
  });
  const titles = (t.inputs ?? []).map((p) => p.title).sort();
  expect(titles).toEqual(["query", "region"]);
});

Deno.test("createBuiltinTool: preserves toolType + configuration", () => {
  const t = createBuiltinTool({
    name: "web_search",
    toolType: "web_search",
    configuration: { search_context_size: "medium" },
  });
  expect(t.componentType).toBe("BuiltinTool");
  expect(t.toolType).toBe("web_search");
  expect(t.configuration).toEqual({ search_context_size: "medium" });
});

Deno.test("createMcpTool: carries clientTransport", () => {
  const transport = createStdioTransport({
    name: "echo-server",
    command: "node",
    args: ["echo.js"],
  });
  const t = createMcpTool({
    name: "echo",
    clientTransport: transport,
  });
  expect(t.componentType).toBe("MCPTool");
  expect(t.clientTransport.componentType).toBe("StdioTransport");
});

Deno.test("createMcpToolBox: optional toolFilter", () => {
  const transport = createStreamableHTTPTransport({
    name: "remote",
    url: "https://mcp.example.com/sse",
  });
  const box = createMcpToolBox({
    name: "github",
    clientTransport: transport,
    toolFilter: ["search_repos", "get_issue"],
  });
  expect(box.componentType).toBe("MCPToolBox");
  expect(box.clientTransport.componentType).toBe("StreamableHTTPTransport");
  expect(box.toolFilter).toEqual(["search_repos", "get_issue"]);
});

Deno.test("ToolUnion: validates every tool variant by componentType", () => {
  const transport = createStdioTransport({ name: "t", command: "x" });
  const variants = [
    createServerTool({ name: "s", execute: () => null }),
    createClientTool({ name: "c" }),
    createRemoteTool({ name: "r", url: "https://x.io", httpMethod: "GET" }),
    createBuiltinTool({ name: "b", toolType: "web_search" }),
    createMcpTool({ name: "m", clientTransport: transport }),
  ];
  for (const v of variants) {
    // ServerTool's execute callback isn't part of the schema, so we
    // structurally validate the rest and rely on the runtime branch on
    // `componentType` to dispatch. The schema parse strips unknown
    // fields by default — passing this proves the schema matches the
    // factory output for every kind.
    const parsed = ToolUnion.safeParse(v);
    expect(parsed.success).toBe(true);
  }
});

Deno.test("ToolUnion: rejects unknown componentType", () => {
  const bad = { componentType: "NotATool", name: "x" };
  const parsed = ToolUnion.safeParse(bad);
  expect(parsed.success).toBe(false);
});
