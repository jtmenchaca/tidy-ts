/**
 * ID: SO#21472243
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: plt.hist on object-dtype data fails reduce. Numeric operation on string/object data.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

top_words_10 = [
    (" whitefield", 65299),
    (" bellandur", 57061),
    (" kundalahalli", 51769),
    (" marathahalli", 50639),
    (" electronic city", 44041),
]

plt.hist(top_words_10, label="True")
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { word: "whitefield", count: 65299 },
  { word: "bellandur", count: 57061 },
  { word: "kundalahalli", count: 51769 },
  { word: "marathahalli", count: 50639 },
  { word: "electronic city", count: 44041 },
]);

// @ts-expect-error — Argument of type 'string[]' is not assignable to parameter of type 'NumbersWithNullable'.
s.mean(df.extract("word"));
