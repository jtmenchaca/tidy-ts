/**
 * Error Class 11: Null Narrowing via replaceNull / removeNull
 *
 * Tidy-TS tracks nullability at the type level. After replaceNull() or
 * removeNull(), columns are narrowed from T | null to T. The compiler
 * then allows operations that were previously forbidden.
 * Python/R have no compile-time nullable tracking.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const labs = createDataFrame([
  { lab_id: "L1", result_value: 100, reference_high: 120 as number | null },
  { lab_id: "L2", result_value: 200, reference_high: null },
]);

// ── 11a: Arithmetic on nullable column ──────────────────────────────────
// COMPILE ERROR: reference_high is number | null — can't divide
// @ts-expect-error: number | null can't be divided
labs.mutate({ pct: (r) => r.result_value / r.reference_high });

// After replaceNull: column narrowed to number — arithmetic OK
const filled = labs.replaceNull({ reference_high: 999 });
filled.mutate({ pct: (r) => r.result_value / r.reference_high }); // OK
