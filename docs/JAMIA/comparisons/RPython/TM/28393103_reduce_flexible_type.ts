/**
 * RPython SO#28393103 — TypeError: cannot perform reduce with flexible type
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas/numpy, data loaded from CSV as strings can be passed to sklearn
 * or numpy mean() without error until runtime. The string array crashes
 * numeric reduction.
 *
 * In tidy-ts, string columns are typed as string. Passing string[] to
 * s.mean() is a compile-time error.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { gene1: "-214", gene2: "-153", gene3: "-58" },
  { gene1: "-139", gene2: "-73", gene3: "-1" },
  { gene1: "-76", gene2: "-49", gene3: "-307" },
]);

// gene1 is string — numeric reduction is rejected
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("gene1"));

// Fix: parse first
const parsed = df.mutate({ gene1_num: (r) => parseFloat(r.gene1) });
console.log(s.mean(parsed.extract("gene1_num")));
