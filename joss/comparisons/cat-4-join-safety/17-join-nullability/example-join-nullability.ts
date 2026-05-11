/**
 * Error Class 17: Join Nullability
 *
 * After leftJoin, right-side columns become T | undefined because not
 * every left row has a match. Tidy-TS tracks this in the type system.
 * Python/R silently produce NaN/NA for unmatched rows.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const patients = createDataFrame([
  { patient_id: "P1", name: "Alice" },
  { patient_id: "P2", name: "Bob" },
]);

const encounters = createDataFrame([
  { patient_id: "P1", department: "ED", los_days: 3 },
]);

const joined = patients.leftJoin(encounters, "patient_id");
// department: string | undefined, los_days: number | undefined

// ── ERROR 17a: String method on potentially undefined ───────────────────
// COMPILE ERROR: department is string | undefined
// @ts-expect-error: department is string | undefined — can't call toUpperCase
joined.mutate({ upper: (r) => r.department.toUpperCase() });

// ── ERROR 17b: Arithmetic on potentially undefined ──────────────────────
// COMPILE ERROR: los_days is number | undefined
// @ts-expect-error: los_days is number | undefined — can't do arithmetic
joined.mutate({ weeks: (r) => r.los_days / 7 });

// ── ERROR 17c: Comparison on potentially undefined ──────────────────────
// COMPILE ERROR: los_days is number | undefined
// @ts-expect-error: los_days is number | undefined — can't compare with >
joined.filter((r) => r.los_days > 2);

// ── CORRECT: Narrow first ───────────────────────────────────────────────
joined.mutate({
  upper: (r) => r.department?.toUpperCase() ?? "N/A",
  weeks: (r) => (r.los_days !== undefined ? r.los_days / 7 : null),
});
