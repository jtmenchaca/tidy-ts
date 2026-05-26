// Viz fixture: deeply nested subflows — a Catch wrapping a Flow wrapping
// an inner build.
//
// Stresses recursive subflow rendering. The viz needs to descend two
// levels:
//
//   outer
//     └─ try_summarize (CatchExceptionNode)
//          subflow: SUMMARIZE_VIA_CITED_CONCEPT (Topology)
//            └─ cited_summarize (FlowNode)
//                 subflow: ONE_LINE_SUMMARY (Topology)
//                   └─ summarize (LlmNode)


import { build } from "../../mod.ts";
import { z } from "zod";


const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

// ─── Level 2: the innermost cited concept ────────────────────────────────
const l2Start = build.start({
  name: "l2_start",
  inputSchema: z.object({ note: z.string() }),
});
const l2Llm = build.agentNode({
  name: "summarize",
  agent: build.agent({
    name: "summarize",
    llmConfig: nano,
    systemPromptTemplate: `Summarize the note in one sentence.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ summary: z.string() }),
  }),
});
const l2End = build.end({
  name: "l2_end",
  outputSchema: z.object({ summary: z.string() }),
});
const ONE_LINE_SUMMARY = build.create({
  id: "ONE_LINE_SUMMARY",
  name: "ONE_LINE_SUMMARY",
  version: "1.0.0",
  citation: "Menchaca et al., 2026",
  startNode: l2Start,
  endNode: l2End,
  nodes: [l2Start, l2Llm, l2End],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->l", fromNode: l2Start, toNode: l2Llm }),
    build.controlFlowEdge({ name: "l->e", fromNode: l2Llm, toNode: l2End }),
  ],
});

// ─── Level 1: a topology that embeds the concept ────────────────────────
const l1Start = build.start({
  name: "l1_start",
  inputSchema: z.object({ note: z.string() }),
});
const citedSummarize = build.flow({
  name: "cited_summarize",
  subflow: ONE_LINE_SUMMARY,
});
const l1End = build.end({
  name: "l1_end",
  outputSchema: z.object({ summary: z.string() }),
});
const SUMMARIZE_VIA_CITED_CONCEPT = build.create({
  id: "SUMMARIZE_VIA_CITED_CONCEPT",
  name: "SUMMARIZE_VIA_CITED_CONCEPT",
  version: "1.0.0",
  startNode: l1Start,
  endNode: l1End,
  nodes: [l1Start, citedSummarize, l1End],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->c", fromNode: l1Start, toNode: citedSummarize }),
    build.controlFlowEdge({ name: "c->e", fromNode: citedSummarize, toNode: l1End }),
  ],
});

// ─── Outer: wrap the level-1 topology in a catch ────────────────────────
const outerStart = build.start({
  name: "start",
  inputSchema: z.object({ note: z.string() }),
});
const trySummarize = build.catchException({
  name: "try_summarize",
  subflow: SUMMARIZE_VIA_CITED_CONCEPT,
});
const fallback = build.agentNode({
  name: "fallback",
  agent: build.agent({
    name: "fallback",
    llmConfig: nano,
    systemPromptTemplate: `The summarizer failed. Produce a placeholder summary.\n\nException info: {{caught_exception_info}}`,
    inputSchema: z.object({ caught_exception_info: z.string().nullable() }),
    outputSchema: z.object({ summary: z.string() }),
  }),
});
const outerEnd = build.end({
  name: "end",
  outputSchema: z.object({ summary: z.string() }),
});

export default build.create({
  id: "NESTED_SUBFLOWS",
  name: "NESTED_SUBFLOWS",
  version: "1.0.0",
  startNode: outerStart,
  endNode: outerEnd,
  nodes: [outerStart, trySummarize, fallback, outerEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->try", fromNode: outerStart, toNode: trySummarize }),
    build.controlFlowEdge({
      name: "try->end:ok", fromNode: trySummarize, toNode: outerEnd, fromBranch: "next",
    }),
    build.controlFlowEdge({
      name: "try->fb", fromNode: trySummarize, toNode: fallback, fromBranch: build.CAUGHT_EXCEPTION_BRANCH,
    }),
    build.controlFlowEdge({ name: "fb->end", fromNode: fallback, toNode: outerEnd }),
  ],
});
