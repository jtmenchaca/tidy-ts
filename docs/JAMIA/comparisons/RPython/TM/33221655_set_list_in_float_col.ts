/**
 * ID: SO#33221655
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Setting list value in float64 column fails. Type mismatch on assignment.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

output = pd.DataFrame(data=[[800.0]], columns=['Sold Count'], index=['Project1'])
output.loc['Project1', 'Sold Count'] = [400.0]
print(output)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { project: "Project1", sold_count: 800.0 },
]);

const wrong = df.mutate({ sold_count: (_r) => [400.0] });

// @ts-expect-error — number[][] is not assignable to number[]
s.mean(wrong.extract("sold_count"));
