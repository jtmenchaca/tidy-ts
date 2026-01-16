# Async

> Auto-generated from tidy-ts MCP documentation

## Table of Contents

- [parallel](#parallel)
- [batch](#batch)
- [chunk](#chunk)
- [RetryConfig](#retryconfig)
- [SettledResult](#settledresult)
- [ExponentialBackoff](#exponentialbackoff)
- [LinearBackoff](#linearbackoff)
- [CustomBackoff](#custombackoff)

---

## parallel

Process promises with concurrency control and retry logic. Limits how many promises run simultaneously. Pass functions (not already-started promises) to enable retry support. Fails fast on first error unless settled: true is passed.

### Signature

```typescript
parallel<T>(promises: (Promise | (() => Promise))[], options: { concurrency: number; retry?: RetryConfig; signal?: AbortSignal; settled?: boolean }): Promise<T[] | SettledResult<T>[]>
```

### Import

```typescript
import { parallel } from "@tidy-ts/shims";
```

### Parameters

- promises: Array of promises or functions returning promises
- options.concurrency: Maximum concurrent tasks (required)
- options.retry: Retry configuration (RetryConfig)
- options.signal: AbortSignal to cancel all tasks
- options.settled: If true, collect all results like Promise.allSettled

### Returns

Promise<T[]> or Promise<SettledResult<T>[]> if settled: true

### Examples

```typescript
// Basic concurrency limit
import { parallel } from "@tidy-ts/shims";

const results = await parallel(
  [fetchUser(1), fetchUser(2), fetchUser(3)],
  { concurrency: 2 }
);
// With retry (pass functions for retry support)
const results = await parallel(
  [
    () => fetchUser(1),
    () => fetchUser(2),
    () => fetchUser(3),
  ],
  {
    concurrency: 5,
    retry: {
      backoff: "exponential",
      maxRetries: 3,
      baseDelay: 100,
    }
  }
);
// With timeout via AbortSignal
const results = await parallel(tasks, {
  concurrency: 10,
  signal: AbortSignal.timeout(5000)
});
// Collect all results even if some fail
const results = await parallel(tasks, { concurrency: 5, settled: true });
for (const r of results) {
  if (r.status === "fulfilled") {
    console.log(r.value);
  } else {
    console.error(r.reason);
  }
}
```

### Best Practices

- ✓ GOOD: Pass functions (not promises) to enable retry
- ✓ GOOD: Use settled: true when you need all results
- ✓ GOOD: Set appropriate concurrency limits for API rate limits
- ✓ GOOD: Use AbortSignal.timeout() for request timeouts

### Anti-patterns

- ❌ BAD: Passing already-started promises when retry is configured
- ❌ BAD: Setting concurrency too high for rate-limited APIs

### Related

`batch`, `RetryConfig`, `SettledResult`

---

## batch

Process items with an async function and concurrency control. Maps over an array with limited parallelism. Supports retry logic and fail-fast or settled modes.

### Signature

```typescript
batch<T, R>(items: T[], fn: (item: T, index: number) => Promise<R>, options: { concurrency: number; retry?: RetryConfig; signal?: AbortSignal; settled?: boolean }): Promise<R[] | SettledResult<R>[]>
```

### Import

```typescript
import { batch } from "@tidy-ts/shims";
```

### Parameters

- items: Array of items to process
- fn: Async function to apply to each item (receives item and index)
- options.concurrency: Maximum concurrent tasks (required)
- options.retry: Retry configuration (RetryConfig)
- options.signal: AbortSignal to cancel all tasks
- options.settled: If true, collect all results like Promise.allSettled

### Returns

Promise<R[]> or Promise<SettledResult<R>[]> if settled: true

### Examples

```typescript
// Process with concurrency limit
import { batch } from "@tidy-ts/shims";

const results = await batch(
  userIds,
  async (id) => fetchUser(id),
  { concurrency: 5 }
);
// With retry
const results = await batch(
  apiCalls,
  async (call) => makeRequest(call),
  {
    concurrency: 10,
    retry: {
      backoff: "exponential",
      maxRetries: 3,
    }
  }
);
// Get all results even if some fail
const results = await batch(
  items,
  async (item) => process(item),
  { concurrency: 5, settled: true }
);
```

### Best Practices

- ✓ GOOD: Use batch over manual Promise.all for rate limiting
- ✓ GOOD: Use retry for flaky network requests

### Related

`parallel`, `chunk`, `RetryConfig`

---

## chunk

Splits an array into chunks of specified size. Returns an array of arrays, each containing up to 'size' elements. The last chunk may have fewer elements.

### Signature

```typescript
chunk<T>(arr: T[], size: number): T[][]
```

### Import

```typescript
import { chunk } from "@tidy-ts/shims";
```

### Parameters

- arr: Array to split into chunks
- size: Size of each chunk (must be positive integer)

### Returns

T[][] - Array of chunks

### Examples

```typescript
// Split array into chunks
import { chunk } from "@tidy-ts/shims";

const numbers = [1, 2, 3, 4, 5, 6, 7];
const chunked = chunk(numbers, 3);
// Returns: [[1, 2, 3], [4, 5, 6], [7]]
// Batch processing
const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
for (const batch of chunk(userIds, 3)) {
  await processUsers(batch);
}
```

### Best Practices

- ✓ GOOD: Use for breaking large arrays into manageable batches
- ✓ GOOD: Combine with sequential processing for rate limiting

### Related

`batch`, `parallel`

---

## RetryConfig

Configuration for retry behavior in parallel and batch operations. Supports exponential backoff, linear backoff, or custom delay functions.

### Signature

```typescript
type RetryConfig = ExponentialBackoff | LinearBackoff | CustomBackoff
```

### Import

```typescript
import type { RetryConfig, ExponentialBackoff, LinearBackoff, CustomBackoff } from "@tidy-ts/shims";
```

### Parameters

- backoff: Strategy type ('exponential' | 'linear' | 'custom')
- maxRetries: Maximum retry attempts (default: 3)
- baseDelay: Initial delay in ms (default: 100)
- backoffMultiplier: Multiplier for exponential growth (default: 2)
- maxDelay: Maximum delay cap in ms (default: 5000)
- shouldRetry: Function to determine if error should trigger retry
- onRetry: Callback called before each retry

### Returns

Configuration object for retry behavior

### Examples

```typescript
// Exponential backoff
import { parallel } from "@tidy-ts/shims";

const results = await parallel(tasks, {
  concurrency: 5,
  retry: {
    backoff: "exponential",
    maxRetries: 3,
    baseDelay: 100,
    backoffMultiplier: 2,
    maxDelay: 5000,
  }
});
// Linear backoff
const results = await parallel(tasks, {
  concurrency: 5,
  retry: {
    backoff: "linear",
    maxRetries: 3,
    baseDelay: 200,
  }
});
// Custom backoff with conditional retry
const results = await parallel(tasks, {
  concurrency: 5,
  retry: {
    backoff: "custom",
    maxRetries: 5,
    backoffFn: (error, attempt) => attempt * 1000,
    shouldRetry: (error) => error.name !== "AuthError",
    onRetry: (error, attempt, taskIndex) => {
      console.log(`Retrying task ${taskIndex}, attempt ${attempt}`);
    }
  }
});
```

### Best Practices

- ✓ GOOD: Use exponential backoff for most API retry scenarios
- ✓ GOOD: Set shouldRetry to avoid retrying non-transient errors
- ✓ GOOD: Use onRetry for logging and monitoring
- ✓ GOOD: Set maxDelay to cap worst-case delays

### Related

`parallel`, `batch`, `ExponentialBackoff`, `LinearBackoff`

---

## SettledResult

Result type for settled operations in parallel and batch. Matches Promise.allSettled output format. Used when settled: true is passed.

### Signature

```typescript
type SettledResult<T> = { status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown }
```

### Import

```typescript
import type { SettledResult } from "@tidy-ts/shims";
```

### Parameters

- T: Type of the fulfilled value

### Returns

Discriminated union with status, value (fulfilled) or reason (rejected)

### Examples

```typescript
// Handle settled results
import { parallel, type SettledResult } from "@tidy-ts/shims";

const results: SettledResult<User>[] = await parallel(tasks, {
  concurrency: 5,
  settled: true
});

const successful = results.filter((r): r is { status: "fulfilled"; value: User } =>
  r.status === "fulfilled"
);

const failed = results.filter((r): r is { status: "rejected"; reason: unknown } =>
  r.status === "rejected"
);
```

### Best Practices

- ✓ GOOD: Use type guards to narrow fulfilled vs rejected results
- ✓ GOOD: Use settled: true when partial success is acceptable

### Related

`parallel`, `batch`

---

## ExponentialBackoff

Retry strategy using exponential backoff. Delay = baseDelay * backoffMultiplier^attempt. Good for rate-limited APIs where you want increasing delays between retries.

### Signature

```typescript
type ExponentialBackoff = { backoff: 'exponential'; maxRetries?: number; baseDelay?: number; backoffMultiplier?: number; maxDelay?: number; shouldRetry?: Function; onRetry?: Function }
```

### Import

```typescript
import type { ExponentialBackoff } from "@tidy-ts/shims";
```

### Parameters

- backoff: 'exponential' (required literal)
- maxRetries: Maximum retry attempts (default: 3)
- baseDelay: Initial delay in ms (default: 100)
- backoffMultiplier: Multiplier for growth (default: 2)
- maxDelay: Maximum delay cap in ms (default: 5000)
- shouldRetry: (error, attempt) => boolean
- onRetry: (error, attempt, taskIndex) => void

### Returns

RetryConfig for exponential backoff

### Examples

```typescript
// Exponential: 100ms, 200ms, 400ms, 800ms...
const config: ExponentialBackoff = {
  backoff: "exponential",
  maxRetries: 5,
  baseDelay: 100,
  backoffMultiplier: 2,
  maxDelay: 10000,
};
```

### Best Practices

- ✓ GOOD: Standard choice for rate-limited API retries
- ✓ GOOD: Set maxDelay to prevent excessive wait times

### Related

`RetryConfig`, `LinearBackoff`, `CustomBackoff`

---

## LinearBackoff

Retry strategy using linear backoff. Delay = baseDelay * attempt. Provides consistent delay growth between retries.

### Signature

```typescript
type LinearBackoff = { backoff: 'linear'; maxRetries?: number; baseDelay?: number; maxDelay?: number; shouldRetry?: Function; onRetry?: Function }
```

### Import

```typescript
import type { LinearBackoff } from "@tidy-ts/shims";
```

### Parameters

- backoff: 'linear' (required literal)
- maxRetries: Maximum retry attempts (default: 3)
- baseDelay: Base delay in ms (default: 100)
- maxDelay: Maximum delay cap in ms (default: 5000)
- shouldRetry: (error, attempt) => boolean
- onRetry: (error, attempt, taskIndex) => void

### Returns

RetryConfig for linear backoff

### Examples

```typescript
// Linear: 100ms, 200ms, 300ms, 400ms...
const config: LinearBackoff = {
  backoff: "linear",
  maxRetries: 5,
  baseDelay: 100,
};
```

### Best Practices

- ✓ GOOD: Use when you want predictable, steady delay increases

### Related

`RetryConfig`, `ExponentialBackoff`, `CustomBackoff`

---

## CustomBackoff

Retry strategy using a custom backoff function. Provides full control over delay calculation based on error, attempt number, and task index.

### Signature

```typescript
type CustomBackoff = { backoff: 'custom'; maxRetries?: number; backoffFn: (error, attempt, taskIndex) => number; shouldRetry?: Function; onRetry?: Function }
```

### Import

```typescript
import type { CustomBackoff } from "@tidy-ts/shims";
```

### Parameters

- backoff: 'custom' (required literal)
- maxRetries: Maximum retry attempts (default: 3)
- backoffFn: (error, attempt, taskIndex) => delay in ms (required)
- shouldRetry: (error, attempt) => boolean
- onRetry: (error, attempt, taskIndex) => void

### Returns

RetryConfig for custom backoff

### Examples

```typescript
// Custom delay based on error type
const config: CustomBackoff = {
  backoff: "custom",
  maxRetries: 5,
  backoffFn: (error, attempt, taskIndex) => {
    // Rate limit errors get longer delays
    if (error.status === 429) return 5000 * attempt;
    return 100 * Math.pow(2, attempt);
  },
  shouldRetry: (error) => error.status !== 401,
};
```

### Best Practices

- ✓ GOOD: Use for complex retry logic that depends on error type
- ✓ GOOD: Use backoffFn to implement jitter

### Related

`RetryConfig`, `ExponentialBackoff`, `LinearBackoff`

---
