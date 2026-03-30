/**
 * Regression test: DataFrame operations with generic Row type parameter.
 *
 * Previously, RestrictEmptyDataFrame used `[Row] extends [never] ? ... : ...`
 * which deferred when Row was a generic T, blocking all assignments.
 * Fixed by making RestrictEmptyDataFrame a pass-through.
 *
 * All patterns should work:
 *   ✅ DataFrame<ConcreteType>          — Row is resolved
 *   ✅ T extends DataFrame<ConcreteRow> — Row is still concrete inside DataFrame
 *   ✅ DataFrame<T> where T extends X   — Row is generic T (previously broken)
 */

import type { DataFrame } from "@tidy-ts/dataframe";

type HasId = { id: string };

// ─── Concrete Row ───

function pass_concrete(df: DataFrame<{ id: string; name: string }>) {
  const out = df.select("id");
  return out; // ✅
}

// ─── Generic on DataFrame, concrete Row ───

function pass_genericDF<T extends DataFrame<HasId>>(df: T) {
  const out = df.select("id");
  return out; // ✅
}

// ─── Generic Row (previously broken) ───

function pass_genericRow<T extends HasId>(df: DataFrame<T>) {
  const out = df.select("id");
  return out; // ✅
}

function pass_genericRow_groupBy<T extends { id: string; value: number }>(df: DataFrame<T>) {
  const out = df.groupBy("id");
  return out; // ✅
}

function pass_genericRow_distinct<T extends { id: string; value: number }>(df: DataFrame<T>) {
  const out = df.distinct("id");
  return out; // ✅
}

function pass_genericRow_sliceMax<T extends { id: string; value: number }>(df: DataFrame<T>) {
  const out = df.groupBy("id").sliceMax("value", 1);
  return out; // ✅
}

// ─── filter/mutate (always worked) ───

function pass_filter<T extends { id: string; value: number }>(df: DataFrame<T>) {
  const out = df.filter((r) => r.id === "foo");
  return out; // ✅
}

function pass_mutate<T extends { id: string; value: number }>(df: DataFrame<T>) {
  const out = df.mutate({ doubled: (r) => r.value * 2 });
  return out; // ✅
}

// Suppress unused
void pass_concrete;
void pass_genericDF;
void pass_genericRow;
void pass_genericRow_groupBy;
void pass_genericRow_distinct;
void pass_genericRow_sliceMax;
void pass_filter;
void pass_mutate;
