/**
 * ID: 2k
 * Category: Value type
 * Label: numeric function applied to string column
 * Intent: Compute `Math.log(insurance_carrier)` on an insurance-type string column.
 */
import * as aq from "arquero";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { patients } from "../data.ts";

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
patients = pd.DataFrame({
    "name": ["Alice", "Bob"],
    "age": [30, 45],
    "weight": [65.5, 80.0],
    "insurance": ["Medicare", "Medicaid"],
})
result = patients[["age", "insurance"]].apply(lambda x: x * 2)
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
patients <- tibble(
  name = c("Alice", "Bob"),
  age = c(30, 45),
  weight = c(65.5, 80.0),
  insurance = c("Medicare", "Medicaid")
)
patients %>% mutate(across(c(age, insurance), log))
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
patients = pl.DataFrame({
    "name": ["Alice", "Bob"],
    "age": [30, 45],
    "weight": [65.5, 80.0],
    "insurance": ["Medicare", "Medicaid"],
})
result = patients.select(
    (pl.col("age") * 2).alias("age"),
    (pl.col("insurance") * 2).alias("insurance"),
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
        name: ["Alice", "Bob"],
        age: [30, 45],
        weight: [65.5, 80.0],
        insurance: ["Medicare", "Medicaid"],
      })
      .select("age", "insurance")
      .derive({
        age: (d) => d.age * 2,
        insurance: (d) => d.insurance * 2,
      }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    patients.mutate({
      // @ts-expect-error — Argument of type 'string' is not assignable to parameter of type 'number'.
      log_ins: (r) => Math.log(r.insurance),
    }),
  (df) => `rows=${df.nrows()}`,
);
