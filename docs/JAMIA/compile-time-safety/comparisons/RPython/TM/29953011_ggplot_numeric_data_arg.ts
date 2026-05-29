/**
 * ID: SO#29953011
 * Language: R
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Numeric vector passed where DataFrame expected. Typed graph() requires `DataFrame<T>` input.
 */
import { concatDataFrames, createDataFrame } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(ggplot2)

GVW <- data.frame(
  Genotype = rep(c("KO", "WT"), each = 4),
  variable = rep(c("Start", "End"), 4),
  value = runif(8, 20, 40),
  seSKO = runif(8)
)

ggplot(GVW, aes(x = variable, y = value, fill = Genotype)) +
  geom_bar(position = position_dodge(), stat = "identity") +
  geom_errorbar(
    data = GVW[1:3, 3],
    aes(ymin = value - seSKO, ymax = value + seSKO),
    width = 0.2,
    position = position_dodge(0.9)
  )
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const GVW = createDataFrame([
  { genotype: "KO", variable: "Start", value: 25 },
  { genotype: "WT", variable: "End", value: 30 },
]);

const valueCol = GVW.extract("value");

// @ts-expect-error — number[] is not assignable to DataFrame
concatDataFrames([valueCol]);
