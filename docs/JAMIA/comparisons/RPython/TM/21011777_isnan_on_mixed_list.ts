/**
 * RPython SO#21011777 — How can I remove NaN from list Python/NumPy
 * Effect: Crash
 * Bug class: Nullable type
 *
 * In Python, math.isnan() and np.isnan() fail on mixed lists containing
 * strings and NaN. The type system doesn't prevent passing mixed data to isnan.
 *
 * In tidy-ts, a column with nulls is typed as string | null. Null-checking
 * uses === null, which works on any type. There is no isnan confusion.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { country: null as string | null },
  { country: "USA" },
  { country: "UK" },
  { country: "France" },
]);

// @ts-expect-error — 'country' is possibly 'null'
const wrong = df.mutate({ upper: (r) => r.country.toUpperCase() });

// Fix: filter nulls, then operate on guaranteed strings
const cleaned = df.filter((r) => r.country !== null);
cleaned.print();
