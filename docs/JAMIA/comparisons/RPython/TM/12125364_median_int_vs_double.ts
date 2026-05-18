/**
 * RPython SO#12125364 — Why does median trip up data.table (integer vs double)?
 * Effect: Crash
 * Bug class: Int/double distinction
 *
 * In R data.table, median() returns integer for odd-length groups and double for
 * even-length groups. data.table requires consistent types across groups, causing
 * a crash.
 *
 * In JavaScript, there is no int/double distinction — all numbers are `number`.
 * This class of bug does not exist. The type system still catches unrelated
 * misuse (e.g., passing a string column to s.median()).
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const data = createDataFrame([
  { day: "Mon", n: 3 },
  { day: "Mon", n: 5 },
  { day: "Mon", n: 2 },
  { day: "Tue", n: 7 },
  { day: "Tue", n: 4 },
  { day: "Wed", n: 6 },
  { day: "Wed", n: 1 },
  { day: "Wed", n: 8 },
]);

// s.median() returns number regardless of group size — no int/double conflict
const result = data.groupBy("day").summarize({
  patient_encounters: (g) => s.median(g.extract("n")),
});

// Passing a string column to median is still caught
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.median(data.extract("day"));

result.print();
