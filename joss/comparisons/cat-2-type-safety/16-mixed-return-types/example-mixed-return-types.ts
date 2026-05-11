/**
 * Error Class 16: Return Type Consistency in Mutate
 *
 * When a mutate function returns different types depending on a condition,
 * TypeScript infers the union type. Downstream code must handle both.
 * Python/R silently coerce to object/character with no warning.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const labs = createDataFrame([
  { id: "P1", value: 1250 },
  { id: "P2", value: 15 },
]);

// status is inferred as string | number
const withStatus = labs.mutate({
  status: (r) => (r.value > 100 ? "HIGH" : r.value),
});

// ── ERROR 16a: Treating union as single type ────────────────────────────
// COMPILE ERROR: toUpperCase not available on string | number
// @ts-expect-error: toUpperCase not on string | number
withStatus.mutate({ upper: (r) => r.status.toUpperCase() });

// ── CORRECT: Narrow the union first ─────────────────────────────────────
withStatus.mutate({
  label: (r) =>
    typeof r.status === "string" ? r.status.toUpperCase() : `Val: ${r.status}`,
});
