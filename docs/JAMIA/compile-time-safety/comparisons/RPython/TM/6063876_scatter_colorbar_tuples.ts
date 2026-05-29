/**
 * ID: SO#6063876
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: Scatter colorbar needs float array, got tuple list. Type mismatch.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

cm = matplotlib.colormaps["RdYlBu"]
colors = [cm(1.0 * i / 20) for i in range(20)]
xy = list(range(20))
plt.subplot(111)
colorlist = [colors[x // 2] for x in xy]
plt.scatter(xy, xy, c=colorlist, s=35, vmin=0, vmax=20)
plt.colorbar()
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { x: 0, y: 0, color: "rgba(0.8,0.2,0.1,1)" },
  { x: 5, y: 5, color: "rgba(0.5,0.5,0.1,1)" },
  { x: 10, y: 10, color: "rgba(0.1,0.2,0.8,1)" },
  { x: 15, y: 15, color: "rgba(0.2,0.8,0.2,1)" },
  { x: 19, y: 19, color: "rgba(0.9,0.1,0.1,1)" },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(df.extract("color"));
