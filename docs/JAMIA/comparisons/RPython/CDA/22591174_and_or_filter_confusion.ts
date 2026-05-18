/**
 * RPython SO#22591174 — pandas: multiple conditions while indexing - unexpected behavior
 * Effect: IF (silent incorrect functionality)
 * Bug class: Operator overloading
 *
 * In pandas, boolean indexing with | and & on negated conditions confuses users.
 * df[(df.a != -1) | (df.b != -1)] keeps rows where EITHER is != -1, but users
 * expect it to drop rows where EITHER equals -1.
 *
 * In tidy-ts, filter() takes a predicate function using standard JS logical
 * operators (&&, ||). The semantics are "keep rows where predicate returns true."
 * There is no operator overloading confusion. The bug is structurally absent —
 * this is a language semantics issue, not a type issue. No @ts-expect-error
 * is applicable because the fix is clearer operator semantics, not type checking.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { a: 0, b: 0 },
  { a: -1, b: -1 },
  { a: 2, b: 2 },
  { a: -1, b: 3 },
  { a: 4, b: -1 },
]);

// "keep rows where a != -1 AND b != -1" — && means what you expect
const filtered = df.filter((r) => r.a !== -1 && r.b !== -1);
filtered.print();
