import { readCSV, writeCSV } from "@tidy-ts/dataframe";
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

const csv = await readCSV("./component_names.csv",
  componentIDSchema,
);

const baseNames = csv.distinct("BASE_NAME").select("BASE_NAME");

await writeCSV(baseNames, "./base_names.csv");

console.log(baseNames);
