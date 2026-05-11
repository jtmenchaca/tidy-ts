/**
 * Error Class 4: Schema Evolution Through Pipelines
 *
 * After select/drop/summarize, the DataFrame schema changes. Tidy-TS
 * tracks the new schema at compile time. Python/R throw KeyError at runtime.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const encounters = createDataFrame([
  { encounter_id: "E001", patient_id: "P001", department: "ED", attending_physician: "Dr. Smith", encounter_type: "Inpatient" },
]);

// ── ERROR 4a: Accessing dropped column ─────────────────────────────────────
// COMPILE ERROR: attending_physician was not selected
const slim = encounters.select("encounter_id", "patient_id", "department");
// @ts-expect-error: column was not selected
slim.mutate({ doc: (r) => r.attending_physician });

// ── ERROR 4b: Accessing original column after summarize ────────────────────
// COMPILE ERROR: encounter_type gone after summarize
const summary = encounters.groupBy("department").summarize({
  count: (g) => g.nrows(),
});
// @ts-expect-error: column gone after summarize
summary.filter((r) => r.encounter_type === "Inpatient");

// ── ERROR 4c: Sorting by dropped column ────────────────────────────────────
// COMPILE ERROR: attending_physician was dropped
const noDoc = encounters.drop("attending_physician");
// @ts-expect-error: column was dropped
noDoc.arrange("attending_physician", "asc");
