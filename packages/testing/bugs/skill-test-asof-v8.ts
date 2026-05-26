// Skill test: hourly prices + asof join for irregular trade decisions.
// Uses only the API described by tidy-ts-best-practices SKILL.md + rules/.

import {
  createDataFrame,
  readCSV,
  stats as s,
  writeCSV,
} from "@tidy-ts/dataframe";
import { Temporal, zInstant } from "@tidy-ts/shims";
import { z } from "zod";

// --- Load price data --------------------------------------------------------

const priceSchema = z.object({
  timestamp: zInstant, // "2024-03-04T09:30:00.000Z" -> Temporal.Instant
  symbol: z.string(),
  price: z.number(),
  volume: z.number(),
});

const prices = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/hourly-prices.csv",
  priceSchema,
);

// --- Task 1: count + symbols ------------------------------------------------

const totalRows = prices.nrows();
const symbols = prices.extractUnique("symbol");
console.log(`Task 1: ${totalRows} price observations, symbols = [${symbols.join(", ")}]`);

// --- Build trade timestamp DataFrame ---------------------------------------

const tradeTimestamps = [
  "2024-03-04T09:35:00.000Z",
  "2024-03-04T11:17:00.000Z",
  "2024-03-04T14:42:00.000Z",
  "2024-03-05T10:08:00.000Z",
  "2024-03-05T15:50:00.000Z",
];

// asofJoin requires both sides sorted on the join column. We build the trades
// DF with a `timestamp` column matching the prices DF's column name + type.
const trades = createDataFrame(
  tradeTimestamps.map((t) => ({ timestamp: Temporal.Instant.from(t) })),
).arrange("timestamp");

// Prices must be sorted on the asof key (per asofJoin docs).
const pricesSorted = prices.arrange("timestamp");

// --- Task 2: AAPL price as-of each trade timestamp --------------------------

const aaplPrices = pricesSorted
  .filter((r) => r.symbol === "AAPL")
  .select("timestamp", "price");

const aaplAsof = trades
  .asofJoin(aaplPrices, "timestamp", { direction: "backward" })
  .rename({ timestamp: "trade_time", price: "asof_aapl_price" });

aaplAsof.print("Task 2: AAPL price as-of each trade timestamp");

// --- Task 3: all three symbols, one combined table --------------------------

// We need three rows per trade timestamp (one per symbol). Cross the trades
// against the distinct symbols, then asofJoin grouped by symbol on the full
// price table.
const allSymbols = createDataFrame(
  symbols.map((sym) => ({ symbol: sym })),
);

const tradesPerSymbol = trades
  .crossJoin(allSymbols)
  .arrange("symbol", "timestamp");

// asofJoin with group_by needs the partition column on both sides; the
// collision yields `symbol_x` (left/trade) and `symbol_y` (right/price).
// We keep the trade-side symbol and drop the right-side one.
const allAsof = tradesPerSymbol
  .asofJoin(pricesSorted.select("timestamp", "symbol", "price"), "timestamp", {
    direction: "backward",
    group_by: ["symbol"],
  })
  .drop("symbol_y")
  .rename({ timestamp: "trade_time", price: "asof_price", symbol_x: "symbol" })
  .arrange("trade_time", "symbol");

allAsof.print("Task 3: per-symbol asof price for every trade timestamp");

// --- Task 4: per-symbol first→last pct change -------------------------------

const symbolSummary = prices
  .arrange("timestamp")
  .groupBy("symbol")
  .summarize({
    first_price: (g) => s.first(g.price),
    last_price: (g) => s.last(g.price),
  })
  .mutate({
    pct_change: (r) => {
      if (r.first_price === null || r.last_price === null) return null;
      return s.round(((r.last_price - r.first_price) / r.first_price) * 100, 4);
    },
  });

symbolSummary.print("Task 4: per-symbol first/last/pct_change");

// --- Task 5: single highest 1-hour price observation ------------------------

const topPrice = prices.sliceMax("price", 1).select("symbol", "timestamp", "price");
topPrice.print("Task 5: highest 1-hour price observation");

// --- Task 6: write summary CSV ---------------------------------------------

const outPath = "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/symbol-summary.csv";
await writeCSV(symbolSummary, outPath);
console.log(`Task 6: wrote ${outPath}`);
