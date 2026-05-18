/**
 * RPython SO#6063876 — scatter plot colorbar with tuple RGBA colors
 * Effect: Crash
 * Bug class: Value type
 *
 * Python bug: `plt.scatter(c=colorlist)` with `plt.colorbar()` crashes because
 * the colorbar needs a numeric scalar mapping (c must be a float array for the
 * colormap to map values). The user passed RGBA tuples from `cm(i/20)` which
 * are not numeric scalars.
 *
 * In tidy-ts, if color values are strings (RGBA representations), they cannot
 * be passed to numeric functions that expect a scalar color value array.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Same structure as the .py: x, y coordinates with color values
// The .py generates RGBA tuples from a colormap — in tidy-ts these would be strings
const df = createDataFrame([
  { x: 0, y: 0, color: "rgba(0.8,0.2,0.1,1)" },
  { x: 5, y: 5, color: "rgba(0.5,0.5,0.1,1)" },
  { x: 10, y: 10, color: "rgba(0.1,0.2,0.8,1)" },
  { x: 15, y: 15, color: "rgba(0.2,0.8,0.2,1)" },
  { x: 19, y: 19, color: "rgba(0.9,0.1,0.1,1)" },
]);

// The .py user wants colorbar to scale the colors numerically (needs c as number[]).
// Passing string RGBA values where a numeric color scale is required fails.
// @ts-expect-error — string[] is not assignable to number[]
s.mean(df.extract("color"));
