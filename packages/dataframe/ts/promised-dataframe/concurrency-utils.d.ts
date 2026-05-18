/**
 * Concurrency Control Utilities for DataFrame Async Operations
 *
 * Provides utilities to limit concurrent async operations to prevent
 * overwhelming servers and provide better resource management.
 */
/**
 * Retry strategy using exponential backoff.
 * Delay = baseDelay * backoffMultiplier^attempt
 */
export type ExponentialBackoff = {
    /** Backoff strategy identifier */
    backoff: "exponential";
    /** Maximum number of retry attempts (default: 3) */
    maxRetries?: number;
    /** Initial delay before the first retry in milliseconds (default: 100) */
    baseDelay?: number;
    /** Backoff multiplier for exponential backoff (default: 2) */
    backoffMultiplier?: number;
    /** Maximum delay between retries in milliseconds (default: 5000) */
    maxDelay?: number;
    /** Function to determine if an error should trigger a retry */
    shouldRetry?: (error: unknown, attempt: number) => boolean;
    /** Called before each retry attempt */
    onRetry?: (error: unknown, attempt: number, taskIndex: number) => void;
};
/**
 * Retry strategy using linear backoff.
 * Delay = baseDelay * attempt
 */
export type LinearBackoff = {
    backoff: "linear";
    /** Maximum number of retry attempts (default: 3) */
    maxRetries?: number;
    /** Initial delay before the first retry in milliseconds (default: 100) */
    baseDelay?: number;
    /** Maximum delay between retries in milliseconds (default: 5000) */
    maxDelay?: number;
    /** Function to determine if an error should trigger a retry */
    shouldRetry?: (error: unknown, attempt: number) => boolean;
    /** Called before each retry attempt */
    onRetry?: (error: unknown, attempt: number, taskIndex: number) => void;
};
/**
 * Retry strategy using a custom backoff function.
 */
export type CustomBackoff = {
    backoff: "custom";
    /** Maximum number of retry attempts (default: 3) */
    maxRetries?: number;
    /** Required function that computes the delay (in ms) based on error/attempt/task index */
    backoffFn: (error: unknown, attempt: number, taskIndex: number) => number;
    /** Function to determine if an error should trigger a retry */
    shouldRetry?: (error: unknown, attempt: number) => boolean;
    /** Called before each retry attempt */
    onRetry?: (error: unknown, attempt: number, taskIndex: number) => void;
};
/**
 * Supported retry strategies.
 */
export type RetryConfig = ExponentialBackoff | LinearBackoff | CustomBackoff;
/**
 * Legacy retry options interface for backward compatibility.
 * @deprecated Use RetryConfig with discriminated unions instead
 */
export interface RetryOptions {
    /** Maximum number of retry attempts (default: 0 - no retries) */
    maxRetries?: number;
    /** Initial delay between retries in milliseconds (default: 100) */
    retryDelay?: number;
    /** Backoff multiplier for exponential backoff (default: 2) */
    backoffMultiplier?: number;
    /** Maximum delay between retries in milliseconds (default: 10000) */
    maxRetryDelay?: number;
    /** Function to determine if an error should trigger a retry */
    shouldRetry?: (error: unknown, attempt: number) => boolean;
    /** Callback when a retry occurs */
    onRetry?: (error: unknown, attempt: number, taskIndex: number) => void;
}
/**
 * Options for controlling async concurrency in DataFrame operations
 */
export interface ConcurrencyOptions {
    /** Maximum number of concurrent async operations (default: unlimited) */
    concurrency?: number;
    /** Batch size for processing chunks (alternative to concurrency limit) */
    batchSize?: number;
    /** Delay between batches in milliseconds */
    batchDelay?: number;
    /** Retry configuration using discriminated unions */
    retry?: RetryConfig;
}
/**
 * Legacy concurrency options for backward compatibility.
 * @deprecated Use ConcurrencyOptions with retry: RetryConfig instead
 */
export interface LegacyConcurrencyOptions extends RetryOptions {
    /** Maximum number of concurrent async operations (default: unlimited) */
    concurrency?: number;
    /** Batch size for processing chunks (alternative to concurrency limit) */
    batchSize?: number;
    /** Delay between batches in milliseconds */
    batchDelay?: number;
}
/**
 * Processes an array of tasks with concurrency control
 *
 * @param tasks Array of functions that return promises
 * @param options Concurrency control options (new format)
 * @returns Promise that resolves to array of results
 */
export declare function processConcurrently<T, R>(tasks: Array<() => Promise<R>>, options?: ConcurrencyOptions): Promise<R[]>;
/**
 * Default concurrency options for different operation types
 */
export declare const DEFAULT_CONCURRENCY: Record<string, ConcurrencyOptions>;
