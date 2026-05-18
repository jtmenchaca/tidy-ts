/**
 * RPython SO#12844529 — No numeric types to aggregate - change in groupby() behaviour?
 * Effect: DC (silent data corruption)
 * Bug class: Implicit column selection
 *
 * In pandas, groupby().mean() silently drops object-dtype columns, returning
 * an empty DataFrame if all columns are strings.
 *
 * In tidy-ts, s.mean() on a string[] is a compile-time error. You must convert first.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { city: "NYC", temp: "72", humidity: "45" },
  { city: "NYC", temp: "75", humidity: "50" },
  { city: "LA", temp: "80", humidity: "60" },
  { city: "LA", temp: "82", humidity: "55" },
]);

// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("temp"));

// Fix: explicit conversion
const numeric = df.mutate({
  temp: (r) => parseFloat(r.temp),
  humidity: (r) => parseFloat(r.humidity),
});

const result = numeric.groupBy("city").summarize({
  mean_temp: (g) => s.mean(g.extract("temp")),
  mean_humidity: (g) => s.mean(g.extract("humidity")),
});

result.print();
