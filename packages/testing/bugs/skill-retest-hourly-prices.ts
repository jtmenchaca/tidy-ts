// Skill retest: idiomatic tidy-ts analysis of an hourly-prices CSV.
//
// Three analyses chosen for time-series data of this shape
// (timestamp, symbol, price, volume; long format; multiple instruments):
//
//   1. Per-symbol daily OHLC bars via summarize after binning timestamp
//      into a day bucket (rules/dataframe-time-series.md + grouping).
//   2. Per-symbol hourly log returns + rolling stats. The skill's
//      `mutateOverGroup` example didn't type-check on this build, so we
//      fan out by symbol with filter + concatDataFrames and use s.lag /
//      s.rolling inside an ungrouped mutate per slice
//      (rules/stats-window.md).
//   3. Cross-symbol return correlation: long -> wide via pivotWider
//      with expectedColumns, then s.test.correlation.pearson on the
//      aligned columns (rules/dataframe-reshaping.md + rules/stats-tests.md).

import { z } from "zod";
import {
  concatDataFrames,
  createDataFrame,
  type DataFrame,
  readCSV,
  stats as s,
} from "@tidy-ts/dataframe";
import { dirname, fileURLToPath, resolve } from "@tidy-ts/shims";

// --- path resolution (works from any cwd) ---------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const csvPath = resolve(
  __dirname,
  "..",
  "fixtures",
  "hourly-prices.csv",
);

// --- load -----------------------------------------------------------------
const rowSchema = z.object({
  timestamp: z.coerce.date(),
  symbol: z.string(),
  price: z.number(),
  volume: z.number(),
});

const prices = await readCSV(csvPath, rowSchema);

console.log("Loaded hourly prices:");
prices.sliceHead(3).print();
console.log(
  `rows: ${prices.nrows()}  symbols: ${s.unique(prices.symbol).join(", ")}`,
);

const symbols = s.unique(prices.symbol);

// =========================================================================
// 1. Per-symbol daily OHLC bars
// =========================================================================
// Idiom: groupBy + summarize on a day-bucketed timestamp. (The skill's
// `downsample({ aggregations: { col: { column, fn } } })` form did not
// type-check on this build — see report — so the OHLC pattern is built
// directly with summarize, which is a superset capability anyway.)
const startOfDay = (d: Date) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const ohlc = prices
  .mutate({ day: (r) => startOfDay(r.timestamp) })
  // arrange first so first()/last() inside summarize are temporally meaningful
  .arrange("timestamp", "asc")
  .groupBy("symbol", "day")
  .summarize({
    open: (g) => s.first(g.price as readonly number[]),
    high: (g) => s.max(g.price as readonly number[]),
    low: (g) => s.min(g.price as readonly number[]),
    close: (g) => s.last(g.price as readonly number[]),
    volume: (g) => s.sum(g.volume as readonly number[]),
    n_bars: (g) => g.nrows(),
  })
  .arrange("symbol", "asc")
  .arrange("day", "asc");

console.log("\n[1] Daily OHLC bars per symbol:");
ohlc.print();

// =========================================================================
// 2. Per-symbol hourly returns + rolling stats
// =========================================================================
// Idiom: fan out by symbol with filter + concatDataFrames (the rule for
// reshaping shows concatDataFrames as the standard vertical stack), then
// run lag/rolling inside an ungrouped mutate per slice so they stay
// within each symbol's series. (The skill's mutateOverGroup example
// expected `(group) => ...` but the type's GroupExpr is row-level on
// this build — see report. Per-symbol fan-out gives the same semantics.)
type EnrichedRow = {
  timestamp: Date;
  symbol: string;
  price: number;
  volume: number;
  prev_price: number;
  rolling_mean_price: number;
  rolling_sd_price: number | null;
  log_return: number;
};

const enrichedPerSymbol: DataFrame<EnrichedRow>[] = symbols.map((sym) => {
  const slice = prices
    .filter((r) => r.symbol === sym)
    .arrange("timestamp", "asc");

  const priceCol = slice.price;
  const prev = s.lag(priceCol, { defaultValue: priceCol[0] ?? 0 });
  const rollingMean = s.rolling({
    values: priceCol,
    windowSize: 5,
    fn: s.mean,
  });
  const rollingSd = s.rolling({
    values: priceCol,
    windowSize: 5,
    fn: (w: readonly number[]) => s.stdev(w),
  });

  // Build rows manually (typed, no `unknown` leakage).
  const ts = slice.timestamp;
  const vol = slice.volume;
  const rows: EnrichedRow[] = priceCol.map((price, i) => {
    const prevP = prev[i] ?? 0;
    return {
      timestamp: ts[i]!,
      symbol: sym,
      price,
      volume: vol[i]!,
      prev_price: prevP,
      rolling_mean_price: rollingMean[i] ?? price,
      rolling_sd_price: rollingSd[i] ?? null,
      log_return: prevP > 0 ? Math.log(price / prevP) : 0,
    };
  });
  return createDataFrame(rows);
});

const enriched = concatDataFrames(enrichedPerSymbol);

const returnSummary = enriched
  .groupBy("symbol")
  .summarize({
    n_bars: (g) => g.nrows(),
    mean_return_pct: (g) =>
      s.round(s.mean(g.log_return as readonly number[]) * 100, 4),
    sd_return_pct: (g) =>
      s.round((s.stdev(g.log_return as readonly number[]) ?? 0) * 100, 4),
    max_drawup_pct: (g) =>
      s.round((s.max(g.log_return as readonly number[]) ?? 0) * 100, 4),
    max_drawdown_pct: (g) =>
      s.round((s.min(g.log_return as readonly number[]) ?? 0) * 100, 4),
    total_volume: (g) => s.sum(g.volume as readonly number[]),
  })
  .arrange("mean_return_pct", "desc");

console.log(
  "\n[2] Per-symbol hourly log-return summary (5-bar rolling mean/sd added per row):",
);
returnSummary.print();

console.log(
  "\n    First 4 rows of AAPL's enriched series (rolling mean / sd / return):",
);
enriched
  .filter((r) => r.symbol === "AAPL")
  .select(
    "timestamp",
    "price",
    "prev_price",
    "rolling_mean_price",
    "rolling_sd_price",
    "log_return",
  )
  .sliceHead(4)
  .print();

// =========================================================================
// 3. Cross-symbol return correlation (long -> wide + Pearson)
// =========================================================================
// Idiom: pivotWider with expectedColumns from s.unique for typing, then
// removeNull to drop bars where any symbol is missing, then call
// s.test.correlation.pearson on the aligned columns. (Pearson's typed
// signature wants mutable number[] — the skill's "All test functions
// accept readonly number[]" line is wrong for this one — so copy with
// spread.)
const returnsLong = enriched.select("timestamp", "symbol", "log_return");

const returnsWide = returnsLong.pivotWider({
  namesFrom: "symbol",
  valuesFrom: "log_return",
  expectedColumns: symbols,
});

const returnsWideClean = returnsWide.removeNull(
  "AAPL" as const,
  "GOOG" as const,
  "MSFT" as const,
);

console.log("\n[3] Wide returns table (first 4 rows):");
returnsWideClean.sliceHead(4).print();

type CorrRow = {
  pair: string;
  r: number | null;
  pValue: number | null;
  significant: boolean;
  n: number;
};

const corrRows: CorrRow[] = [];
for (let i = 0; i < symbols.length; i++) {
  for (let j = i + 1; j < symbols.length; j++) {
    const a = symbols[i]!;
    const b = symbols[j]!;
    const x = [
      ...(returnsWideClean[
        a as keyof typeof returnsWideClean
      ] as readonly number[]),
    ];
    const y = [
      ...(returnsWideClean[
        b as keyof typeof returnsWideClean
      ] as readonly number[]),
    ];
    try {
      const test = s.test.correlation.pearson({ x, y });
      corrRows.push({
        pair: `${a} vs ${b}`,
        r: s.round(test.effectSize.value, 4),
        pValue: s.round(test.pValue, 6),
        significant: test.pValue < (test.alpha ?? 0.05),
        n: x.length,
      });
    } catch (e) {
      console.warn(`Could not compute correlation for ${a} vs ${b}:`, e);
    }
  }
}

const corrDf = createDataFrame(corrRows).arrange("r", "desc");
console.log("\n[3] Pairwise Pearson correlation of hourly log returns:");
corrDf.print();
