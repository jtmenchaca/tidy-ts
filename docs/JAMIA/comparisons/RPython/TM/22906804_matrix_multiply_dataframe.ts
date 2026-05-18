/**
 * ID: SO#22906804
 * Language: R
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Matrix multiply on data.frame requires as.matrix. Type not suitable for math operations.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (R) ───────────────────────────────────────────────────

const foreignScript = `
da <- data.frame(
  V1 = c(0.46, 0.25, 0.82),
  V2 = c(2.36, 1.52, 1.50),
  V3 = c(-1.54, -0.59, 0.34)
)

t(da) %*% da
`;

printForeignResult("r", runForeign("r", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const da = createDataFrame([
  { v1: 0.46, v2: 2.36, v3: -1.54 },
  { v1: 0.25, v2: 1.52, v3: -0.59 },
  { v1: 0.82, v2: 1.50, v3: 0.34 },
]);

// @ts-expect-error — Argument of type 'DataFrame<...>' is not assignable to parameter of type 'NumbersWithNullable'.
s.mean(da);
