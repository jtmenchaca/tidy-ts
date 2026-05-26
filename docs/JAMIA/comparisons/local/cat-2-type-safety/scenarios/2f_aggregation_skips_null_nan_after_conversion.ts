/**
 * ID: 2f
 * Category: Value type
 * Label: aggregation skips null/NaN after conversion
 * Intent: Compute the mean of a converted-to-numeric column.
 */
import * as aq from "arquero";
import { stats as s } from "@tidy-ts/dataframe";
import {
  printForeignResult,
  printStaticCheckerResult,
  runForeign,
  runInProcess,
  runStaticChecker,
} from "../../../runners.ts";
import { raw } from "../data.ts";

const parsed = raw.mutate({
  result_num: (r) => {
    const n = Number(r.result_str);
    return isNaN(n) ? null : n;
  },
});
const summary = parsed.groupBy("lab_id").summarize({
  avg: (g) => s.mean(g.result_num),
});

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
conv_labs = pd.DataFrame({
    "lab_id": ["L1", "L2", "L3"],
    "test_name": ["BNP", "pH", "WBC"],
    "result_str": ["1250", "7.28", "pending"],
})
conv_labs["result_num"] = pd.to_numeric(conv_labs["result_str"], errors="coerce")
avg = conv_labs["result_num"].mean()
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
conv_labs <- tibble(
  lab_id = c("L1", "L2", "L3"),
  test_name = c("BNP", "pH", "WBC"),
  result_str = c("1250", "7.28", "pending")
)
conv_labs <- conv_labs %>% mutate(result_num = suppressWarnings(as.numeric(result_str)))
avg <- mean(conv_labs$result_num)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
conv_labs = pl.DataFrame({
    "lab_id": ["L1", "L2", "L3"],
    "test_name": ["BNP", "pH", "WBC"],
    "result_str": ["1250", "7.28", "pending"],
})
with_num = conv_labs.with_columns(pl.col("result_str").cast(pl.Float64, strict=False).alias("result_num"))
avg = with_num["result_num"].mean()
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const withNum = aq
      .table({
        lab_id: ["L1", "L2", "L3"],
        test_name: ["BNP", "pH", "WBC"],
        result_str: ["1250", "7.28", "pending"],
      })
      .derive({ result_num: (d) => +d.result_str });
    return withNum.rollup({ avg: aq.op.mean("result_num") });
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — 'r.avg' is possibly 'null'.
    summary.mutate({ doubled: (r) => r.avg * 2 }),
  (df) => `rows=${df.nrows()}`,
);
