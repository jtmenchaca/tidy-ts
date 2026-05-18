/**
 * RPython SO#31521526 — Convert currency to float (and parentheses indicate negative amounts)
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, currency strings with parentheses "(3,000.00)" crash on
 * astype(float) because the format is not handled. The column is string
 * but the user treats it as numeric.
 *
 * In tidy-ts, the column is typed as string. Numeric operations are
 * rejected until the user explicitly parses the values.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { currency: "$1.00" },
  { currency: "$2,000.00" },
  { currency: "(3,000.00)" },
]);

// currency is string — numeric operations are rejected
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.sum(df.extract("currency"));

// Fix: explicit parse with format handling
const parsed = df.mutate({
  amount: (r) => {
    const clean = r.currency.replace(/[$,]/g, "");
    if (clean.startsWith("(") && clean.endsWith(")")) {
      return -parseFloat(clean.slice(1, -1));
    }
    return parseFloat(clean);
  },
});
console.log(s.sum(parsed.extract("amount")));
