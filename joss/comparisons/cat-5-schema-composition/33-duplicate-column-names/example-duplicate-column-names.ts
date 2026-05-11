/**
 * Error Class 33: Duplicate Column Name Detection (Runtime)
 *
 * Tidy-TS throws a runtime error when a rename maps two different
 * columns to the same new name. This catches a common copy-paste error.
 *
 * However, renaming a column to an *existing* column name silently
 * overwrites — this is a gap in the current implementation.
 *
 * Python silently creates DataFrames with duplicate column names.
 * Accessing a duplicated column returns multiple columns as a
 * DataFrame instead of a Series — silently changing the return type.
 *
 * R's tibble rejects duplicates, but data.frame allows them.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { patient_id: "P001", a: 1, b: 2, c: 3 },
]);

// RUNTIME ERROR: two columns mapped to same new name
// df.rename({ b: "x", c: "x" });
// → Error: Duplicate new column name: "x"

// Gap: renaming to an existing column silently overwrites
// df.rename({ b: "a" });
// → columns: ["a", "c"], original "a" values lost
