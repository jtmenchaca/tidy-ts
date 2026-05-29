/**
 * ID: 5f
 * Category: Schema composition
 * Label: implicit type coercion when binding rows with different column types
 * Intent: Combine two prescription tables where one has numeric doses and the other has string doses ('sliding scale'); then format dose to two decimals.
 */
import * as aq from "arquero";
import { numericDoses, textDoses } from "../data.ts";
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
numeric_doses = pd.DataFrame({"drug": ["Aspirin", "Lisinopril"], "dose": [325, 10]})
text_doses = pd.DataFrame({"drug": ["Insulin", "Warfarin"], "dose": ["sliding scale", "per INR"]})
combined_doses = pd.concat([numeric_doses, text_doses], ignore_index=True)
combined_doses["formatted"] = combined_doses["dose"].apply(lambda x: f"{float(x):.2f}" if isinstance(x, (int, float)) else x)
`;
printForeignResult("pandas", runForeign("python", pandasScript));

// tidyverse ────────────────────────────────────────────────────────────────
const rScript = `
suppressPackageStartupMessages(library(dplyr))
numeric_doses <- tibble(drug = c("Aspirin"), dose = c(325))
text_doses <- tibble(drug = c("Insulin"), dose = c("sliding scale"))
bind_rows(numeric_doses, text_doses)
`;
printForeignResult("tidyverse", runForeign("r", rScript));

// Polars ────────────────────────────────────────────────────────────────────
const polarsScript = `
import polars as pl
numeric_doses = pl.DataFrame({"drug": ["Aspirin", "Lisinopril"], "dose": [325, 10]})
text_doses = pl.DataFrame({"drug": ["Insulin", "Warfarin"], "dose": ["sliding scale", "per INR"]})
combined_doses = pl.concat([numeric_doses, text_doses], how="diagonal")
dtype = str(combined_doses["dose"].dtype)
`;
printForeignResult("Polars", runForeign("python", polarsScript));

// mypy / pyright ────────────────────────────────────────────────────────────
printStaticCheckerResult("mypy", runStaticChecker("mypy", pandasScript));
printStaticCheckerResult("pyright", runStaticChecker("pyright", pandasScript));

// Arquero ────────────────────────────────────────────────────────────────────
runInProcess(
  "Arquero",
  () => {
    const numeric = aq.table({
      drug: ["Aspirin", "Lisinopril"],
      dose: [325, 10],
    });
    const text = aq.table({
      drug: ["Insulin", "Warfarin"],
      dose: ["sliding scale", "per INR"],
    });
    return numeric.concat(text);
  },
  (table) => `rows=${table.numRows()}`,
);

// Tidy-TS ────────────────────────────────────────────────────────────────────
const combinedF = numericDoses.bindRows(textDoses);
runInProcess(
  "Tidy-TS",
  () =>
    // @ts-expect-error — Property 'toFixed' does not exist on type 'string | number'.
    combinedF.mutate({ formatted: (r) => r.dose.toFixed(2) }),
  (df) => `rows=${df.nrows()}`,
);
