/**
 * ID: SO#21714867
 * Language: R
 * Bug class: Nullable
 * Runtime consequence: DC
 * In study: Yes
 * Inclusion rationale: ifelse with NA_integer_ reinterprets double bits as integer; silent corruption
 */
import { createDataFrame } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(dplyr)

df <- data.frame(
  yearID = c(2004L, 2006L, 2007L, 2008L, 2012L),
  teamID = c("SFN", "CHN", "CHA", "BOS", "NYA"),
  G = c(11L, 43L, 2L, 5L, NA_integer_)
)

result <- df %>%
  mutate(G = ifelse(is.na(G), mean(G, na.rm = TRUE), G))

print(result)
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { yearId: 2004, teamId: "SFN", g: 11 },
  { yearId: 2006, teamId: "CHN", g: 43 },
  { yearId: 2007, teamId: "CHA", g: 2 },
  { yearId: 2008, teamId: "BOS", g: 5 },
  { yearId: 2012, teamId: "NYA", g: null as number | null },
]);

const filled = df.mutate({
  gFilled: (r) => (r.g !== null ? r.g : null),
});

// @ts-expect-error — Argument of type 'number | null' is not assignable to parameter of type 'number'.
filled.mutate({ rounded: (r) => Math.round(r.gFilled) });
