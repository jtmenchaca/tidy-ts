/**
 * Standalone proof: .select().distinct() on a grouped DataFrame after sliceMax
 * returns IDs from the pre-slice underlying data, not from the sliced result.
 *
 * This is the root cause of the resultIn() bug in protocol-api.ts.
 *
 * anyCodesInValueSet does: events.filter(...).select("id").distinct("id")
 * When `events` is a grouped DataFrame from sliceMax, the .select().distinct()
 * leaks rows that were excluded by the slice.
 */

import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

const dt = (s: string) => Temporal.PlainDateTime.from(s);

interface Row {
  id: string;
  code: string;
  effectiveDateTime: Temporal.PlainDateTime;
  value: string;
}

// PA has 2 rows: one with value "GOOD", one with value "BAD"
// PB has 1 row with value "BAD"
// After groupBy("id").sliceMax("effectiveDateTime", 1):
//   PA → most recent = "GOOD" (2025-06)
//   PB → only row = "BAD" (2025-03)
const rows: Row[] = [
  { id: "PA", code: "X", effectiveDateTime: dt("2025-02-01T00:00"), value: "BAD" },
  { id: "PA", code: "X", effectiveDateTime: dt("2025-06-01T00:00"), value: "GOOD" },
  { id: "PB", code: "X", effectiveDateTime: dt("2025-03-01T00:00"), value: "BAD" },
];

// ── Test 1: toArray on sliceMax is correct ───────────────────────────────────

Deno.test("grouped sliceMax: toArray returns correct rows", () => {
  const df = createDataFrame(rows);
  const sliced = df.groupBy("id").sliceMax("effectiveDateTime", 1);
  const out = sliced.toArray();
  expect(out.length).toBe(2);
  expect(out.find(r => r.id === "PA")!.value).toBe("GOOD");
  expect(out.find(r => r.id === "PB")!.value).toBe("BAD");
});

// ── Test 2: filter on grouped sliceMax works ─────────────────────────────────

Deno.test("grouped sliceMax: filter(value === 'GOOD') returns only PA", () => {
  const df = createDataFrame(rows);
  const sliced = df.groupBy("id").sliceMax("effectiveDateTime", 1);
  const filtered = sliced.filter(r => r.value === "GOOD");
  const out = filtered.toArray();
  expect(out.length).toBe(1);
  expect(out[0].id).toBe("PA");
});

// ── Test 3: filter + select("id") on grouped sliceMax ────────────────────────

Deno.test("grouped sliceMax: filter(value === 'GOOD').select('id') returns only PA", () => {
  const df = createDataFrame(rows);
  const sliced = df.groupBy("id").sliceMax("effectiveDateTime", 1);
  const ids = sliced.filter(r => r.value === "GOOD").select("id");
  const out = ids.toArray();
  expect(out.length).toBe(1);
  expect(out[0].id).toBe("PA");
});

// ── Test 4: filter + select("id") + distinct("id") on grouped sliceMax ──────

Deno.test("grouped sliceMax: filter(value === 'GOOD').select('id').distinct('id') returns only PA", () => {
  const df = createDataFrame(rows);
  const sliced = df.groupBy("id").sliceMax("effectiveDateTime", 1);
  const ids = sliced.filter(r => r.value === "GOOD").select("id").distinct("id");
  const out = ids.toArray();
  // BUG: if this returns both PA and PB, then .select().distinct() on a grouped
  // DataFrame leaks IDs from the pre-slice data
  expect(out.length).toBe(1);
  expect(out[0].id).toBe("PA");
});

// ── Test 5: same chain but ungrouped first — should work ─────────────────────

Deno.test("UNGROUPED sliceMax: filter(value === 'GOOD').select('id').distinct('id') returns only PA", () => {
  const df = createDataFrame(rows);
  const sliced = df.groupBy("id").sliceMax("effectiveDateTime", 1).ungroup();
  const ids = sliced.filter(r => r.value === "GOOD").select("id").distinct("id");
  const out = ids.toArray();
  expect(out.length).toBe(1);
  expect(out[0].id).toBe("PA");
});

// ── Test 6: isolate select on grouped ────────────────────────────────────────

Deno.test("grouped sliceMax: .select('id', 'value') preserves only sliced rows", () => {
  const df = createDataFrame(rows);
  const sliced = df.groupBy("id").sliceMax("effectiveDateTime", 1);
  const selected = sliced.select("id", "value");
  const out = selected.toArray();
  // Should be 2 rows (one per group), not 3 (all original rows)
  expect(out.length).toBe(2);
});

// ── Test 7: isolate distinct on grouped ──────────────────────────────────────

Deno.test("grouped sliceMax: .distinct('id') returns 2 IDs (not a bug, but baseline)", () => {
  const df = createDataFrame(rows);
  const sliced = df.groupBy("id").sliceMax("effectiveDateTime", 1);
  const distinct = sliced.distinct("id");
  const out = distinct.toArray();
  expect(out.length).toBe(2);
});
