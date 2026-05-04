/**
 * Standalone test proving that .filter().select("id").distinct("id") on a
 * grouped DataFrame (from groupBy().sliceMin()) drops IDs when the group
 * that was sliced had multiple input rows.
 *
 * The bug only manifests when there are 3+ groups AND at least one group
 * has multiple rows before slicing. With only 2 groups, distinct() works
 * correctly — the bug is specific to larger group counts.
 *
 * Impact: CMS165 numerator is wrong — patients whose min systolic BP is
 * correctly < 140 are excluded from the numerator because distinct() on
 * the grouped sliceMin result drops their ID.
 */

import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

// ── Scenario: 8 single-row groups + 1 multi-row group ───────────────────
// P9 has two rows (142, 138). sliceMin picks 138. filter(< 140) should
// include P9, but distinct() on the grouped result drops it.

const rows = [
  { id: "P1", value: 130 },
  { id: "P2", value: 145 },
  { id: "P3", value: 135 },
  { id: "P5", value: 120 },
  { id: "P6", value: 125 },
  { id: "P7", value: 120 },
  { id: "P8", value: 130 },
  { id: "P9", value: 142 },
  { id: "P9", value: 138 },  // P9 has 2 rows — sliceMin picks 138
];

// ── Step 1: sliceMin produces correct rows ───────────────────────────────

Deno.test("Step 1: sliceMin picks correct min per group", () => {
  const sliced = createDataFrame(rows).groupBy("id").sliceMin("value", 1);
  const out = sliced.toArray();
  expect(out.length).toBe(8);
  expect(out.find(r => r.id === "P9")!.value).toBe(138);
  expect(out.find(r => r.id === "P2")!.value).toBe(145);
});

// ── Step 2: filter on sliceMin works ─────────────────────────────────────

Deno.test("Step 2: filter(value < 140) on sliceMin returns 7 rows (all except P2)", () => {
  const sliced = createDataFrame(rows).groupBy("id").sliceMin("value", 1);
  const filtered = sliced.filter(r => r.value < 140);
  const out = filtered.toArray();
  expect(out.length).toBe(7);
  expect(out.find(r => r.id === "P9")!.value).toBe(138);
});

// ── Step 3: THE BUG — distinct() on grouped sliceMin drops P9 ───────────

Deno.test("Step 3 [BUG]: grouped sliceMin filter().select().distinct() drops multi-row group ID", () => {
  const sliced = createDataFrame(rows).groupBy("id").sliceMin("value", 1);
  const ids = sliced
    .filter(r => r.value < 140)
    .select("id")
    .distinct("id");
  const out = ids.toArray();
  // P9 (138 < 140) SHOULD be included — 7 IDs total
  expect(out.length).toBe(7);
  expect(out.map(r => r.id)).toContain("P9");
});

// ── Step 4: .ungroup() before filter fixes it ────────────────────────────

Deno.test("Step 4: ungrouped sliceMin filter().select().distinct() includes P9", () => {
  const sliced = createDataFrame(rows).groupBy("id").sliceMin("value", 1).ungroup();
  const ids = sliced
    .filter(r => r.value < 140)
    .select("id")
    .distinct("id");
  const out = ids.toArray();
  expect(out.length).toBe(7);
  expect(out.map(r => r.id)).toContain("P9");
});

// ── Step 5: With only 2 groups the bug does NOT reproduce ────────────────

Deno.test("Step 5: 2-group case works (bug only manifests with more groups)", () => {
  const twoRows = [
    { id: "PA", value: 130 },
    { id: "PB", value: 142 },
    { id: "PB", value: 138 },
  ];
  const sliced = createDataFrame(twoRows).groupBy("id").sliceMin("value", 1);
  const ids = sliced
    .filter(r => r.value < 140)
    .select("id")
    .distinct("id");
  const out = ids.toArray();
  // Both PA (130) and PB (138) are < 140
  expect(out.length).toBe(2);
});
