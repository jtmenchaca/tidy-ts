/**
 * Error Class 18: Column Name Collision in Joins
 *
 * When joining DataFrames with overlapping non-key columns, name collisions
 * must be resolved. All three platforms apply default suffixes (_x/_y in TS
 * and Python, .x/.y in R), and the type system tracks the renaming.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const admissions = createDataFrame([
  { patient_id: "P1", date: "2024-01-15", department: "ED" },
]);

const discharges = createDataFrame([
  { patient_id: "P1", date: "2024-01-18", disposition: "Home" },
]);

// ── 18a: Explicit suffixes — access original unsuffixed name ─────────────
// Mistake: user forgets that explicit suffixes renamed the column
const withSuffixes = admissions.innerJoin(discharges, {
  keys: ["patient_id"],
  suffixes: { left: "_admit", right: "_discharge" },
});
// @ts-expect-error: date no longer exists — now date_admit and date_discharge
withSuffixes.mutate({ d: (r) => r.date });

// ── 18b: No suffixes — access original unsuffixed name ───────────────────
// Mistake: user accesses `date` after collision, unaware both sides were renamed.
// All three platforms rename both sides by default (_x/_y or .x/.y).
const noSuffixes = admissions.innerJoin(discharges, {
  keys: ["patient_id"],
});
// @ts-expect-error: date no longer exists — now date_x and date_y
noSuffixes.mutate({ d: (r) => r.date });
