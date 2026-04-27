/**
 * Nested DataFrame demo — DataFrames as cell values inside other DataFrames.
 *
 * The point: a DataFrame cell can itself be a DataFrame. This lets you
 * model hierarchical data (patients → labs, clinics → patients → encounters)
 * without flattening everything into one wide table.
 */

import { expect } from "@std/expect";
import {
  createDataFrame,
  concatDataFrames,
  stats as s,
} from "@tidy-ts/dataframe";

const dt = (str: string) => Temporal.PlainDateTime.from(str);

// =========================================================================
// 1. Simplest case: a cell is a DataFrame
// =========================================================================

Deno.test("cell value is a DataFrame", () => {
  const dx = createDataFrame([
    { code: "I10", desc: "Essential hypertension" },
    { code: "E11", desc: "Type 2 diabetes" },
  ]);

  const outer = createDataFrame([{ id: "P1", diagnoses: dx }]);

  expect(outer.diagnoses[0].nrows()).toBe(2);
  expect(outer.diagnoses[0].code).toEqual(["I10", "E11"]);
});

// =========================================================================
// 2. Each row owns its own nested DataFrame
// =========================================================================

Deno.test("per-row nested DataFrames with different sizes", () => {
  const patients = createDataFrame([
    {
      id: "P1",
      labs: createDataFrame([
        { test: "A1C", value: 6.1 },
        { test: "A1C", value: 5.9 },
        { test: "LDL", value: 110 },
      ]),
    },
    {
      id: "P2",
      labs: createDataFrame([
        { test: "A1C", value: 8.2 },
      ]),
    },
    {
      id: "P3",
      labs: createDataFrame([] as { test: string; value: number }[]),
    },
  ]);

  expect(patients.labs[0].nrows()).toBe(3);
  expect(patients.labs[1].nrows()).toBe(1);
  expect(patients.labs[2].nrows()).toBe(0);

  // Chain on the nested DataFrame — filter + stats
  const p1A1c = patients.labs[0].filter((r) => r.test === "A1C");
  expect(p1A1c.nrows()).toBe(2);
  expect(s.mean(p1A1c.extract("value"))).toBeCloseTo(6.0, 1);
});

// =========================================================================
// 3. mutate to nest: attach per-row DataFrames from a flat table
// =========================================================================

Deno.test("mutate nests a flat table into per-row DataFrames", () => {
  const roster = createDataFrame([{ id: "P1" }, { id: "P2" }, { id: "P3" }]);

  const allLabs = createDataFrame([
    { id: "P1", test: "A1C", value: 6.1 },
    { id: "P1", test: "LDL", value: 110 },
    { id: "P2", test: "A1C", value: 8.2 },
    // P3 has no labs
  ]);

  const nested = roster.mutate({
    labs: (r) => allLabs.filter((lab) => lab.id === r.id),
  });

  expect(nested.labs[0].nrows()).toBe(2); // P1
  expect(nested.labs[1].nrows()).toBe(1); // P2
  expect(nested.labs[2].nrows()).toBe(0); // P3 — empty DataFrame, not null
});

// =========================================================================
// 4. Flatten nested DataFrames back out with concatDataFrames
// =========================================================================

Deno.test("flatten nested DataFrames via concatDataFrames", () => {
  const patients = createDataFrame([
    {
      id: "P1",
      labs: createDataFrame([
        { test: "A1C", value: 6.1 },
        { test: "LDL", value: 110 },
      ]),
    },
    {
      id: "P2",
      labs: createDataFrame([
        { test: "A1C", value: 8.2 },
      ]),
    },
  ]);

  // Flatten: concat all nested DataFrames back into one flat table
  const flat = concatDataFrames(
    patients.id.map((_id, i) =>
      patients.labs[i].mutate({ patient_id: () => patients.id[i] })
    ),
  );

  expect(flat.nrows()).toBe(3);
  expect(flat.patient_id).toEqual(["P1", "P1", "P2"]);
  expect(flat.test).toEqual(["A1C", "LDL", "A1C"]);
});

// =========================================================================
// 5. Summarize over nested DataFrames
// =========================================================================

Deno.test("summarize nested DataFrames per row", () => {
  const patients = createDataFrame([
    {
      id: "P1",
      labs: createDataFrame([
        { test: "A1C", value: 6.1 },
        { test: "A1C", value: 5.9 },
        { test: "LDL", value: 110 },
      ]),
    },
    {
      id: "P2",
      labs: createDataFrame([
        { test: "A1C", value: 8.2 },
        { test: "A1C", value: 7.9 },
      ]),
    },
  ]);

  // Compute per-patient stats from nested DataFrames
  const summary = patients.mutate({
    n_labs: (r) => r.labs.nrows(),
    n_a1c: (r) => r.labs.filter((l) => l.test === "A1C").nrows(),
    mean_a1c: (r) => {
      const a1c = r.labs.filter((l) => l.test === "A1C");
      return a1c.nrows() > 0 ? s.mean(a1c.extract("value")) : null;
    },
  });

  expect(summary.n_labs).toEqual([3, 2]);
  expect(summary.n_a1c).toEqual([2, 2]);
  expect(summary.mean_a1c[0]).toBeCloseTo(6.0, 1);
  expect(summary.mean_a1c[1]).toBeCloseTo(8.05, 1);
});

// =========================================================================
// 6. Nested objects inside nested DataFrames
// =========================================================================

Deno.test("nested DataFrame rows containing structured objects", () => {
  const patients = createDataFrame([
    {
      id: "P1",
      encounters: createDataFrame([
        { type: "inpatient", period: { start: dt("2025-01-10"), end: dt("2025-01-15") } },
        { type: "outpatient", period: { start: dt("2025-06-01"), end: dt("2025-06-01") } },
      ]),
    },
  ]);

  const enc = patients.encounters[0];
  const inpatient = enc.filter((r) => r.type === "inpatient");
  const los = inpatient.period[0].start.until(inpatient.period[0].end, { largestUnit: "days" }).days;
  expect(los).toBe(5);
});

// =========================================================================
// 7. Two levels deep: DataFrame → DataFrame → DataFrame
// =========================================================================

Deno.test("two levels: clinic → patients → labs", () => {
  const clinics = createDataFrame([
    {
      name: "Main St",
      patients: createDataFrame([
        {
          id: "P1",
          labs: createDataFrame([
            { test: "A1C", value: 6.5 },
            { test: "LDL", value: 95 },
          ]),
        },
        {
          id: "P2",
          labs: createDataFrame([
            { test: "A1C", value: 7.8 },
          ]),
        },
      ]),
    },
    {
      name: "Oak Ave",
      patients: createDataFrame([
        {
          id: "P3",
          labs: createDataFrame([
            { test: "A1C", value: 5.4 },
          ]),
        },
      ]),
    },
  ]);

  // Navigate: clinic → patients → labs
  expect(clinics.patients[0].nrows()).toBe(2);                     // Main St: 2 patients
  expect(clinics.patients[0].labs[0].nrows()).toBe(2);             // P1: 2 labs
  expect(clinics.patients[0].labs[0].test).toEqual(["A1C", "LDL"]);
  expect(clinics.patients[1].labs[0].value).toEqual([5.4]);        // P3 at Oak Ave
});

// =========================================================================
// 8. Summarize across multiple nested DataFrames per row
// =========================================================================

Deno.test("summarize across multiple nested DataFrames per row", () => {
  const patients = createDataFrame([
    {
      id: "P1",
      diagnoses: createDataFrame([
        { code: "I10", onset: dt("2024-06-01") },
        { code: "E11", onset: dt("2023-01-15") },
      ]),
      meds: createDataFrame([
        { drug: "lisinopril", start: dt("2024-07-01") },
        { drug: "metformin", start: dt("2023-02-01") },
      ]),
    },
    {
      id: "P2",
      diagnoses: createDataFrame([
        { code: "J45", onset: dt("2020-03-10") },
      ]),
      meds: createDataFrame([
        { drug: "albuterol", start: dt("2020-04-01") },
      ]),
    },
  ]);

  // Derive scalar columns from multiple nested DataFrames
  const summary = patients.mutate({
    n_dx: (r) => r.diagnoses.nrows(),
    n_meds: (r) => r.meds.nrows(),
    has_htn: (r) => r.diagnoses.filter((d) => d.code === "I10").nrows() > 0,
    on_ace: (r) => r.meds.filter((m) => m.drug === "lisinopril").nrows() > 0,
  });

  expect(summary.n_dx).toEqual([2, 1]);
  expect(summary.n_meds).toEqual([2, 1]);
  expect(summary.has_htn).toEqual([true, false]);
  expect(summary.on_ace).toEqual([true, false]);
});

// =========================================================================
// 9. Filter outer rows based on nested DataFrame content
// =========================================================================

Deno.test("filter outer DataFrame by nested DataFrame content", () => {
  const patients = createDataFrame([
    {
      id: "P1",
      labs: createDataFrame([
        { test: "A1C", value: 6.1 },
      ]),
    },
    {
      id: "P2",
      labs: createDataFrame([
        { test: "A1C", value: 9.5 },
      ]),
    },
    {
      id: "P3",
      labs: createDataFrame([] as { test: string; value: number }[]),
    },
  ]);

  // Find patients with any A1C > 7
  const uncontrolled = patients.filter((r) =>
    r.labs.filter((l) => l.test === "A1C" && l.value > 7).nrows() > 0
  );

  expect(uncontrolled.nrows()).toBe(1);
  expect(uncontrolled.id[0]).toBe("P2");
});

// =========================================================================
// 10. Nest → transform → flatten round-trip
// =========================================================================

Deno.test("nest → transform → flatten round-trip", () => {
  // Start flat
  const flat = createDataFrame([
    { id: "P1", test: "A1C", value: 6.1 },
    { id: "P1", test: "A1C", value: 5.9 },
    { id: "P2", test: "A1C", value: 8.2 },
    { id: "P2", test: "A1C", value: 7.9 },
  ]);

  // Nest: group into per-patient DataFrames
  const ids = flat.select("id").distinct("id");
  const nested = ids.mutate({
    labs: (r) => flat.filter((row) => row.id === r.id),
  });

  expect(nested.nrows()).toBe(2);
  expect(nested.labs[0].nrows()).toBe(2);

  // Transform: compute mean per nested DataFrame
  const withMean = nested.mutate({
    mean_val: (r) => s.mean(r.labs.extract("value")),
  });

  expect(withMean.mean_val[0]).toBeCloseTo(6.0, 1); // P1
  expect(withMean.mean_val[1]).toBeCloseTo(8.05, 1); // P2

  // Flatten back out
  const backToFlat = concatDataFrames(
    nested.id.map((_id, i) => nested.labs[i]),
  );

  expect(backToFlat.nrows()).toBe(4);
  expect(backToFlat.id).toEqual(["P1", "P1", "P2", "P2"]);
});

// =========================================================================
// 11. Mutate inside nested DataFrames — transform the nested data itself
// =========================================================================

Deno.test("mutate to transform nested DataFrames in place", () => {
  const patients = createDataFrame([
    {
      id: "P1",
      labs: createDataFrame([
        { test: "A1C", value: 6.1, date: dt("2025-01-15") },
        { test: "A1C", value: 5.9, date: dt("2025-06-20") },
        { test: "LDL", value: 110, date: dt("2025-03-01") },
      ]),
    },
    {
      id: "P2",
      labs: createDataFrame([
        { test: "A1C", value: 8.2, date: dt("2025-02-10") },
      ]),
    },
  ]);

  // Add a derived column to every patient's nested labs DataFrame
  const enriched = patients.mutate({
    labs: (r) => r.labs.mutate({
      abnormal: (l) =>
        (l.test === "A1C" && l.value > 6.5) ||
        (l.test === "LDL" && l.value > 100),
    }),
  });

  expect(enriched.labs[0].abnormal).toEqual([false, false, true]);
  expect(enriched.labs[1].abnormal).toEqual([true]);
});

// =========================================================================
// 12. Sort/arrange inside nested DataFrames
// =========================================================================

Deno.test("arrange nested DataFrames into chronological order", () => {
  const patients = createDataFrame([
    {
      id: "P1",
      encounters: createDataFrame([
        { type: "outpatient", date: dt("2025-06-01") },
        { type: "inpatient", date: dt("2025-01-10") },
        { type: "outpatient", date: dt("2025-03-15") },
      ]),
    },
  ]);

  // Sort each patient's encounters by date
  const sorted = patients.mutate({
    encounters: (r) => r.encounters.arrange("date"),
  });

  expect(sorted.encounters[0].type).toEqual([
    "inpatient",
    "outpatient",
    "outpatient",
  ]);
  expect(sorted.encounters[0].date[0]).toEqual(dt("2025-01-10"));
  expect(sorted.encounters[0].date[2]).toEqual(dt("2025-06-01"));
});

// =========================================================================
// 13. Join nested DataFrame against an external reference table
// =========================================================================

Deno.test("join nested DataFrame with external reference data", () => {
  const normalRanges = createDataFrame([
    { test: "A1C", low: 4.0, high: 5.6 },
    { test: "LDL", low: 0, high: 100 },
  ]);

  const patients = createDataFrame([
    {
      id: "P1",
      labs: createDataFrame([
        { test: "A1C", value: 6.1 },
        { test: "LDL", value: 95 },
      ]),
    },
    {
      id: "P2",
      labs: createDataFrame([
        { test: "A1C", value: 5.2 },
      ]),
    },
  ]);

  // Enrich each patient's labs by joining against reference ranges
  const enriched = patients.mutate({
    labs: (r) => r.labs.leftJoin(normalRanges, "test").mutate({
      out_of_range: (l) => l.value < l.low! || l.value > l.high!,
    }),
  });

  expect(enriched.labs[0].out_of_range).toEqual([true, false]); // A1C high, LDL normal
  expect(enriched.labs[1].out_of_range).toEqual([false]);        // A1C normal
});

// =========================================================================
// 14. GroupBy + summarize inside a nested DataFrame
// =========================================================================

Deno.test("groupBy and summarize within nested DataFrames", () => {
  const patients = createDataFrame([
    {
      id: "P1",
      labs: createDataFrame([
        { test: "A1C", value: 6.1 },
        { test: "A1C", value: 5.9 },
        { test: "A1C", value: 6.3 },
        { test: "LDL", value: 110 },
        { test: "LDL", value: 95 },
      ]),
    },
    {
      id: "P2",
      labs: createDataFrame([
        { test: "A1C", value: 8.2 },
        { test: "A1C", value: 7.9 },
      ]),
    },
  ]);

  // Summarize per test type within each patient's labs
  const p1Summary = patients.labs[0]
    .groupBy("test")
    .summarize({
      mean_val: (g) => s.mean(g.extract("value")),
      n: (g) => g.nrows(),
    })
    .arrange("test");

  expect(p1Summary.test).toEqual(["A1C", "LDL"]);
  expect(p1Summary.n).toEqual([3, 2]);
  expect(p1Summary.mean_val[0]).toBeCloseTo(6.1, 1);
  expect(p1Summary.mean_val[1]).toBeCloseTo(102.5, 1);

  const p2Summary = patients.labs[1]
    .groupBy("test")
    .summarize({
      mean_val: (g) => s.mean(g.extract("value")),
      n: (g) => g.nrows(),
    });

  expect(p2Summary.test).toEqual(["A1C"]);
  expect(p2Summary.n).toEqual([2]);
  expect(p2Summary.mean_val[0]).toBeCloseTo(8.05, 2);
});

// =========================================================================
// 15. Selective flattening — flatten one nesting level, preserve another
// =========================================================================

Deno.test("flatten one nesting level while preserving another", () => {
  const clinics = createDataFrame([
    {
      clinic: "Main St",
      patients: createDataFrame([
        {
          id: "P1",
          labs: createDataFrame([
            { test: "A1C", value: 6.5 },
          ]),
        },
        {
          id: "P2",
          labs: createDataFrame([
            { test: "A1C", value: 7.8 },
            { test: "LDL", value: 120 },
          ]),
        },
      ]),
    },
    {
      clinic: "Oak Ave",
      patients: createDataFrame([
        {
          id: "P3",
          labs: createDataFrame([
            { test: "A1C", value: 5.4 },
          ]),
        },
      ]),
    },
  ]);

  // Flatten clinics → patients (one level), but keep labs nested
  const flat = concatDataFrames(
    clinics.clinic.map((_c, i) =>
      clinics.patients[i].mutate({ clinic: () => clinics.clinic[i] })
    ),
  );

  expect(flat.nrows()).toBe(3);
  expect(flat.clinic).toEqual(["Main St", "Main St", "Oak Ave"]);
  expect(flat.id).toEqual(["P1", "P2", "P3"]);
  // Labs are still nested DataFrames
  expect(flat.labs[0].nrows()).toBe(1);
  expect(flat.labs[1].nrows()).toBe(2);
  expect(flat.labs[2].nrows()).toBe(1);
});

// =========================================================================
// 16. Concat nested DataFrames with different schemas
// =========================================================================

Deno.test("concat nested DataFrames with mismatched columns", () => {
  const patients = createDataFrame([
    {
      id: "P1",
      labs: createDataFrame([
        { test: "A1C", value: 6.1 },
      ]),
    },
    {
      id: "P2",
      labs: createDataFrame([
        { test: "LDL", value: 120, unit: "mg/dL" },
      ]),
    },
  ]);

  // GAP: createDataFrame infers the row type from the array, unifying heterogeneous
  // rows to the common properties. P2's labs have `unit` at runtime but
  // the outer DataFrame types `labs` as `DataFrame<{test: string, value: number}>`
  // — the `unit` column is erased from the type system.
  const allLabs = patients.labs[0].bindRows(patients.labs[1]);

  expect(allLabs.nrows()).toBe(2);
  expect(allLabs.test).toEqual(["A1C", "LDL"]);
  expect(allLabs.value).toEqual([6.1, 120]);
  expect(allLabs.unit).toEqual([undefined, "mg/dL"]); 
});

// =========================================================================
// 17. Operations on empty nested DataFrames
// =========================================================================

Deno.test("operations on empty nested DataFrames are safe", () => {
  const patients = createDataFrame([
    {
      id: "P1",
      labs: createDataFrame([] as { test: string; value: number }[]),
    },
  ]);

  const emptyLabs = patients.labs[0];

  // Empty DataFrame has no rows and no columns (schema not preserved from type alone)
  expect(emptyLabs.nrows()).toBe(0);
  expect(emptyLabs.columns()).toEqual([]);

  // Mutate on empty → empty with only the new column
  const withFlag = emptyLabs.mutate({ flag: () => true });
  expect(withFlag.nrows()).toBe(0);
  expect(withFlag.columns()).toEqual(["flag"]);

  // Summarize derived from empty nested DataFrames
  const summary = patients.mutate({
    n_labs: (r) => r.labs.nrows(),
    mean_val: (r) => r.labs.nrows() > 0 ? s.mean(r.labs.extract("value")) : null,
  });
  expect(summary.n_labs).toEqual([0]);
  expect(summary.mean_val).toEqual([null]);
});

// =========================================================================
// 18. Replace/update a nested DataFrame via mutate
// =========================================================================

Deno.test("replace nested DataFrame with a transformed version", () => {
  const patients = createDataFrame([
    {
      id: "P1",
      labs: createDataFrame([
        { test: "A1C", value: 6.1, date: dt("2024-01-15") },
        { test: "A1C", value: 5.8, date: dt("2025-03-20") },
        { test: "LDL", value: 110, date: dt("2024-06-01") },
      ]),
    },
    {
      id: "P2",
      labs: createDataFrame([
        { test: "A1C", value: 8.2, date: dt("2024-11-05") },
        { test: "A1C", value: 7.5, date: dt("2025-02-14") },
      ]),
    },
  ]);

  // Replace each patient's labs with only their most recent entry per test type.
  // Filter to each test, arrange by date desc, take the first row, then recombine.
  const deduped = patients.mutate({
    labs: (r) => {
      const tests = r.labs.extractUnique("test");
      return concatDataFrames(
        tests.map((t) =>
          r.labs.filter((l) => l.test === t).arrange("date", "desc").sliceHead(1)
        ),
      );
    },
  });

  expect(deduped.labs[0].nrows()).toBe(2); // one A1C, one LDL
  expect(deduped.labs[0].test).toEqual(["A1C", "LDL"]);
  expect(deduped.labs[0].value).toEqual([5.8, 110]); // most recent A1C, only LDL
  expect(deduped.labs[1].nrows()).toBe(1); // one A1C
  expect(deduped.labs[1].value).toEqual([7.5]); // most recent
});
