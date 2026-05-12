/**
 * Runner: Empirically validates Python and R error detection behavior
 * for each error class by executing probe scripts and asserting outcomes.
 *
 * Each probe script attempts erroneous operations and emits JSON:
 *   [{ "outcome": "error" | "warning" | "silent", "message": "...", "result": ... }, ...]
 *
 * Tidy-TS catches ALL of these at compile time (C). This test validates
 * what Python and R do instead.
 */
import { expect } from "@std/expect";
import { createDataFrame, readCSV } from "@tidy-ts/dataframe";
import { z } from "zod";
import {
  type Outcome,
  probePath,
  runPythonProbe,
  runRProbe,
} from "./test-helpers.ts";

const BASE = import.meta.url;

// ── Cat 1: Column & Schema Reference (consolidated) ────────────────────────
// Classes 01, 04, 07, 14, 15, 28, 36 — 15 total results each

const cat1Py = runPythonProbe(
  probePath(BASE, "./cat-1-column-schema-reference/probe.py"),
);
const cat1R = runRProbe(
  probePath(BASE, "./cat-1-column-schema-reference/probe.R"),
);

Deno.test("Cat 1 — Column & Schema Reference: Python probe count", () => {
  expect(cat1Py.length).toBe(16);
});

Deno.test("Cat 1 — Column & Schema Reference: R probe count", () => {
  expect(cat1R.length).toBe(16);
});

// ── 01: Column Reference Errors ─────────────────────────────────────────────

Deno.test("01 — Column Reference: Python", () => {
  // 1a: Misspelled column in mutate — KeyError
  expect(cat1Py[0].outcome).toBe("error" as Outcome);
  // 1b: Nonexistent column in filter — KeyError
  expect(cat1Py[1].outcome).toBe("error" as Outcome);
  // 1c: Misspelled column in sort — KeyError
  expect(cat1Py[2].outcome).toBe("error" as Outcome);
});

Deno.test("01 — Column Reference: R", () => {
  // 1a: Misspelled column in mutate — error (modern dplyr)
  expect(cat1R[0].outcome).toBe("error" as Outcome);
  // 1b: Nonexistent column in filter — error
  expect(cat1R[1].outcome).toBe("error" as Outcome);
  // 1c: Misspelled column in arrange — error
  expect(cat1R[2].outcome).toBe("error" as Outcome);
});

// ── Cat 2: Type Safety (consolidated) ────────────────────────────────────────
// Classes 02, 10, 16, 22, 25, 30, 34 — 14 total results each

const cat2Py = runPythonProbe(
  probePath(BASE, "./cat-2-type-safety/probe.py"),
);
const cat2R = runRProbe(
  probePath(BASE, "./cat-2-type-safety/probe.R"),
);

Deno.test("Cat 2 — Type Safety: Python probe count", () => {
  expect(cat2Py.length).toBe(14);
});

Deno.test("Cat 2 — Type Safety: R probe count", () => {
  expect(cat2R.length).toBe(14);
});

// ── Cat 3: Null & Missing Data (consolidated) ───────────────────────────────
// Classes 05, 11, 12, 21, 24, 26, 35 — 15 total results each

const cat3Py = runPythonProbe(
  probePath(BASE, "./cat-3-null-missing-data/probe.py"),
);
const cat3R = runRProbe(
  probePath(BASE, "./cat-3-null-missing-data/probe.R"),
);

Deno.test("Cat 3 — Null & Missing Data: Python probe count", () => {
  expect(cat3Py.length).toBe(17);
});

Deno.test("Cat 3 — Null & Missing Data: R probe count", () => {
  expect(cat3R.length).toBe(17);
});

// ── Cat 4: Join Safety (consolidated) ────────────────────────────────────────
// Classes 03, 17, 18 — 8 total results each

const cat4Py = runPythonProbe(
  probePath(BASE, "./cat-4-join-safety/probe.py"),
);
const cat4R = runRProbe(
  probePath(BASE, "./cat-4-join-safety/probe.R"),
);

Deno.test("Cat 4 — Join Safety: Python probe count", () => {
  expect(cat4Py.length).toBe(8);
});

Deno.test("Cat 4 — Join Safety: R probe count", () => {
  expect(cat4R.length).toBe(8);
});

// ── Cat 5: Schema Composition (consolidated) ─────────────────────────────────
// Classes 06, 13, 20, 27, 33 — 10 total results each

const cat5Py = runPythonProbe(
  probePath(BASE, "./cat-5-schema-composition/probe.py"),
);
const cat5R = runRProbe(
  probePath(BASE, "./cat-5-schema-composition/probe.R"),
);

Deno.test("Cat 5 — Schema Composition: Python probe count", () => {
  expect(cat5Py.length).toBe(10);
});

Deno.test("Cat 5 — Schema Composition: R probe count", () => {
  expect(cat5R.length).toBe(10);
});

// ── 02: Type Mismatch Errors ────────────────────────────────────────────────

Deno.test("02 — Type Mismatch: Python", () => {
  // a: Arithmetic on string column — error (pandas 3.x)
  expect(cat2Py[0].outcome).toBe("error" as Outcome);
  // b: Numeric aggregation on string — error (pandas 3.x)
  expect(cat2Py[1].outcome).toBe("error" as Outcome);
  // c: Comparing number to string — SILENT, returns 0 rows
  expect(cat2Py[2].outcome).toBe("silent" as Outcome);
  expect(cat2Py[2].result).toBe("returned 0 rows, no error");
});

Deno.test("02 — Type Mismatch: R", () => {
  // a: Arithmetic on string column — error
  expect(cat2R[0].outcome).toBe("error" as Outcome);
  // b: Numeric aggregation on string — WARNING, returns NA
  expect(cat2R[1].outcome).toBe("warning" as Outcome);
  // c: Comparing number to string — SILENT, returns 0 rows
  expect(cat2R[2].outcome).toBe("silent" as Outcome);
  expect(cat2R[2].result).toBe("returned 0 rows, no error");
});

// ── 03: Join Key Errors ─────────────────────────────────────────────────────

Deno.test("03 — Join Key: Python", () => {
  // a: Join key not in left table — KeyError
  expect(cat4Py[0].outcome).toBe("error" as Outcome);
  // b: Misspelled join key — KeyError
  expect(cat4Py[1].outcome).toBe("error" as Outcome);
  // c: Wrong table column post-join — KeyError
  expect(cat4Py[2].outcome).toBe("error" as Outcome);
});

Deno.test("03 — Join Key: R", () => {
  // a: Join key not in left table — error
  expect(cat4R[0].outcome).toBe("error" as Outcome);
  // b: Misspelled join key — error
  expect(cat4R[1].outcome).toBe("error" as Outcome);
  // c: Wrong table column post-join — error
  expect(cat4R[2].outcome).toBe("error" as Outcome);
});

// ── 04: Schema Evolution ────────────────────────────────────────────────────

Deno.test("04 — Schema Evolution: Python", () => {
  // 4a: Accessing dropped column — KeyError
  expect(cat1Py[3].outcome).toBe("error" as Outcome);
  // 4b: Column after summarize — KeyError
  expect(cat1Py[4].outcome).toBe("error" as Outcome);
  // 4c: Sort by dropped column — KeyError
  expect(cat1Py[5].outcome).toBe("error" as Outcome);
});

Deno.test("04 — Schema Evolution: R", () => {
  // 4a: Accessing dropped column — error
  expect(cat1R[3].outcome).toBe("error" as Outcome);
  // 4b: Column after summarise — error
  expect(cat1R[4].outcome).toBe("error" as Outcome);
  // 4c: Sort by dropped column — error
  expect(cat1R[5].outcome).toBe("error" as Outcome);
});

// ── 05: Null Safety Errors ──────────────────────────────────────────────────

Deno.test("05 — Null Safety: Python", () => {
  // a: String method on NaN column — SILENT propagation
  expect(cat3Py[0].outcome).toBe("silent" as Outcome);
  // b: Arithmetic on NaN column — SILENT propagation
  expect(cat3Py[1].outcome).toBe("silent" as Outcome);
  // c: Comparison with NaN — SILENTLY excludes NaN rows
  expect(cat3Py[2].outcome).toBe("silent" as Outcome);
});

Deno.test("05 — Null Safety: R", () => {
  // a: String method on NA column — SILENT propagation
  expect(cat3R[0].outcome).toBe("silent" as Outcome);
  // b: Arithmetic on NA column — SILENT propagation
  expect(cat3R[1].outcome).toBe("silent" as Outcome);
  // c: Comparison with NA — SILENTLY excludes NA rows
  expect(cat3R[2].outcome).toBe("silent" as Outcome);
});

// ── 06: Schema Validation at Data Boundaries ────────────────────────────────

Deno.test("06 — Schema Validation: Python", () => {
  // a: Non-numeric in numeric column — SILENT, dtype becomes str/object
  expect(cat5Py[0].outcome).toBe("silent" as Outcome);
  // b: Missing column — KeyError when accessed
  expect(cat5Py[1].outcome).toBe("error" as Outcome);
  // c: Empty cell — SILENT, becomes NaN
  expect(cat5Py[2].outcome).toBe("silent" as Outcome);
});

Deno.test("06 — Schema Validation: R", () => {
  // a: Non-numeric in numeric column — WARNING, coerced to NA
  expect(cat5R[0].outcome).toBe("warning" as Outcome);
  // b: Missing column — error when accessed
  expect(cat5R[1].outcome).toBe("error" as Outcome);
  // c: Empty cell — SILENT, becomes NA
  expect(cat5R[2].outcome).toBe("silent" as Outcome);
});

// ── 07: Pipeline Composition Errors ─────────────────────────────────────────

Deno.test("07 — Pipeline Composition: Python", () => {
  // 7a: Old name after rename — KeyError
  expect(cat1Py[6].outcome).toBe("error" as Outcome);
  // 7b: Column removed by groupby — KeyError
  expect(cat1Py[7].outcome).toBe("error" as Outcome);
});

Deno.test("07 — Pipeline Composition: R", () => {
  // 7a: Old name after rename — error
  expect(cat1R[6].outcome).toBe("error" as Outcome);
  // 7b: Column removed by summarise — error
  expect(cat1R[7].outcome).toBe("error" as Outcome);
});

// ── 10: Conversion Narrowing ────────────────────────────────────────────────

Deno.test("10 — Conversion Narrowing: Python", () => {
  // d: to_numeric(errors='coerce') — SILENT, unparseable becomes NaN
  expect(cat2Py[3].outcome).toBe("silent" as Outcome);
  // e: Arithmetic on NaN — SILENT propagation
  expect(cat2Py[4].outcome).toBe("silent" as Outcome);
  // f: mean() after conversion — SILENT, skips NaN
  expect(cat2Py[5].outcome).toBe("silent" as Outcome);
});

Deno.test("10 — Conversion Narrowing: R", () => {
  // d: as.numeric() on non-numeric — WARNING (NAs introduced)
  expect(cat2R[3].outcome).toBe("warning" as Outcome);
  // e: Arithmetic on NA — SILENT propagation
  expect(cat2R[4].outcome).toBe("silent" as Outcome);
  // f: mean() after conversion — SILENT, returns NA
  expect(cat2R[5].outcome).toBe("silent" as Outcome);
});

// ── 11: Null Narrowing ──────────────────────────────────────────────────────

Deno.test("11 — Null Narrowing: Python", () => {
  // d: Division with NaN — silent (NaN propagates)
  expect(cat3Py[3].outcome).toBe("silent" as Outcome);
  // e: Re-introduce NaN then divide — silent (NaN propagates again)
  expect(cat3Py[4].outcome).toBe("silent" as Outcome);
});

Deno.test("11 — Null Narrowing: R", () => {
  // d: Division with NA — silent (NA propagates)
  expect(cat3R[3].outcome).toBe("silent" as Outcome);
  // e: Re-introduce NA then divide — silent (NA propagates again)
  expect(cat3R[4].outcome).toBe("silent" as Outcome);
});

// ── 12: Aggregation on Missing Data ─────────────────────────────────────────

Deno.test("12 — Aggregation on Missing Data: Python", () => {
  // f: mean() then *2 — SILENT, NaN skipped in mean, doubled silently
  expect(cat3Py[5].outcome).toBe("silent" as Outcome);
  // g: sum() then *2 — SILENT, NaN skipped in sum, doubled silently
  expect(cat3Py[6].outcome).toBe("silent" as Outcome);
  // h: min() then *2 — SILENT, NaN skipped in min, doubled silently
  expect(cat3Py[7].outcome).toBe("silent" as Outcome);
  // i: groupby mean then +1 — SILENT, NaN+1 still NaN
  expect(cat3Py[8].outcome).toBe("silent" as Outcome);
});

Deno.test("12 — Aggregation on Missing Data: R", () => {
  // f: mean() then *2 — NA propagates through arithmetic
  expect(cat3R[5].outcome).toBe("silent" as Outcome);
  // g: sum() then *2 — NA propagates through arithmetic
  expect(cat3R[6].outcome).toBe("silent" as Outcome);
  // h: min() then *2 — NA propagates through arithmetic
  expect(cat3R[7].outcome).toBe("silent" as Outcome);
  // i: groupby mean then +1 — NA propagates through mutate
  expect(cat3R[8].outcome).toBe("silent" as Outcome);
});

// ── 13: Bind Rows Schema Mismatch ───────────────────────────────────────────

Deno.test("13 — Bind Rows Schema: Python", () => {
  // d: concat fills missing columns with NaN — SILENT
  expect(cat5Py[3].outcome).toBe("silent" as Outcome);
  // e: String op on NaN after concat — SILENT propagation
  expect(cat5Py[4].outcome).toBe("silent" as Outcome);
});

Deno.test("13 — Bind Rows Schema: R", () => {
  // d: bind_rows fills missing columns with NA — SILENT
  expect(cat5R[3].outcome).toBe("silent" as Outcome);
  // e: String op on NA after bind — SILENT propagation
  expect(cat5R[4].outcome).toBe("silent" as Outcome);
});

// ── 14: Pivot Type Safety ───────────────────────────────────────────────────

Deno.test("14 — Pivot Schema: Python", () => {
  // 14a: Non-existent pivot column — RE
  expect(cat1Py[8].outcome).toBe("error" as Outcome);
  // 14b: Pre-pivot column gone — RE
  expect(cat1Py[9].outcome).toBe("error" as Outcome);
});

Deno.test("14 — Pivot Schema: R", () => {
  // 14a: Non-existent pivot column — RE
  expect(cat1R[8].outcome).toBe("error" as Outcome);
  // 14b: Pre-pivot column gone — RE
  expect(cat1R[9].outcome).toBe("error" as Outcome);
});

// ── 15: Distinct Column Narrowing ───────────────────────────────────────────

Deno.test("15 — Distinct Narrowing: Python", () => {
  // 15a: drop_duplicates keeps all columns — SILENT, arbitrary values
  expect(cat1Py[10].outcome).toBe("silent" as Outcome);
  expect(cat1Py[10].result).toBe("all columns kept silently");
  // 15b: drop_duplicates with keep='first' — SILENT
  expect(cat1Py[11].outcome).toBe("silent" as Outcome);
});

Deno.test("15 — Distinct Narrowing: R", () => {
  // 15a: distinct() drops non-specified columns — SILENT (no type tracking)
  expect(cat1R[10].outcome).toBe("silent" as Outcome);
  // 15b: distinct(.keep_all=TRUE) keeps arbitrary values — SILENT
  expect(cat1R[11].outcome).toBe("silent" as Outcome);
});

// ── 16: Mixed Return Types ──────────────────────────────────────────────────

Deno.test("16 — Mixed Return Types: Python", () => {
  // g: arithmetic on mixed column — SILENT (string * 2 repeats string)
  expect(cat2Py[6].outcome).toBe("silent" as Outcome);
  expect(cat2Py[6].result).toBe("string repeated, not math");
});

Deno.test("16 — Mixed Return Types: R", () => {
  // g: as.numeric on "HIGH" — WARNING (NAs introduced by coercion)
  expect(cat2R[6].outcome).toBe("warning" as Outcome);
});

// ── 17: Join Nullability ──────────────────────────────────────────────

Deno.test("17 — Join Nullability: Python", () => {
  // d: str.upper() on NaN from left join — SILENT
  expect(cat4Py[3].outcome).toBe("silent" as Outcome);
  expect(cat4Py[3].result).toBe("produced 2 NaN silently");
  // e: Arithmetic on NaN from left join — SILENT
  expect(cat4Py[4].outcome).toBe("silent" as Outcome);
  expect(cat4Py[4].result).toBe("produced 2 NaN silently");
  // f: Comparison silently excludes NaN rows
  expect(cat4Py[5].outcome).toBe("silent" as Outcome);
  expect(cat4Py[5].result).toBe("excluded 2 NaN rows");
});

Deno.test("17 — Join Nullability: R", () => {
  // d: toupper() on NA from left join — SILENT
  expect(cat4R[3].outcome).toBe("silent" as Outcome);
  // e: Arithmetic on NA from left join — SILENT
  expect(cat4R[4].outcome).toBe("silent" as Outcome);
  // f: filter() silently drops NA rows
  expect(cat4R[5].outcome).toBe("silent" as Outcome);
});

// ── 18: Column Name Collision ─────────────────────────────────────────

Deno.test("18 — Column Name Collision: Python", () => {
  // g: Explicit suffixes — access original → error
  expect(cat4Py[6].outcome).toBe("error" as Outcome);
  // h: No suffixes — access original → error (renamed to _x/_y)
  expect(cat4Py[7].outcome).toBe("error" as Outcome);
});

Deno.test("18 — Column Name Collision: R", () => {
  // g: Explicit suffixes — access original → error
  expect(cat4R[6].outcome).toBe("error" as Outcome);
  // h: No suffixes — access original → error (renamed to .x/.y)
  expect(cat4R[7].outcome).toBe("error" as Outcome);
});

// ── 19: GroupBy State Tracking ────────────────────────────────────────

Deno.test("19 — GroupBy State: Python", () => {
  // p: Multi-level groupby+agg silently produces MultiIndex
  expect(cat1Py[15].outcome).toBe("silent" as Outcome);
  expect(cat1Py[15].result).toBe("produced MultiIndex silently");
});

Deno.test("19 — GroupBy State: R", () => {
  // p: Second summarise on still-grouped result — SILENT per-group aggregation
  expect(cat1R[15].outcome).toBe("silent" as Outcome);
});

// ── 20: Implicit Type Coercion ────────────────────────────────────────

Deno.test("20 — Implicit Type Coercion: Python", () => {
  // f: concat coerces int+string to object — SILENT
  expect(cat5Py[5].outcome).toBe("silent" as Outcome);
  expect(cat5Py[5].result).toBe("coerced to 'object' dtype");
  // g: Arithmetic on mixed column — string repetition instead of multiplication
  expect(cat5Py[6].outcome).toBe("silent" as Outcome);
  expect(cat5Py[6].result).toBe("strings repeated, not math");
});

Deno.test("20 — Implicit Type Coercion: R", () => {
  // f: bind_rows with double+character — RE (R is stricter here)
  expect(cat5R[5].outcome).toBe("error" as Outcome);
  // g: bind_rows with logical+numeric — SILENT coercion
  expect(cat5R[6].outcome).toBe("silent" as Outcome);
});

// ── 21: Aggregation Return Type Narrowing ─────────────────────────────

Deno.test("21 — Aggregation Return Type: Python", () => {
  // j: sum() silently skips NaN
  expect(cat3Py[9].outcome).toBe("silent" as Outcome);
  expect(cat3Py[9].result).toBe("Skipped 1 NaN, returned 1700");
  // k: Arithmetic on NaN-skipped result — no type indication
  expect(cat3Py[10].outcome).toBe("silent" as Outcome);
});

Deno.test("21 — Aggregation Return Type: R", () => {
  // j: sum() returns NA silently
  expect(cat3R[9].outcome).toBe("silent" as Outcome);
  // k: Arithmetic on NA propagates silently
  expect(cat3R[10].outcome).toBe("silent" as Outcome);
});

// ── 22: Temporal Type Safety ──────────────────────────────────────────

Deno.test("22 — Temporal Type Safety: Python", () => {
  // h: Invalid date silently becomes NaT
  expect(cat2Py[7].outcome).toBe("silent" as Outcome);
  expect(cat2Py[7].result).toBe("Invalid date became NaT");
  // i: date > 100 — error (pandas 3.x rejects datetime vs int)
  expect(cat2Py[8].outcome).toBe("error" as Outcome);
  // j: date + 7 — error (pandas 3.x rejects int addition to datetime)
  expect(cat2Py[9].outcome).toBe("error" as Outcome);
});

Deno.test("22 — Temporal Type Safety: R", () => {
  // h: Invalid date silently becomes NA (no warning in vector context)
  expect(cat2R[7].outcome).toBe("silent" as Outcome);
  // i: date > 100 — silent (Date is internally days-since-epoch)
  expect(cat2R[8].outcome).toBe("silent" as Outcome);
  // j: date + 7 — silent (adds 7 days)
  expect(cat2R[9].outcome).toBe("silent" as Outcome);
});

// ── 24: Window Function Output Type ───────────────────────────────────

Deno.test("24 — Window Function Output: Python", () => {
  // l: shift() silently introduces NaN
  expect(cat3Py[11].outcome).toBe("silent" as Outcome);
  expect(cat3Py[11].result).toBe("shift() introduced 1 NaN");
  // m: Arithmetic on shifted NaN propagates
  expect(cat3Py[12].outcome).toBe("silent" as Outcome);
});

Deno.test("24 — Window Function Output: R", () => {
  // l: lag() silently introduces NA
  expect(cat3R[11].outcome).toBe("silent" as Outcome);
  // m: Arithmetic on lagged NA propagates
  expect(cat3R[12].outcome).toBe("silent" as Outcome);
});

// ── 25: Column Type Constraint ────────────────────────────────────────

Deno.test("25 — Column Type Constraint: Python", () => {
  // k: * 2 on string column silently repeats string
  expect(cat2Py[10].outcome).toBe("silent" as Outcome);
  expect(cat2Py[10].result).toBe("String repeated, not doubled");
});

Deno.test("25 — Column Type Constraint: R", () => {
  // k: across with wrong column type — runtime error
  expect(cat2R[10].outcome).toBe("error" as Outcome);
});

// ── 26: Sorting on Nullable Columns ──────────────────────────────────

Deno.test("26 — Sort Nullable Columns: Python", () => {
  // n: sort_values silently places NaN at end
  expect(cat3Py[13].outcome).toBe("silent" as Outcome);
  expect(cat3Py[13].result).toBe("NaN silently placed at end");
});

Deno.test("26 — Sort Nullable Columns: R", () => {
  // n: arrange silently places NA at end
  expect(cat3R[13].outcome).toBe("silent" as Outcome);
});

// ── 27: Append Row Type Mismatch ─────────────────────────────────────

Deno.test("27 — Append Row Type: Python", () => {
  const results = runPythonProbe(
    probePath(BASE, "./cat-5-schema-composition/27-append-row-type/probe.py"),
  );
  expect(results.length).toBe(2);
  // 27a: Missing column silently filled with NaN
  expect(results[0].outcome).toBe("silent" as Outcome);
  expect(results[0].result).toBe("Missing col filled with NaN");
  // 27b: Wrong type silently coerced
  expect(results[1].outcome).toBe("silent" as Outcome);
  expect(results[1].result).toBe("Age dtype coerced to object");
});

Deno.test("27 — Append Row Type: R", () => {
  const results = runRProbe(
    probePath(BASE, "./cat-5-schema-composition/27-append-row-type/probe.R"),
  );
  expect(results.length).toBe(2);
  // 27a: Missing column silently filled with NA
  expect(results[0].outcome).toBe("silent" as Outcome);
  // 27b: Wrong type — R errors on double + character
  expect(results[1].outcome).toBe("error" as Outcome);
});

// ── 28: Reorder Schema Preservation ──────────────────────────────────

Deno.test("28 — Reorder Schema: Python", () => {
  // 28a: Column selection silently drops unmentioned columns
  expect(cat1Py[12].outcome).toBe("silent" as Outcome);
  expect(cat1Py[12].result).toBe("Silently dropped 2 columns");
});

Deno.test("28 — Reorder Schema: R", () => {
  // 28a: select() silently drops unmentioned columns
  expect(cat1R[12].outcome).toBe("silent" as Outcome);
});

// ── 30: Row Label / Transpose Type Safety ─────────────────────────────

Deno.test("30 — Transpose Type Safety: Python", () => {
  // l: string * 2 = string repetition — silent
  expect(cat2Py[11].outcome).toBe("silent" as Outcome);
  expect(cat2Py[11].result).toBe("str*2='systolicsystolic'");
  // m: pre-transpose column name — runtime error
  expect(cat2Py[12].outcome).toBe("error" as Outcome);
});

Deno.test("30 — Transpose Type Safety: R", () => {
  // l: t() coerces to character — arithmetic error
  expect(cat2R[11].outcome).toBe("error" as Outcome);
  // m: pre-transpose column name — subscript error
  expect(cat2R[12].outcome).toBe("error" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════
// Runtime Safety (Classes 31–36)
// ═══════════════════════════════════════════════════════════════════════

// ── 31: Nullable vs Optional Distinction ────────────────────────────────

Deno.test("31 — Nullable vs Optional: Python", () => {
  // p: null and missing both become NaN — indistinguishable
  expect(cat3Py[15].outcome).toBe("silent" as Outcome);
  expect(cat3Py[15].result).toBe("null and missing both NaN");
  // q: conditional fill — both filled identically
  expect(cat3Py[16].outcome).toBe("silent" as Outcome);
  expect(cat3Py[16].result).toBe("both filled identically");
});

Deno.test("31 — Nullable vs Optional: R", () => {
  // p: null and missing both become NA — indistinguishable
  expect(cat3R[15].outcome).toBe("silent" as Outcome);
  // q: conditional fill — both filled identically
  expect(cat3R[16].outcome).toBe("silent" as Outcome);
});

Deno.test("31 — Nullable vs Optional: Tidy-TS", async () => {
  const csv = "patient_id,lab_value,notes\nP001,100,present\nP002,,has notes\nP003,200,\n";
  const schema = z.object({
    patient_id: z.string(),
    lab_value: z.coerce.number().nullable(),
    notes: z.string().optional(),
  });
  const df = await readCSV(csv, schema);
  const rows = df.toArray();
  // P002: empty nullable field → null (not undefined)
  expect(rows[1].lab_value).toBe(null);
  expect(rows[1].lab_value === undefined).toBe(false);
  // P003: empty optional field → undefined (not null)
  expect(rows[2].notes).toBe(undefined);
  expect(rows[2].notes === null).toBe(false);
});

// ── 33: Duplicate Column Names ──────────────────────────────────────────

Deno.test("33 — Duplicate Column Names: Python", () => {
  const results = runPythonProbe(
    probePath(BASE, "./cat-5-schema-composition/33-duplicate-column-names/probe.py"),
  );
  expect(results.length).toBe(1);
  // 33a: .str.upper() on duplicate col — error
  expect(results[0].outcome).toBe("error" as Outcome);
});

Deno.test("33 — Duplicate Column Names: R", () => {
  const results = runRProbe(
    probePath(BASE, "./cat-5-schema-composition/33-duplicate-column-names/probe.R"),
  );
  expect(results.length).toBe(1);
  // 33a: tibble rejects duplicate names at creation — error
  expect(results[0].outcome).toBe("error" as Outcome);
});

Deno.test("33 — Duplicate Column Names: Tidy-TS", () => {
  const df = createDataFrame([{ a: 1, b: 2, c: 3 }]);
  // Renaming two columns to the same new name → runtime error
  expect(() => df.rename({ b: "x", c: "x" })).toThrow(
    'Duplicate new column name: "x"',
  );
  // But renaming to an existing column name silently overwrites (no guard)
  const result = df.rename({ b: "a" });
  expect(result.columns()).toEqual(["a", "c"]); // original 'a' overwritten
});

// ── 34: Enum Validation ─────────────────────────────────────────────────

Deno.test("34 — Enum Validation: Python", () => {
  // n: filter on invalid enum value — silent (returns empty df)
  expect(cat2Py[13].outcome).toBe("silent" as Outcome);
});

Deno.test("34 — Enum Validation: R", () => {
  // n: filter on invalid enum value — silent (returns 0 rows)
  expect(cat2R[13].outcome).toBe("silent" as Outcome);
});

// ── 35: Pivot Column Mismatch ───────────────────────────────────────────

Deno.test("35 — Pivot Column Mismatch: Python", () => {
  // o: systolic - diastolic with NaN from missing combo — silent
  expect(cat3Py[14].outcome).toBe("silent" as Outcome);
});

Deno.test("35 — Pivot Column Mismatch: R", () => {
  // o: systolic - diastolic with NA from missing combo — silent
  expect(cat3R[14].outcome).toBe("silent" as Outcome);
});

Deno.test("35 — Pivot Column Mismatch: Tidy-TS", () => {
  const df = createDataFrame([
    { patient_id: "P001", test: "BNP", value: 1250 },
    { patient_id: "P001", test: "WBC", value: 15.2 },
    { patient_id: "P002", test: "BNP", value: 450 },
  ]);
  // expectedColumns that don't match actual data → runtime error with details
  expect(() =>
    df.pivotWider({
      namesFrom: "test",
      valuesFrom: "value",
      expectedColumns: ["BNP", "WBC", "Troponin"] as const,
    })
  ).toThrow("Pivot wider validation failed");
});

// ── 36: Column Existence Messages ───────────────────────────────────────

Deno.test("36 — Column Existence Messages: Python", () => {
  // 36a: groupby with wrong column — error but minimal message
  expect(cat1Py[13].outcome).toBe("error" as Outcome);
  expect(cat1Py[13].result).toBe(null);
  // 36b: Column access with wrong name — error but no suggestion
  expect(cat1Py[14].outcome).toBe("error" as Outcome);
  expect(cat1Py[14].result).toBe(null);
});

Deno.test("36 — Column Existence Messages: R", () => {
  // 36a: group_by with wrong column — error, better message than Python
  expect(cat1R[13].outcome).toBe("error" as Outcome);
  // 36b: select with wrong column — error, no available column list
  expect(cat1R[14].outcome).toBe("error" as Outcome);
});

Deno.test("36 — Column Existence Messages: Tidy-TS", () => {
  const df = createDataFrame([
    { patient_id: "P001", name: "Alice", department: "ED" },
  ]);
  // groupBy with wrong column → error listing available columns
  try {
    // deno-lint-ignore no-explicit-any
    (df as any).groupBy("dept");
    expect(true).toBe(false); // should not reach here
  } catch (e: unknown) {
    const msg = (e as Error).message;
    expect(msg).toContain("Available columns");
    expect(msg).toContain("patient_id");
    expect(msg).toContain("department");
  }
  // select with wrong column → error listing available columns
  try {
    // deno-lint-ignore no-explicit-any
    (df as any).select("dept");
    expect(true).toBe(false);
  } catch (e: unknown) {
    const msg = (e as Error).message;
    expect(msg).toContain("Available columns");
    expect(msg).toContain("patient_id");
  }
});
