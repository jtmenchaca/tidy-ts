/**
 * ID: 5h
 * Category: Schema composition
 * Label: appending row with missing column
 * Intent: Append a row to a patient table that omits one declared column.
 */
import * as aq from "arquero";
import { patients } from "../data.ts";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
patients = pd.DataFrame({"patient_id": ["P001"], "name": ["Alice"], "age": [30]})
new_row = pd.DataFrame({"patient_id": ["P002"], "name": ["Bob"]})
combined_patients = pd.concat([patients, new_row], ignore_index=True)
has_nan = bool(combined_patients["age"].isna().any())
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
patients <- tibble(patient_id = "P001", name = "Alice", age = 30)
new_row <- tibble(patient_id = "P002", name = "Bob")
combined <- bind_rows(patients, new_row)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
patients = pl.DataFrame({"patient_id": ["P001"], "name": ["Alice"], "age": [30]})
new_row = pl.DataFrame({"patient_id": ["P002"], "name": ["Bob"]})
combined_patients = pl.concat([patients, new_row], how="diagonal")
has_null = combined_patients["age"].null_count() > 0
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const patientsTable = aq.table({
      patient_id: ["P001"],
      name: ["Alice"],
      age: [30],
    });
    const newRow = aq.table({ patient_id: ["P002"], name: ["Bob"] });
    return patientsTable.concat(newRow);
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
  // @ts-expect-error — Argument of type '{ patient_id: string; name: string; }' is not assignable to parameter of type '{ patient_id: string; name: string; age: number; }'.
    patients.append({ patient_id: "P002", name: "Bob" }),
  (df) => `rows=${df.nrows()}`,
);
