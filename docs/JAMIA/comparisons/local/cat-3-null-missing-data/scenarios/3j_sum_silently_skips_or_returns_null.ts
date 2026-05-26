/**
 * ID: 3j
 * Category: Missing value
 * Label: sum silently skips or returns null
 * Intent: Sum a nullable column and use the total directly.
 */
import * as aq from "arquero";
import { stats as s } from "@tidy-ts/dataframe";
import { labs21 } from "../data.ts";
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
import numpy as np
values = pd.Series([1250, np.nan, 450])
total = values.sum()
per_patient = total / 2
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
values <- c(1250, NA, 450)
total <- sum(values)
per_patient <- total / 2
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
values = pl.Series([1250, None, 450])
total = values.sum()
per_patient = total / 2
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const agg = aq.table({ val: [1250, null, 450] }).rollup({
      total: aq.op.sum("val"),
    });
    const total = agg.get("total", 0) as number;
    return total / 2;
  },
  (perPatient) => `per_patient=${perPatient}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const totals21 = labs21.groupBy("patient_id").summarize({
  total: (g) => s.sum(g.result_value),
});
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
    totals21.mutate({ per_patient: (r) => r.total / 2 }),
  (df) => `rows=${df.nrows()}`,
);
