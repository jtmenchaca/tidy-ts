/**
 * ID: 5i
 * Category: Schema composition
 * Label: appending row with wrong column type
 * Intent: Append a row to a patient table where one column has the wrong type.
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
bad_row = pd.DataFrame({"patient_id": ["P003"], "name": ["Carol"], "age": ["thirty"]})
combined2 = pd.concat([patients, bad_row], ignore_index=True)
dtype = str(combined2["age"].dtype)
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
patients <- tibble(patient_id = "P001", name = "Alice", age = 30)
bad_row <- tibble(patient_id = "P003", name = "Carol", age = "thirty")
bind_rows(patients, bad_row)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
patients = pl.DataFrame({"patient_id": ["P001"], "name": ["Alice"], "age": [30]})
bad_row = pl.DataFrame({"patient_id": ["P003"], "name": ["Carol"], "age": ["thirty"]})
combined2 = pl.concat([patients, bad_row], how="diagonal")
dtype = str(combined2["age"].dtype)
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
    const badRow = aq.table({
      patient_id: ["P003"],
      name: ["Carol"],
      age: ["thirty"],
    });
    return patientsTable.concat(badRow);
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
  // @ts-expect-error — Type 'string' is not assignable to type 'number'.
    patients.append({ patient_id: "P003", name: "Carol", age: "thirty" }),
  (df) => `rows=${df.nrows()}`,
);
