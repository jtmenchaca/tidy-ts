/**
 * Error Class 5: Null Safety Errors
 *
 * Tidy-TS tracks nullability through the type system. Nullable columns
 * require explicit null handling before arithmetic or method calls.
 * Python silently propagates NaN. R silently propagates NA.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const labs = createDataFrame([
  { patient_id: "P001", result_value: 100, reference_high: 120 as number | null },
  { patient_id: "P002", result_value: 200, reference_high: null },
]);

// ── ERROR 5a: Method call on nullable column ───────────────────────────────
// COMPILE ERROR: reference_high is number | null, .toFixed() not safe
// @ts-expect-error: possibly null
labs.mutate({ label: (r) => r.reference_high.toFixed(1) });

// ── ERROR 5b: Arithmetic on nullable column ────────────────────────────────
// COMPILE ERROR: number | null can't be subtracted
// @ts-expect-error: possibly null
labs.mutate({ deviation: (r) => r.result_value - r.reference_high });

// ── ERROR 5c: Comparison on nullable column ────────────────────────────────
// COMPILE ERROR: reference_high is number | null, > not safe
// @ts-expect-error: possibly null
labs.filter((r) => r.reference_high > 100);
