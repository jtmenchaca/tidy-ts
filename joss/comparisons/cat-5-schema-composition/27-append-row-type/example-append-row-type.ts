/**
 * Error Class 27: Append/Prepend Row Type Mismatch
 *
 * Tidy-TS's append() requires the row to match the DataFrame's schema.
 * Missing columns, extra columns, or wrong types are compile errors.
 * Python's pd.concat silently adds NaN for missing columns.
 * R's bind_rows silently fills NA.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const patients = createDataFrame([
  { patient_id: "P1", name: "Alice", age: 30 },
]);

// ── ERROR 27a: Missing column ───────────────────────────────────────────
// COMPILE ERROR: age is missing
// @ts-expect-error: age is missing
patients.append({ patient_id: "P2", name: "Bob" });

// ── ERROR 27b: Wrong type ───────────────────────────────────────────────
// COMPILE ERROR: age should be number not string
// @ts-expect-error: age should be number not string
patients.append({ patient_id: "P2", name: "Bob", age: "thirty" });

// ── CORRECT: All columns with correct types ─────────────────────────────
patients.append({ patient_id: "P2", name: "Bob", age: 45 });
