/**
 * ID: SO#56079650
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: DC
 * In study: Yes
 * Inclusion rationale: Boolean column silently coerced to object dtype. Bitwise NOT (~) then gives wrong results instead of error. Silent data corruption.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

a = pd.Series(['a', 'a', 'a', 'a', 'b', 'a', 'b', 'b', 'b', 'b'])
b = pd.Series([True, True, True, True, True, False, False, False, False, False], dtype=bool)

c = pd.DataFrame(data=[a, b]).T
c.columns = ['Classification', 'Boolean']

not_b = ~c.Boolean
print(list(not_b))
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { classification: "a", flag: true },
  { classification: "a", flag: true },
  { classification: "b", flag: false },
  { classification: "b", flag: false },
]);

const transposed = df.transpose({ numberOfRows: 4 });

// @ts-expect-error — column is string | boolean, not boolean
s.all(transposed.extract("row_0"));
