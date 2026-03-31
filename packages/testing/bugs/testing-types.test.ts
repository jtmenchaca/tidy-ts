/**
 * Type-level tests for mutate + chaining with generic Row types.
 *
 * Two requirements that must both hold:
 *   1. df.mutate({ x: async () => ... }) returns PromisedDataFrame (concrete async)
 *   2. df.mutate({ x: (r) => r.foo }).select("x") works when df is DataFrame<T> (generic row)
 */

import type { DataFrame, PromisedDataFrame } from "@tidy-ts/dataframe";

// ─── Helpers ────────────────────────────────────────────────────────────────

type HasId = { id: string };
type HasIdAndValue = { id: string; value: number };
type HasIdAndDate<K extends string> = { id: string } & Record<K, Temporal.PlainDateTime>;

// Use this to assert a type is assignable
declare function assertType<T>(value: T): void;

// ═══════════════════════════════════════════════════════════════════════════
// Requirement 1: Async mutate → PromisedDataFrame (concrete types)
// ═══════════════════════════════════════════════════════════════════════════

function test_async_mutate_returns_promised(df: DataFrame<HasIdAndValue>) {
  const result = df.mutate({
    doubled: async (row) => {
      await new Promise((r) => setTimeout(r, 1));
      return row.value * 2;
    },
  });
  // Should be PromisedDataFrame, not DataFrame
  assertType<PromisedDataFrame<{ id: string; value: number; doubled: number }>>(result);
}

// ═══════════════════════════════════════════════════════════════════════════
// Requirement 2: Sync mutate + chain with generic Row
// ═══════════════════════════════════════════════════════════════════════════

// 2a: Generic Row, mutate then select
function test_generic_mutate_select<T extends HasId>(df: DataFrame<T>) {
  const result = df.mutate({ flag: () => true }).select("id", "flag");
  return result; // ✅ should compile
}

// 2b: Generic Row with Record intersection (the test-join pattern)
function test_generic_mutate_select_complex<
  K extends string,
  T extends HasIdAndDate<K>,
>(opts: {
  df: DataFrame<T>;
  fieldName: K & keyof T;
}) {
  const result = opts.df
    .mutate({ _refDate: (r) => r[opts.fieldName] })
    .select("id", "_refDate");
  return result; // ✅ should compile
}

// 2c: Generic Row, mutate then filter
function test_generic_mutate_filter<T extends HasIdAndValue>(df: DataFrame<T>) {
  const result = df.mutate({ doubled: (r) => r.value * 2 }).filter((r) => r.doubled > 10);
  return result; // ✅ should compile
}

// 2d: Generic Row, mutate then groupBy
function test_generic_mutate_groupBy<T extends HasIdAndValue>(df: DataFrame<T>) {
  const result = df.mutate({ category: (r) => (r.value > 10 ? "high" : "low") }).groupBy("category");
  return result; // ✅ should compile
}

// ═══════════════════════════════════════════════════════════════════════════
// Requirement 3: Concrete sync mutate still returns DataFrame
// ═══════════════════════════════════════════════════════════════════════════

function test_concrete_sync_mutate(df: DataFrame<HasIdAndValue>) {
  const result = df.mutate({ doubled: (r) => r.value * 2 });
  assertType<DataFrame<{ id: string; value: number; doubled: number }>>(result);
}

// ═══════════════════════════════════════════════════════════════════════════
// Requirement 4: Concrete types still chain fine
// ═══════════════════════════════════════════════════════════════════════════

function test_concrete_mutate_select(df: DataFrame<HasIdAndValue>) {
  const result = df.mutate({ doubled: (r) => r.value * 2 }).select("id", "doubled");
  return result; // ✅ should compile
}

// ═══════════════════════════════════════════════════════════════════════════
// Suppress unused
// ═══════════════════════════════════════════════════════════════════════════
void test_async_mutate_returns_promised;
void test_generic_mutate_select;
void test_generic_mutate_select_complex;
void test_generic_mutate_filter;
void test_generic_mutate_groupBy;
void test_concrete_sync_mutate;
void test_concrete_mutate_select;
