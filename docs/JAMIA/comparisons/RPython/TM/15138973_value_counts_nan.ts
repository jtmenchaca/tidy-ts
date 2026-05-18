/**
 * RPython SO#15138973 — How to get the number of the most frequent value in a column?
 * Effect: Crash
 * Bug class: Nullable type
 *
 * In pandas, value_counts().max() fails when NaN is present in results,
 * because NaN cannot be converted to integer.
 *
 * In tidy-ts, a nullable column is typed as string | null. Null values
 * must be handled explicitly before aggregation.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { item: "apple" as string | null },
  { item: "banana" },
  { item: "apple" },
  { item: null },
  { item: "banana" },
  { item: "apple" },
  { item: null },
]);

// @ts-expect-error — 'item' is possibly 'null'
const wrong = df.filter((r) => r.item.startsWith("a"));

// Fix: null-check first
const clean = df.filter((r) => r.item !== null);
const counts = clean.groupBy("item").summarize({
  count: (g) => g.nrows(),
});
counts.print();
