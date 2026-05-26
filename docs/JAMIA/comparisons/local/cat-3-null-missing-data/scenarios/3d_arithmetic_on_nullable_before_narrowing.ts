/**
 * ID: 3d
 * Category: Missing value
 * Label: arithmetic on nullable before narrowing
 * Intent: Compute the ratio of result value to upper reference range.
 */
import * as aq from "arquero";
import { labs11 } from "../data.ts";
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
    "lab_id": ["L1", "L2"],
    "result_value": [100, 200],
    "reference_high": [120, None],
})
labs["pct"] = labs["result_value"] / labs["reference_high"]
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
labs <- tibble(
  lab_id = c("L1", "L2"),
  result_value = c(100, 200),
  reference_high = c(120, NA)
)
labs <- labs %>% mutate(pct = result_value / reference_high)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
labs = pl.DataFrame({
    "lab_id": ["L1", "L2"],
    "result_value": [100, 200],
    "reference_high": [120, None],
})
labs = labs.with_columns((pl.col("result_value") / pl.col("reference_high")).alias("pct"))
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
        lab_id: ["L1", "L2"],
        result_value: [100, 200],
        reference_high: [120, null],
      })
      .derive({ pct: (d) => d.result_value / d.reference_high }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
    labs11.mutate({ pct: (r) => r.result_value / r.reference_high }),
  (df) => `rows=${df.nrows()}`,
);
