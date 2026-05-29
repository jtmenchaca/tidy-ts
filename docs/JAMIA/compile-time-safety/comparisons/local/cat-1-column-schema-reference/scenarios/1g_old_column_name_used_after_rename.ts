/**
 * ID: 1g
 * Category: Column reference
 * Label: old column name used after rename
 * Intent: Rename a column, then use the new name in a downstream operation; the prior code still references the old name.
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
pipeline = encounters.rename(columns={"department": "dept"})
pipeline = pipeline[pipeline["department"] == "ICU"]
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
pipeline <- encounters %>% rename(dept = department) %>%
  filter(department == "ICU")
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
pipeline = encounters.rename({"department": "dept"})
pipeline = pipeline.filter(pl.col("department") == "ICU")
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
      .rename({ department: "dept" })
      .filter((d) => d.department === "ICU"),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const renamed = encounters.rename({ department: "dept" });
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — department was renamed to dept
    renamed.filter((r) => r.department === "ICU"),
  (df) => `rows=${df.nrows()}`,
);
