/**
 * ID: 1o
 * Category: Column reference
 * Label: error message on invalid column access
 * Intent: Use an invalid column name in a select and read the error message.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { patientsMsg } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
patients = pd.DataFrame({
    "patient_id": ["P001"],
    "first_name": ["Alice"],
    "last_name": ["Smith"],
})
subset = patients[["patientId"]]
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
patients <- tibble(
  patient_id = c("P001"),
  first_name = c("Alice"),
  last_name = c("Smith")
)
subset <- patients %>% select(patientId)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
patients = pl.DataFrame({
    "patient_id": ["P001"],
    "first_name": ["Alice"],
    "last_name": ["Smith"],
})
subset = patients.select("patientId")
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
        patient_id: ["P001"],
        first_name: ["Alice"],
        last_name: ["Smith"],
      })
      .select("patientId"),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — patientId is not a valid column name
    patientsMsg.select("patientId"),
  (df) => `rows=${df.nrows()}`,
);
