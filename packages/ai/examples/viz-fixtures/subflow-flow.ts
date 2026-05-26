// Viz fixture: FlowNode embedding a published Concept.
//
// Stresses container rendering for a pure subflow (no failure branch).
// Models the "embed a cited concept verbatim" pattern.


import { build } from "../../mod.ts";
import { z } from "zod";


const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

// ─── Inner concept: extract ICD-10 codes ─────────────────────────────────
const innerStart = build.start({
  name: "icd_start",
  inputSchema: z.object({ note: z.string() }),
});
const extract = build.agentNode({
  name: "extract_icd10",
  agent: build.agent({
    name: "extract_icd10",
    llmConfig: nano,
    systemPromptTemplate: `Extract any ICD-10 codes referenced or implied by this note.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ codes: z.array(z.string()) }),
  }),
});
const innerEnd = build.end({
  name: "icd_end",
  outputSchema: z.object({ codes: z.array(z.string()) }),
});

const EXTRACT_ICD10 = build.create({
  id: "EXTRACT_ICD10",
  name: "EXTRACT_ICD10",
  version: "2.1.0",
  citation: "Menchaca et al., 2026 (tidy-ts/ai)",
  startNode: innerStart,
  endNode: innerEnd,
  nodes: [innerStart, extract, innerEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->e", fromNode: innerStart, toNode: extract }),
    build.controlFlowEdge({ name: "e->end", fromNode: extract, toNode: innerEnd }),
  ],
});

// ─── Outer: embed the concept as one node ────────────────────────────────
const outerStart = build.start({
  name: "start",
  inputSchema: z.object({ note: z.string() }),
});

const extractIcdNode = build.flow({
  name: "icd_extraction",
  subflow: EXTRACT_ICD10,
});

const summarize = build.agentNode({
  name: "summarize_codes",
  agent: build.agent({
    name: "summarize_codes",
    llmConfig: nano,
    systemPromptTemplate: `Summarize the extracted ICD-10 codes as a one-sentence clinical impression.\n\nCodes: {{codes}}`,
    inputSchema: z.object({ codes: z.array(z.string()) }),
    outputSchema: z.object({ impression: z.string() }),
  }),
});

const outerEnd = build.end({
  name: "end",
  outputSchema: z.object({
    codes: z.array(z.string()),
    impression: z.string(),
  }),
});

export default build.create({
  id: "ICD10_WITH_IMPRESSION",
  name: "ICD10_WITH_IMPRESSION",
  version: "1.0.0",
  startNode: outerStart,
  endNode: outerEnd,
  nodes: [outerStart, extractIcdNode, summarize, outerEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->icd", fromNode: outerStart, toNode: extractIcdNode }),
    build.controlFlowEdge({ name: "icd->sum", fromNode: extractIcdNode, toNode: summarize }),
    build.controlFlowEdge({ name: "sum->end", fromNode: summarize, toNode: outerEnd }),
  ],
  dataFlowConnections: [
    // start.note → flow's subflow start is implicit.
    build.dataFlowEdge({
      name: "icd.codes->sum.codes",
      sourceNode: extractIcdNode, sourceOutput: "codes",
      destinationNode: summarize, destinationInput: "codes",
    }),
  ],
});
