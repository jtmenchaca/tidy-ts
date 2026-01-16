/**
 * Batch processing utilities for async operations with concurrency control
 */

import {
  type ConcurrencyOptions,
  processConcurrently,
} from "../../promised-dataframe/concurrency-utils.ts";

/**
 * Process an array of items with an async function, applying concurrency control
 *
 * @param items - Array of items to process
 * @param fn - Async function to apply to each item
 * @param options - Concurrency control options
 * @param options.concurrency - Maximum concurrent operations (default: 1)
 * @param options.batchSize - Process items in batches of this size (default: undefined)
 * @param options.batchDelay - Delay in ms between batches (default: 0)
 * @param options.retry - Retry configuration (default: no retries)
 * @param options.retry.backoff - Retry strategy: "exponential" | "linear" | "custom"
 * @param options.retry.maxRetries - Maximum retry attempts (default: 3)
 * @param options.retry.baseDelay - Initial retry delay in ms (default: 100)
 * @param options.retry.maxDelay - Maximum delay between retries in ms (default: 5000)
 * @param options.retry.backoffMultiplier - Multiplier for exponential backoff (default: 2)
 * @param options.retry.shouldRetry - Function to determine if error should trigger retry
 * @param options.retry.onRetry - Callback when retry occurs
 * @returns Promise resolving to array of results
 *
 * @example
 * ```typescript
 * import { stats as s } from "@tidy-ts/dataframe";
 *
 * // Process with concurrency limit (default is 1)
 * const results = await s.batch(
 *   [1, 2, 3, 4, 5],
 *   async (n) => fetchData(n),
 *   { concurrency: 5 }
 * );
 *
 * // Process in batches with delay
 * const results = await s.batch(
 *   userIds,
 *   async (id) => fetchUser(id),
 *   { batchSize: 100, batchDelay: 50 }
 * );
 *
 * // With retry logic (all defaults shown)
 * const results = await s.batch(
 *   apiCalls,
 *   async (call) => makeRequest(call),
 *   {
 *     concurrency: 5,
 *     retry: {
 *       backoff: "exponential",
 *       maxRetries: 3,        // default
 *       baseDelay: 100,       // default
 *       maxDelay: 5000,       // default
 *       backoffMultiplier: 2, // default for exponential
 *     }
 *   }
 * );
 * ```
 */
export function batch<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  options: {
    /** Maximum number of concurrent async operations (default: 1) */
    concurrency?: number;

    /** Batch size for processing chunks (alternative to concurrency limit) */
    batchSize?: number;

    /** Delay between batches in milliseconds (default: 0) */
    batchDelay?: number;

    /** Retry configuration */
    retry?: {
      /** Retry strategy: "exponential", "linear", or "custom" */
      backoff: "exponential" | "linear" | "custom";

      /** Maximum number of retry attempts (default: 3) */
      maxRetries?: number;

      /** Initial delay before the first retry in milliseconds (default: 100) */
      baseDelay?: number;

      /** Backoff multiplier for exponential backoff (default: 2) */
      backoffMultiplier?: number;

      /** Maximum delay between retries in milliseconds (default: 5000) */
      maxDelay?: number;

      /** Required function for custom backoff that computes delay (in ms) */
      backoffFn?: (
        error: unknown,
        attempt: number,
        taskIndex: number,
      ) => number;

      /** Function to determine if an error should trigger a retry */
      shouldRetry?: (error: unknown, attempt: number) => boolean;

      /** Called before each retry attempt */
      onRetry?: (error: unknown, attempt: number, taskIndex: number) => void;
    };
  } = {},
): Promise<R[]> {
  // Convert items array to tasks array
  const tasks = items.map((item, index) => () => fn(item, index));

  // Use existing processConcurrently infrastructure
  return processConcurrently(tasks, options as ConcurrencyOptions);
}
