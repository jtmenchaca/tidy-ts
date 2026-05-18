/**
 * RPython SO#50916422 — TypeError: Object of type 'int64' is not JSON serializable
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, values extracted via .iloc[] are numpy scalar types (int64, float64).
 * json.dumps() rejects them because they are not native Python types.
 *
 * In tidy-ts, extracted values are native JS types (number, string, boolean).
 * JSON.stringify works on all native types. The bug is structurally absent —
 * there are no "numpy scalar" wrapper types in JS. The type system still
 * catches passing non-serializable types (like functions) to JSON operations.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { store: "A", count: 10 },
  { store: "B", count: 12 },
  { store: "C", count: 5 },
]);

// Values are native JS number — JSON.stringify works directly
const counts = df.extract("count"); // number[]
console.log(JSON.stringify(counts));

// Type system still guards: passing string[] where number[] expected
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.sum(df.extract("store"));
