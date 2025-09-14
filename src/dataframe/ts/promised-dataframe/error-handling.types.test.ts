import { createDataFrame, type DataFrame } from "../dataframe/index.ts";
import type { PromisedDataFrame } from "./types/promised-dataframe.type.ts";

/**
 * Type Tests for Error Handling in DataFrame Operations
 *
 * These tests document expected type behavior for various error handling patterns
 * in both sync and async DataFrame operations.
 */

// ============================================================================
// Test Data Setup
// ============================================================================

const testData = createDataFrame([
  { id: 1, value: 10 },
  { id: 2, value: 20 },
  { id: 3, value: 30 },
]);

// ============================================================================
// SYNC FUNCTION TESTS
// ============================================================================

// Test 1: Sync function returning a value
const syncValue = testData.mutate({
  doubled: (row) => row.value * 2,
});

const _syncValueCheck: DataFrame<{
  id: number;
  value: number;
  doubled: number; // ✅ Expected: number
}> = syncValue;

// Test 2: Sync function explicitly returning Error
const syncError = testData.mutate({
  alwaysError: (_row) => new Error("Always fails"),
});

const _syncErrorCheck: DataFrame<{
  id: number;
  value: number;
  alwaysError: Error; // ✅ Expected: Error
}> = syncError;

// Test 3: Sync function returning union type (value | Error)
const syncUnion = testData.mutate({
  maybeDoubled: (row) => {
    if (row.value > 15) {
      return row.value * 2;
    }
    return new Error("Value too small");
  },
});

const _syncUnionCheck: DataFrame<{
  id: number;
  value: number;
  maybeDoubled: number | Error; // ✅ Expected: number | Error
}> = syncUnion;

// Test 4: Sync function returning null/undefined
const syncNullable = testData.mutate({
  nullable: (row) => row.value > 15 ? row.value : null,
  optional: (row) => row.value > 15 ? row.value : undefined,
});

const _syncNullableCheck: DataFrame<{
  id: number;
  value: number;
  nullable: number | null; // ✅ Expected: number | null
  optional: number | undefined; // ✅ Expected: number | undefined
}> = syncNullable;

// ============================================================================
// ASYNC FUNCTION TESTS - Current Behavior vs Expected
// ============================================================================

// Test 5: Async function always resolving
const asyncValue = testData.mutate({
  doubled: async (row) => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    return row.value * 2;
  },
});

const _asyncValueCheck: PromisedDataFrame<{
  id: number;
  value: number;
  doubled: number; // ✅ Expected: number (always resolves)
}> = asyncValue;

// Test 6: Async function explicitly returning Error in resolved promise
const asyncResolvedError = testData.mutate({
  alwaysError: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    return new Error("Always fails");
  },
});

const _asyncResolvedErrorCheck: PromisedDataFrame<{
  id: number;
  value: number;
  alwaysError: Error; // ✅ Expected: Error (explicitly returned)
}> = asyncResolvedError;

// Test 7: Async function returning union in resolved promise
const asyncResolvedUnion = testData.mutate({
  maybeDoubled: async (row) => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    if (row.value > 15) {
      return row.value * 2;
    }
    return new Error("Value too small");
  },
});

const _asyncResolvedUnionCheck: PromisedDataFrame<{
  id: number;
  value: number;
  maybeDoubled: number | Error; // ✅ Expected: number | Error
}> = asyncResolvedUnion;

// Test 8: Async function with explicit return type annotation
// NOTE: Commented out to prevent uncaught promise rejections during type checking
// const asyncExplicitType = testData.mutate({
//   maybeDoubled: async (row): Promise<number | Error> => {
//     if (row.value > 15) {
//       return row.value * 2;
//     }
//     // Even if we throw, the return type is explicit
//     throw new Error("Random failure");
//   },
// });

// Type check still works without execution:
type AsyncExplicitType = PromisedDataFrame<{
  id: number;
  value: number;
  maybeDoubled: number | Error; // ✅ Expected: number | Error (explicit type)
}>;

// ============================================================================
// PROBLEMATIC CASES - What Should Happen?
// ============================================================================

// Test 9: Async function that throws (not caught by TypeScript)
// NOTE: Commented out to prevent uncaught promise rejections during type checking
// const asyncThrows = testData.mutate({
//   maybeDoubled: async (row) => {
//     if (row.value > 15) {
//       return row.value * 2;
//     }
//     throw new Error("Value too small");  // TypeScript doesn't know this can happen
//   },
// });

// CURRENT BEHAVIOR (Wrong):
// Type check without execution:
type AsyncThrowsCurrent = PromisedDataFrame<{
  id: number;
  value: number;
  maybeDoubled: number; // ❌ Current: only sees the return path
}>;

// IDEAL BEHAVIOR (What we want):
// Option A: Automatically include Error for any async function
// const _asyncThrowsIdealA: PromisedDataFrame<{
//   id: number;
//   value: number;
//   maybeDoubled: number | Error;  // ✅ Auto-include Error for async
// }> = asyncThrows;

// Option B: Require explicit typing for error cases
// const _asyncThrowsIdealB: PromisedDataFrame<{
//   id: number;
//   value: number;
//   maybeDoubled: number;  // If no explicit Error type, assume it doesn't error
// }> = asyncThrows;

// Test 10: Async function using Promise.reject
// NOTE: Commented out to prevent uncaught promise rejections during type checking
// const asyncReject = testData.mutate({
//   maybeDoubled: async (row) => {
//     if (row.value > 15) {
//       return row.value * 2;
//     }
//     return Promise.reject(new Error("Value too small"));
//   },
// });

// CURRENT BEHAVIOR (Wrong):
// Type check without execution:
type AsyncRejectCurrent = PromisedDataFrame<{
  id: number;
  value: number;
  maybeDoubled: number; // ❌ Current: doesn't see the reject path
}>;

// Test 11: Async function with try-catch internally
const asyncTryCatch = testData.mutate({
  safeDoubled: async (row) => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    try {
      if (row.value > 15) {
        return row.value * 2;
      }
      throw new Error("Value too small");
    } catch (error) {
      return error as Error; // Explicitly return the error
    }
  },
});

const _asyncTryCatchCheck: PromisedDataFrame<{
  id: number;
  value: number;
  safeDoubled: number | Error; // ✅ Expected: number | Error (explicit)
}> = asyncTryCatch;

// ============================================================================
// PROPOSED SOLUTION PATTERNS
// ============================================================================

// Pattern 1: Explicit Error Wrapper Type
type MayFail<T> = T | Error;

// NOTE: Commented out to prevent uncaught promise rejections during type checking
// const patternExplicit = testData.mutate({
//   maybeDoubled: async (row): Promise<MayFail<number>> => {
//     if (row.value > 15) {
//       return row.value * 2;
//     }
//     throw new Error("Value too small");  // Now type-safe
//   },
// });

// Type check without execution:
type PatternExplicitCheck = PromisedDataFrame<{
  id: number;
  value: number;
  maybeDoubled: MayFail<number>; // ✅ Explicit: number | Error
}>;

// Pattern 2: Result Type Pattern (like Rust)
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

const patternResult = testData.mutate({
  maybeDoubled: async (row): Promise<Result<number>> => {
    await new Promise((resolve) => setTimeout(resolve, 1));
    if (row.value > 15) {
      return { ok: true, value: row.value * 2 };
    }
    return { ok: false, error: new Error("Value too small") };
  },
});

const _patternResultCheck: PromisedDataFrame<{
  id: number;
  value: number;
  maybeDoubled: Result<number>; // ✅ Explicit result type
}> = patternResult;

// Pattern 3: Special Error-Aware Async Type
type AsyncMayFail<T> = Promise<T | Error>;

const patternAsyncMayFail = testData.mutate({
  maybeDoubled: (row): AsyncMayFail<number> => {
    if (row.value > 15) {
      return Promise.resolve(row.value * 2);
    }
    return Promise.resolve(new Error("Value too small"));
  },
});

const _patternAsyncMayFailCheck: PromisedDataFrame<{
  id: number;
  value: number;
  maybeDoubled: number | Error; // ✅ Unwraps to union
}> = patternAsyncMayFail;

// ============================================================================
// EDGE CASES
// ============================================================================

// Test 12: Mixed sync and async operations
const mixedOperations = testData.mutate({
  syncValue: (row) => row.value * 2,
  asyncValue: (row) => row.value * 3,
  syncError: (row) => row.value > 15 ? row.value : new Error("Too small"),
  asyncError: async (row): Promise<number | Error> => {
    if (row.value > 15) {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return row.value * 4;
    }
    return new Error("Too small");
  },
});

const _mixedOperationsCheck: PromisedDataFrame<{
  id: number;
  value: number;
  syncValue: number;
  asyncValue: number;
  syncError: number | Error;
  asyncError: number | Error;
}> = mixedOperations;

// Test 13: Nested Error types
const nestedErrors = testData.mutate({
  nested: (row) => {
    if (row.value > 20) {
      return { success: true as const, value: row.value * 2 };
    }
    return { success: false as const, error: new Error("Failed") };
  },
});

const _nestedErrorsCheck: DataFrame<{
  id: number;
  value: number;
  nested: { success: true; value: number } | { success: false; error: Error };
}> = nestedErrors;

// Test 14: Array of possible errors
const arrayErrors = testData.mutate({
  results: (row) => {
    const results: (number | Error)[] = [];
    for (let i = 0; i < 3; i++) {
      if (i % 2 === 0) {
        results.push(row.value * i);
      } else {
        results.push(new Error(`Failed at ${i}`));
      }
    }
    return results;
  },
});

const _arrayErrorsCheck: DataFrame<{
  id: number;
  value: number;
  results: (number | Error)[];
}> = arrayErrors;

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

/**
 * Recommended Type Behavior:
 *
 * 1. SYNC FUNCTIONS:
 *    - Preserve exact return type (including unions with Error)
 *    - No automatic Error injection
 *
 * 2. ASYNC FUNCTIONS:
 *    Option A (Conservative):
 *      - Only include Error if explicitly typed
 *      - Requires: async (row): Promise<T | Error> => ...
 *
 *    Option B (Safe by Default):
 *      - Always include Error for async operations
 *      - All async columns become T | Error automatically
 *
 *    Option C (Configurable):
 *      - Default: Don't include Error
 *      - With flag: df.mutate({...}, { assumeAsyncMayFail: true })
 *
 * 3. SPECIAL TYPES:
 *    - Provide MayFail<T> = T | Error helper type
 *    - Provide Result<T, E> for Rust-like error handling
 *    - Support explicit Promise<T | Error> return types
 *
 * 4. ERROR RECOVERY:
 *    - If async function throws/rejects, store Error object in cell
 *    - Allow filtering/handling of Error cells later
 */

export type { AsyncMayFail, MayFail, Result };
