/**
 * RPython SO#56079650 — Boolean column silently coerced to object dtype
 * Effect: DC (silent data corruption)
 * Bug class: Type coercion
 *
 * In pandas, constructing a DataFrame from row-wise Series [strings, booleans]
 * then transposing coerces the boolean column to object dtype. Bitwise NOT (~)
 * then returns integers (-2, -1) instead of booleans.
 *
 * In tidy-ts, transpose produces columns typed as the union of all row values.
 * The type system then rejects downstream boolean operations on that union column.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Same structure as the .py: one string column, one boolean column
const df = createDataFrame([
  { classification: "a", flag: true },
  { classification: "a", flag: true },
  { classification: "b", flag: false },
  { classification: "b", flag: false },
]);

// Transpose — just like pd.DataFrame(data=[a, b]).T
// After transpose, all columns become string | boolean (the union of row value types)
const transposed = df.transpose({ numberOfRows: 4 });

// Downstream: user extracts what was the boolean column and tries boolean aggregation.
// After transpose, columns are typed string | boolean — s.all() rejects this.
// @ts-expect-error — column is string | boolean, not boolean
s.all(transposed.extract("row_0"));
