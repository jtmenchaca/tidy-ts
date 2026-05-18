/**
 * ID: SO#30944577
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: str.contains returns Series used as scalar bool. Typed filter operates on values, returns boolean.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

BabyDataSet = [('Bob', 968), ('Jessica', 155), ('Mary', 77), ('John', 578), ('Mel', 973)]
a = pd.DataFrame(data=BabyDataSet, columns=['Names', 'Births'])

if a['Names'].str.contains('Mel'):
    print("Mel is there")
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { name: "Bob", births: 968 },
  { name: "Jessica", births: 155 },
  { name: "Mary", births: 77 },
  { name: "John", births: 578 },
  { name: "Mel", births: 973 },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(df.extract("name"));
