// deno-lint-ignore-file no-explicit-any
import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// ── Data ──────────────────────────────────────────────────────────────────────

const vitalsData = [
  { id: "P1", code: "8480-6", codeSystem: "LOINC", value: 120, date: "2025-03-15" },
  { id: "P1", code: "8480-6", codeSystem: "LOINC", value: 118, date: "2025-03-16" },
  { id: "P1", code: "8480-6", codeSystem: "LOINC", value: 122, date: "2025-06-01" },
  { id: "P1", code: "8462-4", codeSystem: "LOINC", value: 80, date: "2025-03-15" },
  { id: "P2", code: "8480-6", codeSystem: "LOINC", value: 130, date: "2025-04-10" },
  { id: "P2", code: "8480-6", codeSystem: "LOINC", value: 128, date: "2025-04-11" },
  { id: "P2", code: "8462-4", codeSystem: "LOINC", value: 85, date: "2025-04-10" },
  { id: "P3", code: "8480-6", codeSystem: "LOINC", value: 115, date: "2025-05-20" },
];
const events = createDataFrame(vitalsData);
const targetCode = "8480-6";

// ── nrows on filtered data ───────────��────────────────────────────────────

Deno.test("summarize nrows - unfiltered", () => {
  const result = events.groupBy("id").summarize({
    n: (g: any) => g.nrows(),
  });
  const out = [...result].map((r: any) => ({ id: r.id, n: r.n }));
  expect(out).toEqual([
    { id: "P1", n: 4 },
    { id: "P2", n: 3 },
    { id: "P3", n: 1 },
  ]);
});

Deno.test("summarize nrows - after filter", () => {
  const filtered = events.filter((r: any) => r.code === targetCode);
  const result = filtered.groupBy("id").summarize({
    n: (g: any) => g.nrows(),
  });
  const out = [...result].map((r: any) => ({ id: r.id, n: r.n }));
  expect(out).toEqual([
    { id: "P1", n: 3 },
    { id: "P2", n: 2 },
    { id: "P3", n: 1 },
  ]);
});

// ── s.unique on filtered data (the original bug) ─────────────────────────

Deno.test("summarize s.unique - filter then mutate then select", () => {
  const chain = events
    .filter((r: any) => r.code === targetCode)
    .mutate({ _dateStr: (r: any) => r.date })
    .select("id", "_dateStr");

  const result = chain.groupBy("id").summarize({
    uniqueDates: (g: any) => s.unique(g._dateStr).length,
  });
  const out = [...result].map((r: any) => ({ id: r.id, n: r.uniqueDates }));
  expect(out).toEqual([
    { id: "P1", n: 3 },
    { id: "P2", n: 2 },
    { id: "P3", n: 1 },
  ]);
});

Deno.test("summarize s.unique - filter only, pre-existing column", () => {
  const result = events
    .filter((r: any) => r.code === targetCode)
    .groupBy("id")
    .summarize({
      uniqueCodes: (g: any) => s.unique(g.code).length,
    });
  const out = [...result].map((r: any) => ({ id: r.id, n: r.uniqueCodes }));
  // All filtered rows have the same code
  expect(out).toEqual([
    { id: "P1", n: 1 },
    { id: "P2", n: 1 },
    { id: "P3", n: 1 },
  ]);
});

Deno.test("summarize s.unique - filter keeps all rows", () => {
  const chain = events
    .filter((r: any) => r.codeSystem === "LOINC")
    .mutate({ _dateStr: (r: any) => r.date })
    .select("id", "_dateStr");

  const result = chain.groupBy("id").summarize({
    uniqueDates: (g: any) => s.unique(g._dateStr).length,
  });
  const out = [...result].map((r: any) => ({ id: r.id, n: r.uniqueDates }));
  expect(out).toEqual([
    { id: "P1", n: 3 },
    { id: "P2", n: 2 },
    { id: "P3", n: 1 },
  ]);
});

Deno.test("summarize s.unique - no filter baseline", () => {
  const chain = events
    .mutate({ _dateStr: (r: any) => r.date })
    .select("id", "_dateStr");

  const result = chain.groupBy("id").summarize({
    uniqueDates: (g: any) => s.unique(g._dateStr).length,
  });
  const out = [...result].map((r: any) => ({ id: r.id, n: r.uniqueDates }));
  expect(out).toEqual([
    { id: "P1", n: 3 },
    { id: "P2", n: 2 },
    { id: "P3", n: 1 },
  ]);
});

// ── filter removes rows, flat data, mutate + s.unique ─────────────────────

Deno.test("summarize s.unique - flat data, filter removes rows", () => {
  const flat = createDataFrame([
    { id: "P1", code: "A", date: "2025-01-01" },
    { id: "P1", code: "A", date: "2025-02-01" },
    { id: "P1", code: "B", date: "2025-03-01" },
    { id: "P2", code: "A", date: "2025-04-01" },
    { id: "P2", code: "A", date: "2025-05-01" },
    { id: "P2", code: "B", date: "2025-06-01" },
    { id: "P3", code: "A", date: "2025-07-01" },
  ]);
  const chain = flat
    .filter((r: any) => r.code === "A")
    .mutate({ _dateStr: (r: any) => r.date })
    .select("id", "_dateStr");

  const result = chain.groupBy("id").summarize({
    uniqueDates: (g: any) => s.unique(g._dateStr).length,
  });
  const out = [...result].map((r: any) => ({ id: r.id, n: r.uniqueDates }));
  expect(out).toEqual([
    { id: "P1", n: 2 },
    { id: "P2", n: 2 },
    { id: "P3", n: 1 },
  ]);
});

// ── Set-based unique (alternative to s.unique) ───────────────────────────

Deno.test("summarize with new Set - filter then mutate then select", () => {
  const chain = events
    .filter((r: any) => r.code === targetCode)
    .mutate({ _dateStr: (r: any) => r.date })
    .select("id", "_dateStr");

  const result = chain.groupBy("id").summarize({
    uniqueDates: (g: any) => new Set(g._dateStr).size,
  });
  const out = [...result].map((r: any) => ({ id: r.id, n: r.uniqueDates }));
  expect(out).toEqual([
    { id: "P1", n: 3 },
    { id: "P2", n: 2 },
    { id: "P3", n: 1 },
  ]);
});

// ── stats aggregations on filtered data ─────��─────────────────────────────

Deno.test("summarize mean/sum - after filter", () => {
  const filtered = events.filter((r: any) => r.code === targetCode);
  const result = filtered.groupBy("id").summarize({
    mean_val: (g: any) => s.mean(g.value),
    sum_val: (g: any) => s.sum(g.value),
    count: (g: any) => g.nrows(),
  });
  const out = [...result].map((r: any) => ({
    id: r.id,
    mean: r.mean_val,
    sum: r.sum_val,
    n: r.count,
  }));
  expect(out).toEqual([
    { id: "P1", mean: 120, sum: 360, n: 3 },
    { id: "P2", mean: 129, sum: 258, n: 2 },
    { id: "P3", mean: 115, sum: 115, n: 1 },
  ]);
});
