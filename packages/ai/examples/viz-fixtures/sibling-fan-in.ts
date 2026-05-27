// Viz fixture: two off-spine nodes producing values that re-converge
// into a single downstream node.
//
// Stresses: data flow edges where source is off-spine. The viz currently
// routes data edges port-to-port; this fixture tests that off-spine
// sources route cleanly.
//
// Workflow: extract symptom + extract medication from the same note in
// parallel side-branches, then a downstream node consumes both.


import { build } from "../../mod.ts";
import { z } from "zod";


const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

const start = build.start({
  name: "start",
  inputSchema: z.object({ note: z.string() }),
});

// Pre-process node that exists only because Start must have a single
// outgoing control edge — it's a tee that downstream siblings branch off.
const tee = build.agentNode({
  name: "ingest",
  agent: build.agent({
    name: "ingest",
    llmConfig: nano,
    systemPromptTemplate: `Echo the note back unchanged so downstream extractors can run.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ note: z.string() }),
  }),
});

const symptom = build.agentNode({
  name: "extract_symptom",
  agent: build.agent({
    name: "extract_symptom",
    llmConfig: nano,
    systemPromptTemplate: `Extract the dominant symptom.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ symptom: z.string() }),
  }),
});

const med = build.agentNode({
  name: "extract_medication",
  agent: build.agent({
    name: "extract_medication",
    llmConfig: nano,
    systemPromptTemplate: `Extract any current medication.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ medication: z.string() }),
  }),
});

const synthesize = build.agentNode({
  name: "synthesize",
  agent: build.agent({
    name: "synthesize",
    llmConfig: nano,
    systemPromptTemplate: `Given symptom and medication, produce a one-line impression.\n\nSymptom: {{symptom}}\nMedication: {{medication}}`,
    inputSchema: z.object({ symptom: z.string(), medication: z.string() }),
    outputSchema: z.object({ impression: z.string() }),
  }),
});

const end = build.end({
  name: "end",
  outputSchema: z.object({ impression: z.string() }),
});

export default build.create({
  id: "FAN_OUT_THEN_SYNTHESIZE",
  name: "FAN_OUT_THEN_SYNTHESIZE",
  version: "1.0.0",
  startNode: start,
  endNode: end,
  nodes: [start, tee, symptom, med, synthesize, end],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->t", fromNode: start, toNode: tee }),
    build.controlFlowEdge({ name: "t->sym", fromNode: tee, toNode: symptom }),
    build.controlFlowEdge({ name: "t->med", fromNode: tee, toNode: med }),
    build.controlFlowEdge({ name: "sym->syn", fromNode: symptom, toNode: synthesize }),
    build.controlFlowEdge({ name: "med->syn", fromNode: med, toNode: synthesize }),
    build.controlFlowEdge({ name: "syn->e", fromNode: synthesize, toNode: end }),
  ],
  dataFlowConnections: [
    build.dataFlowEdge({
      name: "start.note->tee.note",
      sourceNode: start, sourceOutput: "note",
      destinationNode: tee, destinationInput: "note",
    }),
    build.dataFlowEdge({
      name: "tee.note->sym.note",
      sourceNode: tee, sourceOutput: "note",
      destinationNode: symptom, destinationInput: "note",
    }),
    build.dataFlowEdge({
      name: "tee.note->med.note",
      sourceNode: tee, sourceOutput: "note",
      destinationNode: med, destinationInput: "note",
    }),
    build.dataFlowEdge({
      name: "sym.symptom->syn.symptom",
      sourceNode: symptom, sourceOutput: "symptom",
      destinationNode: synthesize, destinationInput: "symptom",
    }),
    build.dataFlowEdge({
      name: "med.medication->syn.medication",
      sourceNode: med, sourceOutput: "medication",
      destinationNode: synthesize, destinationInput: "medication",
    }),
    build.dataFlowEdge({
      name: "syn.impression->end.impression",
      sourceNode: synthesize, sourceOutput: "impression",
      destinationNode: end, destinationInput: "impression",
    }),
  ],
});
