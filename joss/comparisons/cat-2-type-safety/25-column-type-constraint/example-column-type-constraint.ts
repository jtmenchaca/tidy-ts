/**
 * Error Class 25: Column Type Constraint in Specialized Verbs
 *
 * Tidy-TS's mutateColumns() applies transforms to columns by type.
 * However, the colType constraint does NOT catch string columns passed
 * with colType: "number" at compile time — this is a gap.
 * The fn callback receives the correct column values at runtime.
 *
 * Python/R apply functions to columns at runtime — type mismatches
 * either error or produce wrong results silently.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const patients = createDataFrame([
  { name: "Alice", age: 30, weight: 65.5, insurance: "Medicare" },
]);

// CORRECT: Apply log to numeric columns
patients.mutateColumns({
  colType: "number",
  columns: ["age", "weight"],
  newColumns: [{ prefix: "log_", fn: (col) => Math.log(col) }],
});

// GAP: Selecting string column with colType "number" compiles fine
// No compile error — the constraint is not enforced at the type level
patients.mutateColumns({
  colType: "number",
  columns: ["age", "insurance"], // insurance is string — no error
  newColumns: [{ prefix: "log_", fn: (col) => Math.log(col) }],
});
