import { ai, build, mcp, sandbox, tool } from "../../mod.ts";
import { aiTest } from "../runtime/testing.ts";
import { expect } from "@std/expect";
import { z } from "zod";


const MODEL = "gpt-5.4-nano";
const openai = build.llmConfig({ modelId: MODEL });

const InSchema = z.object({ note: z.string() });
const OutSchema = z.object({
  severity: z.enum(["mild", "moderate", "severe"]),
  confidence: z.number().min(0).max(1),
});

function buildTopology() {
  const start = build.start({ name: "start", inputSchema: InSchema });
  const llm = build.agentNode({
    name: "extract",
    agent: build.agent({
      name: "extract",
      llmConfig: openai,
      systemPromptTemplate: `Extract severity from the note.\n\nNote: {{note}}`,
      inputSchema: InSchema,
      outputSchema: OutSchema,
    }),
  });
  const end = build.end({ name: "end", outputSchema: OutSchema });
  return build.create({
    id: "EXTRACT_SEVERITY",
    name: "EXTRACT_SEVERITY",
    version: "1.0.0",
    citation: "Tidy-ts AI v0.1",
    startNode: start,
    endNode: end,
    nodes: [start, llm, end],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->l", fromNode: start, toNode: llm }),
      build.controlFlowEdge({ name: "l->e", fromNode: llm, toNode: end }),
    ],
    dataFlowConnections: [
      build.dataFlowEdge({
        name: "s.note->l.note",
        sourceNode: start, sourceOutput: "note",
        destinationNode: llm, destinationInput: "note",
      }),
      build.dataFlowEdge({
        name: "l.severity->e.severity",
        sourceNode: llm, sourceOutput: "severity",
        destinationNode: end, destinationInput: "severity",
      }),
      build.dataFlowEdge({
        name: "l.confidence->e.confidence",
        sourceNode: llm, sourceOutput: "confidence",
        destinationNode: end, destinationInput: "confidence",
      }),
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────
// 1. build.toOAS produces JSON.stringify-able output with the right envelope.
// ─────────────────────────────────────────────────────────────────────────
Deno.test("oas — build.toOAS produces serializable JSON with the expected envelope", () => {
  const topology = buildTopology();
  const oas = build.toOAS(topology);

  expect(oas.componentType).toBe("Topology");
  expect(oas.id).toBe("EXTRACT_SEVERITY");
  expect(oas.version).toBe("1.0.0");
  expect(oas.citation).toBe("Tidy-ts AI v0.1");
  expect(oas.agentspecVersion).toBe("0.1.0-tidyts");

  // JSON.stringify round-trips without throwing (no functions, no symbols).
  const text = JSON.stringify(oas);
  expect(text.length).toBeGreaterThan(0);
  const parsed = JSON.parse(text);
  expect(parsed.id).toBe("EXTRACT_SEVERITY");
});

// ─────────────────────────────────────────────────────────────────────────
// 2. build.toOAS preserves edge references as $component_ref pointers.
// ─────────────────────────────────────────────────────────────────────────
Deno.test("oas — edges become $component_ref pointers, not embedded copies", () => {
  const topology = buildTopology();
  const oas = build.toOAS(topology) as Record<string, unknown>;

  const edges = oas.controlFlowConnections as Record<string, unknown>[];
  expect(edges.length).toBe(2);
  for (const e of edges) {
    expect(e.fromNode).toHaveProperty("$component_ref");
    expect(e.toNode).toHaveProperty("$component_ref");
  }
});

// ─────────────────────────────────────────────────────────────────────────
// 3. build.toOAS → JSON → build.fromOAS preserves the structure.
// ─────────────────────────────────────────────────────────────────────────
Deno.test("oas — build.toOAS → JSON → build.fromOAS preserves structure", () => {
  const original = buildTopology();
  const json = JSON.parse(JSON.stringify(build.toOAS(original)));
  const rebuilt = build.fromOAS(json);

  expect(rebuilt.id).toBe(original.id);
  expect(rebuilt.name).toBe(original.name);
  expect(rebuilt.version).toBe(original.version);
  expect(rebuilt.citation).toBe(original.citation);
  expect(rebuilt.nodes.length).toBe(original.nodes.length);
  expect(rebuilt.controlFlowConnections.length).toBe(
    original.controlFlowConnections.length,
  );

  // Edge endpoints resolved back to node references.
  const firstEdge = rebuilt.controlFlowConnections[0];
  expect((firstEdge.fromNode as { id: string }).id).toBe(
    (original.controlFlowConnections[0].fromNode as { id: string }).id,
  );
});

// ─────────────────────────────────────────────────────────────────────────
// 4. build.fromOAS preserves output JSON Schema on the EndNode (no Zod, but
//    the JSON Schema blob is reachable for tooling / API calls).
// ─────────────────────────────────────────────────────────────────────────
Deno.test("oas — deserialized end node carries outputSchemaJson", () => {
  const original = buildTopology();
  const json = JSON.parse(JSON.stringify(build.toOAS(original)));
  const rebuilt = build.fromOAS(json);

  const endNode = rebuilt.nodes.find(
    (n) => (n as Record<string, unknown>).componentType === "EndNode",
  ) as Record<string, unknown>;
  expect(endNode).toBeDefined();
  expect(endNode.outputSchemaJson).toBeDefined();
  const js = endNode.outputSchemaJson as Record<string, unknown>;
  expect(js.type).toBe("object");
});

// ─────────────────────────────────────────────────────────────────────────
// 5. Data-flow edges round-trip with $component_ref pointers preserved.
// ─────────────────────────────────────────────────────────────────────────
Deno.test("oas — data-flow edges round-trip", () => {
  const start = build.start({
    name: "start",
    inputSchema: z.object({ text: z.string() }),
  });
  const llm = build.agentNode({
    name: "classify",
    agent: build.agent({
      name: "classify",
      llmConfig: openai,
      systemPromptTemplate: "{{text}}",
      inputSchema: z.object({ text: z.string() }),
      outputSchema: z.object({ label: z.string() }),
    }),
  });
  const end = build.end({
    name: "end",
    outputSchema: z.object({ label: z.string() }),
  });
  const topology = build.create({
    id: "WITH_DATA_FLOW",
    name: "WITH_DATA_FLOW",
    startNode: start,
    endNode: end,
    nodes: [start, llm, end],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->l", fromNode: start, toNode: llm }),
      build.controlFlowEdge({ name: "l->e", fromNode: llm, toNode: end }),
    ],
    dataFlowConnections: [
      build.dataFlowEdge({
        name: "start.text->llm.text",
        sourceNode: start,
        sourceOutput: "text",
        destinationNode: llm,
        destinationInput: "text",
      }),
    ],
  });

  const json = JSON.parse(JSON.stringify(build.toOAS(topology)));
  const rebuilt = build.fromOAS(json);

  expect(rebuilt.dataFlowConnections?.length).toBe(1);
  const e = rebuilt.dataFlowConnections![0];
  expect(e.sourceOutput).toBe("text");
  expect(e.destinationInput).toBe("text");
  expect((e.sourceNode as { id: string }).id).toBe(start.id);
});

// ─────────────────────────────────────────────────────────────────────────
// 5b. Tool zoo round-trip — Agent with mixed Server/Client/Remote/Builtin/Mcp
//     tools and an MCPToolBox. Verifies that each variant's per-kind fields
//     survive a build.toOAS → JSON.stringify → JSON.parse → build.fromOAS cycle.
// ─────────────────────────────────────────────────────────────────────────
Deno.test("oas — agent tool zoo round-trips (Server/Client/Remote/Builtin/Mcp + Toolbox)", () => {
  const transport = mcp.transport.stdio({
    name: "echo-mcp",
    command: "node",
    args: ["echo-server.js"],
  });
  const boxTransport = mcp.transport.http({
    name: "github-mcp",
    url: "https://mcp.github.example/sse",
  });

  const agent = build.agent({
    name: "kitchen_sink",
    // BuiltinTool routing is handled by the SDK; no apiType field
    // needed.
    llmConfig: openai,
    systemPromptTemplate: "Answer the question. {{q}}",
    inputSchema: z.object({ q: z.string() }),
    outputSchema: z.object({ answer: z.string() }),
    tools: [
      tool.server({
        name: "calc",
        paramsSchema: z.object({ n: z.number() }),
        execute: ({ n }) => n * 2,
      }),
      tool.client({
        name: "pick_file",
        paramsSchema: z.object({ accept: z.string() }),
      }),
      tool.remote({
        name: "get_user",
        url: "https://api.example.test/users/{{id}}",
        httpMethod: "GET",
        headers: { Accept: "application/json" },
      }),
      tool.builtin({
        name: "search",
        toolType: "web_search",
        configuration: { search_context_size: "medium" },
      }),
      mcp.tool({ name: "echo", clientTransport: transport }),
    ],
    toolboxes: [
      tool.box({
        name: "github",
        clientTransport: boxTransport,
        toolFilter: ["search_repos"],
      }),
    ],
  });
  const agentNode = build.agentNode({ name: "agent", agent });

  const start = build.start({
    name: "start",
    inputSchema: z.object({ q: z.string() }),
  });
  const end = build.end({
    name: "end",
    outputSchema: z.object({ answer: z.string() }),
  });
  const topology = build.create({
    id: "TOOL_ZOO",
    name: "TOOL_ZOO",
    startNode: start,
    endNode: end,
    nodes: [start, agentNode, end],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->a", fromNode: start, toNode: agentNode }),
      build.controlFlowEdge({ name: "a->e", fromNode: agentNode, toNode: end }),
    ],
  });

  // Round-trip through JSON to flush out anything that doesn't serialize.
  const json = JSON.parse(JSON.stringify(build.toOAS(topology)));
  const rebuilt = build.fromOAS(json);

  // Pull the rebuilt agent node back out.
  const rebuiltAgentNode = rebuilt.nodes.find(
    (n) => (n as Record<string, unknown>).componentType === "AgentNode",
  ) as Record<string, unknown>;
  const rebuiltAgent = rebuiltAgentNode.agent as Record<string, unknown>;
  const rebuiltTools = rebuiltAgent.tools as Array<Record<string, unknown>>;
  const rebuiltBoxes = rebuiltAgent.toolboxes as Array<Record<string, unknown>>;

  // Every kind's componentType discriminator preserved.
  const kinds = rebuiltTools.map((t) => t.componentType);
  expect(kinds).toEqual([
    "ServerTool",
    "ClientTool",
    "RemoteTool",
    "BuiltinTool",
    "MCPTool",
  ]);

  // RemoteTool wire-shape fields preserved.
  const remote = rebuiltTools[2];
  expect(remote.url).toBe("https://api.example.test/users/{{id}}");
  expect(remote.httpMethod).toBe("GET");
  expect(remote.headers).toEqual({ Accept: "application/json" });

  // BuiltinTool config preserved.
  const builtin = rebuiltTools[3];
  expect(builtin.toolType).toBe("web_search");
  expect(builtin.configuration).toEqual({ search_context_size: "medium" });

  // McpTool clientTransport preserved (the discriminated union round-trips
  // as a plain JSON object).
  const mcpTool = rebuiltTools[4];
  const mcpTransport = mcpTool.clientTransport as Record<string, unknown>;
  expect(mcpTransport.componentType).toBe("StdioTransport");
  expect(mcpTransport.command).toBe("node");

  // Toolbox round-trips with its filter.
  expect(rebuiltBoxes.length).toBe(1);
  const box = rebuiltBoxes[0];
  expect(box.componentType).toBe("MCPToolBox");
  expect(box.toolFilter).toEqual(["search_repos"]);

  // ServerTool's execute() must be a throwing stub since functions can't
  // round-trip — invoking it after build.fromOAS should fail with a clear
  // "re-attach" message.
  const server = rebuiltTools[0] as { execute: () => void };
  let thrown: unknown;
  try {
    server.execute();
  } catch (e) {
    thrown = e;
  }
  expect(thrown).toBeInstanceOf(Error);
  expect(String((thrown as Error).message)).toMatch(/re-attach/);
});

// ─────────────────────────────────────────────────────────────────────────
// 6. BranchingNode round-trip preserves the mapping.
// ─────────────────────────────────────────────────────────────────────────
Deno.test("oas — BranchingNode mapping round-trips", () => {
  const start = build.start({
    name: "start",
    inputSchema: z.object({ kind: z.string() }),
  });
  const branch = build.branching({
    name: "branch",
    mapping: { urgent: "urgent", routine: "routine" },
    inputs: [{
      jsonSchema: { title: "kind", type: "string" },
      title: "kind",
      type: "string",
    }],
  });
  const end = build.end({
    name: "end",
    outputSchema: z.object({ kind: z.string() }),
  });
  const topology = build.create({
    id: "WITH_BRANCH",
    name: "WITH_BRANCH",
    startNode: start,
    endNode: end,
    nodes: [start, branch, end],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->b", fromNode: start, toNode: branch }),
      build.controlFlowEdge({
        name: "b->e:urgent",
        fromNode: branch,
        toNode: end,
        fromBranch: "urgent",
      }),
      build.controlFlowEdge({
        name: "b->e:routine",
        fromNode: branch,
        toNode: end,
        fromBranch: "routine",
      }),
    ],
  });

  const json = JSON.parse(JSON.stringify(build.toOAS(topology)));
  const rebuilt = build.fromOAS(json);

  const rebuiltBranch = rebuilt.nodes.find(
    (n) => (n as Record<string, unknown>).componentType === "BranchingNode",
  ) as Record<string, unknown>;
  expect(rebuiltBranch.mapping).toEqual({ urgent: "urgent", routine: "routine" });
});

// ─────────────────────────────────────────────────────────────────────────
// 6b. SandboxAgent round-trip — verifies the SDK-shape passthrough split
//     (ADR-0004): `defaultManifest` (plain JSON) + `runAs` (string) survive;
//     `capabilities` (SDK class instances) are dropped by build.toOAS and
//     re-attached by callers after build.fromOAS.
// ─────────────────────────────────────────────────────────────────────────
Deno.test("oas — SandboxAgentNode round-trips manifest + runAs; capabilities dropped (class instances)", () => {
  const manifest = {
    entries: {
      data: sandbox.localDir({ src: "/tmp/data" }),
      repo: sandbox.gitRepo({ repo: "openai/openai-agents-js", ref: "main" }),
    },
  };
  const sandboxAgent = build.sandboxAgent({
    name: "workspace",
    llmConfig: openai,
    systemPromptTemplate: "Inspect {{path}}",
    inputSchema: z.object({ path: z.string() }),
    defaultManifest: manifest,
    capabilities: [
      sandbox.capability.filesystem(),
      sandbox.capability.shell(),
      sandbox.capability.skills({
        skills: [{
          name: "csv",
          description: "csv work",
          content: "# CSV summarizer",
        }],
      }),
    ],
    runAs: "agent",
  });
  const sandboxNode = build.sandboxAgentNode({
    name: "workspace",
    agent: sandboxAgent,
  });

  const start = build.start({
    name: "start",
    inputSchema: z.object({ path: z.string() }),
  });
  const end = build.end({
    name: "end",
    outputSchema: z.object({ summary: z.string() }),
  });
  const topology = build.create({
    id: "SANDBOX_WORKSPACE",
    name: "SANDBOX_WORKSPACE",
    startNode: start,
    endNode: end,
    nodes: [start, sandboxNode, end],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->a", fromNode: start, toNode: sandboxNode }),
      build.controlFlowEdge({ name: "a->e", fromNode: sandboxNode, toNode: end }),
    ],
  });

  const json = JSON.parse(JSON.stringify(build.toOAS(topology)));
  const rebuilt = build.fromOAS(json);

  const rebuiltNode = rebuilt.nodes.find(
    (n) => (n as Record<string, unknown>).componentType === "SandboxAgentNode",
  ) as Record<string, unknown>;
  expect(rebuiltNode.componentType).toBe("SandboxAgentNode");
  const rebuiltAgent = rebuiltNode.agent as Record<string, unknown>;
  expect(rebuiltAgent.componentType).toBe("SandboxAgent");
  expect(rebuiltAgent.runAs).toBe("agent");

  // Manifest entries kept the SDK's `type` discriminator.
  const rebuiltManifest = rebuiltAgent.defaultManifest as {
    entries: Record<string, { type: string; src?: string; repo?: string }>;
  };
  expect(rebuiltManifest.entries.data.type).toBe("local_dir");
  expect(rebuiltManifest.entries.data.src).toBe("/tmp/data");
  expect(rebuiltManifest.entries.repo.type).toBe("git_repo");
  expect(rebuiltManifest.entries.repo.repo).toBe("openai/openai-agents-js");

  // Capabilities are SDK class instances that JSON.stringify can't
  // preserve. The deserialized agent has `capabilities: undefined` —
  // an honest "re-attach me" signal, parallel to ServerTool.execute.
  expect(rebuiltAgent.capabilities).toBeUndefined();
});

// ─────────────────────────────────────────────────────────────────────────
// 7. Real-API: deserialized topology runs end-to-end against gpt-5.4-nano.
// ─────────────────────────────────────────────────────────────────────────
aiTest({
  name: "oas — deserialized topology runs identically against the real API",
  ignore: !Deno.env.get("OPENAI_API_KEY"),
  async fn() {
    const original = buildTopology();
    const json = JSON.parse(JSON.stringify(build.toOAS(original)));
    // deno-lint-ignore no-explicit-any
    const rebuilt = build.fromOAS(json) as any;

    const out = await ai.evaluate({
      topology: rebuilt,
      input: { note: "Patient reports severe chest pain radiating to left arm." },
      includeUsage: false,
    });

    // build.fromOAS strips the phantom type params (Topology<unknown, unknown>),
    // so we cast at the assertion boundary. The runtime shape is whatever
    // the strict JSON-Schema output produced, which we validate here.
    const typed = out as { severity: string; confidence: number };
    expect(["mild", "moderate", "severe"]).toContain(typed.severity);
    expect(typeof typed.confidence).toBe("number");
    expect(typed.confidence).toBeGreaterThanOrEqual(0);
    expect(typed.confidence).toBeLessThanOrEqual(1);
  },
});
