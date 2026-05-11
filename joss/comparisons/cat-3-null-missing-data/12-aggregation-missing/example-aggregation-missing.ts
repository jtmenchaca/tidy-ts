/**
 * Error Class 12: Aggregation on Columns with Missing Data
 *
 * R's mean() silently returns NA when NAs are present. Python's mean()
 * silently skips NaN. Tidy-TS's s.mean() accepts nullable arrays but
 * returns number | null, propagating nullability through the pipeline.
 * The compiler then forces null handling downstream.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const labs = createDataFrame([
  { test: "BNP", value: 100, ref_high: 120 as number | null },
  { test: "WBC", value: 200, ref_high: null },
]);

// ── s.mean() on nullable column returns number | null ───────────────────
const result = labs.groupBy("test").summarize({
  avg: (g) => s.mean(g.ref_high), // returns number | null
});

// ── ERROR 12a: Can't do arithmetic on result — it's number | null ───────
// COMPILE ERROR: number | null can't be multiplied
// @ts-expect-error: number | null can't be multiplied
result.mutate({ doubled: (r) => r.avg * 2 });

// ── CORRECT: Handle nulls first, then aggregate ────────────────────────
const filled = labs.replaceNA({ ref_high: 0 });
const clean = filled.groupBy("test").summarize({
  avg: (g) => s.mean(g.ref_high), // returns number (not nullable)
});
clean.mutate({ doubled: (r) => r.avg * 2 }); // OK
