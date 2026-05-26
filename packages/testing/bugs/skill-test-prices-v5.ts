import { readCSV, stats as s, writeCSV } from "@tidy-ts/dataframe";
import { Temporal, zInstant } from "@tidy-ts/shims";
import { z } from "zod";

const CSV_PATH =
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/hourly-prices.csv";
const OUT_PATH = "/Users/jtmenchaca/tidy-ts/prices-15min.csv";

const schema = z.object({
  timestamp: zInstant,
  symbol: z.string(),
  price: z.number(),
  volume: z.number(),
});

const df = await readCSV(CSV_PATH, schema);

console.log(`Loaded ${df.nrows()} rows`);

// --- 1. Per-symbol earliest/latest timestamp + count ---
const perSymbol = df
  .groupBy("symbol")
  .summarize({
    earliest: (g) => s.min(g.timestamp),
    latest: (g) => s.max(g.timestamp),
    n_obs: (g) => g.nrows(),
  });

perSymbol.print("Per-symbol coverage:");
console.log("Coverage rows (readable):");
for (const r of perSymbol.toRows()) {
  console.log(
    `  ${r.symbol}: ${r.earliest?.toString()} -> ${r.latest?.toString()} (n=${r.n_obs})`,
  );
}

// --- 2. 4-hour (4-row) rolling average per symbol, looking back ---
const withRolling = df
  .arrange("symbol", "timestamp")
  .groupBy("symbol")
  .mutateOverGroup({
    price_ma4: (g) =>
      s.rolling({ values: g.extract("price"), windowSize: 4, fn: s.mean }),
  })
  .ungroup();

withRolling.sliceHead(8).print("First 8 rows with 4-hour moving average:");

// --- 3. 15-minute buckets per symbol: avg price + total volume ---
const buckets15 = df
  .groupBy("symbol")
  .downsample({
    timeColumn: "timestamp",
    frequency: Temporal.Duration.from({ minutes: 15 }),
    aggregations: {
      avg_price: { column: "price", fn: s.mean },
      total_volume: { column: "volume", fn: s.sum },
    },
  });

buckets15.sliceHead(8).print("First 8 fifteen-minute buckets:");
console.log(`Total 15-min bucket rows: ${buckets15.nrows()}`);

// --- 4. Single hour with largest total volume across symbols ---
const hourlyTotals = df
  .groupBy("timestamp")
  .summarize({
    total_volume: (g) => s.sum(g.volume),
  })
  .arrange("total_volume", "desc");

const topHour = hourlyTotals.sliceHead(1);
topHour.print("Top hour by total volume across symbols:");
const topRow = topHour.toRows()[0];
console.log(
  `Top hour (readable): ${topRow.timestamp.toString()} -> volume=${topRow.total_volume}`,
);

// --- 5. Write the 15-minute summary ---
await writeCSV(buckets15, OUT_PATH);
console.log(`Wrote ${OUT_PATH}`);
