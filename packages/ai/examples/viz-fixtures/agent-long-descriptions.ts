// Viz fixture: AgentNode whose tools have intentionally long descriptions.
//
// Stresses the tool-row renderer's handling of multi-line text. The
// current renderer puts each description on a single line, so an
// overlong description overflows the tools panel to the right.

import { build, tool } from "../../mod.ts";
import { z } from "zod";

const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

const lookupRxcui = tool.server({
  name: "lookup_rxcui",
  description:
    "Resolve a free-text drug name to its RxCUI concept identifier by querying the NLM RxNorm REST API; falls back to approximate-match search when the exact name is not found and returns null for ambiguous queries.",
  paramsSchema: z.object({ name: z.string() }),
  resultSchema: z.object({ rxcui: z.string().nullable() }),
  execute: () => ({ rxcui: null }),
});

const findRelated = tool.server({
  name: "find_related_concepts",
  description:
    "Given an RxCUI, return semantically related concepts (e.g. ingredient, dose form, brand name) using NLM's published relationship taxonomy; supports optional term-type and relationship filters.",
  paramsSchema: z.object({
    rxcui: z.string(),
    rel: z.string().optional(),
    tty: z.string().optional(),
  }),
  resultSchema: z.object({ related: z.array(z.string()) }),
  execute: () => ({ related: [] }),
});

const writeReport = tool.server({
  name: "write_report",
  description: "Write a one-line clinical impression to the patient record.",
  paramsSchema: z.object({ patient_id: z.string(), text: z.string() }),
  resultSchema: z.object({ written: z.boolean() }),
  execute: () => ({ written: true }),
});

const start = build.start({
  name: "start",
  inputSchema: z.object({ drug_name: z.string(), patient_id: z.string() }),
});

const research = build.agentNode({
  name: "investigate_drug",
  agent: build.agent({
    name: "investigate_drug",
    llmConfig: nano,
    systemPromptTemplate:
      "Investigate the drug, summarize what it is, and write a one-line clinical impression to the patient record.",
    inputSchema: z.object({ drug_name: z.string(), patient_id: z.string() }),
    outputSchema: z.object({ summary: z.string(), written: z.boolean() }),
    tools: [lookupRxcui, findRelated, writeReport],
  }),
});

const end = build.end({
  name: "end",
  outputSchema: z.object({ summary: z.string(), written: z.boolean() }),
});

export default build.create({
  id: "INVESTIGATE_DRUG_LONG_DESCRIPTIONS",
  name: "INVESTIGATE_DRUG_LONG_DESCRIPTIONS",
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
      name: "start.drug_name->r.drug_name",
      sourceNode: start, sourceOutput: "drug_name",
      destinationNode: research, destinationInput: "drug_name",
    }),
    build.dataFlowEdge({
      name: "start.patient_id->r.patient_id",
      sourceNode: start, sourceOutput: "patient_id",
      destinationNode: research, destinationInput: "patient_id",
    }),
    build.dataFlowEdge({
      name: "r.summary->end.summary",
      sourceNode: research, sourceOutput: "summary",
      destinationNode: end, destinationInput: "summary",
    }),
    build.dataFlowEdge({
      name: "r.written->end.written",
      sourceNode: research, sourceOutput: "written",
      destinationNode: end, destinationInput: "written",
    }),
  ],
});
