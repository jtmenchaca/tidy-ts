/**
 * Parallel processing utilities for async operations with concurrency control
 */

import {
  type ConcurrencyOptions,
  processConcurrently,
} from "../../promised-dataframe/concurrency-utils.ts";

/**
 * Process an array of promises with concurrency control, batching, and retry logic.
 * This serves as a replacement for Promise.all with additional async helper features.
 *
 * **Note on retry**: Retry logic requires recreating promises, which isn't possible
 * with already-created promises. For retry functionality, use `s.batch()` instead,
 * which accepts a function that creates promises.
 *
 * @param promises - Array of promises to execute
 * @param options - Concurrency control options
 * @param options.concurrency - Maximum concurrent operations (default: Infinity, runs all in parallel)
 * @param options.batchSize - Process promises in batches of this size (default: undefined)
 * @param options.batchDelay - Delay in ms between batches (default: 0)
 * @param options.retry - Retry configuration (default: no retries)
 * **Note**: Retry won't work with already-created promises. Use `s.batch()` for retry support.
 * @param options.retry.backoff - Retry strategy: "exponential" | "linear" | "custom"
 * @param options.retry.maxRetries - Maximum retry attempts (default: 3)
 * @param options.retry.baseDelay - Initial retry delay in ms (default: 100)
 * @param options.retry.maxDelay - Maximum delay between retries in ms (default: 5000)
 * @param options.retry.backoffMultiplier - Multiplier for exponential backoff (default: 2)
 * @param options.retry.shouldRetry - Function to determine if error should trigger retry
 * @param options.retry.onRetry - Callback when retry occurs
 * @returns Promise resolving to array of results in the same order as input
 *
 * @example
 * ```typescript
 * import { stats as s } from "@tidy-ts/dataframe";
 *
 * // Basic usage - like Promise.all but with concurrency control
 * const results = await s.parallel([
 *   fetchUser(1),
 *   fetchUser(2),
 *   fetchUser(3),
 * ], { concurrency: 2 });
 *
 * // Process in batches with delay
 * const results = await s.parallel(
 *   userIds.map(id => fetchUser(id)),
 *   { batchSize: 100, batchDelay: 50 }
 * );
 *
 * // Default behavior (like Promise.all) - all promises run concurrently
 * const results = await s.parallel([
 *   promise1,
 *   promise2,
 *   promise3,
 * ]);
 *
 * // For retry functionality, use s.batch() instead:
 * const results = await s.batch(
 *   apiCalls,
 *   async (call) => makeRequest(call),
 *   {
 *     concurrency: 5,
 *     retry: {
 *       backoff: "exponential",
 *       maxRetries: 3,
 *     }
 *   }
 * );
 * ```
 */
export function parallel<T>(
  promises: Array<Promise<T>>,
  options: {
    /** Maximum number of concurrent async operations (default: Infinity - all in parallel) */
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
): Promise<T[]> {
  // Convert promises array to tasks array
  // Each task wraps the promise to enable retry logic
  const tasks = promises.map((promise, index) => () => promise);

  // Use existing processConcurrently infrastructure
  // Default concurrency to Infinity to match Promise.all behavior
  // Type assertion needed because retry config uses union type in signature
  // but ConcurrencyOptions expects discriminated union
  return processConcurrently(tasks, {
    concurrency: options.concurrency ?? Infinity,
    batchSize: options.batchSize,
    batchDelay: options.batchDelay,
    retry: options.retry,
  } as ConcurrencyOptions);
}

