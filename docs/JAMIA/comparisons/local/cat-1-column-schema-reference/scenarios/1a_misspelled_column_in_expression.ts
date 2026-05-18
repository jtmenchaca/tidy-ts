/**
 * ID: 1a
 * Category: Column reference
 * Label: misspelled column name in expression
 * Intent: Filter encounters to those at a specific facility.
 * Severity: Low
 * Severity criteria: AV=Y PS=Y PO=N OI=Y
 * Rationale: If undetected, every row gets `undefined` for the misspelled column — but the resulting all-undefined/NaN column is obviously implausible. All three ecosystems error at runtime.
 */
import * as aq from "arquero";
import { createDataFrame } from "@tidy-ts/dataframe";
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
patients = pd.DataFrame({
    "patient_id": ["P001"],
    "first_name": ["Alice"],
    "last_name": ["Smith"],
})
patients["full_name"] = patients["patientId"] + " " + patients["last_name"]
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
patients <- patients %>% mutate(full_name = paste(patientId, last_name))
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
patients = patients.with_columns(
    (pl.col("patientId") + " " + pl.col("last_name")).alias("full_name")
)
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
      .derive({ full_name: (d) => d.patientId + " " + d.last_name }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
// The `@ts-expect-error` is the compile-time catch (verified by `deno check`).
// We also wrap the runtime call in `runInProcess` to capture the second-line
// defense: tidy-ts's proxy throws at runtime when an undeclared column is
// accessed. Both signals are recorded.
const patients = createDataFrame([
  { patient_id: "P001", first_name: "Alice", last_name: "Smith" },
]);
runInProcess(
  "Tidy-TS",
  () =>
    patients.mutate({
      // @ts-expect-error — Property 'patientId' does not exist on type
      full_name: (r) => r.patientId + " " + r.last_name,
    }),
  (df) => `rows=${df.nrows()}`,
);
