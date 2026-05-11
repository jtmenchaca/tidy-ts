/**
 * Error Class 36: Descriptive Runtime Error Messages
 *
 * Tidy-TS runtime errors include context: the column name attempted
 * and the available columns in the DataFrame.
 *
 * Python throws KeyError with just the column name — no context about
 * available columns or what operation failed.
 * R gives slightly better errors via dplyr but still lacks available
 * column listings in most cases.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const patients = createDataFrame([
  { patient_id: "P001", name: "Alice", department: "ED" },
]);

// Tidy-TS runtime error (groupBy):
// patients.groupBy("dept" as any);
// → Column 'dept' not found in DataFrame. Available columns: [patient_id, name, department]

// Tidy-TS runtime error (select):
// patients.select("dept" as any);
// → Column "dept" not found. Available columns: [patient_id, name, department]
