import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { region: "N", count: 10 },
  { region: "S", count: 20 },
]);

console.log("df['count']:           ", df["count"]);
console.log("typeof df['count']:    ", typeof df["count"]);
console.log("Array.isArray(df['count']):", Array.isArray(df["count"]));

const summed = df.summarize({
  total: (g) => s.sum(g["count"]),
});
console.log("s.sum(g['count']):     ", summed.toRows());
