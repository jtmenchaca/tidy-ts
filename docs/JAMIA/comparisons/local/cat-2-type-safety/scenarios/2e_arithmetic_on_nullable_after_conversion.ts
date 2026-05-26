/**
 * ID: 2e
 * Category: Value type
 * Label: arithmetic on nullable after conversion
 * Intent: Multiply a converted-to-numeric column by 2 without narrowing nulls first.
 */
import * as aq from "arquero";
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

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
conv_labs = pd.DataFrame({
    "lab_id": ["L1", "L2", "L3"],
    "test_name": ["BNP", "pH", "WBC"],
    "result_str": ["1250", "7.28", "pending"],
})
conv_labs["result_num"] = pd.to_numeric(conv_labs["result_str"], errors="coerce")
conv_labs["doubled"] = conv_labs["result_num"] * 2
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
conv_labs <- conv_labs %>% mutate(doubled = result_num * 2)
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
doubled = with_num.with_columns((pl.col("result_num") * 2).alias("doubled"))
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
      .derive({ result_num: (d) => +d.result_str })
      .objects();
    return aq.from(withNum).derive({ doubled: (d) => d.result_num * 2 });
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — 'r.result_num' is possibly 'null'.
    parsed.mutate({ doubled: (r) => r.result_num * 2 }),
  (df) => `rows=${df.nrows()}`,
);
