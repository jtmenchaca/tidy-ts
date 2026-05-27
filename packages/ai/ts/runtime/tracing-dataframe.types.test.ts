/**
 * Compile-time check: `out.trace.toDataFrame()` projects to a DataFrame
 * whose row carries the OTel canonical columns plus typed `input` /
 * `output` derived from the topology's start / end schemas.
 */

import { z } from "zod";
import type { DataFrame } from "@tidy-ts/dataframe";
import { ai, build } from "../../mod.ts";

type IsExact<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? (<T>() => T extends B ? 1 : 2) extends (<T>() => T extends A ? 1 : 2)
      ? true
      : false
    : false;

type Expect<_T extends true> = true;
type RowOf<T> = T extends DataFrame<infer R> ? R : never;

const Input = z.object({ note: z.string() });
const Output = z.object({
  severity: z.enum(["mild", "moderate", "severe"]),
  confidence: z.number(),
});

const start = build.start({ name: "start", inputSchema: Input });
const end = build.end({ name: "end", outputSchema: Output });
const extract = build.agentNode({
  name: "extract",
  agent: build.agent({
    name: "extract",
    llmConfig: build.llmConfig({ modelId: "gpt-5.4-nano" }),
    systemPromptTemplate: "Extract severity from: {{note}}",
    inputSchema: Input,
    outputSchema: Output,
  }),
});
const CLASSIFY_NOTE_AUTHOR = build.create({
  id: "EXTRACT",
  name: "EXTRACT",
  startNode: start,
  endNode: end,
  nodes: [start, extract, end],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->a", fromNode: start, toNode: extract }),
    build.controlFlowEdge({ name: "a->e", fromNode: extract, toNode: end }),
  ],
});

const INPUT = {
  note: "Triage note: vitals stable, complains of intermittent dizziness.",
};

// First run: cache enabled so the agent's conversation is captured
// into the envelope. (Default cache; we let the per-row write happen.)
const fresh = await ai.evaluate({
  topology: CLASSIFY_NOTE_AUTHOR,
  input: INPUT,
});
console.log("─── FRESH RUN ───");
console.log(fresh.trace.toConversation());

// Second run: same input → cache hit. The wrapper span replays the
// captured conversation, so this trace should contain the same chat
// span (and any tool spans) as the fresh run — proving cache hits
// don't lose the prompts.
const cached = await ai.evaluate({
  topology: CLASSIFY_NOTE_AUTHOR,
  input: INPUT,
});
console.log("─── CACHED RUN ───");
console.log(cached.trace.toConversation());

const out = fresh;
const df = out.trace.toDataFrame();

type _row = Expect<
  IsExact<
    RowOf<typeof df>,
    {
      spanId: string;
      parentSpanId: string | null;
      traceId: string;
      name: string;
      startTime: number;
      endTime: number;
      durationMs: number;
      status: "ERROR" | "UNSET";
      errorMessage: string | null;
      operationName:
        | "invoke_workflow"
        | "invoke_agent"
        | "chat"
        | "execute_tool"
        | "map"
        | "parallel_map"
        | "parallel_flow"
        | "branch"
        | "catch_exception"
        | "subflow"
        | null;
      workflowName: string | null;
      agentName: string | null;
      toolName: string | null;
      model: string | null;
      inputTokens: number | null;
      outputTokens: number | null;
      nodeName: string | null;
      cached: boolean | null;
      systemPrompt: string | null;
      input: { note: string } | null;
      output:
        | { severity: "mild" | "moderate" | "severe"; confidence: number }
        | null;
    }
  >
>;

export type _assertions = _row;
