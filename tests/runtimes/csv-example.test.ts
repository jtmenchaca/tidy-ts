import { readCSV, writeCSV } from "@tidy-ts/dataframe";
import { readTextFile, writeTextFile, currentRuntime, Runtime } from "@tidy-ts/shims";
import { z } from "zod";

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
const csvContent = await readTextFile("./component_names.csv");
const csv = await readCSV(csvContent, componentIDSchema);

const baseNames = csv.distinct("BASE_NAME").select("BASE_NAME");

// Write CSV using shims
const csvOutput = await writeCSV(baseNames);
await writeTextFile("./base_names.csv", csvOutput);

console.log("✅ CSV operations completed successfully");
console.log(`Found ${baseNames.nrows()} distinct base names`);
baseNames.print();
