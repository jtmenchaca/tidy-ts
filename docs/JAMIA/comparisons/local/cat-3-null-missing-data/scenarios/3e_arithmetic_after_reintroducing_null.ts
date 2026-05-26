/**
 * ID: 3e
 * Category: Missing value
 * Label: arithmetic after re-introducing null
 * Intent: Replace nulls in the reference range with a fallback, mutate to re-introduce nulls under a condition, then compute a ratio.
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
import numpy as np
labs = pd.DataFrame({
    "lab_id": ["L1", "L2"],
    "result_value": [100, 200],
    "reference_high": [120, None],
})
filled = labs.copy()
filled["reference_high"] = filled["reference_high"].fillna(999)
filled.loc[filled["result_value"] > 150, "reference_high"] = np.nan
filled["pct"] = filled["result_value"] / filled["reference_high"]
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
filled <- labs %>% mutate(reference_high = replace_na(reference_high, 999))
filled$reference_high[filled$result_value > 150] <- NA
filled <- filled %>% mutate(pct = result_value / reference_high)
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
filled = labs.with_columns(pl.col("reference_high").fill_null(999))
filled = filled.with_columns(
    pl.when(pl.col("result_value") > 150)
    .then(None)
    .otherwise(pl.col("reference_high"))
    .alias("reference_high")
)
filled = filled.with_columns((pl.col("result_value") / pl.col("reference_high")).alias("pct"))
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const filled = aq
      .table({
        lab_id: ["L1", "L2"],
        result_value: [100, 200],
        reference_high: [120, null],
      })
      .derive({
        reference_high: (d) =>
          d.reference_high == null ? 999 : d.reference_high,
      });
    const reNulled = filled.derive({
      reference_high: (d) => (d.result_value > 150 ? null : d.reference_high),
    });
    return reNulled.derive({
      pct: (d) => d.result_value / d.reference_high,
    });
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const filled11 = labs11.replaceNull({ reference_high: 999 });
const refilled11 = filled11.mutate({
  reference_high: (r) => (r.reference_high > 500 ? null : r.reference_high),
});
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
    refilled11.mutate({ pct: (r) => r.result_value / r.reference_high }),
  (df) => `rows=${df.nrows()}`,
);
