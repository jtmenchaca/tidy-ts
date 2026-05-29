/**
 * ID: SO#15799162
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Resampling requires DatetimeIndex, got MultiIndex with dates. Wrong index type.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd
import numpy as np

dates = pd.date_range('2012-01-01', periods=4, freq='D')
states = ['Georgia', 'Georgia', 'Alabama', 'Alabama']
cities = ['Atlanta', 'Savannah', 'Mobile', 'Montgomery']

arrays = []
for state, city in zip(states, cities):
    for date in dates:
        arrays.append((state, city, date))

index = pd.MultiIndex.from_tuples(arrays, names=['State', 'City', 'Date'])
df = pd.DataFrame({'value_a': np.arange(16), 'value_b': np.arange(16) + 10}, index=index)

result = df.resample('2D').sum()
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { state: "Georgia", city: "Atlanta", date: "2012-01-01", value_a: 0, value_b: 10 },
  { state: "Georgia", city: "Atlanta", date: "2012-01-02", value_a: 1, value_b: 11 },
  { state: "Georgia", city: "Savannah", date: "2012-01-01", value_a: 4, value_b: 14 },
  { state: "Georgia", city: "Savannah", date: "2012-01-02", value_a: 5, value_b: 15 },
]);

// @ts-expect-error — Type 'string[]' is not assignable to type 'number[]'
s.sum(df.extract("date"));
