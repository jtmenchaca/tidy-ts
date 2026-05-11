/**
 * Error Class 35: Pivot Column Validation (Runtime)
 *
 * Tidy-TS validates that expectedColumns in pivot_wider exactly match
 * the unique values in the namesFrom column. If you specify columns
 * that don't exist in the data, you get a clear error showing
 * expected vs actual values.
 *
 * Python silently creates NaN-filled columns for missing pivot values.
 * R silently creates NA-filled columns.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const labs = createDataFrame([
  { patient_id: "P001", test: "BNP", value: 1250 },
  { patient_id: "P001", test: "WBC", value: 15.2 },
  { patient_id: "P002", test: "BNP", value: 450 },
]);

// RUNTIME ERROR: expectedColumns don't match actual values
// labs.pivotWider({
//   namesFrom: "test",
//   valuesFrom: "value",
//   expectedColumns: ["BNP", "WBC", "Troponin"],  // Troponin not in data!
// });
// → Pivot wider validation failed:
//   expectedColumns should only contain values from the 'namesFrom' column.
//   You provided: [BNP, WBC, Troponin]
//   Actual values in 'namesFrom' column: [BNP, WBC]
