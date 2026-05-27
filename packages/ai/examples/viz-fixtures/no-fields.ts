// Viz fixture: nodes with no inputs and no outputs (a checkpoint pattern).
//
// Stresses the layout when a card has no fields to size against. Width
// should fall back to header-content width; height should not collapse
// to zero.
//
// Workflow: two LLM steps with checkpoint nodes between them that have
// no schema (they're declared with empty `inputs`/`outputs` to model an
// audit-log / side-effect node).


import { build } from "../../mod.ts";
import { z } from "zod";


const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

const start = build.start({
  name: "start",
  inputSchema: z.object({ note: z.string() }),
});

const step1 = build.agentNode({
  name: "step1",
  agent: build.agent({
    name: "step1",
    llmConfig: nano,
    systemPromptTemplate: `Process the note.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ result: z.string() }),
  }),
});

// A nodeless checkpoint — declared via an LlmNode that produces nothing
// new (its schemas declare no fields). Models a "log it, move on" step.
const checkpoint = build.agentNode({
  name: "audit_checkpoint",
  agent: build.agent({
    name: "audit_checkpoint",
    llmConfig: nano,
    systemPromptTemplate: `Acknowledge the result for audit purposes.\n\n`,
    inputSchema: z.object({}),
    outputSchema: z.object({}),
    inputs: [],
    outputs: [],
  }),
});

const step2 = build.agentNode({
  name: "step2",
  agent: build.agent({
    name: "step2",
    llmConfig: nano,
    systemPromptTemplate: `Finalize the result.\n\nResult: {{result}}`,
    inputSchema: z.object({ result: z.string() }),
    outputSchema: z.object({ final: z.string() }),
  }),
});

const end = build.end({
  name: "end",
  outputSchema: z.object({ final: z.string() }),
});

export default build.create({
  id: "WITH_CHECKPOINT",
  name: "WITH_CHECKPOINT",
  version: "1.0.0",
  startNode: start,
  endNode: end,
  nodes: [start, step1, checkpoint, step2, end],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->1", fromNode: start, toNode: step1 }),
    build.controlFlowEdge({ name: "1->cp", fromNode: step1, toNode: checkpoint }),
    build.controlFlowEdge({ name: "cp->2", fromNode: checkpoint, toNode: step2 }),
    build.controlFlowEdge({ name: "2->e", fromNode: step2, toNode: end }),
  ],
  dataFlowConnections: [
    build.dataFlowEdge({
      name: "start.note->step1.note",
      sourceNode: start, sourceOutput: "note",
      destinationNode: step1, destinationInput: "note",
    }),
    build.dataFlowEdge({
      name: "step1.result->step2.result",
      sourceNode: step1, sourceOutput: "result",
      destinationNode: step2, destinationInput: "result",
    }),
    build.dataFlowEdge({
      name: "step2.final->end.final",
      sourceNode: step2, sourceOutput: "final",
      destinationNode: end, destinationInput: "final",
    }),
  ],
});
