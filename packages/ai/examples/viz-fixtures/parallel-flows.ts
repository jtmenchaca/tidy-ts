// Viz fixture: ParallelFlowNode running two independent subflows.
//
// Stresses: a single node containing multiple sibling subflows. The viz
// needs to render both subflows side-by-side (or stacked) inside the
// container, with the concurrency cap shown somewhere.
//
// Workflow: fan-out a clinical note to two independent analyses
// (sentiment of the note's narrative + extraction of vital signs), then
// merge the results.


import { build } from "../../mod.ts";
import { z } from "zod";


const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

// ─── Subflow A: sentiment ────────────────────────────────────────────────
const sStart = build.start({
  name: "s_start",
  inputSchema: z.object({ note: z.string() }),
});
const sentiment = build.agentNode({
  name: "score_sentiment",
  agent: build.agent({
    name: "score_sentiment",
    llmConfig: nano,
    systemPromptTemplate: `Score the sentiment of this clinical note from -1 (negative) to 1 (positive).\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ sentiment: z.number() }),
  }),
});
const sEnd = build.end({
  name: "s_end",
  outputSchema: z.object({ sentiment: z.number() }),
});
const SENTIMENT = build.create({
  id: "NOTE_SENTIMENT",
  name: "NOTE_SENTIMENT",
  version: "1.0.0",
  startNode: sStart,
  endNode: sEnd,
  nodes: [sStart, sentiment, sEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->n", fromNode: sStart, toNode: sentiment }),
    build.controlFlowEdge({ name: "n->e", fromNode: sentiment, toNode: sEnd }),
  ],
});

// ─── Subflow B: extract vitals ──────────────────────────────────────────
const vStart = build.start({
  name: "v_start",
  inputSchema: z.object({ note: z.string() }),
});
const vitals = build.agentNode({
  name: "extract_vitals",
  agent: build.agent({
    name: "extract_vitals",
    llmConfig: nano,
    systemPromptTemplate: `Extract structured vital signs from this note.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({
    bp_systolic: z.number().nullable(),
    bp_diastolic: z.number().nullable(),
    heart_rate: z.number().nullable(),
  }),
  }),
});
const vEnd = build.end({
  name: "v_end",
  outputSchema: z.object({
    bp_systolic: z.number().nullable(),
    bp_diastolic: z.number().nullable(),
    heart_rate: z.number().nullable(),
  }),
});
const VITALS = build.create({
  id: "EXTRACT_VITALS",
  name: "EXTRACT_VITALS",
  version: "1.0.0",
  startNode: vStart,
  endNode: vEnd,
  nodes: [vStart, vitals, vEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->v", fromNode: vStart, toNode: vitals }),
    build.controlFlowEdge({ name: "v->e", fromNode: vitals, toNode: vEnd }),
  ],
});

// ─── Outer ───────────────────────────────────────────────────────────────
const outerStart = build.start({
  name: "start",
  inputSchema: z.object({ note: z.string() }),
});

const fanOut = build.parallelFlow({
  name: "analyze_in_parallel",
  subflows: [SENTIMENT, VITALS],
  concurrency: 2,
  inputs: [{
    jsonSchema: { title: "note", type: "string" },
    title: "note",
    type: "string",
  }],
  outputs: [
    { jsonSchema: { title: "sentiment", type: "number" }, title: "sentiment", type: "number" },
    { jsonSchema: { title: "bp_systolic", type: "number" }, title: "bp_systolic", type: "number" },
    { jsonSchema: { title: "bp_diastolic", type: "number" }, title: "bp_diastolic", type: "number" },
    { jsonSchema: { title: "heart_rate", type: "number" }, title: "heart_rate", type: "number" },
  ],
});

const outerEnd = build.end({
  name: "end",
  outputSchema: z.object({
    sentiment: z.number(),
    bp_systolic: z.number().nullable(),
    bp_diastolic: z.number().nullable(),
    heart_rate: z.number().nullable(),
  }),
});

export default build.create({
  id: "NOTE_ANALYSIS_PARALLEL",
  name: "NOTE_ANALYSIS_PARALLEL",
  version: "1.0.0",
  startNode: outerStart,
  endNode: outerEnd,
  nodes: [outerStart, fanOut, outerEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->p", fromNode: outerStart, toNode: fanOut }),
    build.controlFlowEdge({ name: "p->e", fromNode: fanOut, toNode: outerEnd }),
  ],
  dataFlowConnections: [
    build.dataFlowEdge({
      name: "start.note->fanOut.note",
      sourceNode: outerStart, sourceOutput: "note",
      destinationNode: fanOut, destinationInput: "note",
    }),
  ],
});
