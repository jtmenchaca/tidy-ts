/**
 * Error Class 6: Schema Validation at Data Boundaries
 *
 * Tidy-TS uses Zod schemas at CSV load to validate types, reject
 * non-numeric values in numeric columns, and enforce non-null constraints.
 * After loading, column types are known at compile time.
 *
 * Python silently infers types (strings in numeric columns → object dtype).
 * R warns on coercion but silently produces NA for empty cells.
 */
import { readCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

const LabSchema = z.object({
  lab_id: z.string(),
  patient_id: z.string(),
  test_name: z.string(),
  result_value: z.number(), // non-null — Zod rejects empty cells at parse time
  reference_high: z.number().nullable(), // nullable — empty cells become null
});

// RUNTIME: If a CSV row has "pending" in result_value, Zod throws immediately:
//   "Row 5 validation failed: Expected number, received string"
// Python: column silently becomes object dtype
// R: warning "NAs introduced by coercion", value becomes NA

// RUNTIME: If a CSV row has an empty result_value, Zod rejects it:
//   result_value is z.number() (non-null), so empty is not allowed
// Python: silently becomes NaN
// R: silently becomes NA

// After loading, columns are typed — compile-time safety for references:
async function example() {
  const labs = await readCSV("fixtures/lab_results.csv", LabSchema);

  // Compiler knows result_value is number (not number | null)
  labs.mutate({ doubled: (r) => r.result_value * 2 }); // OK

  // Compiler knows reference_high is number | null
  // @ts-expect-error: possibly null
  labs.mutate({ bad: (r) => r.reference_high * 2 });
}
