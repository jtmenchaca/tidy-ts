/**
 * Grouped DataFrame view-mask leak tests.
 *
 * When filter() is applied to a grouped DataFrame, it creates a view mask
 * but copies __groups verbatim. Any downstream verb that walks the group
 * adjacency list without checking the view mask will see pre-filter rows.
 *
 * This file tests each verb that uses collectGroupPhysicalIndices or
 * directly walks __groups adjacency lists after a grouped filter.
 */

import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const dt = (str: string) => Temporal.PlainDateTime.from(str);

// ── Shared data ──────────────────────────────────────────────────────────────
// After groupBy("id").sliceMax("time", 1):
//   PA → most recent row has value "GOOD" (2025-06)
//   PB → only row has value "BAD"  (2025-03)
// filter(value === "GOOD") should keep only PA.

interface Row {
  id: string;
  code: string;
  time: Temporal.PlainDateTime;
  value: string;
  score: number;
}

const rows: Row[] = [
  { id: "PA", code: "X", time: dt("2025-02-01T00:00"), value: "BAD", score: 10 },
  { id: "PA", code: "X", time: dt("2025-06-01T00:00"), value: "GOOD", score: 50 },
  { id: "PB", code: "X", time: dt("2025-03-01T00:00"), value: "BAD", score: 20 },
];

function makeFilteredGrouped() {
  return createDataFrame(rows)
    .groupBy("id")
    .sliceMax("time", 1)
    .filter((r: Row) => r.value === "GOOD");
}

// ── distinct ─────────────────────────────────────────────────────────────────

Deno.test("distinct: does not leak pre-filter rows on grouped DataFrame", () => {
  const result = makeFilteredGrouped()
    .select("id")
    .distinct("id")
    .toArray();
  expect(result.length).toBe(1);
  expect(result[0].id).toBe("PA");
});

// ── slice ────────────────────────────────────────────────────────────────────

Deno.test("slice: does not leak pre-filter rows on grouped DataFrame", () => {
  const result = makeFilteredGrouped()
    .slice(0, 10)
    .toArray();
  expect(result.length).toBe(1);
  expect(result[0].id).toBe("PA");
});

// ── sliceHead ────────────────────────────────────────────────────────────────

Deno.test("sliceHead: does not leak pre-filter rows on grouped DataFrame", () => {
  const result = makeFilteredGrouped()
    .sliceHead(10)
    .toArray();
  expect(result.length).toBe(1);
  expect(result[0].id).toBe("PA");
});

// ── sliceTail ────────────────────────────────────────────────────────────────

Deno.test("sliceTail: does not leak pre-filter rows on grouped DataFrame", () => {
  const result = makeFilteredGrouped()
    .sliceTail(10)
    .toArray();
  expect(result.length).toBe(1);
  expect(result[0].id).toBe("PA");
});

// ── sliceMin ─────────────────────────────────────────────────────────────────

Deno.test("sliceMin: does not leak pre-filter rows on grouped DataFrame", () => {
  const result = makeFilteredGrouped()
    .sliceMin("score", 10)
    .toArray();
  expect(result.length).toBe(1);
  expect(result[0].id).toBe("PA");
});

// ── sliceMax ─────────────────────────────────────────────────────────────────

Deno.test("sliceMax: does not leak pre-filter rows on grouped DataFrame", () => {
  const result = makeFilteredGrouped()
    .sliceMax("score", 10)
    .toArray();
  expect(result.length).toBe(1);
  expect(result[0].id).toBe("PA");
});

// ── sample ───────────────────────────────────────────────────────────────────

Deno.test("sample: does not leak pre-filter rows on grouped DataFrame", () => {
  const result = makeFilteredGrouped()
    .sample(10)
    .toArray();
  expect(result.length).toBe(1);
  expect(result[0].id).toBe("PA");
});

// ── shuffle ──────────────────────────────────────────────────────────────────

Deno.test("shuffle: does not leak pre-filter rows on grouped DataFrame", () => {
  const result = makeFilteredGrouped()
    .shuffle(42)
    .toArray();
  expect(result.length).toBe(1);
  expect(result[0].id).toBe("PA");
});

// ── summarize ────────────────────────────────────────────────────────────────

Deno.test("summarize: does not leak pre-filter groups on grouped DataFrame", () => {
  const result = makeFilteredGrouped()
    .summarize({
      count: (g) => g.nrows(),
      total: (g) => s.sum(g.score),
    })
    .toArray();
  // Only PA's group should appear (the PB group was filtered out)
  expect(result.length).toBe(1);
  expect(result[0].id).toBe("PA");
  expect(result[0].count).toBe(1);
  expect(result[0].total).toBe(50);
});

// ── arrange ──────────────────────────────────────────────────────────────────

Deno.test("arrange: does not leak pre-filter rows on grouped DataFrame", () => {
  const result = makeFilteredGrouped()
    .arrange("score", "desc")
    .toArray();
  expect(result.length).toBe(1);
  expect(result[0].id).toBe("PA");
});

// ── summarise_columns (via summarizeColumns) ─────────────────────────────────

Deno.test("summarizeColumns: does not leak pre-filter groups on grouped DataFrame", () => {
  const result = makeFilteredGrouped()
    .summarizeColumns({
      colType: "number",
      columns: ["score"],
      newColumns: [
        { prefix: "mean_", fn: (vals: number[]) => {
          return vals.reduce((a, b) => a + b, 0) / vals.length;
        }},
      ],
    })
    .toArray();
  expect(result.length).toBe(1);
  expect(result[0].id).toBe("PA");
  expect(result[0].mean_score).toBe(50);
});
