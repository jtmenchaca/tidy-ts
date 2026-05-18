/**
 * ID: SO#45769987
 * Language: R
 * Bug class: Column ref
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Duplicate column names cause dplyr spread/join errors. Schema validation at column level.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(dplyr)
library(tidyr)

dt <- data.frame(
  hid = c(1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4),
  syear = c(2000, 2001, 2003, 2003, 2003, 2000, 2000, 2001, 2001, 2002, 2002),
  employlvl = c(
    "Full-time", "Part-time", "Part-time", "Unemployed", "Unemployed",
    "Full-time", "Full-time", "Full-time", "Unemployed", "Part-time",
    "Full-time"
  ),
  relhead = c(
    "Head", "Head", "Employment Partner", "Partner", "other", "Head",
    "Partner", "Head", "Partner", "Head", "Partner"
  )
)

dt2 <- dt %>%
  group_by(hid, syear) %>%
  filter(n() > 1) %>%
  filter(relhead != "Child") %>%
  spread(relhead, employlvl) %>%
  mutate(Relation = "Head") %>%
  rename(\`Employment Partner\` = Partner) %>%
  select(-Head)
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const dt = createDataFrame([
  { hid: 1, syear: 2000, employlvl: "Full-time", relhead: "Head" },
  { hid: 2, syear: 2001, employlvl: "Part-time", relhead: "Head" },
  { hid: 2, syear: 2003, employlvl: "Part-time", relhead: "Employment Partner" },
]);

const wide = dt.pivotWider({
  namesFrom: "relhead",
  valuesFrom: "employlvl",
  expectedColumns: ["Head", "Employment Partner"],
});

// @ts-expect-error — Argument of type '(string | undefined)[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.mean(wide.extract("Head"));
