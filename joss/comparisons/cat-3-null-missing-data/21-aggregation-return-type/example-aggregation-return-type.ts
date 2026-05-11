/**
 * Error Class 21: Aggregation Return Type Narrowing
 *
 * Tidy-TS aggregation functions track nullability through overloads:
 * - s.sum(nullable[]) → number | null
 * - s.sum(nullable[], { removeNull: true }) → number
 * Python silently skips NaN. R silently returns NA.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const labs = createDataFrame([
  { id: "P1", value: 100 as number | null },
  { id: "P2", value: null },
]);

const values = labs.toArray().map((r) => r.value);

// s.sum on nullable returns number | null
const total = s.sum(values);

// ── ERROR 21a: Arithmetic on nullable aggregation result ────────────────
// COMPILE ERROR: total is number | null
// @ts-expect-error: total is number | null — can't divide
const avg = total / 2;

// ── CORRECT: Use removeNull to narrow return type ───────────────────────
const safeTotal = s.sum(values, { removeNull: true }); // returns number
const safeAvg = safeTotal / 2; // OK
