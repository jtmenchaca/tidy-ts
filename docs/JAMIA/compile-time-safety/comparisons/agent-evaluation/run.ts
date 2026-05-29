// Eval driver. For each (task, arm, run-index):
//   1. Build a fresh SandboxAgent topology with the task's fixtures
//      staged into the sandbox's defaultManifest.
//   2. Run it via `ai.evaluate(...)` with a UnixLocalSandboxClient. The
//      SDK gives the model real filesystem + shell tools; for the
//      tidy-ts arm the `tidy-ts-best-practices` skill is mounted too.
//   3. Walk `out.trace.spans` (OTel-shaped GenAI spans) to reconstruct
//      the final file contents and an action log.
//   4. Hand both to the classifier topology and write one JSONL row.
//
// No persistent workspaces, no custom ServerTools, no rig — the OTel
// trace surfaced by `out.trace` is the source of truth for what the
// model did.

import { ai, sandbox } from "@tidy-ts/ai";
import type { ReadableSpan } from "@opentelemetry/sdk-trace-base";
import { readFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { TASKS, type Task } from "./tasks.ts";
import { buildAgentTopology, type LibraryArm } from "./topology.ts";
import { buildClassifierTopology } from "./classifier.ts";
import {
  firstSignalKind,
  formatActionLog,
  reconstructFiles,
} from "./trace.ts";

const ALL_ARMS: LibraryArm[] = ["tidy-ts", "pandas", "tidyverse"];

function parseFlags() {
  const get = (name: string) => {
    const hit = Deno.args.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : undefined;
  };
  const taskFlag = get("task");
  const armFlag = get("arm");
  const runsFlag = get("runs");
  const outFlag = get("out");
  return {
    taskIds: taskFlag ? taskFlag.split(",") : undefined,
    arms: armFlag ? (armFlag.split(",") as LibraryArm[]) : ALL_ARMS,
    runs: runsFlag ? Number(runsFlag) : 5,
    out: outFlag,
  };
}

const FLAGS = parseFlags();
const HERE = fileURLToPath(new URL(".", import.meta.url));
const RESULTS_PATH = FLAGS.out
  ? (FLAGS.out.startsWith("/") ? FLAGS.out : join(HERE, FLAGS.out))
  : join(HERE, "runs", "results.jsonl");

mkdirSync(join(RESULTS_PATH, ".."), { recursive: true });

interface ResultRow {
  taskId: string;
  arm: LibraryArm;
  runIndex: number;
  modelResponse: string;
  librarySignaledBeforeRun: boolean;
  rationale: string;
  turnsUsed: number;
  toolCalls: number;
  firstSignalKind: "compiler" | "program" | "none";
  finalFile?: string;
  finalFileContents?: string;
  allFiles?: Record<string, string>;
  errored?: string;
}

function loadCompletedKeys(): Set<string> {
  if (!existsSync(RESULTS_PATH)) return new Set();
  const text = readFileSync(RESULTS_PATH, "utf-8");
  const keys = new Set<string>();
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      const row: ResultRow = JSON.parse(line);
      keys.add(`${row.taskId}|${row.arm}|${row.runIndex}`);
    } catch { /* ignore malformed */ }
  }
  return keys;
}

function defaultFilenameFor(arm: LibraryArm): string {
  if (arm === "tidy-ts") return "solution.ts";
  if (arm === "pandas") return "solution.py";
  return "solution.R";
}

async function runOne({
  task,
  arm,
  runIndex,
  sandboxClient,
}: {
  task: Task;
  arm: LibraryArm;
  runIndex: number;
  sandboxClient: InstanceType<typeof sandbox.UnixLocalClient>;
}): Promise<ResultRow> {
  const defaultFilename = defaultFilenameFor(arm);
  const topology = buildAgentTopology({ arm, fixtures: task.fixtures });

  // Result mode so we can inspect the trace whether or not the run
  // completed. Both arms carry the OTel trace — success on
  // `result.value.trace`, failure on `result.error.trace`.
  let agentError: string | undefined;
  let spans: ReadableSpan[] = [];
  const result = await ai.evaluate({
    topology,
    input: { intent: task.intent, defaultFilename },
    cache: false,
    sandboxClient,
    onError: "result",
  });
  if (result.ok) {
    spans = result.value.trace.spans;
  } else {
    agentError = result.error.message;
    spans = result.error.trace?.spans ?? [];
  }

  const files = reconstructFiles(spans);
  const finalFile = files[defaultFilename] ?? Object.values(files)[0];
  const allFiles: Record<string, string> = {};
  for (const [p, f] of Object.entries(files)) allFiles[p] = f.contents;

  const classifierTopology = buildClassifierTopology();
  const classified = await ai.evaluate({
    topology: classifierTopology,
    input: {
      intent: task.intent,
      plantedError: task.plantedError,
      finalFileContents: finalFile?.contents ?? "",
      finalFilePath: finalFile?.path ?? "(none)",
      actionLog: formatActionLog(spans) +
        (agentError ? `\n\n[agent loop terminated: ${agentError}]` : ""),
    },
    cache: false,
  });
  const out = classified.result;

  // Count tool calls from execute_tool spans on our trace.
  const toolCallCount = spans.filter(
    (s) => s.attributes["gen_ai.operation.name"] === "execute_tool",
  ).length;

  return {
    taskId: task.id,
    arm,
    runIndex,
    modelResponse: out.modelResponse,
    librarySignaledBeforeRun: out.librarySignaledBeforeRun,
    rationale: out.rationale,
    turnsUsed: spans.length,
    toolCalls: toolCallCount,
    firstSignalKind: firstSignalKind(spans),
    finalFile: finalFile?.path,
    finalFileContents: finalFile?.contents,
    allFiles: Object.keys(allFiles).length > 0 ? allFiles : undefined,
    errored: agentError,
  };
}

async function main() {
  const tasks = FLAGS.taskIds
    ? TASKS.filter((t) => FLAGS.taskIds!.includes(t.id))
    : TASKS;
  if (tasks.length === 0) {
    console.error(`no tasks match --task=${FLAGS.taskIds?.join(",")}`);
    return;
  }
  const completed = loadCompletedKeys();
  const total = tasks.length * FLAGS.arms.length * FLAGS.runs;
  let done = 0;
  let skipped = 0;

  console.error(
    `writing to ${RESULTS_PATH}: ${tasks.length} task(s) × ${FLAGS.arms.length} arm(s) × ${FLAGS.runs} run(s) = ${total} cells`,
  );

  // One sandbox client per process — the SDK creates a fresh session
  // per `ai.evaluate` call, so we don't need a fresh client per cell.
  const sandboxClient = new sandbox.UnixLocalClient();

  for (const task of tasks) {
    for (const arm of FLAGS.arms) {
      for (let r = 0; r < FLAGS.runs; r++) {
        done++;
        const key = `${task.id}|${arm}|${r}`;
        if (completed.has(key)) {
          skipped++;
          continue;
        }
        console.error(`[${done}/${total}] ${task.id} ${arm} run=${r}`);
        const row = await runOne({ task, arm, runIndex: r, sandboxClient });
        appendFileSync(RESULTS_PATH, JSON.stringify(row) + "\n", "utf-8");
      }
    }
  }
  console.error(`done. ${total - skipped} new rows, ${skipped} resumed.`);
}

if (import.meta.main) {
  await main();
}
