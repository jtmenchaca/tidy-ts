/**
 * Minimal reproduction of WASM crash in countDistinctEventDatesInInterval.
 *
 * The crash occurs in s.unique() (tidy-ts native WASM) when called on
 * string columns inside a grouped summarize.
 *
 * These variants isolate the issue along several dimensions:
 *   1. s.unique on standalone arrays (no DataFrame)
 *   2. s.unique on number vs string columns outside summarize
 *   3. s.unique inside ungrouped summarize
 *   4. s.unique inside grouped summarize (the crash site)
 *   5. JS Set-based alternative inside grouped summarize
 */

import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { stats as s } from "@tidy-ts/dataframe";

// ── 1. Standalone array (no DataFrame involvement) ─────────────────────

Deno.test("s.unique() on standalone number array", () => {
  const result = s.unique([1, 2, 1, 3, 2]);
  expect(result).toEqual([1, 2, 3]);
});

Deno.test("s.unique() on standalone string array", () => {
  const result = s.unique(["a", "b", "a", "c"]);
  expect(result).toEqual(["a", "b", "c"]);
});

// ── 2. Column access outside summarize ──────────────────────────────────

Deno.test("s.unique() on number column extracted from DataFrame", () => {
  const df = createDataFrame([
    { id: "P1", value: 10 },
    { id: "P1", value: 20 },
    { id: "P1", value: 10 },
  ]);
  const result = s.unique(df.value);
  expect(result).toEqual([10, 20]);
});

Deno.test("s.unique() on string column extracted from DataFrame", () => {
  const df = createDataFrame([
    { id: "P1", label: "alpha" },
    { id: "P1", label: "beta" },
    { id: "P1", label: "alpha" },
  ]);
  const result = s.unique(df.label);
  expect(result).toEqual(["alpha", "beta"]);
});

// ── 3. Inside ungrouped summarize ───────────────────────────────────────

Deno.test("s.unique() on number column inside ungrouped summarize", () => {
  const df = createDataFrame([
    { id: "P1", value: 10 },
    { id: "P1", value: 20 },
    { id: "P1", value: 10 },
  ]);
  const result = df.summarize({
    count: (g: any) => s.unique(g.value).length,
  });
  const rows = [...result] as { count: number }[];
  expect(rows[0].count).toBe(2);
});

Deno.test("s.unique() on string column inside ungrouped summarize", () => {
  const df = createDataFrame([
    { id: "P1", label: "alpha" },
    { id: "P1", label: "beta" },
    { id: "P1", label: "alpha" },
  ]);
  const result = df.summarize({
    count: (g: any) => s.unique(g.label).length,
  });
  const rows = [...result] as { count: number }[];
  expect(rows[0].count).toBe(2);
});

// ── 4. Inside grouped summarize — NUMBER column ─────────────────────────

Deno.test("s.unique() on number column inside grouped summarize", () => {
  const df = createDataFrame([
    { id: "P1", value: 10 },
    { id: "P1", value: 20 },
    { id: "P1", value: 10 },
    { id: "P2", value: 30 },
    { id: "P2", value: 30 },
  ]);
  const result = df
    .groupBy("id")
    .summarize({
      count: (g: any) => s.unique(g.value).length,
    });
  const rows = [...result] as { id: string; count: number }[];
  const byId = Object.fromEntries(rows.map((r) => [r.id, r.count]));
  expect(byId["P1"]).toBe(2);
  expect(byId["P2"]).toBe(1);
});

// ── 5. Inside grouped summarize — STRING column (crash site) ────────────

Deno.test("s.unique() on string column inside grouped summarize", () => {
  const df = createDataFrame([
    { id: "P1", _dateStr: "2025-02-10" },
    { id: "P1", _dateStr: "2025-06-15" },
    { id: "P1", _dateStr: "2025-10-20" },
    { id: "P2", _dateStr: "2025-03-05" },
    { id: "P2", _dateStr: "2025-09-12" },
  ]);

  const result = df
    .groupBy("id")
    .summarize({
      value: (g: any) => s.unique(g._dateStr).length,
    });

  const rows = [...result] as { id: string; value: number }[];
  const byId = Object.fromEntries(rows.map((r) => [r.id, r.value]));
  expect(byId["P1"]).toBe(3);
  expect(byId["P2"]).toBe(2);
});

// ── 6. JS Set workaround inside grouped summarize — STRING column ───────

Deno.test("new Set() on string column inside grouped summarize (JS workaround)", () => {
  const df = createDataFrame([
    { id: "P1", _dateStr: "2025-02-10" },
    { id: "P1", _dateStr: "2025-06-15" },
    { id: "P1", _dateStr: "2025-10-20" },
    { id: "P2", _dateStr: "2025-03-05" },
    { id: "P2", _dateStr: "2025-09-12" },
  ]);

  const result = df
    .groupBy("id")
    .summarize({
      value: (g: any) => new Set(g._dateStr).size,
    });

  const rows = [...result] as { id: string; value: number }[];
  const byId = Object.fromEntries(rows.map((r) => [r.id, r.value]));
  expect(byId["P1"]).toBe(3);
  expect(byId["P2"]).toBe(2);
});

// ── 7. Single-group grouped summarize — STRING column ───────────────────

Deno.test("s.unique() on string column inside single-group summarize", () => {
  const df = createDataFrame([
    { id: "P1", _dateStr: "2025-02-10" },
    { id: "P1", _dateStr: "2025-06-15" },
    { id: "P1", _dateStr: "2025-10-20" },
  ]);

  const result = df
    .groupBy("id")
    .summarize({
      value: (g: any) => s.unique(g._dateStr).length,
    });

  const rows = [...result] as { id: string; value: number }[];
  expect(rows[0].value).toBe(3);
});

// ── 8. Array.from(new Set()) inside grouped summarize ───────────────────

Deno.test("Array.from(new Set()) on string column inside grouped summarize", () => {
  const df = createDataFrame([
    { id: "P1", _dateStr: "2025-02-10" },
    { id: "P1", _dateStr: "2025-06-15" },
    { id: "P1", _dateStr: "2025-10-20" },
    { id: "P2", _dateStr: "2025-03-05" },
    { id: "P2", _dateStr: "2025-09-12" },
  ]);

  const result = df
    .groupBy("id")
    .summarize({
      value: (g: any) => Array.from(new Set(g._dateStr as string[])).length,
    });

  const rows = [...result] as { id: string; value: number }[];
  const byId = Object.fromEntries(rows.map((r) => [r.id, r.value]));
  expect(byId["P1"]).toBe(3);
  expect(byId["P2"]).toBe(2);
});
