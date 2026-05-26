// Viz fixture: pure control flow, no data-flow edges.
//
// Stresses: a topology where every node passes data implicitly (the
// runner auto-threads matching input/output names). No dashed data
// arches should render. Useful baseline for "what does the diagram
// look like when control flow is the entire story?"


import { build } from "../../mod.ts";
import { z } from "zod";


const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

const start = build.start({
  name: "start",
  inputSchema: z.object({ note: z.string() }),
});

const summarize = build.agentNode({
  name: "summarize",
  agent: build.agent({
    name: "summarize",
    llmConfig: nano,
    systemPromptTemplate: `Summarize the note in one sentence.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ summary: z.string() }),
  }),
});

const score = build.agentNode({
  name: "score_quality",
  agent: build.agent({
    name: "score_quality",
    llmConfig: nano,
    systemPromptTemplate: `Score the summary's quality from 0 to 1.\n\nSummary: {{summary}}`,
    inputSchema: z.object({ summary: z.string() }),
    outputSchema: z.object({ summary: z.string(), quality: z.number() }),
  }),
});

const end = build.end({
  name: "end",
  outputSchema: z.object({ summary: z.string(), quality: z.number() }),
});

export default build.create({
  id: "SUMMARIZE_AND_SCORE",
  name: "SUMMARIZE_AND_SCORE",
  version: "1.0.0",
  startNode: start,
  endNode: end,
  nodes: [start, summarize, score, end],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->sum", fromNode: start, toNode: summarize }),
    build.controlFlowEdge({ name: "sum->sc", fromNode: summarize, toNode: score }),
    build.controlFlowEdge({ name: "sc->e", fromNode: score, toNode: end }),
  ],
  // No dataFlowConnections — every hop's input is inferred from the
  // preceding node's output by name.
});
