/**
 * Error Class 26: Sorting on Nullable Columns
 *
 * Tidy-TS allows sorting on nullable columns directly — arrange()
 * accepts nullable column names. The type system makes nullability
 * visible so you can replaceNA before sorting if desired.
 *
 * Python silently puts NaN at the end. R silently puts NA at the end.
 * Tidy-TS places nulls last by default (same behavior, but types
 * make the nullability visible).
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const labs = createDataFrame([
  { id: "P1", value: 100 as number | null },
  { id: "P2", value: null },
  { id: "P3", value: 50 },
]);

// Sorting on nullable column compiles and runs — nulls placed last
labs.arrange("value", "asc");

// Can also replaceNA first for explicit null handling
labs.replaceNA({ value: 0 }).arrange("value", "asc");
