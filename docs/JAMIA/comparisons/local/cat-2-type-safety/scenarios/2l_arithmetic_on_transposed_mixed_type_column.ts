/**
 * ID: 2l
 * Category: Value type
 * Label: arithmetic on transposed mixed-type column
 * Intent: Transpose a wide vitals table, then multiply a transposed row by 2.
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
doubled = transposed["row_0"] * 2
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
doubled <- transposed[, 1] * 2
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
doubled = transposed.with_columns(pl.col("systolic") * 2)
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
    return wide.derive({ systolic: (d) => d.systolic * 2 });
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
    transposed.mutate({ doubled: (r) => r.row_0 * 2 }),
  (df) => `rows=${df.nrows()}`,
);
