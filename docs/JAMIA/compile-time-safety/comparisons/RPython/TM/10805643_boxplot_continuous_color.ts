/**
 * ID: SO#10805643
 * Language: R
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Numeric column passed to discrete color aesthetic. Typed graph API enforces `color: ColumnSpec<T, string | number>` with explicit scale mapping.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(ggplot2)

MYdata <- data.frame(
  Age = rep(c(0, 1, 3, 6, 9, 12), each = 20),
  Richness = rnorm(120, 10000, 2500)
)

p <- ggplot(data = MYdata, aes(x = Age, y = Richness)) +
  geom_boxplot(aes(group = Age)) +
  geom_point(aes(color = Age)) +
  scale_colour_manual(
    values = c("#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00")
  )
ggplot_build(p)
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const MYdata = createDataFrame([
  { Age: 0, Richness: 10000 },
  { Age: 1, Richness: 10500 },
  { Age: 3, Richness: 9800 },
]);

// The SO fix is to convert Age to a factor (string label) for the discrete scale.
const labels = MYdata.mutate({ Age_label: (r) => String(r.Age) });

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.test.correlation.pearson({ x: labels.extract("Age_label"), y: labels.extract("Richness") });
