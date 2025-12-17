/**
 * Async utilities for concurrent processing with retry support.
 *
 * Provides `parallel` and `batch` functions for managing async operations
 * with concurrency control, retry logic, and backoff strategies.
 *
 * @module
 */

// ============================================================================
// Types
// ============================================================================

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
export type SettledResult<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: unknown };

// ============================================================================
// Internal helpers
// ============================================================================

/** Internal retry options after config normalization */
interface InternalRetryOptions {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;
  shouldRetry: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, taskIndex: number) => void;
}

/**
 * Converts user-facing RetryConfig to internal options with defaults applied.
 */
function convertRetryConfig(config?: RetryConfig): InternalRetryOptions {
  if (!config) {
    return {
      maxRetries: 0,
      retryDelay: 100,
      backoffMultiplier: 2,
      maxRetryDelay: 5000,
      shouldRetry: () => true,
    };
  }

  const base = {
    maxRetries: config.maxRetries ?? 3,
    shouldRetry: config.shouldRetry ?? (() => true),
    onRetry: config.onRetry,
  };

  switch (config.backoff) {
    case "exponential":
      return {
        ...base,
        retryDelay: config.baseDelay ?? 100,
        backoffMultiplier: config.backoffMultiplier ?? 2,
        maxRetryDelay: config.maxDelay ?? 5000,
      };
    case "linear":
      return {
        ...base,
        retryDelay: config.baseDelay ?? 100,
        backoffMultiplier: 1,
        maxRetryDelay: config.maxDelay ?? 5000,
      };
    case "custom":
      return {
        ...base,
        retryDelay: 0,
        backoffMultiplier: 1,
        maxRetryDelay: Infinity,
      };
  }
}

/**
 * Throws if the signal is already aborted.
 */
function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException("Aborted", "AbortError");
  }
}

/**
 * Creates an abortable delay promise that cleans up listeners properly.
 */
function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      return;
    }

    const onAbort = () => {
      clearTimeout(timeout);
      reject(signal!.reason ?? new DOMException("Aborted", "AbortError"));
    };

    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Executes a task with retry logic and abort support.
 *
 * @param task - Function that returns a promise
 * @param taskIndex - Index of this task (for error messages and callbacks)
 * @param options - Normalized retry options
 * @param retryConfig - Original retry config (for custom backoff)
 * @param signal - Optional abort signal
 * @returns Promise resolving to task result
 */
async function executeWithRetry<R>(
  task: () => Promise<R>,
  taskIndex: number,
  options: InternalRetryOptions,
  retryConfig?: RetryConfig,
  signal?: AbortSignal,
): Promise<R> {
  const {
    maxRetries,
    retryDelay,
    backoffMultiplier,
    maxRetryDelay,
    shouldRetry,
    onRetry,
  } = options;

  let lastError: unknown;
  let currentDelay = retryDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    checkAborted(signal);

    try {
      return await task();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries && shouldRetry(error, attempt + 1)) {
        onRetry?.(error, attempt + 1, taskIndex);

        let delayMs = currentDelay;

        if (retryConfig?.backoff === "custom") {
          delayMs = retryConfig.backoffFn(error, attempt + 1, taskIndex);
        } else if (retryConfig?.backoff === "linear") {
          delayMs = (retryConfig.baseDelay ?? 100) * (attempt + 1);
          delayMs = Math.min(delayMs, retryConfig.maxDelay ?? 5000);
        } else {
          delayMs = Math.min(currentDelay, maxRetryDelay);
          currentDelay = currentDelay * backoffMultiplier;
        }

        await abortableDelay(delayMs, signal);
      } else {
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Processes tasks with concurrency limiting using a semaphore pattern.
 * Fails fast on first error (like Promise.all) unless settled=true.
 *
 * @param tasks - Array of task functions
 * @param maxConcurrency - Maximum concurrent tasks
 * @param options - Retry options
 * @param retryConfig - Original retry config
 * @param signal - Abort signal
 * @param settled - If true, collect all results instead of failing on first error
 * @returns Array of results (or SettledResult if settled=true)
 */
async function processWithConcurrencyLimit<R>(
  tasks: Array<() => Promise<R>>,
  maxConcurrency: number,
  options: InternalRetryOptions,
  retryConfig?: RetryConfig,
  signal?: AbortSignal,
  settled?: boolean,
): Promise<R[] | SettledResult<R>[]> {
  checkAborted(signal);

  if (tasks.length === 0) {
    return [];
  }

  const results: R[] | SettledResult<R>[] = new Array(tasks.length);
  let activeCount = 0;
  let nextIndex = 0;
  let firstError: { index: number; error: unknown } | null = null;
  let abortController: AbortController | null = null;

  // Create internal abort controller for fail-fast behavior
  if (!settled && !signal) {
    abortController = new AbortController();
  }
  const effectiveSignal = signal ?? abortController?.signal;

  // Track pending waitForSlot cleanup - use a mutable object to avoid closure issues
  const cleanup = { fn: null as (() => void) | null };

  /**
   * Waits for a slot to become available or for abort.
   */
  const waitForSlot = (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (effectiveSignal?.aborted) {
        reject(
          effectiveSignal.reason ?? new DOMException("Aborted", "AbortError"),
        );
        return;
      }

      let resolved = false;

      const onAbort = () => {
        if (!resolved) {
          resolved = true;
          cleanup.fn = null;
          reject(
            effectiveSignal!.reason ??
              new DOMException("Aborted", "AbortError"),
          );
        }
      };

      // Store cleanup function
      cleanup.fn = () => {
        effectiveSignal?.removeEventListener("abort", onAbort);
      };

      // This will be called by signalSlot
      slotResolver = () => {
        if (!resolved) {
          resolved = true;
          effectiveSignal?.removeEventListener("abort", onAbort);
          cleanup.fn = null;
          resolve();
        }
      };

      effectiveSignal?.addEventListener("abort", onAbort, { once: true });
    });
  };

  let slotResolver: (() => void) | null = null;

  const signalSlot = () => {
    if (slotResolver) {
      const r = slotResolver;
      slotResolver = null;
      r();
    }
  };

  try {
    // Launch tasks up to concurrency limit
    while (nextIndex < tasks.length) {
      // For fail-fast: stop launching new tasks if we have an error
      if (!settled && firstError) {
        break;
      }

      // Check for user-provided abort signal (not internal fail-fast)
      if (signal?.aborted) {
        throw signal.reason ?? new DOMException("Aborted", "AbortError");
      }

      // Wait if at capacity
      if (activeCount >= maxConcurrency) {
        try {
          await waitForSlot();
        } catch (e) {
          // If aborted by internal controller for fail-fast, just break
          if (abortController?.signal.aborted && firstError) {
            break;
          }
          throw e;
        }
        continue;
      }

      const index = nextIndex++;
      const task = tasks[index];
      activeCount++;

      // Fire task
      executeWithRetry(task, index, options, retryConfig, effectiveSignal)
        .then((result) => {
          if (settled) {
            (results as SettledResult<R>[])[index] = {
              status: "fulfilled",
              value: result,
            };
          } else {
            (results as R[])[index] = result;
          }
        })
        .catch((error) => {
          if (settled) {
            (results as SettledResult<R>[])[index] = {
              status: "rejected",
              reason: error,
            };
          } else if (!firstError) {
            firstError = { index, error };
            // Trigger fail-fast by aborting internal controller
            abortController?.abort(error);
          }
        })
        .finally(() => {
          activeCount--;
          signalSlot();
        });
    }

    // Wait for remaining tasks (catch abort from fail-fast)
    while (activeCount > 0) {
      try {
        await waitForSlot();
      } catch (e) {
        // If aborted by internal controller for fail-fast, just continue draining
        if (abortController?.signal.aborted && firstError) {
          continue;
        }
        throw e;
      }
    }
  } finally {
    // Clean up any pending abort listener
    cleanup.fn?.();
  }

  // Throw first error if not in settled mode
  // TypeScript can't track that firstError may be set in promise callbacks
  const capturedError = firstError as { index: number; error: unknown } | null;
  if (!settled && capturedError) {
    throw new Error(`Task ${capturedError.index} failed`, {
      cause: capturedError.error,
    });
  }

  return results as R[] | SettledResult<R>[];
}

// ============================================================================
// Synchronous utilities
// ============================================================================

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
export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0 || !Number.isInteger(size)) {
    throw new Error("Chunk size must be a positive integer");
  }
  if (!Array.isArray(arr)) {
    throw new Error("First argument must be an array");
  }

  return Array.from(
    { length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, i * size + size),
  );
}

// ============================================================================
// Public API
// ============================================================================

type ExtractPromiseType<T> = T extends () => Promise<infer U> ? U
  : T extends Promise<infer U> ? U
  : never;

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
export function parallel<
  T extends readonly (Promise<unknown> | (() => Promise<unknown>))[],
>(
  promises: readonly [...T],
  options: {
    concurrency: number;
    retry?: RetryConfig;
    signal?: AbortSignal;
    settled: true;
  },
): Promise<
  { [K in keyof T]: SettledResult<Awaited<ExtractPromiseType<T[K]>>> }
>;
export function parallel<
  T extends readonly (Promise<unknown> | (() => Promise<unknown>))[],
>(
  promises: readonly [...T],
  options: {
    concurrency: number;
    retry?: RetryConfig;
    signal?: AbortSignal;
    settled?: false;
  },
): Promise<{ [K in keyof T]: Awaited<ExtractPromiseType<T[K]>> }>;
export function parallel<
  T extends readonly (Promise<unknown> | (() => Promise<unknown>))[],
>(
  promises: readonly [...T],
  options: {
    concurrency: number;
    retry?: RetryConfig;
    signal?: AbortSignal;
    settled?: boolean;
  },
): Promise<unknown> {
  const { concurrency, retry, signal, settled } = options;

  // Early abort check
  if (signal?.aborted) {
    return Promise.reject(
      signal.reason ?? new DOMException("Aborted", "AbortError"),
    );
  }

  // Convert to task functions
  const tasks = promises.map((promiseOrFn) =>
    typeof promiseOrFn === "function" ? promiseOrFn : () => promiseOrFn
  ) as Array<() => Promise<unknown>>;

  const retryOptions = convertRetryConfig(retry);

  return processWithConcurrencyLimit(
    tasks,
    concurrency,
    retryOptions,
    retry,
    signal,
    settled,
  );
}

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
export function batch<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  options: {
    concurrency: number;
    retry?: RetryConfig;
    signal?: AbortSignal;
    settled: true;
  },
): Promise<SettledResult<R>[]>;
export function batch<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  options: {
    concurrency: number;
    retry?: RetryConfig;
    signal?: AbortSignal;
    settled?: false;
  },
): Promise<R[]>;
export function batch<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  options: {
    concurrency: number;
    retry?: RetryConfig;
    signal?: AbortSignal;
    settled?: boolean;
  },
): Promise<R[] | SettledResult<R>[]> {
  const { concurrency, retry, signal, settled } = options;

  // Early abort check
  if (signal?.aborted) {
    return Promise.reject(
      signal.reason ?? new DOMException("Aborted", "AbortError"),
    );
  }

  const tasks = items.map((item, index) => () => fn(item, index));
  const retryOptions = convertRetryConfig(retry);

  return processWithConcurrencyLimit(
    tasks,
    concurrency,
    retryOptions,
    retry,
    signal,
    settled,
  ) as Promise<R[] | SettledResult<R>[]>;
}
