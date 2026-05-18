/**
 * RPython SO#15799162 — Resampling Within a Pandas MultiIndex
 * Effect: Crash
 * Bug class: Value type
 *
 * In pandas, `df.resample('2D').sum()` requires DatetimeIndex as the primary
 * index. With a MultiIndex (State, City, Date), the Date level is buried inside
 * and resample crashes with TypeError.
 *
 * In tidy-ts, resample() requires the timeColumn to be a Date type. If dates
 * are stored as strings (e.g., loaded from CSV without parsing), the type system
 * rejects the resample call — you must explicitly parse to Date first.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Same data as the .py: state, city, date, values
// Dates stored as strings (common CSV load scenario — analogous to MultiIndex confusion)
const df = createDataFrame([
  { state: "Georgia", city: "Atlanta", date: "2012-01-01", value_a: 0, value_b: 10 },
  { state: "Georgia", city: "Atlanta", date: "2012-01-02", value_a: 1, value_b: 11 },
  { state: "Georgia", city: "Savannah", date: "2012-01-01", value_a: 4, value_b: 14 },
  { state: "Georgia", city: "Savannah", date: "2012-01-02", value_a: 5, value_b: 15 },
  { state: "Alabama", city: "Mobile", date: "2012-01-01", value_a: 8, value_b: 18 },
  { state: "Alabama", city: "Mobile", date: "2012-01-02", value_a: 9, value_b: 19 },
]);

// The .py operation: df.resample('2D').sum()
// Crashes because resample needs DatetimeIndex, not MultiIndex.
// In tidy-ts, resample requires timeColumn to be Date — string is rejected.
// @ts-expect-error — 'date' is string, not Date; resample requires Date column
df.resample({ timeColumn: "date", frequency: "2D", metrics: { value_a: s.sum } });
