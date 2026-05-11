/**
 * Error Class 28: Reorder vs Select Schema Preservation
 *
 * Tidy-TS's reorder() rearranges column order while preserving all
 * columns. select() drops unmentioned columns. Both check column
 * names at compile time.
 * Python/R have no compile-time column tracking for reorder/select.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { patient_id: "P1", name: "Alice", age: 30, insurance: "Medicare" },
]);

// reorder keeps all columns — just changes order
const reordered = df.reorder(["name", "patient_id"]);

// ── ERROR 28a: Nonexistent column in reorder ────────────────────────────
// COMPILE ERROR: nonexistent is not a column
// @ts-expect-error: nonexistent is not a column
df.reorder(["name", "nonexistent"]);

// select drops unmentioned columns (by design)
const selected = df.select("name", "patient_id");

// ── ERROR 28b: Accessing dropped column after select ────────────────────
// COMPILE ERROR: age was dropped by select
// @ts-expect-error: age was dropped by select
selected.mutate({ a: (r) => r.age });
