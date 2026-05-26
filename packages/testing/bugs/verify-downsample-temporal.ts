import { readCSV, stats as s } from "@tidy-ts/dataframe";
import { zInstant, zPlainDateTime } from "@tidy-ts/shims";
import { z } from "zod";

// === Case 1: zInstant input (Temporal.Instant) ===
const csv1 = `timestamp,symbol,price
2024-03-04T09:30:00Z,AAPL,175.5
2024-03-04T10:30:00Z,AAPL,175.4
2024-03-04T11:30:00Z,AAPL,175.1
2024-03-05T09:30:00Z,AAPL,180.0`;

const schema1 = z.object({
  timestamp: zInstant,
  symbol: z.string(),
  price: z.number(),
});

const df1 = await readCSV(csv1, schema1);
console.log("=== zInstant input ===");
console.log("first timestamp class:", df1.timestamp[0].constructor.name);

try {
  const daily = df1.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      mean_price: { column: "price", fn: s.mean },
    },
  });
  console.log("downsample succeeded; result rows:", daily.nrows());
  console.log("first daily row:", daily.toRows()[0]);
  console.log("daily.timestamp[0] class:", daily.timestamp[0]?.constructor?.name);
} catch (e) {
  console.log("downsample failed:", String(e).slice(0, 300));
}

// === Case 2: zPlainDateTime input ===
const csv2 = `timestamp,price
2024-03-04T09:30:00,1
2024-03-04T10:30:00,2
2024-03-05T09:30:00,3`;

const schema2 = z.object({
  timestamp: zPlainDateTime,
  price: z.number(),
});

const df2 = await readCSV(csv2, schema2);
console.log("\n=== zPlainDateTime input ===");
console.log("first timestamp class:", df2.timestamp[0].constructor.name);

try {
  const daily2 = df2.downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      mean_price: { column: "price", fn: s.mean },
    },
  });
  console.log("downsample succeeded; result rows:", daily2.nrows());
} catch (e) {
  console.log("downsample failed:", String(e).slice(0, 300));
}
