// Reconstruct the final file state + a human-readable action log from
// the OTel trace `ai.evaluate` returns on `out.trace.spans`. Replaces
// the old SDK-shaped TurnEvent[] reconstruction — same information,
// sourced from the OTel-shaped GenAI semantic-convention spans instead.
//
// Each span carries `gen_ai.operation.name` ("execute_tool", "chat",
// "invoke_agent") or our extension namespace (`tidy_ts.ai.*`). We pull
// the relevant subset (tool calls + their outputs), classify by tool
// name and arguments, and project into the file/log shapes the
// classifier downstream consumes.

import type { ReadableSpan } from "@opentelemetry/sdk-trace-base";

// ── Attribute access helpers ───────────────────────────────────────────

function attr(span: ReadableSpan, key: string): unknown {
  return span.attributes[key];
}

function attrString(span: ReadableSpan, key: string): string | undefined {
  const v = attr(span, key);
  return typeof v === "string" ? v : undefined;
}

function operationName(span: ReadableSpan): string | undefined {
  return attrString(span, "gen_ai.operation.name") ??
    attrString(span, "tidy_ts.ai.operation.name");
}

/** OTel sorts spans by finish order in our exporter, but tool-call /
 *  tool-output pairs may interleave with chat spans across multiple
 *  agent turns. We don't need strict turn ordering; what we DO need is
 *  the apply-patch ops applied in the order they finished (which
 *  matches the order they were called). */
function toolCallSpans(spans: ReadableSpan[]): ReadableSpan[] {
  return spans.filter((s) => operationName(s) === "execute_tool");
}

// ── Minimal unified-diff applier ──────────────────────────────────────
//
// Handles the two shapes the SDK's apply_patch tool emits in practice:
// `create_file` (full body, often `+` prefixed) and `update_file`
// (compact hunk diff). We don't try to be a full diff library; if a
// hunk doesn't match cleanly we record the raw diff inline so the
// classifier still sees what was attempted.

function applyUnifiedDiff(source: string, diff: string): string | false {
  const lines = diff.split("\n");
  // If every non-empty line starts with `+`, treat as create-file body.
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
    else if (l.startsWith(" ")) {
      out.push(srcLines[srcIdx++] ?? "");
    }
  }
  while (srcIdx < srcLines.length) out.push(srcLines[srcIdx++]);
  return out.join("\n");
}

function tryApplyOrFallback(prev: string, diff: string): string {
  const applied = applyUnifiedDiff(prev, diff);
  if (typeof applied === "string") return applied;
  return prev + "\n\n[--- diff did not apply cleanly ---]\n" + diff;
}

// ── Apply-patch parsing ───────────────────────────────────────────────
//
// The SDK's `apply_patch` tool surfaces as `gen_ai.operation.name=execute_tool`
// with `gen_ai.tool.name="apply_patch"`. The arguments live on
// `gen_ai.tool.call.arguments` (a JSON string when captured) and the
// operation payload looks like `{ type: "create_file" | "update_file" |
// "delete_file", path, diff }`. captureMessageContent must be enabled
// on `ai.evaluate` for these to appear on the span — without it, this
// reconstruction returns an empty file map (the classifier will then
// see "no files" and score accordingly).

interface ApplyPatchOp {
  type: "create_file" | "update_file" | "delete_file";
  path: string;
  diff?: string;
}

function parseApplyPatchOp(span: ReadableSpan): ApplyPatchOp | undefined {
  const toolName = attrString(span, "gen_ai.tool.name");
  if (toolName !== "apply_patch") return undefined;
  const args = attrString(span, "gen_ai.tool.call.arguments");
  if (!args) return undefined;
  try {
    const parsed = JSON.parse(args) as { operation?: ApplyPatchOp } | ApplyPatchOp;
    const op = (parsed as { operation?: ApplyPatchOp }).operation
      ?? (parsed as ApplyPatchOp);
    if (op && typeof op === "object" && typeof op.path === "string") return op;
  } catch { /* fall through */ }
  return undefined;
}

export interface ReconstructedFile {
  path: string;
  contents: string;
  /** Number of apply_patch entries that targeted this path. */
  edits: number;
}

/** Walk the trace's `execute_tool` spans for `apply_patch` operations
 *  and fold them per path to reconstruct the final file state.
 *
 *  Requires `ai.evaluate({..., captureMessageContent: true })` — without
 *  it the tool-call arguments aren't attached to the span and this
 *  returns `{}`. */
export function reconstructFiles(
  spans: ReadableSpan[],
): Record<string, ReconstructedFile> {
  const files: Record<string, ReconstructedFile> = {};
  for (const span of toolCallSpans(spans)) {
    const op = parseApplyPatchOp(span);
    if (!op) continue;
    if (op.type === "delete_file") {
      delete files[op.path];
      continue;
    }
    const prev = op.type === "create_file"
      ? ""
      : files[op.path]?.contents ?? "";
    files[op.path] = {
      path: op.path,
      contents: tryApplyOrFallback(prev, op.diff ?? ""),
      edits: (files[op.path]?.edits ?? 0) + 1,
    };
  }
  return files;
}

// ── Action log ─────────────────────────────────────────────────────────
//
// One line per relevant span — message outputs, tool calls (with brief
// arguments), tool outputs (with brief preview), and the apply-patch
// summaries. Used as the classifier's input.

/** Compact human-readable representation of the trace.
 *
 *  Spans are emitted in finish order, which for sequential agent
 *  reasoning matches the order the model acted in. Concurrent subflow
 *  fan-out (ParallelMap, ParallelFlow) will interleave; the classifier
 *  reads this as a stream of evidence, not a strict timeline. */
export function formatActionLog(spans: ReadableSpan[]): string {
  const lines: string[] = [];
  let i = 0;
  for (const span of spans) {
    const op = operationName(span);
    if (op === undefined) continue;
    i++;
    if (op === "chat") {
      const model = attrString(span, "gen_ai.request.model") ?? "?";
      const inTok = span.attributes["gen_ai.usage.input_tokens"];
      const outTok = span.attributes["gen_ai.usage.output_tokens"];
      lines.push(
        `${i}. chat model=${model} in=${inTok ?? "?"} out=${outTok ?? "?"}`,
      );
      continue;
    }
    if (op === "execute_tool") {
      const tool = attrString(span, "gen_ai.tool.name") ?? "?";
      const args = attrString(span, "gen_ai.tool.call.arguments") ?? "";
      lines.push(
        `${i}. tool ${tool} ${args.slice(0, 200).replace(/\n/g, " | ")}`,
      );
      const result = attrString(span, "gen_ai.tool.call.result");
      if (result) {
        lines.push(
          `   ↳ ${result.slice(0, 400).replace(/\n/g, " | ")}`,
        );
      }
      continue;
    }
    if (op === "invoke_agent") {
      const name = attrString(span, "gen_ai.agent.name") ?? "?";
      lines.push(`${i}. agent ${name}`);
      continue;
    }
    if (op === "invoke_workflow") {
      const name = attrString(span, "gen_ai.workflow.name") ?? "?";
      lines.push(`${i}. workflow ${name}`);
      continue;
    }
    // tidy_ts.ai.* — control-flow nodes.
    lines.push(`${i}. ${op} ${attrString(span, "tidy_ts.ai.node.name") ?? ""}`);
  }
  return lines.join("\n");
}

// ── First-signal heuristic ─────────────────────────────────────────────
//
// Did the library surface a problem before the model ran the program?
// Looks at shell tool-call spans, classifying by leading command and
// non-zero exit code. Returns the kind of first non-zero signal seen,
// or "none".

export function firstSignalKind(
  spans: ReadableSpan[],
): "compiler" | "program" | "none" {
  for (const span of toolCallSpans(spans)) {
    const tool = attrString(span, "gen_ai.tool.name");
    if (tool !== "shell") continue;
    const args = attrString(span, "gen_ai.tool.call.arguments");
    const result = attrString(span, "gen_ai.tool.call.result");
    if (!args || !result) continue;
    const cmd = extractShellCommand(args);
    if (!cmd) continue;
    if (!outputIndicatesFailure(result)) continue;
    if (/^(deno\s+check|pyright|tsc)\b/.test(cmd)) return "compiler";
    if (/^(deno\s+run|python3?|Rscript|node)\b/.test(cmd)) return "program";
  }
  return "none";
}

function extractShellCommand(argsJson: string): string | undefined {
  try {
    const parsed = JSON.parse(argsJson) as Record<string, unknown>;
    if (typeof parsed.command === "string") return parsed.command;
    if (Array.isArray(parsed.command)) return (parsed.command as string[]).join(" ");
    if (typeof parsed.cmd === "string") return parsed.cmd;
  } catch { /* fall through */ }
  return undefined;
}

function outputIndicatesFailure(output: string): boolean {
  if (/\bexitCode\b\s*[:=]\s*[^0]/.test(output)) return true;
  if (/\berror\b/i.test(output) && !/\b0 errors?\b/i.test(output)) return true;
  return false;
}
