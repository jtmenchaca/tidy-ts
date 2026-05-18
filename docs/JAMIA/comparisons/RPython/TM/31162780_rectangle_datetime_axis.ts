/**
 * RPython SO#31162780 — matplotlib Rectangle on datetime axis
 * Effect: Crash
 * Bug class: Value type
 *
 * Python bug: `Rectangle((startTime, 0), width, 1)` expects numeric x/width.
 * Passing datetime objects crashes: "unsupported operand type(s) for -:
 * 'datetime.datetime' and 'float'". The user needs to convert datetimes to
 * numeric positions (e.g., matplotlib date numbers) before using them as coordinates.
 *
 * In tidy-ts, string dates cannot be used in arithmetic. The type system rejects
 * using a string where a number is required — you must convert to numeric first.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Same scenario: datetime timestamps and numeric values
const df = createDataFrame([
  { startTime: "2024-01-15T10:00:00", width: "PT1H", y: 0, height: 1 },
  { startTime: "2024-01-15T12:00:00", width: "PT1H", y: 0, height: 1 },
]);

// The .py passes datetime as x-coordinate to Rectangle (needs numeric position).
// In tidy-ts, the startTime column is string — passing it to a numeric function
// (analogous to Rectangle needing float x) is rejected.
// @ts-expect-error — string[] is not assignable to number[]
s.mean(df.extract("startTime"));
