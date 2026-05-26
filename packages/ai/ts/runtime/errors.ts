// Error types thrown by `ai.evaluate`. All variants are built via
// `defineError` from @tidy-ts/shims, so a caller's `shouldRetry` /
// `Result` handler gets a properly-narrowed `AiEvalError` union (no
// `as { name?: string }` casts at the call site).
//
// Every variant carries the partial OTel trace accumulated up to the
// failure point. The trace is the source of truth for "what the model
// did before the throw" — read `error.trace.spans` to inspect tool
// calls, chat invocations, file edits, etc.

import { type AppError, defineError } from "@tidy-ts/shims";
import type { Trace } from "./tracing.ts";

export const InputValidationError = defineError(
  "InputValidationError",
  ({ message }: { message: string; issues?: unknown; trace?: Trace }) => message,
);
export type InputValidationError = AppError<
  "InputValidationError",
  { message: string; issues?: unknown; trace?: Trace }
>;

export const LlmTransportError = defineError(
  "LlmTransportError",
  ({ message }: { message: string; cause?: unknown; trace?: Trace }) => message,
);
export type LlmTransportError = AppError<
  "LlmTransportError",
  { message: string; cause?: unknown; trace?: Trace }
>;

export const OutputParseError = defineError(
  "OutputParseError",
  ({ message }: { message: string; raw?: string; issues?: unknown; trace?: Trace }) => message,
);
export type OutputParseError = AppError<
  "OutputParseError",
  { message: string; raw?: string; issues?: unknown; trace?: Trace }
>;

export const ToolError = defineError(
  "ToolError",
  ({ message }: { message: string; tool?: string; cause?: unknown; trace?: Trace }) => message,
);
export type ToolError = AppError<
  "ToolError",
  { message: string; tool?: string; cause?: unknown; trace?: Trace }
>;

/** Raised when an `AgentNode` exhausts its `Agent.maxToolTurns` budget
 *  without producing a final response. Distinct from `ToolError` so a
 *  caller's `shouldRetry` / `Result` handling can tell "runaway tool
 *  loop" apart from "individual tool threw." */
export const AgentTurnLimitError = defineError(
  "AgentTurnLimitError",
  ({ message }: {
    message: string;
    agent?: string;
    maxToolTurns?: number;
    trace?: Trace;
  }) => message,
);
export type AgentTurnLimitError = AppError<
  "AgentTurnLimitError",
  { message: string; agent?: string; maxToolTurns?: number; trace?: Trace }
>;

export type AiEvalError =
  | InputValidationError
  | LlmTransportError
  | OutputParseError
  | ToolError
  | AgentTurnLimitError;

/** Whether `e` is one of the documented runtime error variants. Used at
 *  the boundaries that catch arbitrary throws and need to decide whether
 *  to re-throw the typed variant as-is or wrap an unexpected runtime
 *  throw in `LlmTransportError`. */
export function isAiEvalError(e: unknown): e is AiEvalError {
  return (
    e instanceof InputValidationError ||
    e instanceof LlmTransportError ||
    e instanceof OutputParseError ||
    e instanceof ToolError ||
    e instanceof AgentTurnLimitError
  );
}

/** Coerce an unknown throw to an `AiEvalError`. Re-uses the typed
 *  variant when one is already in hand; otherwise translates known
 *  Agents-SDK error classes (`MaxTurnsExceededError`, `ModelBehaviorError`,
 *  `ToolTimeoutError`, etc.) before falling back to `LlmTransportError`
 *  for unrecognized throws. */
export function toAiEvalError(e: unknown): AiEvalError {
  if (isAiEvalError(e)) return e;
  const name = (e as { name?: string } | null)?.name;
  if (name === "MaxTurnsExceededError") {
    return new AgentTurnLimitError({
      message: e instanceof Error ? e.message : String(e),
    });
  }
  if (name === "ToolCallError" || name === "ToolTimeoutError") {
    return new ToolError({
      message: e instanceof Error ? e.message : String(e),
      cause: e,
    });
  }
  if (name === "ModelBehaviorError" || name === "ModelRefusalError") {
    return new OutputParseError({
      message: e instanceof Error ? e.message : String(e),
      issues: e,
    });
  }
  return new LlmTransportError({
    message: e instanceof Error ? e.message : String(e),
    cause: e,
  });
}
