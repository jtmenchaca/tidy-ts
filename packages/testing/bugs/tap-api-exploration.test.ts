import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

/**
 * Exploring ideal API for .trace() and .assert() — mid-chain
 * inspection and validation. These methods don't exist yet.
 *
 * .trace(label, cb) — prints label + metadata returned by cb, returns df for chaining
 * .assert(predicate, msg) — throws if predicate returns false
 */

// ─── Sample data to simulate the med pipeline ───────────────────────

const dementiaMedsDf = createDataFrame([
  { pat_id: 1, medication_id: "med_a", ordering_date: "2024-01-01" },
  { pat_id: 2, medication_id: null, ordering_date: "2024-01-02" },
  { pat_id: null, medication_id: "med_b", ordering_date: "2024-01-03" },
  { pat_id: 3, medication_id: "med_c", ordering_date: null },
  { pat_id: 4, medication_id: "med_d", ordering_date: "2024-01-04" },
  { pat_id: 5, medication_id: "med_unknown", ordering_date: "2024-01-05" },
]);

// ─── .trace(label, cb) ──────────────────────────────────────────────

Deno.test("trace - log nrows before and after removeNull", () => {
  const result = dementiaMedsDf
    .trace("before removeNull", (df) => ({ nrows: df.nrows() }))
    .removeNull("pat_id", "medication_id", "ordering_date")
    .trace("after removeNull", (df) => ({ nrows: df.nrows() }));

  expect(result.nrows()).toBe(2);
});

Deno.test("trace - count nulls in a specific column", () => {
  const result = dementiaMedsDf
    .trace("null check", (df) => ({
      medication_id_nulls: df.medication_id.filter((x) => x === null).length,
      total_rows: df.nrows(),
    }))
    .removeNull("medication_id");

  expect(result.nrows()).toBe(5);
});

Deno.test("trace - multiple inspection points in a real pipeline", () => {
  const result = dementiaMedsDf
    .trace("start", (df) => ({ rows: df.nrows() }))
    .removeNull("pat_id", "medication_id", "ordering_date")
    .trace("after removeNull", (df) => ({ rows: df.nrows() }))
    .mutate({ year: (r) => r.ordering_date.slice(0, 4) })
    .trace("after mutate", (df) => ({ columns: df.columns() }))
    .filter((r) => r.pat_id > 1)
    .trace("after filter", (df) => ({ rows: df.nrows() }));

  expect(result.nrows()).toBe(1);
});

Deno.test("trace - inspect null counts across all columns", () => {
  const result = dementiaMedsDf
    .trace("null report", (df) => ({
      pat_id_nulls: df.pat_id.filter((x) => x === null).length,
      med_id_nulls: df.medication_id.filter((x) => x === null).length,
      date_nulls: df.ordering_date.filter((x) => x === null).length,
    }))
    .removeNull("pat_id", "medication_id", "ordering_date");

  expect(result.nrows()).toBe(2);
});

Deno.test("trace - rich metadata for debugging a join", () => {
  const lookup = createDataFrame([
    { medication_id: "med_a", name: "Donepezil" },
    { medication_id: "med_d", name: "Memantine" },
  ]);

  const result = dementiaMedsDf
    .removeNull("pat_id", "medication_id", "ordering_date")
    .trace("before join", (df) => ({
      rows: df.nrows(),
      unique_meds: new Set(df.medication_id).size,
    }))
    .leftJoin(lookup, "medication_id")
    .trace("after join", (df) => ({
      rows: df.nrows(),
      matched: df.name.filter((x) => x !== null).length,
      unmatched: df.name.filter((x) => x === null).length,
    }));

  result.print();
});

// ─── .assert(predicate, msg) ────────────────────────────────────────

Deno.test("assert - validate mid-chain expectations", () => {
  const result = dementiaMedsDf
    .removeNull("pat_id", "medication_id", "ordering_date")
    .assert((df) => df.nrows() > 0, "should have rows after removeNull")
    .assert((df) => df.columns().includes("pat_id"), "should still have pat_id")
    .filter((r) => r.pat_id > 1);

  expect(result.nrows()).toBe(1);
});

Deno.test("assert - fails with a clear error", () => {
  expect(() =>
    dementiaMedsDf
      .removeNull("pat_id", "medication_id", "ordering_date")
      .assert((df) => df.nrows() > 100, "expected more than 100 rows")
  ).toThrow("expected more than 100 rows");
});
