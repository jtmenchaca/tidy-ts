import { readCSV, writeCSV } from "@tidy-ts/dataframe";
import { currentRuntime, readTextFile } from "@tidy-ts/shims";
import { z } from "zod";

// Get path relative to this file (works for both Deno and Bun)
const TEST_DIR = new URL(".", import.meta.url).pathname;

const componentIDSchema = z.object({
  NAME: z.string().nullable(),
  COMPONENT_ID: z.string().nullable(),
  ABBREVIATION: z.string().nullable(),
  EXTERNAL_NAME: z.string().nullable(),
  BASE_NAME: z.string().nullable(),
  COMPONENT_TYPE: z.string().nullable(),
  LAB_DATA_TYPE_C: z.string().nullable(),
  COMMON_NAME: z.string().nullable(),
  LOINC_CODE: z.string().nullable(),
  COMPONENT_SUBTYPE_C: z.string().nullable(),
  RECORD_STATE: z.string().nullable(),
  GROUP_TYPE_C: z.string().nullable(),
  DEFAULT_LOW: z.string().nullable(),
  DEFAULT_HIGH: z.string().nullable(),
  DFLT_UNITS: z.string().nullable(),
});

console.log(`Running CSV example test on ${currentRuntime}`);

// Read CSV file using shims for cross-runtime compatibility
const csvContent = await readTextFile(`${TEST_DIR}component_names.csv`);
const csv = await readCSV(csvContent, componentIDSchema);

const baseNames = csv.distinct("BASE_NAME").select("BASE_NAME");

// Write CSV directly to file
await writeCSV(baseNames, `${TEST_DIR}base_names.csv`);

console.log("✅ CSV operations completed successfully");
console.log(`Found ${baseNames.nrows()} distinct base names`);
baseNames.print();
