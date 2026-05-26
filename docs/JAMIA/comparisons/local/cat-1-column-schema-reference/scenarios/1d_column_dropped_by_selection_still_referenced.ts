/**
 * ID: 1d
 * Category: Column reference
 * Label: column dropped by selection still referenced
 * Intent: Select a subset of columns from a wide patient table, then compute a derived value using one of the columns.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { encounters } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
encounters = pd.DataFrame({
    "encounter_id": ["E001"],
    "patient_id": ["P001"],
    "department": ["ED"],
    "attending_physician": ["Dr. Smith"],
    "encounter_type": ["Inpatient"],
})
slim = encounters[["encounter_id", "patient_id", "department"]]
slim["doc"] = slim["attending_physician"]
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
encounters <- tibble(
  encounter_id = c("E001"),
  patient_id = c("P001"),
  department = c("ED"),
  attending_physician = c("Dr. Smith"),
  encounter_type = c("Inpatient")
)
slim <- encounters %>% select(encounter_id, patient_id, department) %>%
  mutate(doc = attending_physician)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
encounters = pl.DataFrame({
    "encounter_id": ["E001"],
    "patient_id": ["P001"],
    "department": ["ED"],
    "attending_physician": ["Dr. Smith"],
    "encounter_type": ["Inpatient"],
})
slim = encounters.select("encounter_id", "patient_id", "department")
slim = slim.with_columns(pl.col("attending_physician").alias("doc"))
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () =>
    aq
      .table({
        encounter_id: ["E001"],
        patient_id: ["P001"],
        department: ["ED"],
        attending_physician: ["Dr. Smith"],
        encounter_type: ["Inpatient"],
      })
      .select("encounter_id", "patient_id", "department")
      .derive({ doc: (d) => d.attending_physician }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const slim = encounters.select("encounter_id", "patient_id", "department");
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — attending_physician was not selected
    slim.mutate({ doc: (r) => r.attending_physician }),
  (df) => `rows=${df.nrows()}`,
);
