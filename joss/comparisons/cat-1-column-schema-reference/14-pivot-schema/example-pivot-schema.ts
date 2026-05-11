/**
 * Error Class 14: Pivot Type Safety
 *
 * pivotWider creates new columns from data values. With expectedColumns,
 * Tidy-TS types the result schema. Accessing undeclared pivot columns
 * or pre-pivot columns is a compile error.
 * Python/R discover missing columns only at runtime.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const vitals = createDataFrame([
  { patient_id: "P001", metric: "systolic", value: 130 },
  { patient_id: "P001", metric: "diastolic", value: 85 },
  { patient_id: "P002", metric: "systolic", value: 145 },
  { patient_id: "P002", metric: "diastolic", value: 92 },
]);

const wide = vitals.pivotWider({
  namesFrom: "metric",
  valuesFrom: "value",
  expectedColumns: ["systolic", "diastolic"] as const,
});

// ── ERROR 14a: Accessing undeclared pivot column ────────────────────────
// COMPILE ERROR: temperature not in expectedColumns
// @ts-expect-error: temperature not in expectedColumns
wide.mutate({ fever: (r) => r.temperature > 100 });

// ── ERROR 14b: Pre-pivot columns are gone ───────────────────────────────
// COMPILE ERROR: metric no longer exists after pivot
// @ts-expect-error: metric no longer exists after pivot
wide.filter((r) => r.metric === "systolic");

// ── CORRECT: Access declared pivot columns ──────────────────────────────
wide.filter((r) => r.systolic > 140 || r.diastolic > 90);
