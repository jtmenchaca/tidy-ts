// Viz fixture: a realistic composite — Map over patients, with a
// CatchException-wrapped extraction concept inside the per-item subflow.
//
// Stresses several features at once:
//   - Outer ParallelMapNode that fans out one record per patient.
//   - Inside the per-patient subflow, a CatchExceptionNode wraps a
//     citable concept (the same extraction concept can be re-used
//     across studies).
//   - The outer topology threads a config through a side input.
//   - End collects per-patient results into an array.


import { build } from "../../mod.ts";
import { z } from "zod";


const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

// ─── Innermost citable concept: extract problems from one note ──────────
const ePStart = build.start({
  name: "ep_start",
  inputSchema: z.object({ note: z.string() }),
});
const ePLlm = build.agentNode({
  name: "extract_problems_llm",
  agent: build.agent({
    name: "extract_problems_llm",
    llmConfig: nano,
    systemPromptTemplate: `Extract structured clinical problems from this note.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ problems: z.array(z.string()) }),
  }),
});
const ePEnd = build.end({
  name: "ep_end",
  outputSchema: z.object({ problems: z.array(z.string()) }),
});
const EXTRACT_PROBLEMS = build.create({
  id: "EXTRACT_PROBLEMS",
  name: "EXTRACT_PROBLEMS",
  version: "3.0.0",
  citation: "Menchaca et al., 2026 (tidy-ts/ai)",
  startNode: ePStart,
  endNode: ePEnd,
  nodes: [ePStart, ePLlm, ePEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->l", fromNode: ePStart, toNode: ePLlm }),
    build.controlFlowEdge({ name: "l->e", fromNode: ePLlm, toNode: ePEnd }),
  ],
});

// ─── Per-patient subflow: try the concept, fall back on failure ─────────
const ppStart = build.start({
  name: "pp_start",
  inputSchema: z.object({ note: z.string() }),
});
const ppCatch = build.catchException({
  name: "try_extract",
  subflow: EXTRACT_PROBLEMS,
});
const ppFallback = build.agentNode({
  name: "fallback_problems",
  agent: build.agent({
    name: "fallback_problems",
    llmConfig: nano,
    systemPromptTemplate: `Extraction failed; produce { problems: [] }.\n\nException info: {{caught_exception_info}}`,
    inputSchema: z.object({ caught_exception_info: z.string().nullable() }),
    outputSchema: z.object({ problems: z.array(z.string()) }),
  }),
});
const ppEnd = build.end({
  name: "pp_end",
  outputSchema: z.object({ problems: z.array(z.string()) }),
});
const PER_PATIENT = build.create({
  id: "PER_PATIENT",
  name: "PER_PATIENT",
  version: "1.0.0",
  startNode: ppStart,
  endNode: ppEnd,
  nodes: [ppStart, ppCatch, ppFallback, ppEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->try", fromNode: ppStart, toNode: ppCatch }),
    build.controlFlowEdge({
      name: "try->end:ok", fromNode: ppCatch, toNode: ppEnd, fromBranch: "next",
    }),
    build.controlFlowEdge({
      name: "try->fb", fromNode: ppCatch, toNode: ppFallback, fromBranch: build.CAUGHT_EXCEPTION_BRANCH,
    }),
    build.controlFlowEdge({ name: "fb->end", fromNode: ppFallback, toNode: ppEnd }),
  ],
});

// ─── Outer: parallel-map across patient notes ───────────────────────────
const outerStart = build.start({
  name: "start",
  inputSchema: z.object({ notes: z.array(z.string()) }),
});

const perPatient = build.parallelMap({
  name: "per_patient_extract",
  subflow: PER_PATIENT,
  iterateOver: "notes",
  concurrency: 8,
  inputs: [{
    jsonSchema: { title: "notes", type: "array", items: { type: "string" } },
    title: "notes",
    type: "array",
  }],
  outputs: [{
    jsonSchema: {
      title: "problems_per_patient",
      type: "array",
      items: { type: "array", items: { type: "string" } },
    },
    title: "problems_per_patient",
    type: "array",
  }],
});

const outerEnd = build.end({
  name: "end",
  outputSchema: z.object({
    problems_per_patient: z.array(z.array(z.string())),
  }),
});

export default build.create({
  id: "COHORT_EXTRACTION",
  name: "COHORT_EXTRACTION",
  version: "1.0.0",
  startNode: outerStart,
  endNode: outerEnd,
  nodes: [outerStart, perPatient, outerEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->pp", fromNode: outerStart, toNode: perPatient }),
    build.controlFlowEdge({ name: "pp->e", fromNode: perPatient, toNode: outerEnd }),
  ],
  dataFlowConnections: [
    build.dataFlowEdge({
      name: "start.notes->pp.notes",
      sourceNode: outerStart, sourceOutput: "notes",
      destinationNode: perPatient, destinationInput: "notes",
    }),
  ],
});
