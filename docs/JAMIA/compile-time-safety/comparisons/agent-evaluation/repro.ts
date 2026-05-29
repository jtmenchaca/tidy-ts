// Single-file end-to-end repro of the agent-evaluation pipeline:
// one sandbox agent writes + runs `solution.ts`, then a classifier
// agent scores the trace. No CLI, no resume, no fanout — read top to
// bottom.
//
// Run:
//   OPENAI_API_KEY=sk-... deno run -A docs/JAMIA/comparisons/agent-evaluation/repro.ts

import { ai, build, sandbox } from "@tidy-ts/ai";
import { z } from "zod";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import type { ReadableSpan } from "@opentelemetry/sdk-trace-base";

// ─── Inputs ─────────────────────────────────────────────────────────────

const SKILLS_ROOT = join(
  fileURLToPath(new URL(".", import.meta.url).href),
  "../../../..",
  ".claude/skills",
);
const DENO_BIN = join(homedir(), ".deno/bin");

const fixtures = {
  "data.csv": "date,value\n2024-12-31,1\n2025-01-15,2\n2025-03-01,3\n",
};
const intent =
  "Read `data.csv`. Count rows whose `date` is strictly after 2025-01-01. " +
  "Print the count.";
const plantedError =
  "The obvious idiom keeps `date` as a string. Lexicographic compare " +
  "happens to give the right answer on ISO dates here, but the agent " +
  "should still know to parse before comparing.";

// ─── 1. Sandbox agent: writes + runs solution.ts ───────────────────────

const llm = build.llmConfig({ modelId: "gpt-5.4-nano" });
const RunInput = z.object({ intent: z.string() });
const RunOutput = z.object({ finalSummary: z.string() });

const runner = build.sandboxAgent({
  name: "tidy_ts_author",
  llmConfig: llm,
  systemPromptTemplate:
    "You write TypeScript that uses @tidy-ts/dataframe. You have " +
    "filesystem + shell. Iterate: write `solution.ts`, type-check with " +
    "`deno check solution.ts`, run with `deno run -A solution.ts`. " +
    "When done, return your finalSummary.\n\nTask: {{intent}}",
  inputSchema: RunInput,
  outputSchema: RunOutput,
  defaultManifest: {
    entries: { "data.csv": sandbox.file({ content: fixtures["data.csv"] }) },
    environment: { PATH: `${DENO_BIN}:/usr/local/bin:/usr/bin:/bin` },
    extraPathGrants: [{ path: SKILLS_ROOT }],
  },
  capabilities: [
    sandbox.capability.filesystem(),
    sandbox.capability.shell(),
    sandbox.capability.skills({
      lazyFrom: sandbox.lazySkillSource({ src: SKILLS_ROOT }),
    }),
  ],
  maxToolTurns: 15,
});

const runStart = build.start({ name: "start", inputSchema: RunInput });
const runEnd = build.end({ name: "end", outputSchema: RunOutput });
const runNode = build.sandboxAgentNode({ name: "author", agent: runner });
const runTopology = build.create({
  id: "REPRO_AUTHOR",
  name: "REPRO_AUTHOR",
  startNode: runStart,
  endNode: runEnd,
  nodes: [runStart, runNode, runEnd],
  controlFlowConnections: [
    build.controlFlowEdge({ name: "s->a", fromNode: runStart, toNode: runNode }),
    build.controlFlowEdge({ name: "a->e", fromNode: runNode, toNode: runEnd }),
  ],
});

console.log("running author agent…");
const authorResult = await ai.evaluate({
  topology: runTopology,
  input: { intent },
  cache: false,
  sandboxClient: new sandbox.UnixLocalClient(),
  onError: "result",
});

const spans: ReadableSpan[] = authorResult.ok
  ? authorResult.value.trace.spans
  : (authorResult.error.trace?.spans ?? []);
const authorError = authorResult.ok ? undefined : authorResult.error.message;

// ─── 2. Reconstruct files + action log from the trace ──────────────────

const files = reconstructFiles(spans);
const finalFile = files["solution.ts"] ?? Object.values(files)[0];
const actionLog = formatLog(spans) +
  (authorError ? `\n\n[author loop terminated: ${authorError}]` : "");

// ─── 3. Classifier agent: scores the trace ─────────────────────────────

const ClassifierInput = z.object({
  intent: z.string(),
  plantedError: z.string(),
  finalFileContents: z.string(),
  actionLog: z.string(),
});
const ClassifierOutput = z.object({
  modelResponse: z.enum([
    "fixed",
    "worked-around",
    "suppressed",
    "abandoned",
    "not-encountered",
  ]),
  librarySignaledBeforeRun: z.boolean(),
  rationale: z.string(),
});

const classifier = build.agent({
  name: "classify",
  llmConfig: llm,
  systemPromptTemplate:
    "You are scoring an LLM's attempt at writing data-analysis code. " +
    "The task had a planted error: a competent practitioner writing the " +
    "obvious idiom would trigger it. Score honestly.\n\n" +
    "Intent: {{intent}}\n\nPlanted error: {{plantedError}}\n\n" +
    "Final file:\n```\n{{finalFileContents}}\n```\n\n" +
    "Action log:\n```\n{{actionLog}}\n```",
  inputSchema: ClassifierInput,
  outputSchema: ClassifierOutput,
});

const classifierStart = build.start({
  name: "start",
  inputSchema: ClassifierInput,
});
const classifierEnd = build.end({
  name: "end",
  outputSchema: ClassifierOutput,
});
const classifierNode = build.agentNode({ name: "classify", agent: classifier });
const classifierTopology = build.create({
  id: "REPRO_CLASSIFY",
  name: "REPRO_CLASSIFY",
  startNode: classifierStart,
  endNode: classifierEnd,
  nodes: [classifierStart, classifierNode, classifierEnd],
  controlFlowConnections: [
    build.controlFlowEdge({
      name: "s->c",
      fromNode: classifierStart,
      toNode: classifierNode,
    }),
    build.controlFlowEdge({
      name: "c->e",
      fromNode: classifierNode,
      toNode: classifierEnd,
    }),
  ],
});

console.log("scoring with classifier…");
const scored = await ai.evaluate({
  topology: classifierTopology,
  input: {
    intent,
    plantedError,
    finalFileContents: finalFile?.contents ?? "",
    actionLog,
  },
  cache: false,
});

// ─── 4. Print the row ──────────────────────────────────────────────────

console.log("\n─── Result ───────────────────────────");
console.log(JSON.stringify({
  modelResponse: scored.result.modelResponse,
  librarySignaledBeforeRun: scored.result.librarySignaledBeforeRun,
  rationale: scored.result.rationale,
  authorError,
  finalFile: finalFile?.path,
}, null, 2));

// ─── Helpers (folded inline — no module boundary) ──────────────────────

interface ReconstructedFile {
  path: string;
  contents: string;
}

/** Fold every `execute_tool` span where `gen_ai.tool.name === "apply_patch"`
 *  into a final file map. The arguments live on `gen_ai.tool.call.arguments`
 *  as a JSON string (captureMessageContent default-on). */
function reconstructFiles(
  spans: ReadableSpan[],
): Record<string, ReconstructedFile> {
  const files: Record<string, ReconstructedFile> = {};
  for (const span of spans) {
    if (span.attributes["gen_ai.operation.name"] !== "execute_tool") continue;
    if (span.attributes["gen_ai.tool.name"] !== "apply_patch") continue;
    const args = span.attributes["gen_ai.tool.call.arguments"];
    if (typeof args !== "string") continue;
    let op: { type: string; path: string; diff?: string } | undefined;
    try {
      const parsed = JSON.parse(args);
      op = parsed.operation ?? parsed;
    } catch { /* skip */ }
    if (!op || typeof op.path !== "string") continue;
    if (op.type === "delete_file") {
      delete files[op.path];
      continue;
    }
    const prev = op.type === "create_file" ? "" : files[op.path]?.contents ?? "";
    files[op.path] = {
      path: op.path,
      contents: applyUnifiedDiff(prev, op.diff ?? "") ??
        prev + "\n\n[--- diff did not apply ---]\n" + (op.diff ?? ""),
    };
  }
  return files;
}

/** Minimal unified-diff applier. Handles the two shapes apply_patch
 *  emits in practice: `create_file` (full body, `+` prefixed) and
 *  `update_file` (compact hunk diff). Returns the new file body, or
 *  null when no hunk matched cleanly so callers can fall back. */
function applyUnifiedDiff(source: string, diff: string): string | null {
  const lines = diff.split("\n");
  if (lines.every((l) => l === "" || l.startsWith("+"))) {
    return lines.map((l) => (l.startsWith("+") ? l.slice(1) : l)).join("\n");
  }
  const srcLines = source.split("\n");
  const out: string[] = [];
  let srcIdx = 0;
  let inHunk = false;
  for (const l of lines) {
    if (l.startsWith("---") || l.startsWith("+++")) continue;
    if (l.startsWith("@@")) {
      const m = l.match(/-([0-9]+)/);
      if (m) {
        const targetSrcIdx = Math.max(0, parseInt(m[1], 10) - 1);
        while (srcIdx < targetSrcIdx) out.push(srcLines[srcIdx++] ?? "");
      }
      inHunk = true;
      continue;
    }
    if (!inHunk) continue;
    if (l.startsWith("+")) out.push(l.slice(1));
    else if (l.startsWith("-")) srcIdx++;
    else if (l.startsWith(" ")) out.push(srcLines[srcIdx++] ?? "");
  }
  while (srcIdx < srcLines.length) out.push(srcLines[srcIdx++]);
  return out.join("\n");
}

/** Compact per-span log: tool calls with names + truncated args. */
function formatLog(spans: ReadableSpan[]): string {
  const lines: string[] = [];
  let i = 0;
  for (const span of spans) {
    const op = span.attributes["gen_ai.operation.name"] ??
      span.attributes["tidy_ts.ai.operation.name"];
    if (typeof op !== "string") continue;
    i++;
    if (op === "execute_tool") {
      const name = span.attributes["gen_ai.tool.name"] ?? "?";
      const args = String(span.attributes["gen_ai.tool.call.arguments"] ?? "");
      lines.push(`${i}. tool ${String(name)} ${args.slice(0, 200).replace(/\n/g, " | ")}`);
      const result = span.attributes["gen_ai.tool.call.result"];
      if (typeof result === "string") {
        lines.push(`   ↳ ${result.slice(0, 200).replace(/\n/g, " | ")}`);
      }
    } else if (op === "chat") {
      const model = span.attributes["gen_ai.request.model"] ?? "?";
      lines.push(`${i}. chat ${String(model)}`);
    } else {
      lines.push(`${i}. ${op}`);
    }
  }
  return lines.join("\n");
}
