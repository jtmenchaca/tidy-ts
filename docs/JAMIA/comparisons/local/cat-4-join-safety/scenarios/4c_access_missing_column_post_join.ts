/**
 * ID: 4c
 * Category: Join
 * Label: access missing column post-join
 * Intent: Left-join labs to encounters, then access a column expected to be present.
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
joined = patients.merge(encounters, on="patient_id")
val = joined["prescription_id"]
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
joined <- patients %>% left_join(encounters, by = "patient_id")
joined <- joined %>% mutate(rx = prescription_id)
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
joined = patients.join(encounters, on="patient_id")
val = joined["prescription_id"]
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
    const joined = patients.join(encounters, ["patient_id", "patient_id"]);
    return joined.select("prescription_id");
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const joined03 = patients03.leftJoin(encounters03, "patient_id");
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — 'prescription_id' not in joined schema
    joined03.mutate({ note: (r) => r.prescription_id }),
  (df) => `rows=${df.nrows()}`,
);
