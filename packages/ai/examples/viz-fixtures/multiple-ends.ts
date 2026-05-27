// Viz fixture: multiple EndNodes (one per branch).
//
// Stresses: the spine reconstruction picks an end; what does the viz do
// when there are several? Topologies are allowed multiple ends — each
// EndNode carries an optional `branchName` so the consumer can tell
// which path the run took.
//
// Workflow: classify a note as urgent / routine / followup → emit a
// different output shape on each branch via a dedicated end node.


import { build } from "../../mod.ts";
import { z } from "zod";


const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

const Kind = z.enum(["urgent", "routine", "followup"]);

const start = build.start({
  name: "start",
  inputSchema: z.object({ note: z.string() }),
});

const classify = build.agentNode({
  name: "classify",
  agent: build.agent({
    name: "classify",
    llmConfig: nano,
    systemPromptTemplate: `Classify the note as urgent, routine, or followup.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ kind: Kind }),
  }),
});

const branch = build.branching({
  name: "branch_on_kind",
  mapping: { urgent: "urgent", routine: "routine", followup: "followup" },
  inputs: [{
    jsonSchema: { title: "kind", type: "string" },
    title: "kind",
    type: "string",
  }],
});

const handleUrgent = build.agentNode({
  name: "handle_urgent",
  agent: build.agent({
    name: "handle_urgent",
    llmConfig: nano,
    systemPromptTemplate: `Produce an urgent-action summary.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ urgent_action: z.string() }),
  }),
});

const handleRoutine = build.agentNode({
  name: "handle_routine",
  agent: build.agent({
    name: "handle_routine",
    llmConfig: nano,
    systemPromptTemplate: `Produce a routine-acknowledgement summary.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ routine_ack: z.string() }),
  }),
});

const handleFollowup = build.agentNode({
  name: "handle_followup",
  agent: build.agent({
    name: "handle_followup",
    llmConfig: nano,
    systemPromptTemplate: `Produce a followup-scheduling note.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ followup_at: z.string() }),
  }),
});

const endUrgent = build.end({
  name: "end_urgent",
  outputSchema: z.object({ urgent_action: z.string() }),
  branchName: "urgent",
});
const endRoutine = build.end({
  name: "end_routine",
  outputSchema: z.object({ routine_ack: z.string() }),
  branchName: "routine",
});
const endFollowup = build.end({
  name: "end_followup",
  outputSchema: z.object({ followup_at: z.string() }),
  branchName: "followup",
});

export default build.create({
  id: "DISPATCH_BY_KIND",
  name: "DISPATCH_BY_KIND",
  version: "1.0.0",
  startNode: start,
  endNode: endUrgent, // primary end; the other two are sibling exits
  nodes: [start, classify, branch, handleUrgent, handleRoutine, handleFollowup, endUrgent, endRoutine, endFollowup],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->c", fromNode: start, toNode: classify }),
    build.controlFlowEdge({ name: "c->b", fromNode: classify, toNode: branch }),
    build.controlFlowEdge({ name: "b->u", fromNode: branch, toNode: handleUrgent, fromBranch: "urgent" }),
    build.controlFlowEdge({ name: "b->r", fromNode: branch, toNode: handleRoutine, fromBranch: "routine" }),
    build.controlFlowEdge({ name: "b->f", fromNode: branch, toNode: handleFollowup, fromBranch: "followup" }),
    build.controlFlowEdge({ name: "u->eu", fromNode: handleUrgent, toNode: endUrgent }),
    build.controlFlowEdge({ name: "r->er", fromNode: handleRoutine, toNode: endRoutine }),
    build.controlFlowEdge({ name: "f->ef", fromNode: handleFollowup, toNode: endFollowup }),
  ],
  dataFlowConnections: [
    build.dataFlowEdge({
      name: "start.note->classify.note",
      sourceNode: start, sourceOutput: "note",
      destinationNode: classify, destinationInput: "note",
    }),
    build.dataFlowEdge({
      name: "classify.kind->branch.kind",
      sourceNode: classify, sourceOutput: "kind",
      destinationNode: branch, destinationInput: "kind",
    }),
    build.dataFlowEdge({
      name: "start.note->handle_urgent.note",
      sourceNode: start, sourceOutput: "note",
      destinationNode: handleUrgent, destinationInput: "note",
    }),
    build.dataFlowEdge({
      name: "start.note->handle_routine.note",
      sourceNode: start, sourceOutput: "note",
      destinationNode: handleRoutine, destinationInput: "note",
    }),
    build.dataFlowEdge({
      name: "start.note->handle_followup.note",
      sourceNode: start, sourceOutput: "note",
      destinationNode: handleFollowup, destinationInput: "note",
    }),
    build.dataFlowEdge({
      name: "handle_urgent.urgent_action->end_urgent.urgent_action",
      sourceNode: handleUrgent, sourceOutput: "urgent_action",
      destinationNode: endUrgent, destinationInput: "urgent_action",
    }),
    build.dataFlowEdge({
      name: "handle_routine.routine_ack->end_routine.routine_ack",
      sourceNode: handleRoutine, sourceOutput: "routine_ack",
      destinationNode: endRoutine, destinationInput: "routine_ack",
    }),
    build.dataFlowEdge({
      name: "handle_followup.followup_at->end_followup.followup_at",
      sourceNode: handleFollowup, sourceOutput: "followup_at",
      destinationNode: endFollowup, destinationInput: "followup_at",
    }),
  ],
});
