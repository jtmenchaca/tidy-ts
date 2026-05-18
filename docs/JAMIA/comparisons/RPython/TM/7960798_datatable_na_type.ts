/**
 * RPython SO#7960798 — data.table by: NA type inconsistent across groups
 * Effect: Crash
 * Bug class: Nullable type
 *
 * R bug: foo2 returns 1 (numeric) for group A but bare NA (logical) for group B.
 * data.table crashes: "columns of j don't evaluate to consistent types for each group:
 * result for group 2 has column 1 type 'logical' but expecting type 'numeric'".
 * Fix: use NA_real_ instead of bare NA.
 *
 * In tidy-ts, summarize that returns number | null across groups produces a
 * (number | null) column. Downstream numeric ops that require number[] reject it,
 * forcing the user to handle null explicitly — the same fix as using NA_real_ in R.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const DT = createDataFrame([
  { id: "A", value: 1 },
  { id: "A", value: 2 },
  { id: "A", value: 3 },
  { id: "A", value: 4 },
  { id: "A", value: 5 },
  { id: "B", value: 6 },
  { id: "B", value: 7 },
  { id: "B", value: 8 },
  { id: "B", value: 9 },
  { id: "B", value: 10 },
]);

// Equivalent of R's foo2: returns numeric for one group, null (≈ bare NA) for another
const grouped = DT.groupBy("id").summarize({
  foo: (g) => {
    const m = s.mean(g.extract("value"));
    return m < 5 ? 1 : null;
  },
});

// grouped.foo is (number | null) — same inconsistency as R's logical NA vs numeric.
// Downstream operation that requires strict number rejects the nullable value:
const result = grouped.mutate({
  // @ts-expect-error — Argument of type 'number | null' is not assignable to parameter of type 'number'
  doubled: (r) => Math.round(r.foo),
});
