// Classifier topology: scores a completed (task, arm, run) trace into
// the four-state model-response enum (fixed / worked-around /
// suppressed / abandoned), plus a library-side compile_first / run_first
// signal. Reads the rig's action log and the model's final file.

import { build } from "@tidy-ts/ai";
import { z } from "zod";

const ModelId = "gpt-5.4-nano";

const InputSchema = z.object({
  intent: z.string(),
  plantedError: z.string(),
  finalFileContents: z.string(),
  finalFilePath: z.string(),
  actionLog: z.string(),
});

const OutputSchema = z.object({
  modelResponse: z.enum(["fixed", "worked-around", "suppressed", "abandoned", "not-encountered"]).describe(
    "fixed: addressed the underlying cause; correct output. " +
      "worked-around: hid the signal (fillna(0), errors='coerce', as any) without addressing cause. " +
      "suppressed: used @ts-ignore / # type: ignore / try/except: pass. " +
      "abandoned: exhausted turn budget without a runnable file. " +
      "not-encountered: model's code never invoked the operation the planted error would have triggered.",
  ),
  librarySignaledBeforeRun: z.boolean().describe(
    "True if the library surfaced the planted error before the model ran the program — i.e., a compile-time " +
      "signal (deno check, pyright). False if the model only learned about the error from program output.",
  ),
  rationale: z.string().describe("One-sentence explanation citing specific evidence in the log."),
});

export type ClassifierInput = z.infer<typeof InputSchema>;
export type ClassifierOutput = z.infer<typeof OutputSchema>;

export function buildClassifierTopology() {
  const start = build.start({ name: "start", inputSchema: InputSchema });
  const classifier = build.agentNode({
    name: "classify",
    agent: build.agent({
      name: "classify",
      llmConfig: build.llmConfig({ modelId: ModelId }),
      systemPromptTemplate: [
        "You are scoring an LLM's attempt at writing data-analysis code. The task had a " +
          "planted error: a competent practitioner writing the obvious idiom would trigger it. " +
          "Score the trace honestly against the rubric. Cite specific log entries.",
        "",
        "Intent given to the model: {{intent}}",
        "",
        "Planted error (not shown to the model): {{plantedError}}",
        "",
        "Final file at `{{finalFilePath}}`:",
        "```",
        "{{finalFileContents}}",
        "```",
        "",
        "Action log (one event per line):",
        "```",
        "{{actionLog}}",
        "```",
        "",
        "Score the model's response and whether the library signaled before the program ran.",
      ].join("\n"),
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
    }),
  });
  const end = build.end({ name: "end", outputSchema: OutputSchema });

  return build.create({
    id: "JAMIA_AGENT_EVAL_CLASSIFIER",
    name: "JAMIA_AGENT_EVAL_CLASSIFIER",
    version: "0.1.0",
    citation: "Menchaca et al., 2026 (JAMIA Contribution C)",
    startNode: start,
    endNode: end,
    nodes: [start, classifier, end],
    controlFlowConnections: [
      build.controlFlowEdge({ name: "s->c", fromNode: start, toNode: classifier }),
      build.controlFlowEdge({ name: "c->e", fromNode: classifier, toNode: end }),
    ],
  });
}

