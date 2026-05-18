/**
 * RPython SO#30857680 — Pandas Resampling error: Only valid with DatetimeIndex
 * Effect: Crash
 * Bug class: Value type
 *
 * In pandas, `data.Price.resample('30min').ohlc()` crashes because resample
 * requires DatetimeIndex but the DataFrame has an integer RangeIndex. The
 * datetime exists as a regular column, not as the index.
 *
 * In tidy-ts, resample() explicitly requires a timeColumn of type Date.
 * If timestamps are strings (not parsed to Date), the type system rejects it.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Same data as the .py: timestamps as strings (not Date), price, volume
const data = createDataFrame([
  { timestamp: "2023-01-01 09:00", price: 100.5, volume: 1000 },
  { timestamp: "2023-01-01 09:15", price: 101.2, volume: 1500 },
  { timestamp: "2023-01-01 09:30", price: 99.8, volume: 800 },
  { timestamp: "2023-01-01 09:45", price: 102.0, volume: 2000 },
  { timestamp: "2023-01-01 10:00", price: 100.0, volume: 1200 },
]);

// The .py operation: data.Price.resample('30min').ohlc()
// Crashes because timestamp is not the index (and not DatetimeIndex).
// In tidy-ts, resample requires timeColumn to be Date — string is rejected.
// @ts-expect-error — 'timestamp' is string, not Date; resample requires Date column
data.resample({ timeColumn: "timestamp", frequency: "30min", metrics: { price: s.mean } });
