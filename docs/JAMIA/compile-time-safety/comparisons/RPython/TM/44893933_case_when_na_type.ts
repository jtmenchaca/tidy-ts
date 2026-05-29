/**
 * ID: SO#44893933
 * Language: R
 * Bug class: Nullable
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: bare NA is logical type; case_when crashes on type mismatch across branches
 */
import { createDataFrame } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(dplyr)

df <- data.frame(old = 1:3)

df <- df %>% dplyr::mutate(new = dplyr::case_when(old == 1 ~ 5,
                                                  old == 2 ~ NA,
                                                  TRUE ~ old))
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { old: 1 },
  { old: 2 },
  { old: 3 },
]);

const result = df.mutate({
  new: (r) => {
    if (r.old === 1) return 5;
    if (r.old === 2) return null;
    return r.old;
  },
});

// @ts-expect-error — Argument of type 'number | null' is not assignable to parameter of type 'number'
result.mutate({ doubled: (r) => Math.round(r.new) });
