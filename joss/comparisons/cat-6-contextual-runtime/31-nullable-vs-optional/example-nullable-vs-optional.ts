/**
 * Error Class 31: Nullable vs Optional Distinction (Runtime)
 *
 * Tidy-TS distinguishes between null (explicitly missing) and undefined
 * (structurally absent) at both compile time AND runtime. When reading
 * CSV data, z.nullable() fields produce null for empty cells, while
 * z.optional() fields produce undefined.
 *
 * Python collapses both to NaN. R collapses both to NA. Neither
 * distinguishes "this value was explicitly marked as missing" from
 * "this field doesn't exist in this record."
 */
import { readCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

const Schema = z.object({
  patient_id: z.string(),
  lab_value: z.number().nullable(),  // explicitly missing → null
  notes: z.string().optional(),      // structurally absent → undefined
});

// At runtime, Zod enforces:
// - Empty lab_value cell → null (not undefined)
// - Missing notes column → undefined (not null)
// - This distinction is preserved through all DataFrame operations
