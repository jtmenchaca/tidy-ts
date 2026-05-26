// Viz fixture: Agent with both ServerTools and an MCPToolBox.
//
// Stresses the agent's tool surface beyond hand-declared ServerTools.
// An MCPToolBox doesn't ship a static `inputs`/`outputs` shape — it
// connects to a server at runtime and expands into whatever tools the
// server exposes (optionally filtered). The viz should be honest about
// that: render the toolbox as a single row that names the box + its
// connection, not as a fake "tool" with empty signature.

import { build, mcp, tool } from "../../mod.ts";
import { z } from "zod";

const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

// A concrete ServerTool the agent calls directly.
const summarize = tool.server({
  name: "summarize_findings",
  description: "Produce a one-sentence summary of the findings array.",
  paramsSchema: z.object({ findings: z.array(z.string()) }),
  resultSchema: z.object({ summary: z.string() }),
  execute: () => ({ summary: "" }),
});

// An MCPToolBox that connects to a PubMed MCP server. At runtime the
// agent gets to call any tool the server exposes; we filter to two.
const pubmedBox = tool.box({
  name: "pubmed",
  description: "PubMed MCP server — search and fetch articles.",
  clientTransport: mcp.transport.stdio({
    name: "pubmed_stdio",
    command: "pubmed-mcp",
    args: [],
  }),
  toolFilter: ["search_pubmed", "fetch_abstracts"],
});

const researcher = build.agentNode({
  name: "literature_lookup",
  agent: build.agent({
    name: "literature_lookup",
    llmConfig: nano,
    systemPromptTemplate:
      "Given a clinical condition, search PubMed for recent reviews, " +
      "fetch their abstracts, and produce a one-sentence summary.",
    inputSchema: z.object({ condition: z.string() }),
    outputSchema: z.object({
      pmids: z.array(z.string()),
      summary: z.string(),
    }),
    tools: [summarize],
    toolboxes: [pubmedBox],
    maxToolTurns: 20,
  }),
});

const start = build.start({
  name: "start",
  inputSchema: z.object({ condition: z.string() }),
});

const end = build.end({
  name: "end",
  outputSchema: z.object({
    pmids: z.array(z.string()),
    summary: z.string(),
  }),
});

export default build.create({
  id: "LITERATURE_LOOKUP",
  name: "LITERATURE_LOOKUP",
  version: "1.0.0",
  startNode: start,
  endNode: end,
  nodes: [start, researcher, end],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->r", fromNode: start, toNode: researcher }),
    build.controlFlowEdge({ name: "r->e", fromNode: researcher, toNode: end }),
  ],
});
