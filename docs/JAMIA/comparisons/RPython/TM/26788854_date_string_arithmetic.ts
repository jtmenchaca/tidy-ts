/**
 * RPython SO#26788854 — Pandas get the age from a date (example: date of birth)
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, a date column stored as string "03011979" crashes when you
 * try to subtract it from datetime.now(). String - datetime is not valid.
 *
 * In tidy-ts, the column is typed as string. Arithmetic operations on
 * strings are caught at compile time.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { name: "DOE", dob: "03011979" },
  { name: "BOURNE", dob: "06111978" },
  { name: "GRINCH", dob: "12131988" },
]);

// dob is string — numeric operations are rejected
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("dob"));

// Fix: parse the date string explicitly
const parsed = df.mutate({
  birth_ms: (r) => {
    const m = r.dob.slice(0, 2);
    const d = r.dob.slice(2, 4);
    const y = r.dob.slice(4);
    return new Date(`${y}-${m}-${d}`).getTime();
  },
});
parsed.print();
