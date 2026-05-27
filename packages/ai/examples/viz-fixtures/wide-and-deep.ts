// Viz fixture: a long chain plus several off-spine siblings.
//
// Stresses: many-column layout, per-row stacking when several nodes
// land off the spine in the same column.
//
// Shape:
//
//   start → c1 → c2 → c3 → c4 → c5 → c6 → end       (spine)
//                │     │     │
//                ▼     ▼     ▼
//               s2_a  s3_a  s4_a    (off-spine row 1)
//                      │
//                      ▼
//                     s3_b           (off-spine row 2)
//
// All nodes are LlmNodes with trivial schemas — the focus is layout, not
// content.


import { build } from "../../mod.ts";
import { z } from "zod";


const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

function step(name: string) {
  return build.agentNode({
    name: name,
    agent: build.agent({
      name: name,
      llmConfig: nano,
      systemPromptTemplate: `${`Step ${name}.`}\n\n${"Input: {{x}}"}`,
      inputSchema: z.object({ x: z.string() }),
      outputSchema: z.object({ x: z.string() }),
    }),
  });
}

const start = build.start({
  name: "start",
  inputSchema: z.object({ x: z.string() }),
});

const c1 = step("c1");
const c2 = step("c2");
const c3 = step("c3");
const c4 = step("c4");
const c5 = step("c5");
const c6 = step("c6");

const s2a = step("s2_a");
const s3a = step("s3_a");
const s3b = step("s3_b");
const s4a = step("s4_a");

const end = build.end({
  name: "end",
  outputSchema: z.object({ x: z.string() }),
});

export default build.create({
  id: "WIDE_AND_DEEP",
  name: "WIDE_AND_DEEP",
  version: "1.0.0",
  startNode: start,
  endNode: end,
  nodes: [start, c1, c2, c3, c4, c5, c6, s2a, s3a, s3b, s4a, end],
  controlFlowConnections: [
    // Spine.
    build.controlFlowEdge({ name: "s->c1", fromNode: start, toNode: c1 }),
    build.controlFlowEdge({ name: "c1->c2", fromNode: c1, toNode: c2 }),
    build.controlFlowEdge({ name: "c2->c3", fromNode: c2, toNode: c3 }),
    build.controlFlowEdge({ name: "c3->c4", fromNode: c3, toNode: c4 }),
    build.controlFlowEdge({ name: "c4->c5", fromNode: c4, toNode: c5 }),
    build.controlFlowEdge({ name: "c5->c6", fromNode: c5, toNode: c6 }),
    build.controlFlowEdge({ name: "c6->end", fromNode: c6, toNode: end }),
    // Off-spine fan-outs.
    build.controlFlowEdge({ name: "c2->s2a", fromNode: c2, toNode: s2a }),
    build.controlFlowEdge({ name: "c3->s3a", fromNode: c3, toNode: s3a }),
    build.controlFlowEdge({ name: "s3a->s3b", fromNode: s3a, toNode: s3b }),
    build.controlFlowEdge({ name: "c4->s4a", fromNode: c4, toNode: s4a }),
  ],
  dataFlowConnections: [
    // Spine.
    build.dataFlowEdge({ name: "s->c1.x", sourceNode: start, sourceOutput: "x", destinationNode: c1, destinationInput: "x" }),
    build.dataFlowEdge({ name: "c1->c2.x", sourceNode: c1, sourceOutput: "x", destinationNode: c2, destinationInput: "x" }),
    build.dataFlowEdge({ name: "c2->c3.x", sourceNode: c2, sourceOutput: "x", destinationNode: c3, destinationInput: "x" }),
    build.dataFlowEdge({ name: "c3->c4.x", sourceNode: c3, sourceOutput: "x", destinationNode: c4, destinationInput: "x" }),
    build.dataFlowEdge({ name: "c4->c5.x", sourceNode: c4, sourceOutput: "x", destinationNode: c5, destinationInput: "x" }),
    build.dataFlowEdge({ name: "c5->c6.x", sourceNode: c5, sourceOutput: "x", destinationNode: c6, destinationInput: "x" }),
    build.dataFlowEdge({ name: "c6->end.x", sourceNode: c6, sourceOutput: "x", destinationNode: end, destinationInput: "x" }),
    // Off-spine.
    build.dataFlowEdge({ name: "c2->s2a.x", sourceNode: c2, sourceOutput: "x", destinationNode: s2a, destinationInput: "x" }),
    build.dataFlowEdge({ name: "c3->s3a.x", sourceNode: c3, sourceOutput: "x", destinationNode: s3a, destinationInput: "x" }),
    build.dataFlowEdge({ name: "s3a->s3b.x", sourceNode: s3a, sourceOutput: "x", destinationNode: s3b, destinationInput: "x" }),
    build.dataFlowEdge({ name: "c4->s4a.x", sourceNode: c4, sourceOutput: "x", destinationNode: s4a, destinationInput: "x" }),
  ],
});
