/**
 * ID: 4b
 * Category: Join
 * Label: join on misspelled key
 * Intent: Left-join labs to encounters on a misspelled key.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { encounters03, patients03 } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
patients = pd.DataFrame({"patient_id": ["P001"], "name": ["Alice"]})
encounters = pd.DataFrame({
    "encounter_id": ["E001"],
    "patient_id": ["P001"],
    "department": ["ED"],
})
merged = patients.merge(encounters, on="patient_ID")
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
patients <- tibble(patient_id = c("P001"), name = c("Alice"))
encounters <- tibble(
  encounter_id = c("E001"),
  patient_id = c("P001"),
  department = c("ED")
)
merged <- patients %>% left_join(encounters, by = "patient_ID")
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
patients = pl.DataFrame({"patient_id": ["P001"], "name": ["Alice"]})
encounters = pl.DataFrame({
    "encounter_id": ["E001"],
    "patient_id": ["P001"],
    "department": ["ED"],
})
merged = patients.join(encounters, on="patient_ID")
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const patients = aq.table({ patient_id: ["P001"], name: ["Alice"] });
    const encounters = aq.table({
      encounter_id: ["E001"],
      patient_id: ["P001"],
      department: ["ED"],
    });
    // @ts-ignore — Arquero join predicate parameters are untyped
    return patients.join(encounters, (a, b) => a.patient_ID === b.patient_ID);
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — 'patient_ID' does not exist on either table
    patients03.leftJoin(encounters03, "patient_ID"),
  (df) => `rows=${df.nrows()}`,
);
