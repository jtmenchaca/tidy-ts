/**
 * Error Class 34: Enum/Categorical Validation (Runtime)
 *
 * Tidy-TS uses Zod's z.enum() to validate categorical values at data
 * ingestion. If a CSV row contains a value not in the allowed set,
 * the row is rejected immediately with a clear error.
 *
 * Python reads any string value without validation. R's factors
 * accept any level unless explicitly constrained, and unknown levels
 * become NA with a warning.
 */
import { readCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

const Schema = z.object({
  patient_id: z.string(),
  sex: z.enum(["M", "F"]),                        // only M or F
  insurance: z.enum(["Medicare", "Medicaid", "Commercial", "Self-Pay"]),
});

// RUNTIME ERROR if CSV contains sex="X" or insurance="Unknown"
// → Row 5 validation failed: Expected 'M' | 'F', received 'X'
