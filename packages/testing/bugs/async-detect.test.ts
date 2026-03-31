/**
 * Test that AnyPropertyIsAsync works correctly for:
 * 1. Concrete mixed sync+async → PromisedDataFrame
 * 2. Concrete sync-only → DataFrame
 * 3. Generic Row with generic return → DataFrame (not deferred conditional union)
 */
import type { DataFrame, PromisedDataFrame } from "@tidy-ts/dataframe";

type HasIdAndDate<K extends string> = { id: string } & Record<K, Temporal.PlainDateTime>;
type IdVal = { id: string; value: number };
declare function assertType<T>(v: T): void;

// ── Generic test-join pattern: must produce DataFrame, not a deferred union ──

function test_generic_join<K extends string, T extends HasIdAndDate<K>>(
  df: DataFrame<T>,
  fieldName: K & keyof T,
) {
  const anchors = df.mutate({ _refDate: (r) => r[fieldName] });
  return anchors.select("id", "_refDate");
}

// ── Concrete mixed sync+async → PromisedDataFrame ──

function test_mixed(df: DataFrame<IdVal>) {
  const r = df.mutate({
    sync_col: (row) => row.value * 2,
    async_col: async (row) => row.id.toUpperCase(),
  });
  assertType<PromisedDataFrame<{ id: string; value: number; sync_col: number; async_col: string }>>(r);
}

// ── Concrete sync → DataFrame ──

function test_sync(df: DataFrame<IdVal>) {
  const r = df.mutate({ doubled: (row) => row.value * 2 });
  assertType<DataFrame<{ id: string; value: number; doubled: number }>>(r);
}

// ── Negative: mixed should NOT be DataFrame ──

function test_mixed_negative(df: DataFrame<IdVal>) {
  const r = df.mutate({
    sync_col: (row) => row.value * 2,
    async_col: async (row) => row.id.toUpperCase(),
  });
  // @ts-expect-error should be PromisedDataFrame, not DataFrame
  assertType<DataFrame<{ id: string; value: number; sync_col: number; async_col: string }>>(r);
}

void test_generic_join; void test_mixed; void test_sync; void test_mixed_negative;
