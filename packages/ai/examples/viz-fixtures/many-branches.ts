// Viz fixture: a BranchingNode with 4 outgoing branches.
//
// Stresses branch-label rendering when several labels exit the same
// source node. Right now branch labels float above their destination
// node tops — with 4 destinations stacking vertically, they should not
// collide.
//
// Workflow: classify a clinical note into one of four document types,
// route to a type-specific extractor.


import { build } from "../../mod.ts";
import { z } from "zod";


const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

const DocType = z.enum(["progress", "discharge", "admission", "consult"]);

const start = build.start({
  name: "start",
  inputSchema: z.object({ note: z.string() }),
});

const classify = build.agentNode({
  name: "classify_doc",
  agent: build.agent({
    name: "classify_doc",
    llmConfig: nano,
    systemPromptTemplate: `Classify the clinical note's document type.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ doc_type: DocType }),
  }),
});

const branch = build.branching({
  name: "branch_on_doc",
  mapping: {
    progress: "progress",
    discharge: "discharge",
    admission: "admission",
    consult: "consult",
  },
  inputs: [{
    jsonSchema: { title: "doc_type", type: "string" },
    title: "doc_type",
    type: "string",
  }],
});

function extractor(name: string, systemPrompt: string) {
  return build.agentNode({
    name: name,
    agent: build.agent({
      name: name,
      llmConfig: nano,
      systemPromptTemplate: `${systemPrompt}\n\n${"Note: {{note}}"}`,
      inputSchema: z.object({ note: z.string() }),
      outputSchema: z.object({ summary: z.string() }),
    }),
  });
}

const progress = extractor("extract_progress", "Summarize the progress note.");
const discharge = extractor("extract_discharge", "Summarize the discharge note.");
const admission = extractor("extract_admission", "Summarize the admission note.");
const consult = extractor("extract_consult", "Summarize the consult note.");

const end = build.end({
  name: "end",
  outputSchema: z.object({
    doc_type: DocType,
    summary: z.string(),
  }),
});

export default build.create({
  id: "ROUTE_BY_DOC_TYPE",
  name: "ROUTE_BY_DOC_TYPE",
  version: "1.0.0",
  startNode: start,
  endNode: end,
  nodes: [start, classify, branch, progress, discharge, admission, consult, end],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->c", fromNode: start, toNode: classify }),
    build.controlFlowEdge({ name: "c->b", fromNode: classify, toNode: branch }),
    build.controlFlowEdge({
      name: "b->prog", fromNode: branch, toNode: progress, fromBranch: "progress",
    }),
    build.controlFlowEdge({
      name: "b->disch", fromNode: branch, toNode: discharge, fromBranch: "discharge",
    }),
    build.controlFlowEdge({
      name: "b->admit", fromNode: branch, toNode: admission, fromBranch: "admission",
    }),
    build.controlFlowEdge({
      name: "b->cons", fromNode: branch, toNode: consult, fromBranch: "consult",
    }),
    build.controlFlowEdge({ name: "prog->e", fromNode: progress, toNode: end }),
    build.controlFlowEdge({ name: "disch->e", fromNode: discharge, toNode: end }),
    build.controlFlowEdge({ name: "admit->e", fromNode: admission, toNode: end }),
    build.controlFlowEdge({ name: "cons->e", fromNode: consult, toNode: end }),
  ],
  dataFlowConnections: [
    build.dataFlowEdge({
      name: "classify.doc_type->branch.doc_type",
      sourceNode: classify, sourceOutput: "doc_type",
      destinationNode: branch, destinationInput: "doc_type",
    }),
  ],
});
