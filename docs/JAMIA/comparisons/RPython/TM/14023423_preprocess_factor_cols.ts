/**
 * RPython SO#14023423 — How to preProcess features when some of them are factors?
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In R, caret::preProcess("center", "scale") crashes on factor columns because
 * it requires all numeric input but doesn't enforce this at compile time.
 *
 * In tidy-ts, statistical functions like s.mean() or s.sd() require number[].
 * Passing a string column is a compile-time error.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const passengers = createDataFrame([
  { pclass: "1st", survived: 1, age: 29, sex: "female" },
  { pclass: "2nd", survived: 0, age: 35, sex: "male" },
  { pclass: "3rd", survived: 0, age: 22, sex: "male" },
]);

// @ts-expect-error — string[] is not assignable to number[]
const wrongMean = s.mean(passengers.extract("pclass"));

// Only numeric columns can be centered/scaled
const ageMean = s.mean(passengers.extract("age"));
console.log({ ageMean });
