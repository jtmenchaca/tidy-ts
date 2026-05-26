/**
 * ID: 1m
 * Category: Column reference
 * Label: unselected column referenced after select
 * Intent: Project a wide patient table to a smaller set of columns, then reference an unselected column downstream.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { patientsReorder } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
patients = pd.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "age": [30],
    "insurance": ["Medicare"],
})
selected = patients[["name", "patient_id"]]
selected["a"] = selected["age"]
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
patients <- tibble(
  patient_id = "P001",
  name = "Alice",
  age = 30,
  insurance = "Medicare"
)
selected <- patients %>% select(name, patient_id) %>%
  mutate(a = age)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
patients = pl.DataFrame({
    "patient_id": ["P001"],
    "name": ["Alice"],
    "age": [30],
    "insurance": ["Medicare"],
})
selected = patients.select("name", "patient_id")
selected = selected.with_columns(pl.col("age").alias("a"))
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
        name: ["Alice"],
        age: [30],
        insurance: ["Medicare"],
      })
      .select("name", "patient_id")
      .derive({ a: (d) => d.age }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const selected = patientsReorder.select("name", "patient_id");
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — age was not selected
    selected.mutate({ a: (r) => r.age }),
  (df) => `rows=${df.nrows()}`,
);
