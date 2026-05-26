/**
 * ID: 1n
 * Category: Column reference
 * Label: error message lists available columns
 * Intent: Access a misspelled column and read the error message.
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
patients["x"] = patients["patientId"]
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
patients <- patients %>% mutate(x = patientId)
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
patients = patients.with_columns(pl.col("patientId").alias("x"))
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
      .derive({ x: (d) => d.patientId }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    patientsMsg.mutate({
      // @ts-expect-error — patientId is not a column
      x: (r) => r.patientId,
    }),
  (df) => `rows=${df.nrows()}`,
);
