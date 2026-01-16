import type { DocEntry } from "../mcp-types.ts";

export const asyncDocs: Record<string, DocEntry> = {
  parallel: {
    name: "parallel",
    category: "shims",
    signature:
      "parallel<T>(promises: (Promise | (() => Promise))[], options: { concurrency: number; retry?: RetryConfig; signal?: AbortSignal; settled?: boolean }): Promise<T[] | SettledResult<T>[]>",
    description:
      "Process promises with concurrency control and retry logic. Limits how many promises run simultaneously. Pass functions (not already-started promises) to enable retry support. Fails fast on first error unless settled: true is passed.",
    imports: [
      'import { parallel } from "@tidy-ts/shims";',
    ],
    parameters: [
      "promises: Array of promises or functions returning promises",
      "options.concurrency: Maximum concurrent tasks (required)",
      "options.retry: Retry configuration (RetryConfig)",
      "options.signal: AbortSignal to cancel all tasks",
      "options.settled: If true, collect all results like Promise.allSettled",
    ],
    returns: "Promise<T[]> or Promise<SettledResult<T>[]> if settled: true",
    examples: [
      '// Basic concurrency limit\nimport { parallel } from "@tidy-ts/shims";\n\nconst results = await parallel(\n  [fetchUser(1), fetchUser(2), fetchUser(3)],\n  { concurrency: 2 }\n);',
      '// With retry (pass functions for retry support)\nconst results = await parallel(\n  [\n    () => fetchUser(1),\n    () => fetchUser(2),\n    () => fetchUser(3),\n  ],\n  {\n    concurrency: 5,\n    retry: {\n      backoff: "exponential",\n      maxRetries: 3,\n      baseDelay: 100,\n    }\n  }\n);',
      "// With timeout via AbortSignal\nconst results = await parallel(tasks, {\n  concurrency: 10,\n  signal: AbortSignal.timeout(5000)\n});",
      '// Collect all results even if some fail\nconst results = await parallel(tasks, { concurrency: 5, settled: true });\nfor (const r of results) {\n  if (r.status === "fulfilled") {\n    console.log(r.value);\n  } else {\n    console.error(r.reason);\n  }\n}',
    ],
    related: ["batch", "RetryConfig", "SettledResult"],
    bestPractices: [
      "✓ GOOD: Pass functions (not promises) to enable retry",
      "✓ GOOD: Use settled: true when you need all results",
      "✓ GOOD: Set appropriate concurrency limits for API rate limits",
      "✓ GOOD: Use AbortSignal.timeout() for request timeouts",
    ],
    antiPatterns: [
      "❌ BAD: Passing already-started promises when retry is configured",
      "❌ BAD: Setting concurrency too high for rate-limited APIs",
    ],
  },

  batch: {
    name: "batch",
    category: "shims",
    signature:
      "batch<T, R>(items: T[], fn: (item: T, index: number) => Promise<R>, options: { concurrency: number; retry?: RetryConfig; signal?: AbortSignal; settled?: boolean }): Promise<R[] | SettledResult<R>[]>",
    description:
      "Process items with an async function and concurrency control. Maps over an array with limited parallelism. Supports retry logic and fail-fast or settled modes.",
    imports: [
      'import { batch } from "@tidy-ts/shims";',
    ],
    parameters: [
      "items: Array of items to process",
      "fn: Async function to apply to each item (receives item and index)",
      "options.concurrency: Maximum concurrent tasks (required)",
      "options.retry: Retry configuration (RetryConfig)",
      "options.signal: AbortSignal to cancel all tasks",
      "options.settled: If true, collect all results like Promise.allSettled",
    ],
    returns: "Promise<R[]> or Promise<SettledResult<R>[]> if settled: true",
    examples: [
      '// Process with concurrency limit\nimport { batch } from "@tidy-ts/shims";\n\nconst results = await batch(\n  userIds,\n  async (id) => fetchUser(id),\n  { concurrency: 5 }\n);',
      '// With retry\nconst results = await batch(\n  apiCalls,\n  async (call) => makeRequest(call),\n  {\n    concurrency: 10,\n    retry: {\n      backoff: "exponential",\n      maxRetries: 3,\n    }\n  }\n);',
      "// Get all results even if some fail\nconst results = await batch(\n  items,\n  async (item) => process(item),\n  { concurrency: 5, settled: true }\n);",
    ],
    related: ["parallel", "chunk", "RetryConfig"],
    bestPractices: [
      "✓ GOOD: Use batch over manual Promise.all for rate limiting",
      "✓ GOOD: Use retry for flaky network requests",
    ],
  },

  chunk: {
    name: "chunk",
    category: "shims",
    signature: "chunk<T>(arr: T[], size: number): T[][]",
    description:
      "Splits an array into chunks of specified size. Returns an array of arrays, each containing up to 'size' elements. The last chunk may have fewer elements.",
    imports: [
      'import { chunk } from "@tidy-ts/shims";',
    ],
    parameters: [
      "arr: Array to split into chunks",
      "size: Size of each chunk (must be positive integer)",
    ],
    returns: "T[][] - Array of chunks",
    examples: [
      '// Split array into chunks\nimport { chunk } from "@tidy-ts/shims";\n\nconst numbers = [1, 2, 3, 4, 5, 6, 7];\nconst chunked = chunk(numbers, 3);\n// Returns: [[1, 2, 3], [4, 5, 6], [7]]',
      "// Batch processing\nconst userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];\nfor (const batch of chunk(userIds, 3)) {\n  await processUsers(batch);\n}",
    ],
    related: ["batch", "parallel"],
    bestPractices: [
      "✓ GOOD: Use for breaking large arrays into manageable batches",
      "✓ GOOD: Combine with sequential processing for rate limiting",
    ],
  },

  RetryConfig: {
    name: "RetryConfig",
    category: "shims",
    signature:
      "type RetryConfig = ExponentialBackoff | LinearBackoff | CustomBackoff",
    description:
      "Configuration for retry behavior in parallel and batch operations. Supports exponential backoff, linear backoff, or custom delay functions.",
    imports: [
      'import type { RetryConfig, ExponentialBackoff, LinearBackoff, CustomBackoff } from "@tidy-ts/shims";',
    ],
    parameters: [
      "backoff: Strategy type ('exponential' | 'linear' | 'custom')",
      "maxRetries: Maximum retry attempts (default: 3)",
      "baseDelay: Initial delay in ms (default: 100)",
      "backoffMultiplier: Multiplier for exponential growth (default: 2)",
      "maxDelay: Maximum delay cap in ms (default: 5000)",
      "shouldRetry: Function to determine if error should trigger retry",
      "onRetry: Callback called before each retry",
    ],
    returns: "Configuration object for retry behavior",
    examples: [
      '// Exponential backoff\nimport { parallel } from "@tidy-ts/shims";\n\nconst results = await parallel(tasks, {\n  concurrency: 5,\n  retry: {\n    backoff: "exponential",\n    maxRetries: 3,\n    baseDelay: 100,\n    backoffMultiplier: 2,\n    maxDelay: 5000,\n  }\n});',
      '// Linear backoff\nconst results = await parallel(tasks, {\n  concurrency: 5,\n  retry: {\n    backoff: "linear",\n    maxRetries: 3,\n    baseDelay: 200,\n  }\n});',
      '// Custom backoff with conditional retry\nconst results = await parallel(tasks, {\n  concurrency: 5,\n  retry: {\n    backoff: "custom",\n    maxRetries: 5,\n    backoffFn: (error, attempt) => attempt * 1000,\n    shouldRetry: (error) => error.name !== "AuthError",\n    onRetry: (error, attempt, taskIndex) => {\n      console.log(`Retrying task ${taskIndex}, attempt ${attempt}`);\n    }\n  }\n});',
    ],
    related: ["parallel", "batch", "ExponentialBackoff", "LinearBackoff"],
    bestPractices: [
      "✓ GOOD: Use exponential backoff for most API retry scenarios",
      "✓ GOOD: Set shouldRetry to avoid retrying non-transient errors",
      "✓ GOOD: Use onRetry for logging and monitoring",
      "✓ GOOD: Set maxDelay to cap worst-case delays",
    ],
  },

  SettledResult: {
    name: "SettledResult",
    category: "shims",
    signature:
      "type SettledResult<T> = { status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown }",
    description:
      "Result type for settled operations in parallel and batch. Matches Promise.allSettled output format. Used when settled: true is passed.",
    imports: [
      'import type { SettledResult } from "@tidy-ts/shims";',
    ],
    parameters: [
      "T: Type of the fulfilled value",
    ],
    returns:
      "Discriminated union with status, value (fulfilled) or reason (rejected)",
    examples: [
      '// Handle settled results\nimport { parallel, type SettledResult } from "@tidy-ts/shims";\n\nconst results: SettledResult<User>[] = await parallel(tasks, {\n  concurrency: 5,\n  settled: true\n});\n\nconst successful = results.filter((r): r is { status: "fulfilled"; value: User } =>\n  r.status === "fulfilled"\n);\n\nconst failed = results.filter((r): r is { status: "rejected"; reason: unknown } =>\n  r.status === "rejected"\n);',
    ],
    related: ["parallel", "batch"],
    bestPractices: [
      "✓ GOOD: Use type guards to narrow fulfilled vs rejected results",
      "✓ GOOD: Use settled: true when partial success is acceptable",
    ],
  },

  ExponentialBackoff: {
    name: "ExponentialBackoff",
    category: "shims",
    signature:
      "type ExponentialBackoff = { backoff: 'exponential'; maxRetries?: number; baseDelay?: number; backoffMultiplier?: number; maxDelay?: number; shouldRetry?: Function; onRetry?: Function }",
    description:
      "Retry strategy using exponential backoff. Delay = baseDelay * backoffMultiplier^attempt. Good for rate-limited APIs where you want increasing delays between retries.",
    imports: [
      'import type { ExponentialBackoff } from "@tidy-ts/shims";',
    ],
    parameters: [
      "backoff: 'exponential' (required literal)",
      "maxRetries: Maximum retry attempts (default: 3)",
      "baseDelay: Initial delay in ms (default: 100)",
      "backoffMultiplier: Multiplier for growth (default: 2)",
      "maxDelay: Maximum delay cap in ms (default: 5000)",
      "shouldRetry: (error, attempt) => boolean",
      "onRetry: (error, attempt, taskIndex) => void",
    ],
    returns: "RetryConfig for exponential backoff",
    examples: [
      '// Exponential: 100ms, 200ms, 400ms, 800ms...\nconst config: ExponentialBackoff = {\n  backoff: "exponential",\n  maxRetries: 5,\n  baseDelay: 100,\n  backoffMultiplier: 2,\n  maxDelay: 10000,\n};',
    ],
    related: ["RetryConfig", "LinearBackoff", "CustomBackoff"],
    bestPractices: [
      "✓ GOOD: Standard choice for rate-limited API retries",
      "✓ GOOD: Set maxDelay to prevent excessive wait times",
    ],
  },

  LinearBackoff: {
    name: "LinearBackoff",
    category: "shims",
    signature:
      "type LinearBackoff = { backoff: 'linear'; maxRetries?: number; baseDelay?: number; maxDelay?: number; shouldRetry?: Function; onRetry?: Function }",
    description:
      "Retry strategy using linear backoff. Delay = baseDelay * attempt. Provides consistent delay growth between retries.",
    imports: [
      'import type { LinearBackoff } from "@tidy-ts/shims";',
    ],
    parameters: [
      "backoff: 'linear' (required literal)",
      "maxRetries: Maximum retry attempts (default: 3)",
      "baseDelay: Base delay in ms (default: 100)",
      "maxDelay: Maximum delay cap in ms (default: 5000)",
      "shouldRetry: (error, attempt) => boolean",
      "onRetry: (error, attempt, taskIndex) => void",
    ],
    returns: "RetryConfig for linear backoff",
    examples: [
      '// Linear: 100ms, 200ms, 300ms, 400ms...\nconst config: LinearBackoff = {\n  backoff: "linear",\n  maxRetries: 5,\n  baseDelay: 100,\n};',
    ],
    related: ["RetryConfig", "ExponentialBackoff", "CustomBackoff"],
    bestPractices: [
      "✓ GOOD: Use when you want predictable, steady delay increases",
    ],
  },

  CustomBackoff: {
    name: "CustomBackoff",
    category: "shims",
    signature:
      "type CustomBackoff = { backoff: 'custom'; maxRetries?: number; backoffFn: (error, attempt, taskIndex) => number; shouldRetry?: Function; onRetry?: Function }",
    description:
      "Retry strategy using a custom backoff function. Provides full control over delay calculation based on error, attempt number, and task index.",
    imports: [
      'import type { CustomBackoff } from "@tidy-ts/shims";',
    ],
    parameters: [
      "backoff: 'custom' (required literal)",
      "maxRetries: Maximum retry attempts (default: 3)",
      "backoffFn: (error, attempt, taskIndex) => delay in ms (required)",
      "shouldRetry: (error, attempt) => boolean",
      "onRetry: (error, attempt, taskIndex) => void",
    ],
    returns: "RetryConfig for custom backoff",
    examples: [
      '// Custom delay based on error type\nconst config: CustomBackoff = {\n  backoff: "custom",\n  maxRetries: 5,\n  backoffFn: (error, attempt, taskIndex) => {\n    // Rate limit errors get longer delays\n    if (error.status === 429) return 5000 * attempt;\n    return 100 * Math.pow(2, attempt);\n  },\n  shouldRetry: (error) => error.status !== 401,\n};',
    ],
    related: ["RetryConfig", "ExponentialBackoff", "LinearBackoff"],
    bestPractices: [
      "✓ GOOD: Use for complex retry logic that depends on error type",
      "✓ GOOD: Use backoffFn to implement jitter",
    ],
  },
};
