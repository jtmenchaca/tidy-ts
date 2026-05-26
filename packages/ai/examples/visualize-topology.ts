// Render the same topology that full-featured.ts evaluates, but to static
// SVG + HTML files — no API calls, no rate limiter, no datastore.
//
// Run:
//   deno run -A packages/ai/examples/visualize-build.ts
//
// Writes:
//   ./analyze-patient-note.svg   — static SVG (open in browser, embed in docs)
//   ./analyze-patient-note.html  — same SVG + grid/force toggle


import { build } from "../mod.ts";
import { z } from "zod";

import { topologyToJGF } from "../ts/viz/index.ts";
import { parseVisualJGF, renderHTML, renderSVG } from "../../ai-graph/mod.ts";

// ─── 1. Inner topology — EXTRACT_SYMPTOM_SEVERITY ────────────────────────
const extractStart = build.start({
  name: "extract_start",
  inputSchema: z.object({ note: z.string() }),
});
const extractLlm = build.agentNode({
  name: "rate_severity",
  agent: build.agent({
    name: "rate_severity",
    llmConfig: build.llmConfig({ modelId: "gpt-5.4-nano" }),
    systemPromptTemplate: `Extract dominant symptom severity from the clinical note.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({
    severity: z.enum(["mild", "moderate", "severe"]),
    confidence: z.number().min(0).max(1),
  }),
  }),
});
const extractEnd = build.end({
  name: "extract_end",
  outputSchema: z.object({
    severity: z.enum(["mild", "moderate", "severe"]),
    confidence: z.number().min(0).max(1),
  }),
});
const EXTRACT_SYMPTOM_SEVERITY = build.create({
  id: "EXTRACT_SYMPTOM_SEVERITY",
  name: "EXTRACT_SYMPTOM_SEVERITY",
  version: "1.0.0",
  startNode: extractStart,
  endNode: extractEnd,
  nodes: [extractStart, extractLlm, extractEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->l", fromNode: extractStart, toNode: extractLlm }),
    build.controlFlowEdge({ name: "l->e", fromNode: extractLlm, toNode: extractEnd }),
  ],
});

// ─── 2. Outer topology — ANALYZE_PATIENT_NOTE ────────────────────────────
const outerStart = build.start({
  name: "start",
  inputSchema: z.object({ note: z.string() }),
});
const classify = build.agentNode({
  name: "classify",
  agent: build.agent({
    name: "classify",
    llmConfig: build.llmConfig({ modelId: "gpt-5.4-nano" }),
    systemPromptTemplate: `Classify a clinical note as 'urgent' or 'routine'.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ kind: z.enum(["urgent", "routine"]) }),
  }),
});
const branch = build.branching({
  name: "branch_on_kind",
  mapping: { urgent: "urgent", routine: "routine" },
  inputs: [{ jsonSchema: { title: "kind", type: "string" }, title: "kind", type: "string" }],
});
const extractWrapped = build.catchException({
  name: "extract_with_catch",
  subflow: EXTRACT_SYMPTOM_SEVERITY,
});
const fallback = build.agentNode({
  name: "fallback_explain",
  agent: build.agent({
    name: "fallback_explain",
    llmConfig: build.llmConfig({ modelId: "gpt-5.4-nano" }),
    systemPromptTemplate: `Produce a fallback record when severity extraction failed.\n\nException info: {{caught_exception_info}}`,
    inputSchema: z.object({ caught_exception_info: z.string().nullable() }),
    outputSchema: z.object({ severity: z.literal("unknown"), reason: z.string() }),
  }),
});
const finalize = build.agentNode({
  name: "finalize",
  agent: build.agent({
    name: "finalize",
    llmConfig: build.llmConfig({ modelId: "gpt-5.4-nano" }),
    systemPromptTemplate: `Echo kind/severity/confidence and write a one-sentence summary.\n\nNote: {{note}}\nKind: {{kind}}\nSeverity: {{severity}}\nConfidence: {{confidence}}`,
    inputSchema: z.object({
    kind: z.enum(["urgent", "routine"]),
    severity: z.enum(["mild", "moderate", "severe", "unknown"]),
    confidence: z.number(),
    note: z.string(),
  }),
    outputSchema: z.object({
    kind: z.enum(["urgent", "routine"]),
    severity: z.enum(["mild", "moderate", "severe", "unknown"]),
    confidence: z.number(),
    note_summary: z.string(),
  }),
  }),
});
const outerEnd = build.end({
  name: "end",
  outputSchema: z.object({
    kind: z.enum(["urgent", "routine"]),
    severity: z.enum(["mild", "moderate", "severe", "unknown"]),
    confidence: z.number(),
    note_summary: z.string(),
  }),
});
const ANALYZE_PATIENT_NOTE = build.create({
  id: "ANALYZE_PATIENT_NOTE",
  name: "ANALYZE_PATIENT_NOTE",
  version: "0.1.0",
  startNode: outerStart,
  endNode: outerEnd,
  nodes: [outerStart, classify, branch, extractWrapped, fallback, finalize, outerEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->c", fromNode: outerStart, toNode: classify }),
    build.controlFlowEdge({ name: "c->b", fromNode: classify, toNode: branch }),
    build.controlFlowEdge({ name: "b->extract", fromNode: branch, toNode: extractWrapped, fromBranch: "urgent" }),
    build.controlFlowEdge({ name: "b->finalize:routine", fromNode: branch, toNode: finalize, fromBranch: "routine" }),
    build.controlFlowEdge({ name: "catch->finalize:ok", fromNode: extractWrapped, toNode: finalize, fromBranch: "next" }),
    build.controlFlowEdge({ name: "catch->fallback", fromNode: extractWrapped, toNode: fallback, fromBranch: build.CAUGHT_EXCEPTION_BRANCH }),
    build.controlFlowEdge({ name: "fallback->finalize", fromNode: fallback, toNode: finalize }),
    build.controlFlowEdge({ name: "finalize->end", fromNode: finalize, toNode: outerEnd }),
  ],
  dataFlowConnections: [
    build.dataFlowEdge({ name: "classify.kind->branch.kind", sourceNode: classify, sourceOutput: "kind", destinationNode: branch, destinationInput: "kind" }),
    build.dataFlowEdge({ name: "start.note->finalize.note", sourceNode: outerStart, sourceOutput: "note", destinationNode: finalize, destinationInput: "note" }),
    build.dataFlowEdge({ name: "classify.kind->finalize.kind", sourceNode: classify, sourceOutput: "kind", destinationNode: finalize, destinationInput: "kind" }),
  ],
});

// ─── 3. Convert + render ─────────────────────────────────────────────────
const jgf = topologyToJGF(ANALYZE_PATIENT_NOTE);
const visual = parseVisualJGF({ document: jgf });

const svg = renderSVG({
  nodes: visual.nodes,
  edges: visual.edges,
  colors: visual.colors,
  legendItems: visual.legendItems,
  legendFooter: visual.legendFooter,
});

const html = renderHTML({
  title: ANALYZE_PATIENT_NOTE.id,
  nodes: visual.nodes,
  edges: visual.edges,
  colors: visual.colors,
  legendItems: visual.legendItems,
  legendFooter: visual.legendFooter,
});

await Deno.writeTextFile("analyze-patient-note.svg", svg);
await Deno.writeTextFile("analyze-patient-note.html", html);
console.log("Wrote analyze-patient-note.svg and analyze-patient-note.html");
