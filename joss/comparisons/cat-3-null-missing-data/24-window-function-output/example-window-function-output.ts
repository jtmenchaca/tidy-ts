/**
 * Error Class 24: Window Function Output Type
 *
 * Tidy-TS's lag()/lead() track output nullability:
 * - lag(values) → (T | undefined)[] — first elements are undefined
 * - lag(values, { defaultValue: 0 }) → T[] — no undefined
 * Python's shift() silently introduces NaN. R's lag() silently adds NA.
 */
import { stats as s } from "@tidy-ts/dataframe";

const values = [100, 200, 300, 400];

// lag without default → (number | undefined)[]
const lagged = s.lag(values);

// ── ERROR 24a: Arithmetic on lagged value ───────────────────────────────
// COMPILE ERROR: element is number | undefined — can't subtract
// @ts-expect-error: element is number | undefined — can't subtract
const diff = lagged.map((v, i) => v - values[i]);

// ── CORRECT: Provide defaultValue to narrow type ────────────────────────
const laggedDefault = s.lag(values, { defaultValue: 0 });
// laggedDefault is number[] — no undefined
const safeDiff = laggedDefault.map((v, i) => v - values[i]); // OK
