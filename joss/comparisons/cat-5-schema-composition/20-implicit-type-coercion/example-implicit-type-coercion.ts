/**
 * Error Class 20: Implicit Type Coercion in Row Binding
 *
 * When binding rows where the same column has different types,
 * Tidy-TS infers a union type and forces you to handle both cases.
 * Python silently coerces to object. R silently coerces to character.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const nums = createDataFrame([{ drug: "Aspirin", dose: 325 }]);
const strs = createDataFrame([{ drug: "Insulin", dose: "sliding scale" }]);

const combined = nums.bindRows(strs);
// dose is number | string

// ── ERROR 20a: Arithmetic on union type ─────────────────────────────────
// COMPILE ERROR: dose is number | string — can't multiply
// @ts-expect-error: dose is number | string — can't multiply
combined.mutate({ doubled: (r) => r.dose * 2 });

// ── CORRECT: Narrow the union first ─────────────────────────────────────
combined.mutate({
  display: (r) => (typeof r.dose === "number" ? `${r.dose}mg` : r.dose),
});
