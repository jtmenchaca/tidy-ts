/**
 * ID: SO#21011777
 * Language: Python
 * Bug class: Value type
 * Runtime consequence: Crash
 * In study: Yes
 * Inclusion rationale: NaN mixed into list prevents clean removal — math.isnan fails on non-float elements. Mixed types.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { printForeignResult, runForeign } from "../run-foreign.ts";

// Foreign reproduction (pandas) ──────────────────────────────────────────────

const foreignScript = `
import math

countries = [float('nan'), 'USA', 'UK', 'France']

cleaned = [x for x in countries if not math.isnan(x)]
`;

printForeignResult("python", runForeign("python", foreignScript));

// Tidy-TS equivalent ─────────────────────────────────────────────────────────

const df = createDataFrame([
  { country: null as string | null },
  { country: "USA" },
  { country: "UK" },
  { country: "France" },
]);

// @ts-expect-error — Type '(string | null)[]' is not assignable to type 'number[]'
s.mean(df.extract("country"));
