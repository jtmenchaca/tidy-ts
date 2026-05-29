/**
 * ID: 1f
 * Category: Column reference
 * Label: dropped column used in sort
 * Intent: Sort a wide patient table by a column after a prior step has dropped that column.
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
no_physician = encounters.drop(columns=["attending_physician"])
sorted_df = no_physician.sort_values("attending_physician")
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
sorted_df <- encounters %>% select(-attending_physician) %>%
  arrange(attending_physician)
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
no_physician = encounters.drop("attending_physician")
sorted_df = no_physician.sort("attending_physician")
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
      .select(aq.not("attending_physician"))
      .orderby("attending_physician"),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const noDoc = encounters.drop("attending_physician");
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — attending_physician was dropped
    noDoc.arrange("attending_physician", "asc"),
  (df) => `rows=${df.nrows()}`,
);
