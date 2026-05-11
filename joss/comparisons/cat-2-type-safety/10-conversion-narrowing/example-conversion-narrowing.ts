/**
 * Error Class 10: Type Conversion and Narrowing
 *
 * Tidy-TS tracks types through conversions. A string column can't be
 * used in arithmetic. After parsing to number | null, the compiler
 * forces null handling before arithmetic.
 * Python silently coerces or raises ValueError at runtime.
 * R silently coerces with warnings.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const raw = createDataFrame([
  { lab_id: "L1", result_str: "1250" },
  { lab_id: "L2", result_str: "pending" },
]);

// ── ERROR 10a: Arithmetic on string column ──────────────────────────────
// COMPILE ERROR: result_str is string — can't multiply
// @ts-expect-error: string * number
raw.mutate({ doubled: (r) => r.result_str * 2 });

// ── Convert string → number | null ──────────────────────────────────────
const parsed = raw.mutate({
  result_num: (r) => {
    const n = Number(r.result_str);
    return isNaN(n) ? null : n;
  },
});

// ── ERROR 10b: Arithmetic on nullable column ────────────────────────────
// COMPILE ERROR: result_num is number | null — can't multiply without narrowing
// @ts-expect-error: number | null can't be multiplied
parsed.mutate({ doubled: (r) => r.result_num * 2 });

// ── CORRECT: Narrow before arithmetic ───────────────────────────────────
parsed.mutate({
  doubled: (r) => (r.result_num !== null ? r.result_num * 2 : null),
});
