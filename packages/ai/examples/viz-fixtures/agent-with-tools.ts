// Viz fixture: AgentNode whose Agent has tools.
//
// Stresses: agent rendering with a third "TOOLS" section (or whatever
// the viz settles on) below outputs. Each tool has its own param/result
// schema that ideally surfaces somehow.


import { build, tool } from "../../mod.ts";
import { z } from "zod";


const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

// ─── Tools ───────────────────────────────────────────────────────────────
const lookupRxcui = tool.server({
  name: "lookup_rxcui",
  description: "Find the RxCUI for a free-text drug name.",
  paramsSchema: z.object({ name: z.string() }),
  resultSchema: z.object({ rxcui: z.string().nullable() }),
  execute: () => ({ rxcui: null }),
});

const getDrugClasses = tool.server({
  name: "get_drug_classes",
  description: "Get ATC/MeSH/VA drug-class memberships for an RxCUI.",
  paramsSchema: z.object({ rxcui: z.string() }),
  resultSchema: z.object({ classes: z.array(z.string()) }),
  execute: () => ({ classes: [] }),
});

const searchPubmed = tool.server({
  name: "search_pubmed",
  description: "Search PubMed for articles matching a query.",
  paramsSchema: z.object({ query: z.string(), limit: z.number().optional() }),
  resultSchema: z.object({ pmids: z.array(z.string()) }),
  execute: () => ({ pmids: [] }),
});

// ─── Agent ───────────────────────────────────────────────────────────────
const drugResearcher = build.agent({
  name: "drug_researcher",
  llmConfig: nano,
  systemPromptTemplate:
    "You are a clinical research agent. Given a drug name, look up its RxCUI, " +
    "fetch its drug classes, and find relevant PubMed evidence. Return a short summary.",
  inputSchema: z.object({ drug_name: z.string() }),
  outputSchema: z.object({
    rxcui: z.string().nullable(),
    drug_classes: z.array(z.string()),
    pmids: z.array(z.string()),
    summary: z.string(),
  }),
  tools: [lookupRxcui, getDrugClasses, searchPubmed],
  maxToolTurns: 12,
});

// ─── Topology ────────────────────────────────────────────────────────────
const start = build.start({
  name: "start",
  inputSchema: z.object({ drug_name: z.string() }),
});

const research = build.agentNode({
  name: "research_drug",
  agent: drugResearcher,
});

const end = build.end({
  name: "end",
  outputSchema: z.object({
    rxcui: z.string().nullable(),
    drug_classes: z.array(z.string()),
    pmids: z.array(z.string()),
    summary: z.string(),
  }),
});

export default build.create({
  id: "DRUG_EVIDENCE_LOOKUP",
  name: "DRUG_EVIDENCE_LOOKUP",
  version: "1.0.0",
  startNode: start,
  endNode: end,
  nodes: [start, research, end],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->r", fromNode: start, toNode: research }),
    build.controlFlowEdge({ name: "r->e", fromNode: research, toNode: end }),
  ],
  dataFlowConnections: [
    build.dataFlowEdge({
      name: "start.drug_name->research.drug_name",
      sourceNode: start, sourceOutput: "drug_name",
      destinationNode: research, destinationInput: "drug_name",
    }),
    build.dataFlowEdge({
      name: "research.rxcui->end.rxcui",
      sourceNode: research, sourceOutput: "rxcui",
      destinationNode: end, destinationInput: "rxcui",
    }),
    build.dataFlowEdge({
      name: "research.drug_classes->end.drug_classes",
      sourceNode: research, sourceOutput: "drug_classes",
      destinationNode: end, destinationInput: "drug_classes",
    }),
    build.dataFlowEdge({
      name: "research.pmids->end.pmids",
      sourceNode: research, sourceOutput: "pmids",
      destinationNode: end, destinationInput: "pmids",
    }),
    build.dataFlowEdge({
      name: "research.summary->end.summary",
      sourceNode: research, sourceOutput: "summary",
      destinationNode: end, destinationInput: "summary",
    }),
  ],
});
