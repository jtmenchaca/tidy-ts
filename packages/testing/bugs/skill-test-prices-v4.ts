import {
  readCSV,
  stats as s,
  writeCSV,
} from "@tidy-ts/dataframe";
import { z } from "zod";

const CSV_PATH =
  "/Users/jtmenchaca/tidy-ts/packages/testing/fixtures/hourly-prices.csv";
const OUT_PATH =
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/daily-prices.csv";

const schema = z.object({
  timestamp: z.coerce.date(),
  symbol: z.string(),
  price: z.number(),
  volume: z.number(),
});

// 1. Load CSV with timestamp parsed as Date
const hourly = await readCSV(CSV_PATH, schema);
hourly.print("Hourly (head):");

// 2. Per-symbol 6-hour rolling average of price.
// Use mutateOverGroup so rolling resets at each symbol boundary.
const withRolling = hourly
  .arrange("symbol", "timestamp")
  .groupBy("symbol")
  .mutateOverGroup({
    price_rolling_6h: (g) =>
      s.rolling({ values: g.extract("price"), windowSize: 6, fn: s.mean }),
  })
  .ungroup();

withRolling.sliceHead(8).print("With 6h rolling average (head, AAPL):");

// 3. Daily summaries per (symbol, day):
//    mean price, total volume, count of hourly observations.
// Use downsample (hourly -> daily) per the time-series rule.
const daily = withRolling
  .groupBy("symbol")
  .downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      mean_price: { column: "price", fn: s.mean },
      total_volume: { column: "volume", fn: s.sum },
      n_obs: { column: "price", fn: (values) => values.length },
    },
  })
  .ungroup();

daily.print("Daily summary:");

// 4. For each symbol, the day with the highest total volume.
const topVolumeDays = daily
  .groupBy("symbol")
  .sliceMax("total_volume", 1)
  .ungroup()
  .select("symbol", "timestamp", "total_volume");

topVolumeDays.print("Top-volume day per symbol:");

// 5. Write daily summary table to CSV.
await writeCSV(daily, OUT_PATH);
console.log(`Wrote daily summary to ${OUT_PATH}`);
