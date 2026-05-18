/**
 * ID: SO#31162780
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: matplotlib Rectangle with datetime needs float conversion. Type mismatch at API boundary.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import matplotlib
matplotlib.use("Agg")
from datetime import datetime, timedelta
from matplotlib.patches import Rectangle
import matplotlib.pyplot as plt

fig = plt.figure()
ax = fig.add_subplot(111)

startTime = datetime.now()
width = timedelta(seconds=1)
endTime = startTime + width
rect = Rectangle((startTime, 0), width, 1, color="yellow")

ax.add_patch(rect)
plt.xlim([startTime, endTime])
plt.ylim([0, 1])
plt.close()
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { startTime: "2024-01-15T10:00:00", width: "PT1H", y: 0, height: 1 },
  { startTime: "2024-01-15T12:00:00", width: "PT1H", y: 0, height: 1 },
]);

// @ts-expect-error — string[] is not assignable to number[]
s.mean(df.extract("startTime"));
