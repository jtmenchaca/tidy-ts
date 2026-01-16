/**
 * Concurrency Control Utilities for DataFrame Async Operations
 *
 * Provides utilities to limit concurrent async operations to prevent
 * overwhelming servers and provide better resource management.
 */

import type { Prettify } from "../dataframe/types/utility-types.ts";

/**
 * Retry strategy using exponential backoff.
 * Delay = baseDelay * backoffMultiplier^attempt
 */
export type ExponentialBackoff = Prettify<{
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
}>;

/**
 * Retry strategy using linear backoff.
 * Delay = baseDelay * attempt
 */
export type LinearBackoff = Prettify<{
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
}>;

/**
 * Retry strategy using a custom backoff function.
 */
export type CustomBackoff = Prettify<{
  backoff: "custom";

  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;

  /** Required function that computes the delay (in ms) based on error/attempt/task index */
  backoffFn: (error: unknown, attempt: number, taskIndex: number) => number;

  /** Function to determine if an error should trigger a retry */
  shouldRetry?: (error: unknown, attempt: number) => boolean;

  /** Called before each retry attempt */
  onRetry?: (error: unknown, attempt: number, taskIndex: number) => void;
}>;

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
 * Convert new RetryConfig to legacy format for internal use
 */
function convertRetryConfigToLegacy(retryConfig?: RetryConfig): RetryOptions {
  if (!retryConfig) {
    return { maxRetries: 0 };
  }

  const base: RetryOptions = {
    maxRetries: retryConfig.maxRetries ?? 3,
    shouldRetry: retryConfig.shouldRetry,
    onRetry: retryConfig.onRetry,
  };

  switch (retryConfig.backoff) {
    case "exponential":
      return {
        ...base,
        retryDelay: retryConfig.baseDelay ?? 100,
        backoffMultiplier: retryConfig.backoffMultiplier ?? 2,
        maxRetryDelay: retryConfig.maxDelay ?? 5000,
      };

    case "linear":
      return {
        ...base,
        retryDelay: retryConfig.baseDelay ?? 100,
        backoffMultiplier: 1, // Linear means no exponential growth
        maxRetryDelay: retryConfig.maxDelay ?? 5000,
      };

    case "custom":
      // For custom backoff, we'll handle the delay calculation specially
      return {
        ...base,
        retryDelay: 0, // Will be overridden by custom function
        backoffMultiplier: 1,
        maxRetryDelay: Infinity,
      };

    default:
      // This should never happen with proper typing
      return { maxRetries: 0 };
  }
}

/**
 * Processes an array of tasks with concurrency control
 *
 * @param tasks Array of functions that return promises
 * @param options Concurrency control options (new format)
 * @returns Promise that resolves to array of results
 */
// deno-lint-ignore require-await
export async function processConcurrently<T, R>(
  tasks: Array<() => Promise<R>>,
  options: ConcurrencyOptions = {},
): Promise<R[]> {
  const {
    concurrency = DEFAULT_CONCURRENCY.mutate.concurrency ?? 1,
    batchSize,
    batchDelay = 0,
    retry,
  } = options;

  // Convert new retry config to legacy format for internal use
  const legacyRetryOptions = convertRetryConfigToLegacy(retry);
  const legacyOptions: LegacyConcurrencyOptions = {
    concurrency,
    batchSize,
    batchDelay,
    ...legacyRetryOptions,
  };

  // If no concurrency limit and no retry, use Promise.all (fastest)
  if (
    concurrency === Infinity && !batchSize && !legacyRetryOptions.maxRetries
  ) {
    return Promise.all(tasks.map((task) => task()));
  }

  // Use batch processing if specified
  if (batchSize) {
    return processBatches(tasks, batchSize, batchDelay, legacyOptions, retry);
  }

  // Use concurrency limiting (with retry support)
  return processWithConcurrencyLimit(tasks, concurrency, legacyOptions, retry);
}

/**
 * Legacy processConcurrently for backward compatibility
 * @deprecated Use processConcurrently with ConcurrencyOptions instead
 */
// deno-lint-ignore require-await
export async function processConcurrentlyLegacy<T, R>(
  tasks: Array<() => Promise<R>>,
  options: LegacyConcurrencyOptions = {},
): Promise<R[]> {
  const {
    concurrency = DEFAULT_CONCURRENCY.mutate.concurrency ?? 1,
    batchSize,
    batchDelay = 0,
  } = options;

  // If no concurrency limit and no retry, use Promise.all (fastest)
  if (concurrency === Infinity && !batchSize && !options.maxRetries) {
    return Promise.all(tasks.map((task) => task()));
  }

  // Use batch processing if specified
  if (batchSize) {
    return processBatches(tasks, batchSize, batchDelay, options);
  }

  // Use concurrency limiting (with retry support)
  return processWithConcurrencyLimit(tasks, concurrency, options);
}

/**
 * Process tasks in batches with optional delay between batches
 */
async function processBatches<R>(
  tasks: Array<() => Promise<R>>,
  batchSize: number,
  batchDelay: number,
  options: LegacyConcurrencyOptions = {},
  retryConfig?: RetryConfig,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((task, idx) =>
        executeWithRetry(task, i + idx, options, retryConfig)
      ),
    );
    results.push(...batchResults);

    // Add delay between batches if specified
    if (batchDelay > 0 && i + batchSize < tasks.length) {
      await new Promise((resolve) => setTimeout(resolve, batchDelay));
    }
  }

  return results;
}

/**
 * Execute a task with retry logic
 */
async function executeWithRetry<R>(
  task: () => Promise<R>,
  taskIndex: number,
  options: RetryOptions = {},
  retryConfig?: RetryConfig,
): Promise<R> {
  const {
    maxRetries = 0,
    retryDelay = 100,
    backoffMultiplier = 2,
    maxRetryDelay = 10000,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: unknown;
  let currentDelay = retryDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await task();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries && shouldRetry(error, attempt + 1)) {
        if (onRetry) {
          onRetry(error, attempt + 1, taskIndex);
        }

        // Calculate delay based on retry config
        let delayMs = currentDelay;

        if (retryConfig?.backoff === "custom") {
          delayMs = retryConfig.backoffFn(error, attempt + 1, taskIndex);
        } else if (retryConfig?.backoff === "linear") {
          delayMs = (retryConfig.baseDelay ?? 100) * (attempt + 1);
          delayMs = Math.min(delayMs, retryConfig.maxDelay ?? 5000);
        } else {
          // Default to exponential backoff (legacy or explicit exponential)
          delayMs = Math.min(currentDelay, maxRetryDelay);
          currentDelay = currentDelay * backoffMultiplier;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        // No more retries or shouldRetry returned false
        break;
      }
    }
  }

  // All retries exhausted, throw the last error
  throw lastError;
}

/**
 * Process tasks with concurrency limiting using semaphore pattern
 */
async function processWithConcurrencyLimit<R>(
  tasks: Array<() => Promise<R>>,
  maxConcurrency: number,
  options: LegacyConcurrencyOptions = {},
  retryConfig?: RetryConfig,
): Promise<R[]> {
  const results: R[] = new Array(tasks.length);
  const executing: Promise<void>[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const promise = (async (index: number) => {
      try {
        results[index] = await executeWithRetry(
          task,
          index,
          options,
          retryConfig,
        );
      } catch (error) {
        // Re-throw with context about which task failed
        throw new Error(
          `Task ${index} failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    })(i);

    executing.push(promise);

    // If we've reached the concurrency limit, wait for at least one to complete
    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
      // Remove completed promises
      for (let j = executing.length - 1; j >= 0; j--) {
        if (await isPromiseResolved(executing[j])) {
          executing.splice(j, 1);
        }
      }
    }
  }

  // Wait for all remaining tasks to complete
  await Promise.all(executing);

  return results;
}

/**
 * Helper to check if a promise has resolved (for cleanup)
 */
async function isPromiseResolved(promise: Promise<void>): Promise<boolean> {
  try {
    let timeoutId: number | undefined;
    await Promise.race([
      promise,
      new Promise<void>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("timeout")), 0);
      }),
    ]);
    // Clear timeout if promise resolved first
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a queue-based concurrency limiter
 * Useful for reusable concurrency control across multiple operations
 */
export class ConcurrencyQueue {
  private running = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly maxConcurrency: number) {}

  /**
   * Execute a task with concurrency control
   */
  // deno-lint-ignore require-await
  async execute<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.running++;
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      });

      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.running < this.maxConcurrency && this.queue.length > 0) {
      const task = this.queue.shift()!;
      task();
    }
  }

  /**
   * Get current queue status
   */
  getStatus(): { running: number; queued: number } {
    return {
      running: this.running,
      queued: this.queue.length,
    };
  }
}

/**
 * Default concurrency options for different operation types
 */
export const DEFAULT_CONCURRENCY: Record<string, ConcurrencyOptions> = {
  // Conservative defaults for different operations
  mutate: { concurrency: 1 },
  filter: { concurrency: 1 },
  summarise: { concurrency: 1 },

  // Batch-based processing for large datasets
  largeMutate: { batchSize: 100, batchDelay: 10 },
  largeFilter: { batchSize: 200, batchDelay: 5 },

  // Default retry settings when retries are enabled
  withRetries: {
    concurrency: 1,
    retry: {
      backoff: "exponential",
      maxRetries: 3,
      baseDelay: 100,
      maxDelay: 5000,
    },
  },
};
