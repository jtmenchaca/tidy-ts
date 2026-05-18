/**
 * ID: SO#35560433
 * Language: R
 * Bug class: Value type
 * Runtime consequence: IF
 * In study: Yes
 * Inclusion rationale: geom_smooth fails silently on character dates. String column where temporal/numeric expected for regression.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(ggplot2)

b <- data.frame(
  day = c("05/22", "05/23", "05/24", "05/25", "05/26", "05/27", "05/28",
          "05/29", "05/30", "05/31", "06/01", "06/02"),
  temp = c(10.1, 8.7, 11.4, 11.4, 11.6, 10.7, 9.6, 11.0, 10.0, 10.7, 9.5, 10.3)
)

gg2 <- ggplot(b, aes(x = day, y = temp, color = temp)) +
  geom_point(stat = "identity", aes(colour = temp), size = 3) +
  geom_smooth(method = "lm") +
  scale_colour_gradient(low = "yellow", high = "#de2d26")

built <- ggplot_build(gg2)
smooth_layer_data <- built$data[[2]]
stopifnot(nrow(smooth_layer_data) == 0)
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const b = createDataFrame([
  { day: "05/22", temp: 10.1 },
  { day: "05/23", temp: 8.7 },
  { day: "05/24", temp: 11.4 },
  { day: "05/25", temp: 11.4 },
  { day: "05/26", temp: 11.6 },
  { day: "05/27", temp: 10.7 },
  { day: "05/28", temp: 9.6 },
  { day: "05/29", temp: 11.0 },
  { day: "05/30", temp: 10.0 },
  { day: "05/31", temp: 10.7 },
  { day: "06/01", temp: 9.5 },
  { day: "06/02", temp: 10.3 },
]);

// @ts-expect-error — Type '{ day: string; temp: number; }' is not assignable to type 'Record<string, number>'
s.glm({ formula: "temp ~ day", family: "gaussian", link: "identity", data: b });
