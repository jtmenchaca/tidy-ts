// Viz fixture: MapNode + ParallelMapNode in series.
//
// Stresses: per-item subflow rendering, the `iterateOver` field, the
// concurrency badge on ParallelMapNode.
//
// Workflow: chunk a long note into sentences (host node), then classify
// each sentence sequentially (MapNode), then extract entities from each
// sentence concurrently (ParallelMapNode), then collect.


import { build } from "../../mod.ts";
import { z } from "zod";


const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

// ─── Inner subflow: classify one sentence ────────────────────────────────
const classifyStart = build.start({
  name: "cls_start",
  inputSchema: z.object({ sentence: z.string() }),
});
const classify = build.agentNode({
  name: "classify_sentence",
  agent: build.agent({
    name: "classify_sentence",
    llmConfig: nano,
    systemPromptTemplate: `Classify the sentence as 'symptom', 'med', 'lab', or 'other'.\n\nSentence: {{sentence}}`,
    inputSchema: z.object({ sentence: z.string() }),
    outputSchema: z.object({
    kind: z.enum(["symptom", "med", "lab", "other"]),
  }),
  }),
});
const classifyEnd = build.end({
  name: "cls_end",
  outputSchema: z.object({ kind: z.enum(["symptom", "med", "lab", "other"]) }),
});

const CLASSIFY_SENTENCE = build.create({
  id: "CLASSIFY_SENTENCE",
  name: "CLASSIFY_SENTENCE",
  version: "1.0.0",
  startNode: classifyStart,
  endNode: classifyEnd,
  nodes: [classifyStart, classify, classifyEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->c", fromNode: classifyStart, toNode: classify }),
    build.controlFlowEdge({ name: "c->e", fromNode: classify, toNode: classifyEnd }),
  ],
});

// ─── Inner subflow: extract entities from one sentence ───────────────────
const entStart = build.start({
  name: "ent_start",
  inputSchema: z.object({ sentence: z.string() }),
});
const entExtract = build.agentNode({
  name: "extract_entities",
  agent: build.agent({
    name: "extract_entities",
    llmConfig: nano,
    systemPromptTemplate: `Extract all named entities from this sentence.\n\nSentence: {{sentence}}`,
    inputSchema: z.object({ sentence: z.string() }),
    outputSchema: z.object({ entities: z.array(z.string()) }),
  }),
});
const entEnd = build.end({
  name: "ent_end",
  outputSchema: z.object({ entities: z.array(z.string()) }),
});

const EXTRACT_ENTITIES = build.create({
  id: "EXTRACT_ENTITIES",
  name: "EXTRACT_ENTITIES",
  version: "1.0.0",
  startNode: entStart,
  endNode: entEnd,
  nodes: [entStart, entExtract, entEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->e", fromNode: entStart, toNode: entExtract }),
    build.controlFlowEdge({ name: "e->end", fromNode: entExtract, toNode: entEnd }),
  ],
});

// ─── Outer ───────────────────────────────────────────────────────────────
const start = build.start({
  name: "start",
  inputSchema: z.object({ sentences: z.array(z.string()) }),
});

const classifyMap = build.map({
  name: "classify_each",
  subflow: CLASSIFY_SENTENCE,
  iterateOver: "sentences",
  reducers: { kinds: "append" },
  inputs: [{
    jsonSchema: { title: "sentences", type: "array", items: { type: "string" } },
    title: "sentences",
    type: "array",
  }],
  outputs: [{
    jsonSchema: { title: "kinds", type: "array", items: { type: "string" } },
    title: "kinds",
    type: "array",
  }],
});

const entitiesMap = build.parallelMap({
  name: "entities_each",
  subflow: EXTRACT_ENTITIES,
  iterateOver: "sentences",
  concurrency: 6,
  reducers: { entities_per_sentence: "append" },
  inputs: [{
    jsonSchema: { title: "sentences", type: "array", items: { type: "string" } },
    title: "sentences",
    type: "array",
  }],
  outputs: [{
    jsonSchema: {
      title: "entities_per_sentence",
      type: "array",
      items: { type: "array", items: { type: "string" } },
    },
    title: "entities_per_sentence",
    type: "array",
  }],
});

const end = build.end({
  name: "end",
  outputSchema: z.object({
    kinds: z.array(z.string()),
    entities_per_sentence: z.array(z.array(z.string())),
  }),
});

export default build.create({
  id: "ANNOTATE_SENTENCES",
  name: "ANNOTATE_SENTENCES",
  version: "1.0.0",
  startNode: start,
  endNode: end,
  nodes: [start, classifyMap, entitiesMap, end],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->m1", fromNode: start, toNode: classifyMap }),
    build.controlFlowEdge({ name: "m1->m2", fromNode: classifyMap, toNode: entitiesMap }),
    build.controlFlowEdge({ name: "m2->e", fromNode: entitiesMap, toNode: end }),
  ],
  dataFlowConnections: [
    build.dataFlowEdge({
      name: "start.sentences->m1.sentences",
      sourceNode: start, sourceOutput: "sentences",
      destinationNode: classifyMap, destinationInput: "sentences",
    }),
    build.dataFlowEdge({
      name: "start.sentences->m2.sentences",
      sourceNode: start, sourceOutput: "sentences",
      destinationNode: entitiesMap, destinationInput: "sentences",
    }),
  ],
});
