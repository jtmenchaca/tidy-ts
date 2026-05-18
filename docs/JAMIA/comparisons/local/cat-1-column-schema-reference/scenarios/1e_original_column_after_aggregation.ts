/**
 * ID: 1e
 * Category: Column reference
 * Label: original column referenced after aggregation
 * Intent: Group encounters by patient, summarize counts, then re-reference an original encounter column.
 * Severity: Low
 * Severity criteria: AV=Y PS=Y PO=N OI=Y
 * Rationale: After summarize, the original column no longer exists — accessing it yields undefined for every summary row. All three error.
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
encounters = pd.DataFrame({
    "encounter_id": ["E001", "E002"],
    "patient_id": ["P001", "P001"],
    "department": ["ED", "ICU"],
    "encounter_type": ["Inpatient", "Inpatient"],
})
summary = encounters.groupby("department").size().reset_index(name="count")
inpatient = summary[summary["encounter_type"] == "Inpatient"]
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
encounters <- tibble(
  encounter_id = c("E001", "E002"),
  patient_id = c("P001", "P001"),
  department = c("ED", "ICU"),
  encounter_type = c("Inpatient", "Inpatient")
)
summary <- encounters %>% group_by(department) %>% summarise(count = n())
inpatient <- summary %>% filter(encounter_type == "Inpatient")
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
encounters = pl.DataFrame({
    "encounter_id": ["E001", "E002"],
    "patient_id": ["P001", "P001"],
    "department": ["ED", "ICU"],
    "encounter_type": ["Inpatient", "Inpatient"],
})
summary = encounters.group_by("department").agg(pl.len().alias("count"))
inpatient = summary.filter(pl.col("encounter_type") == "Inpatient")
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
        encounter_id: ["E001", "E002"],
        patient_id: ["P001", "P001"],
        department: ["ED", "ICU"],
        encounter_type: ["Inpatient", "Inpatient"],
      })
      .groupby("department")
      .count()
      .filter((d) => d.encounter_type === "Inpatient"),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const encounters = createDataFrame([
  { encounter_id: "E001", patient_id: "P001", department: "ED", encounter_type: "Inpatient" },
  { encounter_id: "E002", patient_id: "P001", department: "ICU", encounter_type: "Inpatient" },
]);
const summary = encounters.groupBy("department").summarize({
  count: (g) => g.nrows(),
});
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — encounter_type gone after summarize
    summary.filter((r) => r.encounter_type === "Inpatient"),
  (df) => `rows=${df.nrows()}`,
);
