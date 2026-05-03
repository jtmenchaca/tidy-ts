// deno-lint-ignore-file no-explicit-any
import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const dt = (str: string) => Temporal.PlainDateTime.from(str);

// ── innerJoin on PlainDateTime join keys ────────────────────────────────────

Deno.test("innerJoin on PlainDateTime column", () => {
  const events = createDataFrame([
    { id: "P1", effectiveDateTime: dt("2025-06-01"), value: 120 },
    { id: "P1", effectiveDateTime: dt("2025-06-01"), value: 110 },
    { id: "P1", effectiveDateTime: dt("2025-01-01"), value: 80 },
  ]);

  const maxDates = events
    .groupBy("id")
    .summarize({ effectiveDateTime: (g: any) => s.max(g.effectiveDateTime)! });

  const joined = events.innerJoin(maxDates, ["id", "effectiveDateTime"]);
  expect(joined.nrows()).toBe(2);
  const vals = [...joined].map((r: any) => r.value).sort();
  expect(vals).toEqual([110, 120]);
});

Deno.test("innerJoin on PlainDateTime - multi-patient", () => {
  const events = createDataFrame([
    { id: "P1", ts: dt("2025-06-01"), val: 10 },
    { id: "P1", ts: dt("2025-01-01"), val: 20 },
    { id: "P2", ts: dt("2025-03-01"), val: 30 },
    { id: "P2", ts: dt("2025-06-01"), val: 40 },
  ]);

  const maxDates = events
    .groupBy("id")
    .summarize({ ts: (g: any) => s.max(g.ts)! });

  const joined = events.innerJoin(maxDates, ["id", "ts"]);
  expect(joined.nrows()).toBe(2);
  const out = [...joined].map((r: any) => ({ id: r.id, val: r.val }));
  expect(out).toEqual([
    { id: "P1", val: 10 },
    { id: "P2", val: 40 },
  ]);
});

Deno.test("innerJoin on PlainDate column", () => {
  const pd = (s: string) => Temporal.PlainDate.from(s);
  const left = createDataFrame([
    { id: "A", date: pd("2025-01-15"), x: 1 },
    { id: "A", date: pd("2025-02-15"), x: 2 },
    { id: "B", date: pd("2025-01-15"), x: 3 },
  ]);
  const right = createDataFrame([
    { id: "A", date: pd("2025-01-15"), y: 100 },
    { id: "B", date: pd("2025-01-15"), y: 200 },
  ]);

  const joined = left.innerJoin(right, ["id", "date"]);
  expect(joined.nrows()).toBe(2);
  const out = [...joined].map((r: any) => ({ id: r.id, x: r.x, y: r.y }));
  expect(out).toEqual([
    { id: "A", x: 1, y: 100 },
    { id: "B", x: 3, y: 200 },
  ]);
});

// ── leftJoin on PlainDateTime ───────────────────────────────────────────────

Deno.test("leftJoin on PlainDateTime column", () => {
  const left = createDataFrame([
    { id: "P1", ts: dt("2025-06-01"), val: 10 },
    { id: "P1", ts: dt("2025-01-01"), val: 20 },
    { id: "P2", ts: dt("2025-03-01"), val: 30 },
  ]);
  const right = createDataFrame([
    { id: "P1", ts: dt("2025-06-01"), label: "latest" },
  ]);

  const joined = left.leftJoin(right, ["id", "ts"]);
  expect(joined.nrows()).toBe(3);
  const labels = [...joined].map((r: any) => r.label);
  expect(labels).toEqual(["latest", undefined, undefined]);
});

// ── Verify hash equality for identical Temporal values ──────────────────────

Deno.test("innerJoin matches identical PlainDateTime values constructed separately", () => {
  const left = createDataFrame([
    { id: "X", ts: Temporal.PlainDateTime.from("2025-06-01T12:00:00") },
  ]);
  const right = createDataFrame([
    { id: "X", ts: Temporal.PlainDateTime.from("2025-06-01T12:00:00") },
  ]);

  const joined = left.innerJoin(right, ["id", "ts"]);
  expect(joined.nrows()).toBe(1);
});
