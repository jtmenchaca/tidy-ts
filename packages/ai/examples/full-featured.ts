// @tidy-ts/ai — clinical-note author classifier.
//
// For each clinical note:
//   1. Classify the author: Clinician / MA / RN / Other.
//   2. If Clinician, extract the primary problems discussed (array of strings).
//      Otherwise, just report the author type.
//
// Run:
//   OPENAI_API_KEY=... deno run -A packages/ai/examples/full-featured.ts


import { ai, build } from "../mod.ts";
import { createDataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";


const nano = build.llmConfig({ modelId: "gpt-5.4-nano" });

const AuthorType = z.enum(["Clinician", "MA", "RN", "Other"]);

// ─── Nodes ───────────────────────────────────────────────────────────────
const start = build.start({
  name: "start",
  inputSchema: z.object({ note: z.string() }),
});

const classifyAuthor = build.agentNode({
  name: "classify_author",
  agent: build.agent({
    name: "classify_author",
    llmConfig: nano,
    systemPromptTemplate: `Identify who wrote this clinical note. Return 'Clinician' for a primary-care physician or APP, 'MA' for a medical assistant, 'RN' for a nurse, 'Other' for anyone else.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({ author_type: AuthorType }),
  }),
});

const branch = build.branching({
  name: "branch_on_author",
  // Clinician → its own branch; every other author collapses to "other".
  mapping: { Clinician: "clinician", MA: "other", RN: "other", Other: "other" },
  inputs: [{
    jsonSchema: { title: "author_type", type: "string" },
    title: "author_type",
    type: "string",
  }],
});

const extractProblems = build.agentNode({
  name: "extract_problems",
  agent: build.agent({
    name: "extract_problems",
    llmConfig: nano,
    systemPromptTemplate: `From this primary-care clinical note, list the primary problems discussed as short strings (e.g., 'uncontrolled hypertension'). Return an empty array if no problems are discussed.\n\nNote: {{note}}`,
    inputSchema: z.object({ note: z.string() }),
    outputSchema: z.object({
    author_type: z.literal("Clinician"),
    problems: z.array(z.string()),
  }),
  }),
});

const reportOther = build.agentNode({
  name: "report_other",
  agent: build.agent({
    name: "report_other",
    llmConfig: nano,
    systemPromptTemplate: `Echo the author type. The note was not written by a primary-care clinician, so no problem extraction is performed.\n\nAuthor type: {{author_type}}`,
    inputSchema: z.object({ author_type: AuthorType }),
    outputSchema: z.object({
    author_type: AuthorType,
    problems: z.null(),
  }),
  }),
});

const end = build.end({
  name: "end",
  outputSchema: z.object({
    author_type: AuthorType,
    problems: z.array(z.string()).nullable(),
  }),
});

// ─── Topology ────────────────────────────────────────────────────────────
const CLASSIFY_NOTE_AUTHOR = build.create({
  id: "CLASSIFY_NOTE_AUTHOR",
  name: "CLASSIFY_NOTE_AUTHOR",
  version: "1.0.0",
  startNode: start,
  endNode: end,
  nodes: [start, classifyAuthor, branch, extractProblems, reportOther, end],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->c", fromNode: start, toNode: classifyAuthor }),
    build.controlFlowEdge({ name: "c->b", fromNode: classifyAuthor, toNode: branch }),
    build.controlFlowEdge({
      name: "b->extract", fromNode: branch, toNode: extractProblems, fromBranch: "clinician",
    }),
    build.controlFlowEdge({
      name: "b->report", fromNode: branch, toNode: reportOther, fromBranch: "other",
    }),
    build.controlFlowEdge({ name: "extract->e", fromNode: extractProblems, toNode: end }),
    build.controlFlowEdge({ name: "report->e", fromNode: reportOther, toNode: end }),
  ],
  dataFlowConnections: [
    build.dataFlowEdge({
      name: "classify.author->branch.author",
      sourceNode: classifyAuthor, sourceOutput: "author_type",
      destinationNode: branch, destinationInput: "author_type",
    }),
    build.dataFlowEdge({
      name: "start.note->extract.note",
      sourceNode: start, sourceOutput: "note",
      destinationNode: extractProblems, destinationInput: "note",
    }),
    build.dataFlowEdge({
      name: "classify.author->report.author",
      sourceNode: classifyAuthor, sourceOutput: "author_type",
      destinationNode: reportOther, destinationInput: "author_type",
    }),
  ],
});

export default CLASSIFY_NOTE_AUTHOR;

// ─── Run over a small DataFrame ──────────────────────────────────────────
if (import.meta.main) {
  const notes = createDataFrame([
    { id: 1, note: "55yo M here for follow-up of HTN and T2DM. BP 148/92, A1c 8.4. Plan: increase lisinopril, add metformin XR." },
    { id: 2, note: "Vitals: BP 122/78, HR 72, T 98.4F. Patient reports feeling well. Roomed and ready for provider." },
    { id: 3, note: "Administered Tdap and flu shot per provider order. Patient tolerated well. No adverse reactions." },
  ]);

  const classified = await notes.mutateAsync({
    result: (r) => ai.evaluate({ topology: CLASSIFY_NOTE_AUTHOR, input: { note: r.note } }),
  });

  for (const row of classified.toRows()) {
    const { author_type, problems } = row.result.result;
    console.log(`#${row.id}  ${author_type}  ${problems ? problems.join("; ") : "(no problems extracted)"}`);
  }
}
