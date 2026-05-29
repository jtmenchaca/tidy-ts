/**
 * ID: 1b
 * Category: Column reference
 * Label: nonexistent column in predicate
 * Intent: Select encounters where admission status equals a specific value.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { patients } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
patients = pd.DataFrame({
    "patient_id": ["P001"],
    "first_name": ["Alice"],
    "last_name": ["Smith"],
})
filtered = patients[patients["diagnosis"] == "I50.9"]
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
filtered <- patients %>% filter(diagnosis == "I50.9")
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
filtered = patients.filter(pl.col("diagnosis") == "I50.9")
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
      .filter((d) => d.diagnosis === "I50.9"),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — 'diagnosis' is not a column on this DataFrame
    patients.filter((r) => r.diagnosis === "I50.9"),
  (df) => `rows=${df.nrows()}`,
);
