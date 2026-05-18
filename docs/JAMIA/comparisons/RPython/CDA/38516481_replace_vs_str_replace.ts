/**
 * RPython SO#38516481 — Series.replace() silently does nothing on substrings
 * Effect: IF (silent incorrect functionality)
 * Bug class: API ambiguity
 *
 * In pandas, Series.replace(',', '') does VALUE-level replacement (exact cell match).
 * It silently does nothing when the user wants substring replacement.
 * The user proceeds thinking the data was cleaned.
 *
 * In tidy-ts, string manipulation in mutate() uses JS string methods.
 * .replaceAll() operates on substrings. The column is typed as string,
 * so the user must explicitly convert to number before numeric operations.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { player: "Mike Trout", avg_annual: "$34,083,333" },
  { player: "Clayton Kershaw", avg_annual: "$31,000,000" },
  { player: "Bryce Harper", avg_annual: "$25,538,462" },
]);

// avg_annual is string — attempting numeric operations without cleaning fails
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("avg_annual"));

// Clean and convert
const cleaned = df.mutate({
  salary: (r) => parseFloat(r.avg_annual.replaceAll(",", "").replaceAll("$", "")),
});

console.log(s.mean(cleaned.extract("salary")));
