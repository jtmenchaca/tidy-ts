/**
 * ID: 2g
 * Category: Value type
 * Label: arithmetic on mixed-type return column
 * Intent: Multiply a column whose mutate returned `number | "HIGH"` by 2.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { mixedLabs } from "../data.ts";

const withStatus = mixedLabs.mutate({
  status: (r) => (r.value > 100 ? "HIGH" as const : r.value),
});

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
mixed_labs = pd.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "test_name": ["BNP", "WBC", "Glucose"],
    "result_value": [1250, 15.2, 210],
})
def classify(row):
    if row["result_value"] > 100:
        return "HIGH"
    return row["result_value"]
mixed_labs["status"] = mixed_labs.apply(classify, axis=1)
mixed_labs["doubled"] = mixed_labs["status"] * 2
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
mixed_labs <- tibble(
  patient_id = c("P001", "P002", "P003"),
  test_name = c("BNP", "WBC", "Glucose"),
  result_value = c(1250, 15.2, 210)
)
out <- mixed_labs %>% mutate(status = ifelse(result_value > 100, "HIGH", result_value))
out <- out %>% mutate(doubled = as.numeric(status) * 2)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
mixed_labs = pl.DataFrame({
    "patient_id": ["P001", "P002", "P003"],
    "test_name": ["BNP", "WBC", "Glucose"],
    "result_value": [1250.0, 15.2, 210.0],
})
with_status = mixed_labs.with_columns(
    pl.when(pl.col("result_value") > 100)
    .then(pl.lit("HIGH"))
    .otherwise(pl.col("result_value").cast(pl.Utf8))
    .alias("status")
)
doubled = with_status.with_columns((pl.col("status") + pl.col("status")).alias("doubled"))
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const withStatusAq = aq
      .table({
        patient_id: ["P001", "P002", "P003"],
        test_name: ["BNP", "WBC", "Glucose"],
        result_value: [1250, 15.2, 210],
      })
      .derive({
        status: (d) => (d.result_value > 100 ? "HIGH" : `${d.result_value}`),
      })
      .objects();
    return aq.from(withStatusAq).derive({ doubled: (d) => d.status + d.status });
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
    withStatus.mutate({ doubled: (r) => r.status * 2 }),
  (df) => `rows=${df.nrows()}`,
);
