/**
 * ID: SO#28393103
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: "cannot perform reduce with flexible type" — numeric reduction on object-dtype array.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import numpy as np

trainData = np.array([
    ['-214', '-153', '-58', '36', '191'],
    ['-139', '-73', '-1', '11', '76'],
    ['-76', '-49', '-307', '41', '228'],
])

result = np.mean(trainData, axis=0)
print(result)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { gene1: "-214", gene2: "-153", gene3: "-58" },
  { gene1: "-139", gene2: "-73", gene3: "-1" },
  { gene1: "-76", gene2: "-49", gene3: "-307" },
]);

// @ts-expect-error — Argument of type 'string[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.mean(df.extract("gene1"));
