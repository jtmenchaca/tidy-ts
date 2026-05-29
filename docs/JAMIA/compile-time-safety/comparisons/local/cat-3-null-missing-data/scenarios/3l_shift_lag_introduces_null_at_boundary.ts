/**
 * ID: 3l
 * Category: Missing value
 * Label: shift/lag introduces null at boundary
 * Intent: Compute the prior visit's lab value for each row using `lag()`.
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
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
values <- c(100, 200, 300, 400)
lagged <- lag(values)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
values = pl.Series([100, 200, 300, 400])
lagged = values.shift(1)
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () =>
    aq.table({ val: [100, 200, 300, 400] }).derive({ lagged: aq.op.lag("val", 1) }),
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const values24 = [120, 130, 125, 140];
const lagged24 = s.lag(values24);
runInProcess(
  "Tidy-TS",
  () => {
    // @ts-expect-error — Object is possibly 'undefined'.
    const _diff24 = lagged24.map((v, i) => v - values24[i]);
    return _diff24;
  },
  (diff) => `len=${diff.length}`,
);
