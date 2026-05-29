/**
 * ID: 3o
 * Category: Missing value
 * Label: arithmetic on null from missing pivot combination
 * Intent: Pivot vitals to one column per metric, then compute systolic minus diastolic.
 */
import * as aq from "arquero";
import { vitals35 } from "../data.ts";
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
vitals = pd.DataFrame({
    "patient_id": ["P001", "P001", "P002"],
    "metric": ["systolic", "diastolic", "systolic"],
    "value": [130, 85, 145],
})
wide = vitals.pivot_table(index="patient_id", columns="metric", values="value")
wide["pp"] = wide["systolic"] - wide["diastolic"]
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
vitals <- tibble(
  patient_id = c("P001", "P001", "P002"),
  metric = c("systolic", "diastolic", "systolic"),
  value = c(130, 85, 145)
)
wide <- vitals %>% pivot_wider(names_from = metric, values_from = value)
wide <- wide %>% mutate(pp = systolic - diastolic)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
vitals = pl.DataFrame({
    "patient_id": ["P001", "P001", "P002"],
    "metric": ["systolic", "diastolic", "systolic"],
    "value": [130, 85, 145],
})
wide = vitals.pivot(on="metric", index="patient_id", values="value")
wide = wide.with_columns((pl.col("systolic") - pl.col("diastolic")).alias("pp"))
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const wide = aq
      .table({
        patient_id: ["P001", "P001", "P002"],
        metric: ["systolic", "diastolic", "systolic"],
        value: [130, 85, 145],
      })
      .pivot("metric", { value: aq.op.any("value") });
    return wide.derive({ pp: (d) => d.systolic - d.diastolic });
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const wide35 = vitals35.pivotWider({
  namesFrom: "metric",
  valuesFrom: "value",
  expectedColumns: ["systolic", "diastolic"] as const,
});
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
    wide35.mutate({ pp: (r) => r.systolic - r.diastolic }),
  (df) => `rows=${df.nrows()}`,
);
