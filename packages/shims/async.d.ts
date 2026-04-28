/**
 * Async utilities for concurrent processing with retry support.
 *
 * Provides `parallel` and `batch` functions for managing async operations
 * with concurrency control, retry logic, and backoff strategies.
 *
 * @module
 */
/**
 * Retry strategy using exponential backoff.
 * Delay = baseDelay * backoffMultiplier^attempt
 */
export type ExponentialBackoff = {
    backoff: "exponential";
    /** Maximum retry attempts (default: 3) */
    maxRetries?: number;
    /** Initial delay in ms (default: 100) */
    baseDelay?: number;
    /** Multiplier for exponential growth (default: 2) */
    backoffMultiplier?: number;
    /** Maximum delay in ms (default: 5000) */
    maxDelay?: number;
    /** Determine if error should trigger retry */
    shouldRetry?: (error: unknown, attempt: number) => boolean;
    /** Called before each retry */
    onRetry?: (error: unknown, attempt: number, taskIndex: number) => void;
};
/**
 * Retry strategy using linear backoff.
 * Delay = baseDelay * attempt
 */
export type LinearBackoff = {
    backoff: "linear";
    /** Maximum retry attempts (default: 3) */
    maxRetries?: number;
    /** Base delay in ms (default: 100) */
    baseDelay?: number;
    /** Maximum delay in ms (default: 5000) */
    maxDelay?: number;
    /** Determine if error should trigger retry */
    shouldRetry?: (error: unknown, attempt: number) => boolean;
    /** Called before each retry */
    onRetry?: (error: unknown, attempt: number, taskIndex: number) => void;
};
/**
 * Retry strategy using a custom backoff function.
 */
export type CustomBackoff = {
    backoff: "custom";
    /** Maximum retry attempts (default: 3) */
    maxRetries?: number;
    /** Function to compute delay in ms */
    backoffFn: (error: unknown, attempt: number, taskIndex: number) => number;
    /** Determine if error should trigger retry */
    shouldRetry?: (error: unknown, attempt: number) => boolean;
    /** Called before each retry */
    onRetry?: (error: unknown, attempt: number, taskIndex: number) => void;
};
/** Supported retry strategies */
export type RetryConfig = ExponentialBackoff | LinearBackoff | CustomBackoff;
/** Result of a settled task */
export type SettledResult<T> = {
    status: "fulfilled";
    value: T;
} | {
    status: "rejected";
    reason: unknown;
};
/**
 * Splits an array into chunks of specified size.
 *
 * @param arr - Array to split into chunks
 * @param size - Size of each chunk (must be positive integer)
 * @returns Array of chunks, where each chunk is an array of elements
 *
 * @example
 * ```typescript
 * import { chunk } from "@tidy-ts/shims";
 *
 * const numbers = [1, 2, 3, 4, 5, 6, 7];
 * const chunked = chunk(numbers, 3);
 * // Returns: [[1, 2, 3], [4, 5, 6], [7]]
 *
 * // Useful for batch processing
 * const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
 * for (const batch of chunk(userIds, 3)) {
 *   await processUsers(batch);
 * }
 * ```
 */
export declare function chunk<T>(arr: T[], size: number): T[][];
type ExtractPromiseType<T> = T extends () => Promise<infer U> ? U : T extends Promise<infer U> ? U : never;
/**
 * Process promises with concurrency control and retry logic.
 *
 * @example
 * ```typescript
 * import { parallel } from "@tidy-ts/shims";
 *
 * // With concurrency limit
 * const results = await parallel(
 *   [fetchUser(1), fetchUser(2), fetchUser(3)],
 *   { concurrency: 2 }
 * );
 *
 * // With retry (pass functions for retry support)
 * const results = await parallel(
 *   [
 *     () => fetchUser(1),
 *     () => fetchUser(2),
 *     () => fetchUser(3),
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
 *
 * // With timeout
 * const results = await parallel(tasks, {
 *   concurrency: 10,
 *   signal: AbortSignal.timeout(5000)
 * });
 *
 * // Get all results even if some fail (like Promise.allSettled)
 * const results = await parallel(tasks, { concurrency: 5, settled: true });
 * ```
 */
export declare function parallel<T extends readonly (Promise<unknown> | (() => Promise<unknown>))[]>(promises: readonly [...T], options: {
    concurrency: number;
    retry?: RetryConfig;
    signal?: AbortSignal;
    settled: true;
}): Promise<{
    [K in keyof T]: SettledResult<Awaited<ExtractPromiseType<T[K]>>>;
}>;
export declare function parallel<T extends readonly (Promise<unknown> | (() => Promise<unknown>))[]>(promises: readonly [...T], options: {
    concurrency: number;
    retry?: RetryConfig;
    signal?: AbortSignal;
    settled?: false;
}): Promise<{
    [K in keyof T]: Awaited<ExtractPromiseType<T[K]>>;
}>;
/**
 * Process items with an async function and concurrency control.
 *
 * @example
 * ```typescript
 * import { batch } from "@tidy-ts/shims";
 *
 * // Process with concurrency limit
 * const results = await batch(
 *   userIds,
 *   async (id) => fetchUser(id),
 *   { concurrency: 5 }
 * );
 *
 * // With retry
 * const results = await batch(
 *   apiCalls,
 *   async (call) => makeRequest(call),
 *   {
 *     concurrency: 10,
 *     retry: {
 *       backoff: "exponential",
 *       maxRetries: 3,
 *     }
 *   }
 * );
 *
 * // Get all results even if some fail
 * const results = await batch(items, fn, { concurrency: 5, settled: true });
 * ```
 */
export declare function batch<T, R>(items: T[], fn: (item: T, index: number) => Promise<R>, options: {
    concurrency: number;
    retry?: RetryConfig;
    signal?: AbortSignal;
    settled: true;
}): Promise<SettledResult<R>[]>;
export declare function batch<T, R>(items: T[], fn: (item: T, index: number) => Promise<R>, options: {
    concurrency: number;
    retry?: RetryConfig;
    signal?: AbortSignal;
    settled?: false;
}): Promise<R[]>;
export {};
