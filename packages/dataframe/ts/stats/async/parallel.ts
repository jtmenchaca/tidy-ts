/**
 * Parallel processing utilities for async operations with concurrency control
 */

import {
  type ConcurrencyOptions,
  processConcurrently,
} from "../../promised-dataframe/concurrency-utils.ts";

/**
 * Extract the resolved type from a Promise or a function that returns a Promise
 */
type ExtractPromiseType<T> = T extends () => Promise<infer U> ? U
  : T extends Promise<infer U> ? U
  : never;

/**
 * Process an array of promises with concurrency control and retry logic.
 * This serves as a replacement for Promise.all with additional async helper features.
 *
 * **Retry support**: To enable retry functionality, pass functions that create promises
 * instead of already-created promises. When retry is enabled and a promise is passed
 * directly, retry won't work (the same promise will be retried). Pass functions for
 * full retry support.
 *
 * @param promises - Array of promises or functions that create promises
 * @param options - Concurrency control options
 * @param options.concurrency - Maximum concurrent operations (default: Infinity, runs all in parallel)
 * @param options.retry - Retry configuration (default: no retries)
 * **Note**: For retry to work, pass functions `() => Promise<T>` instead of promises.
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
 * // Default behavior (like Promise.all) - all promises run concurrently
 * const results = await s.parallel([
 *   promise1,
 *   promise2,
 *   promise3,
 * ]);
 *
 * // With retry - pass functions that create promises
 * const results = await s.parallel(
 *   [
 *     () => makeRequest(apiCall1),
 *     () => makeRequest(apiCall2),
 *     () => makeRequest(apiCall3),
 *   ],
 *   {
 *     concurrency: 5,
 *     retry: {
 *       backoff: "exponential",
 *       maxRetries: 3,
 *       baseDelay: 100,
 *     }
 *   }
 * );
 * ```
 */
export function parallel<
  T extends readonly (Promise<unknown> | (() => Promise<unknown>))[],
>(
  promises: readonly [...T],
  options: {
    /** Maximum number of concurrent async operations (default: Infinity - all in parallel) */
    concurrency?: number;

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
): Promise<{ [K in keyof T]: Awaited<ExtractPromiseType<T[K]>> }> {
  // Convert promises/functions array to tasks array
  // If it's already a function, use it directly (enables retry)
  // If it's a promise, wrap it in a function (retry won't work, but API is compatible)
  const tasks = promises.map((promiseOrFn, _index) => {
    if (typeof promiseOrFn === "function") {
      // It's a function that creates a promise - use it directly for retry support
      return promiseOrFn;
    } else {
      // It's an already-created promise - wrap it (retry won't work)
      return () => promiseOrFn;
    }
  }) as Array<() => Promise<unknown>>;

  // Use existing processConcurrently infrastructure
  // Default concurrency to Infinity to match Promise.all behavior
  // Type assertion needed because:
  // 1. Retry config uses union type in signature but ConcurrencyOptions expects discriminated union
  // 2. processConcurrently returns Promise<unknown[]> but we need to preserve tuple types
  // Runtime behavior preserves order, so the cast is safe
  return processConcurrently(tasks, {
    concurrency: options.concurrency ?? Infinity,
    retry: options.retry,
  } as ConcurrencyOptions) as Promise<
    { [K in keyof T]: Awaited<ExtractPromiseType<T[K]>> }
  >;
}
