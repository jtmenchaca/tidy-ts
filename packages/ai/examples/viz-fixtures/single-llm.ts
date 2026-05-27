// Viz fixture: the smallest possible meaningful topology — one LLM call.
//
// Stresses the minimum-viable layout. Three nodes, two control edges,
// one data hop. Useful as a control sample to see how empty space looks
// in the diagram.


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

const end = build.end({
  name: "end",
  outputSchema: z.object({ summary: z.string() }),
});

export default build.create({
  id: "ONE_LINE_SUMMARY",
  name: "ONE_LINE_SUMMARY",
  version: "1.0.0",
  startNode: start,
  endNode: end,
  nodes: [start, summarize, end],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->l", fromNode: start, toNode: summarize }),
    build.controlFlowEdge({ name: "l->e", fromNode: summarize, toNode: end }),
  ],
  dataFlowConnections: [
    build.dataFlowEdge({
      name: "start.note->summarize.note",
      sourceNode: start, sourceOutput: "note",
      destinationNode: summarize, destinationInput: "note",
    }),
    build.dataFlowEdge({
      name: "summarize.summary->end.summary",
      sourceNode: summarize, sourceOutput: "summary",
      destinationNode: end, destinationInput: "summary",
    }),
  ],
});
