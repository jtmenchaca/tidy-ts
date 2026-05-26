/**
 * ID: 1h
 * Category: Column reference
 * Label: pre-aggregation column referenced after summarize
 * Intent: Group labs by patient and summarize mean value, then access an original lab column on the summarized result.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { encounters } from "../data.ts";

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
summary["eid"] = summary["encounter_id"]
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
summary <- summary %>% mutate(eid = encounter_id)
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
summary = summary.with_columns(pl.col("encounter_id").alias("eid"))
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
      .rollup({ count: aq.op.count() })
      .derive({ eid: (d) => d.encounter_id }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const summaryH = encounters.groupBy("department").summarize({
  count: (g) => g.nrows(),
});
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — encounter_id gone after summarize
    summaryH.mutate({ eid: (r) => r.encounter_id }),
  (df) => `rows=${df.nrows()}`,
);
