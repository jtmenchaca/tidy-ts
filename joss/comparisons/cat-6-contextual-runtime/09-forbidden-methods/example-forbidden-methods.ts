/**
 * Error Class 9: Forbidden Array Methods / API Escape
 *
 * Tidy-TS forbids raw array methods (map, push, reduce) on DataFrames
 * at compile time. This prevents escaping the typed pipeline.
 * Python allows direct mutation and .apply() with mixed types silently.
 * R allows $ access with typos (warning) and silent type coercion.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const patients = createDataFrame([
  { patient_id: "P001", name: "Alice", age: 30 },
]);

// ── ERROR 9a: .map() is forbidden ─────────────────────────────────────────
// COMPILE ERROR: Property 'map' does not exist on DataFrame
// @ts-expect-error: map is forbidden on DataFrame
patients.map((r: unknown) => r);

// ── ERROR 9b: .push() is forbidden ────────────────────────────────────────
// COMPILE ERROR: Property 'push' does not exist on DataFrame
// @ts-expect-error: push is forbidden on DataFrame
patients.push({ patient_id: "P002", name: "Bob", age: 45 });

// ── ERROR 9c: .reduce() is forbidden ──────────────────────────────────────
// COMPILE ERROR: Property 'reduce' does not exist on DataFrame
// @ts-expect-error: reduce is forbidden on DataFrame
patients.reduce((sum: number, _r: unknown) => sum, 0);
