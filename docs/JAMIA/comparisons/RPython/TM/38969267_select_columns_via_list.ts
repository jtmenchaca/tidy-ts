/**
 * RPython SO#38969267 — Selecting columns via a list of column names
 * Effect: Crash
 * Bug class: Implicit column selection
 *
 * In pandas, df[list] with a non-existent column name crashes at runtime.
 *
 * In tidy-ts, select() only accepts column names that exist on the row type.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { a: 1, b: 4, c: 7 },
  { a: 2, b: 5, c: 8 },
  { a: 3, b: 6, c: 9 },
]);

const columnList = ["a", "b", "missing_col"] as const;

// @ts-expect-error — "missing_col" is not a key of the row type
const wrong = df.select(...columnList);

const correct = df.select("a", "b");

correct.print();
