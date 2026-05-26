/**
 * ID: 2m
 * Category: Value type
 * Label: pre-transpose column name after transpose
 * Intent: Transpose a wide patient table, then access a pre-transpose column name on the result.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { vitals } from "../data.ts";

const transposed = vitals.transpose({ numberOfRows: 2 });

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
vitals = pd.DataFrame({
    "metric": ["systolic", "diastolic"],
    "P001": [120, 80],
    "P002": [145, 92],
})
transposed = vitals.T
transposed.columns = ["row_0", "row_1"]
_ = transposed["P001"]
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
vitals <- tibble(
  metric = c("systolic", "diastolic"),
  P001 = c(120, 80),
  P002 = c(145, 92)
)
transposed <- t(vitals)
val <- transposed[, "P001"]
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
vitals = pl.DataFrame({
    "metric": ["systolic", "diastolic"],
    "P001": [120, 80],
    "P002": [145, 92],
})
transposed = vitals.transpose(include_header=True, header_name="patient", column_names="metric")
_ = transposed["P001"]
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const folded = aq
      .table({
        metric: ["systolic", "diastolic"],
        P001: [120, 80],
        P002: [145, 92],
      })
      .fold(["P001", "P002"], { as: ["patient", "value"] });
    const wide = folded.pivot("metric", { value: aq.op.any("value") });
    return wide.select("P001");
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — Property 'P001' does not exist on type '{ __tidy_row_label__: "metric" | "P001" | "P002"; __tidy_row_types__: { metric: string; P001: number; P002: number; }; row_0: string | number; row_1: string | number; }'.
    transposed.mutate({ x: (r) => r.P001 }),
  (df) => `rows=${df.nrows()}`,
);
