/**
 * RPython SO#22137723 — Convert number strings with commas in pandas DataFrame to float
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, number strings with commas ("1,200") crash when converted to float.
 * The type system doesn't prevent attempting numeric operations on strings.
 *
 * In tidy-ts, the column is typed as string. You must explicitly parse it,
 * and the parsing logic (removing commas) is visible in the code.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { amount: "1,200" },
  { amount: "4,200" },
  { amount: "7,000" },
  { amount: "-0.03" },
  { amount: "5" },
]);

// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.sum(df.extract("amount"));

// Fix: explicit parsing with comma removal
const numeric = df.mutate({
  amount: (r) => parseFloat(r.amount.replaceAll(",", "")),
});

console.log(s.sum(numeric.extract("amount"))); // 12399.97
