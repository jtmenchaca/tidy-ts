/**
 * ID: SO#30857680
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: resample() requires DatetimeIndex, got integer index. Wrong index type for operation.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import pandas as pd

data = pd.DataFrame({
    'Price': [10.4, 10.4, 10.4, 10.5, 10.5],
    'Volume': [0.779, 0.101, 0.316, 0.150, 1.8],
    'Timestamp': [1313331280, 1313334917, 1313334917, 1313340309, 1313340309],
})

bars = data.Price.resample('30min').ohlc()
print(bars)
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const data = createDataFrame([
  { timestamp: "2023-01-01 09:00", price: 100.5, volume: 1000 },
  { timestamp: "2023-01-01 09:15", price: 101.2, volume: 1500 },
  { timestamp: "2023-01-01 09:30", price: 99.8, volume: 800 },
  { timestamp: "2023-01-01 09:45", price: 102.0, volume: 2000 },
  { timestamp: "2023-01-01 10:00", price: 100.0, volume: 1200 },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(data.extract("timestamp"));
