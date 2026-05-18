// Three analyses on a multi-symbol hourly price/volume time series:
//   1. Per-symbol daily OHLC+volume rollup via downsample (canonical TS aggregation).
//   2. Per-symbol log returns + 5-hour rolling mean & stdev via mutateOverGroup.
//   3. Cross-symbol return correlation matrix (pivot wider, pairwise Pearson r).

import {
  createDataFrame,
  peekCSV,
  readCSV,
  stats as s,
} from "@tidy-ts/dataframe";
import { dirname, fileURLToPath, resolve } from "@tidy-ts/shims";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(__dirname, "../fixtures/hourly-prices.csv");

// 0. Peek so the reader (and future maintainers) know the schema shape.
console.log("\n=== peekCSV ===");
console.log(await peekCSV(csvPath));

const HourlyPriceSchema = z.object({
  timestamp: z.date(),
  symbol: z.string(),
  price: z.number(),
  volume: z.number(),
});

const hourly = await readCSV(csvPath, HourlyPriceSchema);

console.log("\n=== Raw hourly (head) ===");
hourly.sliceHead(5).print();

// ---------------------------------------------------------------------------
// 1. Daily OHLC + volume per symbol. Every aggregation uses the explicit
//    { column, fn } form — no implicit "key matches a column" shortcut.
// ---------------------------------------------------------------------------
const dailyOHLCV = hourly.groupBy("symbol").downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: {
    open: { column: "price", fn: s.first },
    high: { column: "price", fn: s.max },
    low: { column: "price", fn: s.min },
    close: { column: "price", fn: s.last },
    volume: { column: "volume", fn: s.sum },
  },
}).arrange("symbol").arrange("timestamp");

console.log("\n=== 1. Daily OHLC + volume per symbol ===");
dailyOHLCV.print();

// ---------------------------------------------------------------------------
// 2. Hourly log returns + 5-hour rolling mean and stdev (per symbol).
//    Window stats on grouped data MUST go through mutateOverGroup, per the skill.
// ---------------------------------------------------------------------------
const sortedHourly = hourly.arrange("symbol").arrange("timestamp");

const withReturns = sortedHourly
  .groupBy("symbol")
  .mutateOverGroup({
    prev_price: (g) => s.lag(g.price),
  })
  .ungroup()
  .mutate({
    log_return: (r) =>
      r.prev_price == null ? null : Math.log(r.price / r.prev_price),
  });

const rolled = withReturns
  .groupBy("symbol")
  .mutateOverGroup({
    ret_roll_mean_5h: (g) =>
      s.rolling({
        values: g.log_return as readonly (number | null)[],
        windowSize: 5,
        fn: (w) => s.mean(w, { removeNull: true }),
      }),
    ret_roll_stdev_5h: (g) =>
      s.rolling({
        values: g.log_return as readonly (number | null)[],
        windowSize: 5,
        fn: (w) => s.stdev(w, { removeNull: true }),
      }),
  })
  .ungroup();

console.log("\n=== 2. Hourly log returns + 5h rolling stats (tail per symbol) ===");
rolled.groupBy("symbol").sliceTail(3).print();

// Per-symbol return summary: total return, mean/stdev of hourly log returns,
// realized annualized vol (assume ~252*6.5 = 1638 trading hours/yr — toy data).
const returnSummary = withReturns
  .removeNull("log_return")
  .groupBy("symbol")
  .summarize({
    n_hours: (g) => g.nrows(),
    mean_hourly_logret: (g) => s.round(s.mean(g.log_return), 6),
    stdev_hourly_logret: (g) => s.round(s.stdev(g.log_return), 6),
    cumulative_logret: (g) => s.round(s.sum(g.log_return), 4),
    total_volume: (g) => s.sum(g.volume),
  })
  .arrange("cumulative_logret", "desc");

console.log("\n=== 2b. Per-symbol return summary ===");
returnSummary.print();

// ---------------------------------------------------------------------------
// 3. Cross-symbol log-return correlation matrix.
//    pivotWider gives us one column per symbol aligned on timestamp; then we
//    compute pairwise Pearson r over the overlapping (non-null) hours.
// ---------------------------------------------------------------------------
const wideReturns = withReturns
  .select("timestamp", "symbol", "log_return")
  .pivotWider({
    namesFrom: "symbol",
    valuesFrom: "log_return",
  })
  .arrange("timestamp");

console.log("\n=== 3a. Wide returns (head) ===");
wideReturns.sliceHead(5).print();

const symbols = ["AAPL", "GOOG", "MSFT"] as const;

function pearson(xs: readonly (number | null | undefined)[], ys: readonly (number | null | undefined)[]): number | null {
  const xClean: number[] = [];
  const yClean: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    const xv = xs[i];
    const yv = ys[i];
    if (xv == null || yv == null) continue;
    if (Number.isNaN(xv) || Number.isNaN(yv)) continue;
    xClean.push(xv);
    yClean.push(yv);
  }
  if (xClean.length < 2) return null;
  const cov = s.covariance(xClean, yClean);
  const sx = s.stdev(xClean);
  const sy = s.stdev(yClean);
  if (cov == null || sx == null || sy == null || sx === 0 || sy === 0) return null;
  return cov / (sx * sy);
}

const corrRows: { a: string; b: string; r: number | null }[] = [];
for (const a of symbols) {
  for (const b of symbols) {
    const aCol = wideReturns[a as keyof typeof wideReturns] as unknown as
      readonly (number | null | undefined)[];
    const bCol = wideReturns[b as keyof typeof wideReturns] as unknown as
      readonly (number | null | undefined)[];
    corrRows.push({ a, b, r: pearson(aCol, bCol) });
  }
}

const corrLong = createDataFrame(corrRows).mutate({
  r: (row) => row.r == null ? null : s.round(row.r, 4),
});

const corrMatrix = corrLong.pivotWider({
  namesFrom: "b",
  valuesFrom: "r",
});

console.log("\n=== 3b. Log-return correlation matrix ===");
corrMatrix.print();

console.log("\nDone.");
