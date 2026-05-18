/**
 * RPython SO#22906804 — Matrix expression causes "requires numeric/complex matrix/vector arguments"
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In R, %*% on a data.frame crashes — requires as.matrix() first. Nothing enforces
 * this at compile time.
 *
 * In tidy-ts, DataFrame columns are typed arrays. You extract number[] columns
 * explicitly for numeric operations. There is no ambiguity between DataFrame and
 * matrix — they are different things and the type system separates them.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const da = createDataFrame([
  { v1: 0.46, v2: 2.36, v3: -1.54 },
  { v1: 0.25, v2: 1.52, v3: -0.59 },
  { v1: 0.82, v2: 1.50, v3: 0.34 },
]);

// @ts-expect-error — DataFrame is not a number[] — can't pass it where array expected
const wrong = s.mean(da);

// Extract typed arrays for numeric operations
const v1 = da.extract("v1"); // number[]
const v2 = da.extract("v2"); // number[]
console.log(s.mean(v1), s.mean(v2));
