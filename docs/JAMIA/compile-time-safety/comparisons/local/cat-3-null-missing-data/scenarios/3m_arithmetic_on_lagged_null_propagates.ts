/**
 * ID: 3m
 * Category: Missing value
 * Label: arithmetic on lagged null propagates
 * Intent: Subtract each patient's prior visit lab value from the current visit.
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

// pandas ────────────────────────────────────────────────────────────────────
const pandasScript = `
import pandas as pd
values = pd.Series([100, 200, 300, 400])
lagged = values.shift(1)
diff = lagged - values
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
values <- c(100, 200, 300, 400)
lagged <- lag(values)
diff <- lagged - values
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
values = pl.Series([100, 200, 300, 400])
lagged = values.shift(1)
diff = lagged - values
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const withLag = aq.table({ val: [100, 200, 300, 400] }).derive({
      lagged: aq.op.lag("val", 1),
    });
    return withLag.derive({ diff: (d) => d.lagged - d.val });
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const values24m = [120, 130, 125, 140];
const lagged24m = s.lag(values24m);
runInProcess(
  "Tidy-TS",
  () => {
    // @ts-expect-error — 'v' is possibly 'undefined'.
    const _sum24 = lagged24m.map((v, i) => v + values24m[i]);
    return _sum24;
  },
  (sum) => `len=${sum.length}`,
);
