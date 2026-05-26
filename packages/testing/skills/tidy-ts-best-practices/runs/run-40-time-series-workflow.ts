// Time-series workflow exercise.
// Source data: packages/testing/fixtures/hourly-prices.csv
// Columns: timestamp (UTC instant), symbol, price, volume
// Symbols in file: AAPL, GOOG, MSFT (2024-03-04 .. 2024-03-05)

import { createDataFrame, readCSV, stats as s } from "@tidy-ts/dataframe";
import { zInstant } from "@tidy-ts/shims";
import { Temporal } from "@tidy-ts/shims/temporal-polyfill";
import { z } from "zod";

const schema = z.object({
  timestamp: zInstant,
  symbol: z.string(),
  price: z.number(),
  volume: z.number(),
});

const hourly = await readCSV(
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/hourly-prices.csv",
  schema,
);

console.log("=== Raw hourly head ===");
hourly.sliceHead(3).print();

// ----------------------------------------------------------------------
// Task 1 — daily mean closing price per symbol via downsample
// ----------------------------------------------------------------------
const daily = hourly.groupBy("symbol").downsample({
  timeColumn: "timestamp",
  frequency: "1D",
  aggregations: {
    price: { column: "price", fn: s.mean },
  },
});

console.log("\n=== Task 1: first 5 daily rows for AAPL ===");
daily.filter((r) => r.symbol === "AAPL").sliceHead(5).print();

// ----------------------------------------------------------------------
// Task 2 — forward-fill any per-symbol gaps in the daily series.
// NOTE: downsample drops the groupBy marker on its output, so any
// per-group window/fill work after downsample must re-apply groupBy.
// Verified by probe: without re-groupBy, mutateOverGroup runs once on
// the whole frame and bleeds values across symbols.
// ----------------------------------------------------------------------
const dailyFilled = daily.groupBy("symbol").mutateOverGroup({
  price: (g) => s.forwardFill(g.extract("price")),
});

const nullCount = dailyFilled.toRows().filter((r) => r.price == null).length;
console.log("\n=== Task 2: null count in filled daily.price ===");
console.log(`nulls in price after forward fill: ${nullCount}`);
console.log("Sample of filled daily series (head 10):");
dailyFilled.sliceHead(10).print();

// ----------------------------------------------------------------------
// Task 3 — 7-day rolling mean per symbol on the filled daily series.
// ----------------------------------------------------------------------
// Re-apply groupBy because mutateOverGroup chained off a non-grouped
// frame treats the whole frame as a single group.
const dailyWithRoll = dailyFilled.groupBy("symbol").mutateOverGroup({
  rolling_7d: (g) =>
    s.rolling({
      values: g.extract("price"),
      windowSize: 7,
      fn: s.mean,
    }),
});

console.log("\n=== Task 3: first 10 rows per symbol with 7-day rolling mean ===");
for (const sym of ["AAPL", "GOOG", "MSFT"]) {
  console.log(`-- ${sym} --`);
  dailyWithRoll.filter((r) => r.symbol === sym).sliceHead(10).print();
}

// ----------------------------------------------------------------------
// Task 4 — attach most recent hourly closing price (at or before placed_at)
// to each order via asofJoin, partitioned by symbol.
// Data only spans 2024-03-04 .. 2024-03-05 so the example dates from the
// prompt (2018-01-08, ...) don't exist in this file. Substitute equivalent
// in-range timestamps and use symbols that exist (AAPL, GOOG, MSFT).
// ----------------------------------------------------------------------
const orders = createDataFrame([
  {
    placed_at: Temporal.Instant.from("2024-03-04T14:45:00Z"),
    symbol: "AAPL",
    side: "buy",
  },
  {
    placed_at: Temporal.Instant.from("2024-03-05T09:15:00Z"),
    symbol: "GOOG",
    side: "sell",
  },
  {
    placed_at: Temporal.Instant.from("2024-03-05T18:50:00Z"),
    symbol: "AAPL",
    side: "buy",
  },
]);

// asofJoin requires the right-side data sorted ascending on the match key.
const hourlyForJoin = hourly.arrange("timestamp", "asc");

// Use a common key name on both sides — rename order's `placed_at` to
// `timestamp` so it lines up with the hourly key.
const ordersForJoin = orders.rename({ placed_at: "timestamp" });

const ordersWithPrice = ordersForJoin.asofJoin(hourlyForJoin, "timestamp", {
  direction: "backward",
  group_by: ["symbol"],
});

console.log("\n=== Task 4: orders with most-recent hourly price ===");
ordersWithPrice.print();
