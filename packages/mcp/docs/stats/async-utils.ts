import type { DocEntry } from "../mcp-types.ts";

export const asyncUtilsDocs: Record<string, DocEntry> = {
  chunk: {
    name: "s.chunk",
    category: "stats",
    signature: "chunk<T>(arr: T[], size: number): T[][]",
    description:
      "Split an array into consecutive chunks of length `size`. Throws if `size` is not a positive integer or if the first argument is not an array.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "arr: Array to split",
      "size: Positive integer chunk size",
    ],
    returns: "Array of chunks (each chunk is T[])",
    examples: [
      "s.chunk([1, 2, 3, 4, 5, 6], 3) // [[1, 2, 3], [4, 5, 6]]",
      "s.chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]",
    ],
    related: ["batch", "parallel"],
  },

  batch: {
    name: "s.batch",
    category: "stats",
    signature: [
      "batch<T, R>(",
      "  items: T[],",
      "  fn: (item: T, index: number) => Promise<R>,",
      "  options?: {",
      "    concurrency?: number;",
      "    batchSize?: number;",
      "    batchDelay?: number;",
      "    retry?: { backoff: \"exponential\" | \"linear\" | \"custom\"; ... };",
      "  }",
      "): Promise<R[]>",
    ].join("\n"),
    description:
      "Run an async function over each item with optional concurrency limits, batching, delays, and retries (via shared concurrent processor). Default concurrency is 1 unless overridden.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "items: Values to process",
      "fn: Async mapper (receives item and index)",
      "options.concurrency: Max concurrent tasks (default 1)",
      "options.batchSize / batchDelay: Batch grouping and pause between batches",
      "options.retry: Retry policy (see source types for full fields)",
    ],
    returns: "Promise<R[]> — results in input order",
    examples: [
      "await s.batch([1, 2, 3], async (n) => n * 2, { concurrency: 2 })",
    ],
    related: ["parallel", "chunk"],
  },

  parallel: {
    name: "s.parallel",
    category: "stats",
    signature: [
      "parallel<T extends readonly (Promise<unknown> | (() => Promise<unknown>))[]>(",
      "  promises: readonly [...T],",
      "  options?: { concurrency?: number; retry?: { backoff: \"exponential\" | \"linear\" | \"custom\"; ... } }",
      "): Promise<{ [K in keyof T]: Awaited<...> }>",
    ].join("\n"),
    description:
      "Await multiple promises (or lazy functions that return promises) with optional concurrency and retries. Pass () => promise factories when using retry so each attempt creates a fresh promise.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "promises: Tuple of Promise values or functions returning Promise",
      "options.concurrency: Cap concurrent tasks (default Infinity)",
      "options.retry: Optional retry configuration",
    ],
    returns: "Promise of tuple-shaped results matching input order",
    examples: [
      "await s.parallel([Promise.resolve(1), Promise.resolve(2)])",
      "await s.parallel([() => fetch('/a'), () => fetch('/b')], { concurrency: 2 })",
    ],
    related: ["batch", "chunk"],
  },
};
