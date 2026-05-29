/**
 * ID: 4a
 * Category: Join
 * Label: join on key not in left table
 * Intent: Left-join labs to encounters on a key that does not exist on the left table.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { labs03, patients03 } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
patients = pd.DataFrame({"patient_id": ["P001"], "name": ["Alice"]})
labs = pd.DataFrame({
    "lab_id": ["L001"],
    "encounter_id": ["E001"],
    "patient_id": ["P001"],
    "result_value": [7.2],
})
merged = patients.merge(labs, on="encounter_id")
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
patients <- tibble(patient_id = c("P001"), name = c("Alice"))
labs <- tibble(
  lab_id = c("L001"),
  encounter_id = c("E001"),
  patient_id = c("P001"),
  result_value = c(7.2)
)
merged <- patients %>% left_join(labs, by = "encounter_id")
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
patients = pl.DataFrame({"patient_id": ["P001"], "name": ["Alice"]})
labs = pl.DataFrame({
    "lab_id": ["L001"],
    "encounter_id": ["E001"],
    "patient_id": ["P001"],
    "result_value": [7.2],
})
merged = patients.join(labs, on="encounter_id")
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
    const labs = aq.table({
      lab_id: ["L001"],
      encounter_id: ["E001"],
      patient_id: ["P001"],
      result_value: [7.2],
    });
    // @ts-ignore — Arquero join predicate parameters are untyped
    return patients.join(labs, (a, b) => a.encounter_id === b.encounter_id);
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — 'encounter_id' is not a key of patients03
    patients03.leftJoin(labs03, "encounter_id"),
  (df) => `rows=${df.nrows()}`,
);
