/**
 * RPython SO#44893933 — Avoiding type conflicts with dplyr::case_when
 * Effect: Crash
 * Bug class: Nullable type
 *
 * R bug: case_when requires all branches to return the same type. Writing
 * `case_when(old == 2 ~ NA)` gives logical NA, while other branches return numeric.
 * This crashes: "must be type double, not logical." Fix: use NA_real_ explicitly.
 *
 * In tidy-ts, a conditional that returns null produces number | null. Downstream
 * operations requiring strict number (like Math.round) catch the nullable type.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { old: 1 },
  { old: 2 },
  { old: 3 },
]);

// The SO user's intent: case_when(old == 1 ~ 5, old == 2 ~ NA, TRUE ~ old)
// R crashes because NA is logical, not numeric.
// tidy-ts equivalent: returning null from a branch makes the column number | null.
const result = df.mutate({
  new: (r) => {
    if (r.old === 1) return 5;
    if (r.old === 2) return null;
    return r.old;
  },
});

// result.new is number | null. Passing to Math.round (requires number) fails.
// @ts-expect-error — Argument of type 'number | null' is not assignable to parameter of type 'number'
result.mutate({ doubled: (r) => Math.round(r.new) });
