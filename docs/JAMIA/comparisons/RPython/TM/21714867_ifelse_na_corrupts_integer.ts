/**
 * RPython SO#21714867 — replace NA in a dplyr chain
 * Effect: DC (silent data corruption)
 * Bug class: Nullable type
 *
 * R bug: In dplyr, mutate(G = ifelse(is.na(G), mean(G, na.rm=TRUE), G)) on an
 * integer column. mean() returns double, but ifelse preserves the type of the
 * "yes" branch (integer). When the double mean is coerced to integer via memory
 * reinterpretation, it produces garbage values (e.g., 1074266112 instead of 47).
 * This is silent data corruption — no error, just wrong numbers.
 *
 * In tidy-ts, a summarize/mutate that conditionally returns null produces
 * number | null. Downstream use in strict-number contexts catches the mismatch.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { yearId: 2004, teamId: "SFN", g: 11 },
  { yearId: 2006, teamId: "CHN", g: 43 },
  { yearId: 2007, teamId: "CHA", g: 2 },
  { yearId: 2008, teamId: "BOS", g: 5 },
  { yearId: 2012, teamId: "NYA", g: null as number | null },
]);

// The SO user's intent: replace NA with group mean.
// R silently corrupts because double→integer reinterpretation produces garbage.
// tidy-ts: the column is number | null. groupBy summary that may be null stays nullable.
const filled = df.mutate({
  gFilled: (r) => {
    if (r.g !== null) return r.g;
    // In real code you'd compute group mean; the point is the return type includes null
    return null;
  },
});

// filled.gFilled is number | null. Math.round requires strict number.
// @ts-expect-error — Argument of type 'number | null' is not assignable to parameter of type 'number'
filled.mutate({ rounded: (r) => Math.round(r.gFilled) });
