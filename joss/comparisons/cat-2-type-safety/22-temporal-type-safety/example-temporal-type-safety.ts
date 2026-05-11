/**
 * Error Class 22: Temporal Type Safety
 *
 * Tidy-TS tracks Date types through operations. You can't do arithmetic
 * directly on Dates — Date + number and Date * number are compile errors.
 * Python silently produces NaT for invalid operations. R silently
 * produces NA.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const encounters = createDataFrame([
  { patient_id: "P1", admit_date: new Date("2024-01-15"), los_days: 3 },
]);

// ── ERROR 22a: Date + number ────────────────────────────────────────────
// COMPILE ERROR: Operator '+' cannot be applied to Date and number
// @ts-expect-error: Date + number is not valid
encounters.mutate({ discharge: (r) => r.admit_date + r.los_days });

// ── ERROR 22b: Date * number ────────────────────────────────────────────
// COMPILE ERROR: Date * number is not valid
// @ts-expect-error: Date * number is not valid
encounters.mutate({ bad: (r) => r.admit_date * 2 });

// ── CORRECT: Use Date methods explicitly ────────────────────────────────
encounters.mutate({
  discharge_date: (r) => {
    const d = new Date(r.admit_date);
    d.setDate(d.getDate() + r.los_days);
    return d;
  },
});
