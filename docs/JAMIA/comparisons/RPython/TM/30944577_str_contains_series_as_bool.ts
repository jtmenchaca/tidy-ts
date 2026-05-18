/**
 * RPython SO#30944577 — Check if string is in a pandas DataFrame
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, str.contains() returns a Series of booleans. Using it in an
 * if-statement crashes because a Series is not a scalar boolean.
 *
 * In tidy-ts, filter() takes a predicate that operates on individual rows
 * and returns boolean. There is no Series/scalar confusion — the predicate
 * always returns a single boolean per row.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { name: "Bob", births: 968 },
  { name: "Jessica", births: 155 },
  { name: "Mary", births: 77 },
  { name: "John", births: 578 },
  { name: "Mel", births: 973 },
]);

// filter predicate returns boolean per row — no ambiguity
const hasMel = df.filter((r) => r.name.includes("Mel"));
hasMel.print();

// Type system catches passing string column to numeric ops
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("name"));
