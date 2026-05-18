/**
 * RPython SO#29643820 — How to change type of target column when doing := by group
 * Effect: Crash
 * Bug class: Int/double distinction
 *
 * In R data.table, assigning mean() (double) to an integer column crashes because
 * "Type of RHS ('double') must match LHS ('integer')".
 *
 * In tidy-ts, all numbers are `number` — no int/double distinction.
 * The type system still catches passing non-numeric columns to mean.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const db = createDataFrame([
  { id: "1", x: 1, y: 0.47 },
  { id: "1", x: 2, y: 0.03 },
  { id: "1", x: 3, y: 0.57 },
  { id: "2", x: 6, y: 0.83 },
  { id: "2", x: 7, y: 0.11 },
  { id: "2", x: 8, y: 0.23 },
]);

// Assigning mean (a number) to x (a number) — no type conflict
const result = db.groupBy("id").summarize({
  x: (g) => s.mean(g.extract("y")),
});

// Passing string column to mean is caught
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(db.extract("id"));

result.print();
