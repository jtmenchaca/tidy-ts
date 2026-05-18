/**
 * RPython SO#48062499 — numeric data arrives as strings, sorts lexicographically
 *
 * In pandas/numpy, a string array sorts as "103" < "34.17" (lexicographic)
 * with no error. Plots render with wrong y-axis order silently.
 *
 * In tidy-ts, if a column is string, passing it to a numeric operation
 * (like s.mean or s.test) is a compile-time error. The type system forces
 * explicit conversion before numeric use.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Data arrives as strings (simulating CSV read without type parsing)
const df = createDataFrame([
  { time: "07:00", solar: "50.35" },
  { time: "08:00", solar: "41.01" },
  { time: "09:00", solar: "69.16" },
  { time: "10:00", solar: "94.5" },
  { time: "11:00", solar: "111.9" },
  { time: "12:00", solar: "103" },
]);

// Schema is { time: string, solar: string }
// Attempting numeric operations on string column fails at compile time:
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("solar"));

// The fix: explicit conversion — no silent lexicographic sorting possible
const numeric = df.mutate({ solar: (r) => parseFloat(r.solar) });
// Now solar is number — arrange and stats work correctly
const sorted = numeric.arrange("solar", "asc");
const avg = s.mean(numeric.extract("solar"));
console.log(avg);
