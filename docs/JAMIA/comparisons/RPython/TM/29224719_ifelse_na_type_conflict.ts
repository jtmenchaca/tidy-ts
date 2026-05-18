/**
 * ID: SO#29224719
 * Language: R
 * Bug class: Nullable
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: All-NA group makes ifelse return logical instead of numeric; type conflict across groups
 */
import { createDataFrame } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(dplyr)

df1 <- data.frame(
  crawl.id = c(1, 1, 2, 1, 1, 1),
  group.id = factor(c("1", "2", "2", "3", "3", "3")),
  hits.diff = c(NA, NA, 0, NA, NA, NA)
)

result <- df1 %>%
  group_by(group.id) %>%
  mutate(hits.consumed = ifelse(hits.diff <= 0, -hits.diff, 0))
print(result)
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df1 = createDataFrame([
  { crawlId: 1, groupId: "1", hitsDiff: null as number | null },
  { crawlId: 1, groupId: "2", hitsDiff: null as number | null },
  { crawlId: 2, groupId: "2", hitsDiff: 0 },
  { crawlId: 1, groupId: "3", hitsDiff: null as number | null },
  { crawlId: 1, groupId: "3", hitsDiff: null as number | null },
  { crawlId: 1, groupId: "3", hitsDiff: null as number | null },
]);

const result = df1.mutate({
  hitsConsumed: (r) => (r.hitsDiff !== null && r.hitsDiff <= 0) ? -r.hitsDiff : null,
});

// @ts-expect-error — Argument of type 'number | null' is not assignable to parameter of type 'number'.
result.mutate({ rounded: (r) => Math.round(r.hitsConsumed) });
