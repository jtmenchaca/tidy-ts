/**
 * ID: SO#7960798
 * Language: R
 * Bug class: Nullable
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: NA returns logical type instead of numeric across groups. NA type conflicts.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(data.table)

foo2 <- function(x) {
  if (mean(x) < 5) {
    return(1)
  } else {
    return(NA)
  }
}

DT <- data.table(ID = rep(c("A", "B"), each = 5), value = 1:10)
DT[, foo2(value), by = ID]
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const DT = createDataFrame([
  { id: "A", value: 1 },
  { id: "A", value: 2 },
  { id: "A", value: 3 },
  { id: "A", value: 4 },
  { id: "A", value: 5 },
  { id: "B", value: 6 },
  { id: "B", value: 7 },
  { id: "B", value: 8 },
  { id: "B", value: 9 },
  { id: "B", value: 10 },
]);

const grouped = DT.groupBy("id").summarize({
  foo: (g) => {
    const m = s.mean(g.extract("value"));
    return m < 5 ? 1 : null;
  },
});

// @ts-expect-error — Argument of type 'number | null' is not assignable to parameter of type 'number'
grouped.mutate({ doubled: (r) => Math.round(r.foo) });
