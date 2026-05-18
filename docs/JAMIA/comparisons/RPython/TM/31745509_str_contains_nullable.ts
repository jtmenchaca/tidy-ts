/**
 * RPython SO#31745509 — Using str.contains on pandas dataframe with nullable column
 * Effect: Crash
 * Bug class: Nullable type
 *
 * In pandas, str.contains on a column with NaN returns NaN for those rows.
 * Applying ~ (NOT) on NaN crashes. The user must handle nulls explicitly.
 *
 * In tidy-ts, a nullable string column is typed as string | null. Calling
 * string methods without null-checking is a compile-time error.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { v: "File corruption" as string | null },
  { v: "Registry error" },
  { v: null },
  { v: "File missing" },
  { v: "Other issue" },
]);

// @ts-expect-error — 'v' is possibly 'null'
const wrong = df.filter((r) => !r.v.includes("File"));

// Fix: null-check first
const filtered = df.filter((r) => r.v !== null && !r.v.includes("File") && !r.v.includes("Registry"));
filtered.print();
