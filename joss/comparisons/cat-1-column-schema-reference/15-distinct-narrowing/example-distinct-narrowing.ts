/**
 * Error Class 15: Distinct Column Narrowing
 *
 * Tidy-TS's distinct() with column arguments narrows the result schema
 * to only the specified columns. Accessing non-specified columns after
 * distinct is a compile error.
 * Python/R allow access to any column after drop_duplicates/distinct.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const encounters = createDataFrame([
  { patient_id: "P1", dept: "Cardio", physician: "Dr. Patel" },
  { patient_id: "P1", dept: "Cardio", physician: "Dr. Lee" },
  { patient_id: "P2", dept: "ED", physician: "Dr. Martinez" },
]);

const unique = encounters.distinct("patient_id", "dept");
// Result type: { patient_id: string; dept: string } — physician dropped

// ── ERROR 15a: Accessing column not in distinct result ──────────────────
// COMPILE ERROR: physician not in distinct result
// @ts-expect-error: physician not in distinct result
unique.mutate({ doc: (r) => r.physician });

// ── CORRECT: Only access columns passed to distinct ─────────────────────
unique.mutate({ label: (r) => r.patient_id + " — " + r.dept });
