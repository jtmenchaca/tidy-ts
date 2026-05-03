// deno-lint-ignore-file no-explicit-any
import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

// Shared data: P1 has 3 rows, P2 has 2 rows
const rows = [
  { id: "P1", val: 130, date: 20250601 },
  { id: "P1", val: 120, date: 20250101 },
  { id: "P1", val: 140, date: 20250301 },
  { id: "P2", val: 150, date: 20250501 },
  { id: "P2", val: 110, date: 20250201 },
];
const df = createDataFrame(rows);

// Filter removes some rows: keeps P1(130,140), P2(150)
const valFiltered = df.filter((r: any) => r.val >= 130);

// Filter removes rows via range: keeps P1(20250301), P2(20250201)
const dateFiltered = df.filter(
  (r: any) => r.date >= 20250201 && r.date <= 20250401,
);

// Filter keeps ALL rows (view present but nothing removed)
const allKept = df.filter((r: any) => r.val > 0);

// ── sliceMin on filtered data ─────────────────────────────────────────────

Deno.test("sliceMin - filtered data, numeric column", () => {
  const result = valFiltered.groupBy("id").sliceMin("date", 1);
  const out = [...result].map((r: any) => ({ id: r.id, date: r.date }));
  expect(out).toEqual([
    { id: "P1", date: 20250301 },
    { id: "P2", date: 20250501 },
  ]);
});

Deno.test("sliceMin - filtered data, val column", () => {
  const result = valFiltered.groupBy("id").sliceMin("val", 1);
  const out = [...result].map((r: any) => ({ id: r.id, val: r.val }));
  expect(out).toEqual([
    { id: "P1", val: 130 },
    { id: "P2", val: 150 },
  ]);
});

Deno.test("sliceMin - date range filter", () => {
  const result = dateFiltered.groupBy("id").sliceMin("date", 1);
  const out = [...result].map((r: any) => ({ id: r.id, date: r.date }));
  expect(out).toEqual([
    { id: "P1", date: 20250301 },
    { id: "P2", date: 20250201 },
  ]);
});

Deno.test("sliceMin - filter keeps all rows", () => {
  const result = allKept.groupBy("id").sliceMin("date", 1);
  const out = [...result].map((r: any) => ({ id: r.id, date: r.date }));
  expect(out).toEqual([
    { id: "P1", date: 20250101 },
    { id: "P2", date: 20250201 },
  ]);
});

Deno.test("sliceMin - filtered data, n > 1", () => {
  const result = valFiltered.groupBy("id").sliceMin("date", 2);
  const out = [...result].map((r: any) => ({ id: r.id, date: r.date }));
  // P1 has 2 rows after filter (sorted: 20250301, 20250601), P2 has 1
  expect(out).toEqual([
    { id: "P1", date: 20250301 },
    { id: "P1", date: 20250601 },
    { id: "P2", date: 20250501 },
  ]);
});

// ── sliceMax on filtered data ─────────────────────────────────────────────

Deno.test("sliceMax - filtered data, numeric column", () => {
  const result = valFiltered.groupBy("id").sliceMax("date", 1);
  const out = [...result].map((r: any) => ({ id: r.id, date: r.date }));
  expect(out).toEqual([
    { id: "P1", date: 20250601 },
    { id: "P2", date: 20250501 },
  ]);
});

Deno.test("sliceMax - filtered data, val column", () => {
  const result = valFiltered.groupBy("id").sliceMax("val", 1);
  const out = [...result].map((r: any) => ({ id: r.id, val: r.val }));
  expect(out).toEqual([
    { id: "P1", val: 140 },
    { id: "P2", val: 150 },
  ]);
});

// ── head/tail on filtered data ────────────────────────────────────────────

Deno.test("head - filtered data", () => {
  const result = valFiltered.groupBy("id").head(1);
  const out = [...result].map((r: any) => ({ id: r.id, val: r.val }));
  // First row per group in original order: P1->130, P2->150
  expect(out).toEqual([
    { id: "P1", val: 130 },
    { id: "P2", val: 150 },
  ]);
});

Deno.test("tail - filtered data", () => {
  const result = valFiltered.groupBy("id").tail(1);
  const out = [...result].map((r: any) => ({ id: r.id, val: r.val }));
  // Last row per group in original order: P1->140, P2->150
  expect(out).toEqual([
    { id: "P1", val: 140 },
    { id: "P2", val: 150 },
  ]);
});

Deno.test("head(2) - filtered data with uneven groups", () => {
  const result = valFiltered.groupBy("id").head(2);
  const out = [...result].map((r: any) => ({ id: r.id, val: r.val }));
  // P1 has 2 rows (130, 140), P2 has 1 row (150)
  expect(out).toEqual([
    { id: "P1", val: 130 },
    { id: "P1", val: 140 },
    { id: "P2", val: 150 },
  ]);
});

// ── slice (index-based) on filtered data ──────────────────────────────────

Deno.test("slice - filtered data", () => {
  const result = valFiltered.groupBy("id").slice(0, 1);
  const out = [...result].map((r: any) => ({ id: r.id, val: r.val }));
  // First row of each group: P1->130, P2->150
  expect(out).toEqual([
    { id: "P1", val: 130 },
    { id: "P2", val: 150 },
  ]);
});

// ── sample on filtered data ───────────────────────────────────────────────

Deno.test("sample - filtered data preserves correct rows", () => {
  const result = valFiltered.groupBy("id").sample(1, 42);
  expect(result.nrows()).toBe(2); // 1 per group
  const out = [...result];
  // Every sampled row must come from valFiltered, not the unfiltered store
  for (const row of out) {
    expect((row as any).val).toBeGreaterThanOrEqual(130);
  }
});

// ── filter removes exactly 1 row ──────────────────────────────────────────

Deno.test("sliceMin - remove last row only", () => {
  // Remove P2's 110 row (last physical row)
  const oneRemoved = df.filter((r: any) => !(r.id === "P2" && r.val === 110));
  const result = oneRemoved.groupBy("id").sliceMin("date", 1);
  const out = [...result].map((r: any) => ({ id: r.id, date: r.date }));
  expect(out).toEqual([
    { id: "P1", date: 20250101 },
    { id: "P2", date: 20250501 },
  ]);
});

Deno.test("sliceMin - remove first row only", () => {
  // Remove P1's 130 row (first physical row)
  const firstRemoved = df.filter(
    (r: any) => !(r.id === "P1" && r.val === 130),
  );
  const result = firstRemoved.groupBy("id").sliceMin("date", 1);
  const out = [...result].map((r: any) => ({ id: r.id, date: r.date }));
  expect(out).toEqual([
    { id: "P1", date: 20250101 },
    { id: "P2", date: 20250201 },
  ]);
});

Deno.test("sliceMin - remove the min row itself", () => {
  // Remove P1's 120/20250101 row (which IS the min for P1)
  const minRemoved = df.filter((r: any) => !(r.id === "P1" && r.val === 120));
  const result = minRemoved.groupBy("id").sliceMin("date", 1);
  const out = [...result].map((r: any) => ({ id: r.id, date: r.date }));
  expect(out).toEqual([
    { id: "P1", date: 20250301 },
    { id: "P2", date: 20250201 },
  ]);
});

// ── single-row groups after filter ────────────────────────────────────────

Deno.test("sliceMin - single-row groups after filter", () => {
  const singleRows = df.filter(
    (r: any) => r.val === 140 || r.val === 150,
  );
  const result = singleRows.groupBy("id").sliceMin("date", 1);
  const out = [...result].map((r: any) => ({ id: r.id, date: r.date }));
  expect(out).toEqual([
    { id: "P1", date: 20250301 },
    { id: "P2", date: 20250501 },
  ]);
});

// ── Temporal.PlainDateTime columns ────────────────────────────────────────

Deno.test("sliceMin - filtered data with PlainDateTime", () => {
  const dt = (s: string) => Temporal.PlainDateTime.from(s);
  const temporalDf = createDataFrame([
    { id: "P1", effectiveDateTime: dt("2025-06-01"), val: 130 },
    { id: "P1", effectiveDateTime: dt("2025-01-01"), val: 120 },
    { id: "P1", effectiveDateTime: dt("2025-03-01"), val: 140 },
    { id: "P2", effectiveDateTime: dt("2025-05-01"), val: 150 },
    { id: "P2", effectiveDateTime: dt("2025-02-01"), val: 110 },
  ]);
  const filtered = temporalDf.filter((r: any) => r.val >= 130);
  const result = filtered.groupBy("id").sliceMin("effectiveDateTime", 1);
  const out = [...result].map((r: any) => ({
    id: r.id,
    dt: r.effectiveDateTime.toString(),
  }));
  expect(out).toEqual([
    { id: "P1", dt: "2025-03-01T00:00:00" },
    { id: "P2", dt: "2025-05-01T00:00:00" },
  ]);
});

Deno.test("sliceMax - filtered data with PlainDateTime", () => {
  const dt = (s: string) => Temporal.PlainDateTime.from(s);
  const temporalDf = createDataFrame([
    { id: "P1", effectiveDateTime: dt("2025-06-01"), val: 130 },
    { id: "P1", effectiveDateTime: dt("2025-01-01"), val: 120 },
    { id: "P1", effectiveDateTime: dt("2025-03-01"), val: 140 },
    { id: "P2", effectiveDateTime: dt("2025-05-01"), val: 150 },
    { id: "P2", effectiveDateTime: dt("2025-02-01"), val: 110 },
  ]);
  const filtered = temporalDf.filter((r: any) => r.val >= 130);
  const result = filtered.groupBy("id").sliceMax("effectiveDateTime", 1);
  const out = [...result].map((r: any) => ({
    id: r.id,
    dt: r.effectiveDateTime.toString(),
  }));
  expect(out).toEqual([
    { id: "P1", dt: "2025-06-01T00:00:00" },
    { id: "P2", dt: "2025-05-01T00:00:00" },
  ]);
});

// ── String date columns ───────────────────────────────────────────────────

Deno.test("sliceMin - filtered data with string dates", () => {
  const strDf = createDataFrame([
    { id: "P1", date: "2025-06-01", val: 130 },
    { id: "P1", date: "2025-01-01", val: 120 },
    { id: "P1", date: "2025-03-01", val: 140 },
    { id: "P2", date: "2025-05-01", val: 150 },
    { id: "P2", date: "2025-02-01", val: 110 },
  ]);
  const filtered = strDf.filter((r: any) => r.val >= 130);
  const result = filtered.groupBy("id").sliceMin("date", 1);
  const out = [...result].map((r: any) => ({ id: r.id, date: r.date }));
  expect(out).toEqual([
    { id: "P1", date: "2025-03-01" },
    { id: "P2", date: "2025-05-01" },
  ]);
});

// ── Date object columns ───────────────────────────────────────────────────

Deno.test("sliceMin - filtered data with Date objects", () => {
  const dateDf = createDataFrame([
    { id: "P1", date: new Date("2025-06-01"), val: 130 },
    { id: "P1", date: new Date("2025-01-01"), val: 120 },
    { id: "P1", date: new Date("2025-03-01"), val: 140 },
    { id: "P2", date: new Date("2025-05-01"), val: 150 },
    { id: "P2", date: new Date("2025-02-01"), val: 110 },
  ]);
  const filtered = dateDf.filter((r: any) => r.val >= 130);
  const result = filtered.groupBy("id").sliceMin("date", 1);
  const out = [...result].map((r: any) => ({
    id: r.id,
    date: r.date.toISOString().slice(0, 10),
  }));
  expect(out).toEqual([
    { id: "P1", date: "2025-03-01" },
    { id: "P2", date: "2025-05-01" },
  ]);
});

// ── filter → mutate → groupBy → slice ─────────────────────────────────────

Deno.test("sliceMin - filter then mutate then grouped slice", () => {
  const result = df
    .filter((r: any) => r.val >= 130)
    .mutate({ label: (r: any) => `${r.id}-${r.val}` })
    .groupBy("id")
    .sliceMin("date", 1);
  const out = [...result].map((r: any) => ({
    id: r.id,
    date: r.date,
    label: r.label,
  }));
  expect(out).toEqual([
    { id: "P1", date: 20250301, label: "P1-140" },
    { id: "P2", date: 20250501, label: "P2-150" },
  ]);
});
