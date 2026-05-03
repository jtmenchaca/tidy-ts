// deno-lint-ignore-file no-explicit-any
import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

// ── Shared data ───────────────────────────────────────────────────────────

const df = createDataFrame([
  { id: "P1", code: "A", val: 130, date: 20250601 },
  { id: "P1", code: "A", val: 120, date: 20250101 },
  { id: "P1", code: "B", val: 140, date: 20250301 },
  { id: "P2", code: "A", val: 150, date: 20250501 },
  { id: "P2", code: "B", val: 110, date: 20250201 },
]);

// ── Simple predicates ─────────────────────────────────────────────────────

Deno.test("filter - numeric >=", () => {
  const result = df.filter((r: any) => r.val >= 130);
  expect(result.nrows()).toBe(3);
  const vals = [...result].map((r: any) => r.val).sort();
  expect(vals).toEqual([130, 140, 150]);
});

Deno.test("filter - numeric <", () => {
  const result = df.filter((r: any) => r.val < 130);
  expect(result.nrows()).toBe(2);
  const vals = [...result].map((r: any) => r.val).sort();
  expect(vals).toEqual([110, 120]);
});

Deno.test("filter - string ===", () => {
  const result = df.filter((r: any) => r.code === "A");
  expect(result.nrows()).toBe(3);
  for (const row of result) {
    expect((row as any).code).toBe("A");
  }
});

Deno.test("filter - string !==", () => {
  const result = df.filter((r: any) => r.code !== "B");
  expect(result.nrows()).toBe(3);
  for (const row of result) {
    expect((row as any).code).toBe("A");
  }
});

Deno.test("filter - keeps all rows", () => {
  const result = df.filter((r: any) => r.val > 0);
  expect(result.nrows()).toBe(5);
});

Deno.test("filter - removes all rows", () => {
  const result = df.filter((r: any) => r.val > 9999);
  expect(result.nrows()).toBe(0);
});

// ── Compound AND predicates ───────────────────────────────────────────────

Deno.test("filter - compound && with two numeric comparisons", () => {
  const result = df.filter(
    (r: any) => r.val >= 120 && r.val <= 140,
  );
  expect(result.nrows()).toBe(3);
  const vals = [...result].map((r: any) => r.val).sort();
  expect(vals).toEqual([120, 130, 140]);
});

Deno.test("filter - compound && with string and numeric", () => {
  const result = df.filter(
    (r: any) => r.code === "A" && r.val >= 130,
  );
  expect(result.nrows()).toBe(2);
  const vals = [...result].map((r: any) => r.val).sort();
  expect(vals).toEqual([130, 150]);
});

// ── Negation predicates (the bug) ─────────────────────────────────────────

Deno.test("filter - negation with !(a && b)", () => {
  // Remove the single row where id=P2 AND val=110
  const result = df.filter(
    (r: any) => !(r.id === "P2" && r.val === 110),
  );
  // Should keep 4 rows, excluding only P2:110
  expect(result.nrows()).toBe(4);
  const vals = [...result].map((r: any) => r.val).sort();
  expect(vals).toEqual([120, 130, 140, 150]);
});

Deno.test("filter - negation !(a && b) remove first row", () => {
  const result = df.filter(
    (r: any) => !(r.id === "P1" && r.val === 130),
  );
  expect(result.nrows()).toBe(4);
  const vals = [...result].map((r: any) => r.val).sort();
  expect(vals).toEqual([110, 120, 140, 150]);
});

Deno.test("filter - negation !(a && b) remove middle row", () => {
  const result = df.filter(
    (r: any) => !(r.id === "P1" && r.val === 120),
  );
  expect(result.nrows()).toBe(4);
  const vals = [...result].map((r: any) => r.val).sort();
  expect(vals).toEqual([110, 130, 140, 150]);
});

Deno.test("filter - negation with !(string === literal)", () => {
  // NOT(code === "B") is equivalent to code !== "B"
  const result = df.filter((r: any) => !(r.code === "B"));
  expect(result.nrows()).toBe(3);
  for (const row of result) {
    expect((row as any).code).toBe("A");
  }
});

// ── OR predicates ─────────────────────────────────────────────────────────

Deno.test("filter - || (or) predicate", () => {
  const result = df.filter(
    (r: any) => r.code === "B" || r.val >= 150,
  );
  // code B: P1:140, P2:110; val>=150: P2:150 — union: 3 rows
  expect(result.nrows()).toBe(3);
  const vals = [...result].map((r: any) => r.val).sort();
  expect(vals).toEqual([110, 140, 150]);
});

// ── Multiple separate predicates (AND across args) ────────────────────────

Deno.test("filter - two separate predicate functions (AND)", () => {
  const result = df.filter(
    (r: any) => r.code === "A",
    (r: any) => r.val >= 130,
  );
  expect(result.nrows()).toBe(2);
  const vals = [...result].map((r: any) => r.val).sort();
  expect(vals).toEqual([130, 150]);
});

// ── Chained filters ───────────────────────────────────────────────────────

Deno.test("filter - chained filter().filter()", () => {
  const result = df
    .filter((r: any) => r.code === "A")
    .filter((r: any) => r.val >= 130);
  expect(result.nrows()).toBe(2);
  const vals = [...result].map((r: any) => r.val).sort();
  expect(vals).toEqual([130, 150]);
});

Deno.test("filter - chained filter preserves correct view", () => {
  const step1 = df.filter((r: any) => r.val >= 120);
  expect(step1.nrows()).toBe(4); // all except P2:110
  const step2 = step1.filter((r: any) => r.code === "A");
  expect(step2.nrows()).toBe(3); // P1:130(A), P1:120(A), P2:150(A)
  const vals = [...step2].map((r: any) => r.val).sort();
  expect(vals).toEqual([120, 130, 150]);
});

// ── Filter then downstream operations ─────────────────────────────────────

Deno.test("filter - then mutate sees correct rows", () => {
  const result = df
    .filter((r: any) => r.code === "A")
    .mutate({ label: (r: any) => `${r.id}-${r.val}` });
  expect(result.nrows()).toBe(3);
  const labels = [...result].map((r: any) => r.label).sort();
  expect(labels).toEqual(["P1-120", "P1-130", "P2-150"]);
});

Deno.test("filter - then arrange", () => {
  const result = df
    .filter((r: any) => r.code === "A")
    .arrange("val");
  const vals = [...result].map((r: any) => r.val);
  expect(vals).toEqual([120, 130, 150]);
});

Deno.test("filter - then groupBy.summarize", () => {
  const result = df
    .filter((r: any) => r.code === "A")
    .groupBy("id")
    .summarize({ n: (g: any) => g.nrows() });
  const out = [...result].map((r: any) => ({ id: r.id, n: r.n }));
  expect(out).toEqual([
    { id: "P1", n: 2 },
    { id: "P2", n: 1 },
  ]);
});

Deno.test("filter - then groupBy.sliceMin", () => {
  const result = df
    .filter((r: any) => r.code === "A")
    .groupBy("id")
    .sliceMin("val", 1);
  const out = [...result].map((r: any) => ({ id: r.id, val: r.val }));
  expect(out).toEqual([
    { id: "P1", val: 120 },
    { id: "P2", val: 150 },
  ]);
});

// ── Temporal types ────────────────────────────────────────────────────────

Deno.test("filter - Temporal.PlainDateTime comparison", () => {
  const dt = (s: string) => Temporal.PlainDateTime.from(s);
  const tdf = createDataFrame([
    { id: "P1", ts: dt("2025-01-01"), val: 10 },
    { id: "P1", ts: dt("2025-03-01"), val: 20 },
    { id: "P2", ts: dt("2025-02-01"), val: 30 },
    { id: "P2", ts: dt("2025-06-01"), val: 40 },
  ]);
  const start = dt("2025-02-01");
  const end = dt("2025-04-01");
  const result = tdf.filter((r: any) =>
    Temporal.PlainDateTime.compare(r.ts, start) >= 0 &&
    Temporal.PlainDateTime.compare(r.ts, end) <= 0
  );
  expect(result.nrows()).toBe(2);
  const vals = [...result].map((r: any) => r.val).sort();
  expect(vals).toEqual([20, 30]);
});

// ── Date objects ──────────────────────────────────────────────────────────

Deno.test("filter - Date comparison", () => {
  const ddf = createDataFrame([
    { id: "P1", ts: new Date("2025-01-01"), val: 10 },
    { id: "P1", ts: new Date("2025-03-01"), val: 20 },
    { id: "P2", ts: new Date("2025-06-01"), val: 30 },
  ]);
  const cutoff = new Date("2025-02-01").getTime();
  const result = ddf.filter((r: any) => r.ts.getTime() >= cutoff);
  expect(result.nrows()).toBe(2);
  const vals = [...result].map((r: any) => r.val).sort();
  expect(vals).toEqual([20, 30]);
});

// ── Boolean array predicates ──────────────────────────────────────────────

Deno.test("filter - boolean array", () => {
  const result = df.filter([true, false, true, false, true]);
  expect(result.nrows()).toBe(3);
  const vals = [...result].map((r: any) => r.val);
  expect(vals).toEqual([130, 140, 110]);
});

Deno.test("filter - boolean array wrong length throws", () => {
  expect(() => df.filter([true, false])).toThrow();
});

// ── Null/undefined handling ───────────────────────────────────────────────

Deno.test("filter - column with nulls", () => {
  const ndf = createDataFrame([
    { id: 1, val: 10 },
    { id: 2, val: null },
    { id: 3, val: 20 },
    { id: 4, val: undefined },
  ]);
  const result = ndf.filter((r: any) => r.val != null);
  expect(result.nrows()).toBe(2);
  const ids = [...result].map((r: any) => r.id);
  expect(ids).toEqual([1, 3]);
});

// ── Edge cases ────────────────────────────────────────────────────────────

Deno.test("filter - single row df, keep", () => {
  const sdf = createDataFrame([{ id: 1, val: 10 }]);
  const result = sdf.filter((r: any) => r.val === 10);
  expect(result.nrows()).toBe(1);
});

Deno.test("filter - single row df, remove", () => {
  const sdf = createDataFrame([{ id: 1, val: 10 }]);
  const result = sdf.filter((r: any) => r.val === 99);
  expect(result.nrows()).toBe(0);
});

Deno.test("filter - large compound with 3 clauses", () => {
  const result = df.filter(
    (r: any) => r.id === "P1" && r.code === "A" && r.val >= 130,
  );
  expect(result.nrows()).toBe(1);
  expect(result[0].val).toBe(130);
});
