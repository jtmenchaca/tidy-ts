/**
 * RPython SO#19105976 — Get MM-DD-YYYY from pandas Timestamp
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, user calls .date() on a Series (column-level) instead of on
 * individual Timestamp elements. The method doesn't exist on Series.
 *
 * In tidy-ts, mutate operates on individual row values. There is no confusion
 * between column-level and element-level operations. The type system ensures
 * you call methods appropriate to the value type.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { created_date: "2023-01-15 10:30:00", amount: 100 },
  { created_date: "2023-02-20 14:15:00", amount: 200 },
  { created_date: "2023-03-25 09:45:00", amount: 300 },
]);

// mutate operates on individual values — no Series/element confusion
const result = df.mutate({
  date_only: (r) => r.created_date.split(" ")[0],
});

// The date column is string — numeric ops are caught
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("created_date"));

result.print();
