// Default `shouldRetry` predicate for the LLM call site + a small
// wrapper that applies it. Retries transient transport failures
// (anything not in the no-retry set) and refuses to retry errors that
// are semantically deterministic — re-issuing the same request would
// produce the same outcome.

import { retry, type RetryConfig, tryAsync } from "@tidy-ts/shims";

import {
  type AiEvalError,
  AgentTurnLimitError,
  InputValidationError,
  OutputParseError,
  toAiEvalError,
  ToolError,
} from "../errors.ts";

/** Refuses to retry parse / validation / tool / loop-exhaustion errors;
 *  retries everything else as transient transport. */
export const defaultShouldRetry = (
  error: unknown,
  _attempt: number,
): boolean => {
  if (error instanceof OutputParseError) return false;
  if (error instanceof InputValidationError) return false;
  if (error instanceof ToolError) return false;
  if (error instanceof AgentTurnLimitError) return false;
  return true;
};

/** Run an LLM-side network call with the default retry policy applied
 *  on top of the caller-supplied `retryConfig` (or directly when no
 *  retry config is set). Wraps transport-shaped exceptions in
 *  `LlmTransportError` via `tryAsync` and unwraps the result so callers
 *  see a typed throw on failure and a value on success.
 *
 *  Centralises the "tryAsync + retry + defaultShouldRetry + map to
 *  LlmTransportError + unwrap" pattern used by both agent node
 *  executors. */
export async function withDefaultRetry<T>(
  fn: () => Promise<T>,
  retryConfig: RetryConfig | undefined,
): Promise<T> {
  const wrapped = tryAsync({
    fn: () =>
      retryConfig
        ? retry(fn, { shouldRetry: defaultShouldRetry, ...retryConfig })
        : fn(),
    // Preserve typed AiEvalError variants — `OutputParseError` from the
    // post-API JSON.parse or live-Zod validation must NOT be re-wrapped
    // as transport. Everything else (network errors, SDK throws, etc.)
    // becomes `LlmTransportError`.
    mapError: (e): AiEvalError => toAiEvalError(e),
  });
  const result = await wrapped;
  if (!result.ok) throw result.error;
  return result.value;
}
