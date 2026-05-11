/**
 * Error Class 29: Empty DataFrame Operations
 *
 * Tidy-TS does NOT restrict operations on empty DataFrames at compile
 * time — createDataFrame([]).groupBy("x") compiles fine. This is a gap.
 * Operations on empty DataFrames produce empty results at runtime.
 *
 * Python and R also silently allow operations on empty DataFrames,
 * producing empty results that may cause downstream logic errors.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

// Empty DataFrame — operations compile and run, producing empty results
const empty = createDataFrame([]);

// GAP: These all compile fine — no type-level restriction
empty.groupBy("x");
empty.select("x");

// With data, column names are checked
const patients = createDataFrame([
  { patient_id: "P1", name: "Alice" },
]);
// @ts-expect-error: nonexistent column
patients.select("nonexistent");
