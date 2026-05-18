/**
 * RPython SO#39180873 — DataFrame.hist() on object-dtype (string) columns
 * Effect: Crash
 * Bug class: Value type
 *
 * Python bug: numpy array with dtype=object containing string "0"/"1" values
 * is put into a DataFrame. Calling `custom.hist()` crashes because histogram
 * requires numeric columns — the values look numeric but are stored as strings.
 *
 * In tidy-ts, columns loaded as strings stay typed as string[]. Passing them
 * to numeric functions is a compile-time error.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Same data as the .py: numeric-looking values stored as strings
const custom = createDataFrame([
  { buying: "0", maint: "0", doors: "0", persons: "0", lug_boot: "0", safety: "0" },
  { buying: "1", maint: "1", doors: "0", persons: "0", lug_boot: "0", safety: "0" },
  { buying: "0", maint: "0", doors: "0", persons: "0", lug_boot: "0", safety: "0" },
]);

// The .py operation: custom.hist() — needs numeric columns for binning.
// In tidy-ts, s.mean() (histogram bin computation) rejects string columns.
// @ts-expect-error — string[] is not assignable to number[]
s.mean(custom.extract("buying"));
