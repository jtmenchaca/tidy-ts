/**
 * Error Class 13: Bind Rows Schema Mismatch
 *
 * Tidy-TS's bindRows() computes a merged type: shared columns stay
 * required, columns unique to one side become optional (T | undefined).
 * The compiler then prevents unsafe access on optional columns.
 * Python raises KeyError at runtime. R silently fills with NA.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const labsA = createDataFrame([
  { id: "P1", value: 100, site: "Main" },
]);

const labsB = createDataFrame([
  { id: "P2", value: 200, ref_range: "4-5" },
]);

const combined = labsA.bindRows(labsB);
// combined: { id: string; value: number; site: string | undefined; ref_range: string | undefined }

// ── ERROR 13a: Accessing column unique to right side without check ──────
// COMPILE ERROR: ref_range is string | undefined — can't call toUpperCase
// @ts-expect-error: ref_range is string | undefined — can't call toUpperCase
combined.mutate({ upper: (r) => r.ref_range.toUpperCase() });

// ── ERROR 13b: String op on column unique to left side without check ────
// COMPILE ERROR: site is string | undefined — can't call toUpperCase
// @ts-expect-error: site is string | undefined — can't call toUpperCase
combined.mutate({ upper: (r) => r.site.toUpperCase() });
