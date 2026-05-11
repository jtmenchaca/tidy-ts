/**
 * Error Class 30: Row Label and Transpose Type Safety
 *
 * Tidy-TS tracks column names through select(), so accessing
 * dropped columns after narrowing is a compile error.
 * Python's .T and R's t() don't track column names at compile time.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const vitals = createDataFrame([
  { metric: "heart_rate", P001: 72, P002: 88 },
  { metric: "bp_systolic", P001: 120, P002: 140 },
]);

// select narrows the schema — dropped columns are compile errors
const subset = vitals.select("metric", "P001");

// ── ERROR 30a: Accessing column dropped by select ───────────────────────
// COMPILE ERROR: P002 was dropped by select
// @ts-expect-error: P002 was dropped by select
subset.mutate({ bp: (r) => r.P002 });

// ── CORRECT: Access columns that were selected ──────────────────────────
subset.mutate({ label: (r) => `${r.metric}: ${r.P001}` });
