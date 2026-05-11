/**
 * Error Class 7: Pipeline Composition Errors
 *
 * Tidy-TS tracks schema changes through multi-step pipelines. Each
 * transformation updates the type, so errors in later steps are caught.
 * Python/R throw KeyError at runtime.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const encounters = createDataFrame([
  { encounter_id: "E001", patient_id: "P001", department: "ED" },
]);

// ── ERROR 7a: Using old name after rename ──────────────────────────────────
// COMPILE ERROR: 'department' was renamed to 'dept'
const renamed = encounters.rename({ department: "dept" });
// @ts-expect-error: department was renamed to dept
renamed.filter((r) => r.department === "ICU");

// ── ERROR 7b: Accessing column removed by earlier step ─────────────────────
// COMPILE ERROR: encounter_id gone after summarize
const summary = encounters.groupBy("department").summarize({
  count: (g) => g.nrows(),
});
// @ts-expect-error: column gone after summarize
summary.mutate({ eid: (r) => r.encounter_id });
