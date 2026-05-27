// Viz fixture: CatchExceptionNode wrapping a subflow.
//
// Stresses container rendering: a node that contains an entire nested
// topology, with success/failure outgoing branches. Shapes mirror the
// "extract symptom severity, with fallback" pattern from the original
// full-featured example.


import { build } from "../../mod.ts";
import { z } from "zod";


const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

// ─── Inner concept: rate severity from a note ────────────────────────────
const innerStart = build.start({
  name: "rate_start",
  inputSchema: z.object({ note: z.string() }),
});
const rate = build.agentNode({
  name: "rate_severity",
  agent: build.agent({
    name: "rate_severity",
    llmConfig: nano,
    systemPromptTemplate: `Rate the symptom severity in this note: mild, moderate, or severe.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ severity: z.enum(["mild", "moderate", "severe"]) }),
  }),
});
const innerEnd = build.end({
  name: "rate_end",
  outputSchema: z.object({ severity: z.enum(["mild", "moderate", "severe"]) }),
});

const RATE_SEVERITY = build.create({
  id: "RATE_SEVERITY",
  name: "RATE_SEVERITY",
  version: "1.0.0",
  citation: "Menchaca et al., 2026 (tidy-ts/ai)",
  startNode: innerStart,
  endNode: innerEnd,
  nodes: [innerStart, rate, innerEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->r", fromNode: innerStart, toNode: rate }),
    build.controlFlowEdge({ name: "r->e", fromNode: rate, toNode: innerEnd }),
  ],
  dataFlowConnections: [
    build.dataFlowEdge({
      name: "rate_start.note->rate.note",
      sourceNode: innerStart, sourceOutput: "note",
      destinationNode: rate, destinationInput: "note",
    }),
    build.dataFlowEdge({
      name: "rate.severity->rate_end.severity",
      sourceNode: rate, sourceOutput: "severity",
      destinationNode: innerEnd, destinationInput: "severity",
    }),
  ],
});

// ─── Outer: wrap the concept in catch ────────────────────────────────────
const outerStart = build.start({
  name: "start",
  inputSchema: z.object({ note: z.string() }),
});

const tryRate = build.catchException({
  name: "try_rate",
  subflow: RATE_SEVERITY,
});

const fallback = build.agentNode({
  name: "unknown_severity",
  agent: build.agent({
    name: "unknown_severity",
    llmConfig: nano,
    systemPromptTemplate: `The severity rater failed. Produce { severity: 'unknown' }.\n\nException info: {{caught_exception_info}}`,
    inputSchema: z.object({ caught_exception_info: z.string().nullable() }),
    outputSchema: z.object({ severity: z.literal("unknown") }),
  }),
});

const outerEnd = build.end({
  name: "end",
  outputSchema: z.object({
    severity: z.enum(["mild", "moderate", "severe", "unknown"]),
  }),
});

export default build.create({
  id: "SEVERITY_WITH_FALLBACK",
  name: "SEVERITY_WITH_FALLBACK",
  version: "1.0.0",
  startNode: outerStart,
  endNode: outerEnd,
  nodes: [outerStart, tryRate, fallback, outerEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->try", fromNode: outerStart, toNode: tryRate }),
    build.controlFlowEdge({
      name: "try->end:ok", fromNode: tryRate, toNode: outerEnd, fromBranch: "next",
    }),
    build.controlFlowEdge({
      name: "try->fallback", fromNode: tryRate, toNode: fallback, fromBranch: build.CAUGHT_EXCEPTION_BRANCH,
    }),
    build.controlFlowEdge({ name: "fallback->end", fromNode: fallback, toNode: outerEnd }),
  ],
  dataFlowConnections: [
    build.dataFlowEdge({
      name: "start.note->try.note",
      sourceNode: outerStart, sourceOutput: "note",
      destinationNode: tryRate, destinationInput: "note",
    }),
    build.dataFlowEdge({
      name: "try.caught_exception_info->fallback.caught_exception_info",
      sourceNode: tryRate, sourceOutput: "caught_exception_info",
      destinationNode: fallback, destinationInput: "caught_exception_info",
    }),
    build.dataFlowEdge({
      name: "try.severity->end.severity",
      sourceNode: tryRate, sourceOutput: "severity",
      destinationNode: outerEnd, destinationInput: "severity",
    }),
    build.dataFlowEdge({
      name: "fallback.severity->end.severity",
      sourceNode: fallback, sourceOutput: "severity",
      destinationNode: outerEnd, destinationInput: "severity",
    }),
  ],
});
