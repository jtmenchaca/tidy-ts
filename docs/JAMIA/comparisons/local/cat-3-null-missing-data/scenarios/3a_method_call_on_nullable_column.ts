/**
 * ID: 3a
 * Category: Missing value
 * Label: method call on nullable column
 * Intent: Format a nullable lab reference range to two decimal places.
 */
import * as aq from "arquero";
import { labs05 } from "../data.ts";
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
labs = pd.DataFrame({
    "patient_id": ["P001", "P002"],
    "result_value": [100, 200],
    "reference_high": [120, None],
})
labs["label"] = labs["reference_high"].apply(lambda x: f"{x:.1f}" if pd.notna(x) else x)
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
labs <- tibble(
  patient_id = c("P001", "P002"),
  result_value = c(100, 200),
  reference_high = c(120, NA)
)
labs <- labs %>% mutate(label = sprintf("%.1f", reference_high))
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
labs = pl.DataFrame({
    "patient_id": ["P001", "P002"],
    "result_value": [100, 200],
    "reference_high": [120, None],
})
labs = labs.with_columns(
    pl.col("reference_high").map_elements(
        lambda x: f"{x:.1f}" if x is not None else x, return_dtype=pl.Utf8
    ).alias("label")
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
        patient_id: ["P001", "P002"],
        result_value: [100, 200],
        reference_high: [120, null],
      })
      .derive({ label: (d) => d.reference_high.toFixed(1) }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    labs05.mutate({
      // @ts-expect-error — 'r.reference_high' is possibly 'null'.
      label: (r) => r.reference_high.toFixed(1),
    }),
  (df) => `rows=${df.nrows()}`,
);
