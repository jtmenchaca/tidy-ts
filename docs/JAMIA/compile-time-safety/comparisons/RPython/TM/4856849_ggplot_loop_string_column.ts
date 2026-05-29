/**
 * ID: SO#4856849
 * Language: R
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: A character variable holding a column name is passed to aes(); ggplot binds the literal symbol 'i' rather than its value. Originally reported as a crash; in current ggplot2 the literal string is silently treated as a constant value, producing a flat line rather than the intended y mapping. Typed column accessors in Tidy-TS require a literal key of T, not a bare string.
 */
import { createDataFrame } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
library(ggplot2)

t <- data.frame(
  w = c(1, 2, 3, 4),
  x = c(23, 45, 23, 34),
  y = c(23, 34, 54, 23),
  z = c(23, 12, 54, 32)
)

i <- "x"
p <- ggplot(data = t, aes(w, i)) + geom_line()
# Force evaluation of aes() bindings by building the plot panel
ggplot_build(p)
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const t = createDataFrame([
  { w: 1, x: 23, y: 23, z: 23 },
  { w: 2, x: 45, y: 34, z: 12 },
  { w: 3, x: 23, y: 54, z: 54 },
  { w: 4, x: 34, y: 23, z: 32 },
]);

const i: string = "x";

// @ts-expect-error — Argument of type 'string' is not assignable to parameter of type '"w" | "x" | "y" | "z"'.
t.extract(i);
