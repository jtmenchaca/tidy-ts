// deno-lint-ignore-file no-explicit-any
import { expect } from "@std/expect";
import { createDataFrame, stats } from "@tidy-ts/dataframe";

Deno.test("downsample - grouped on filtered data", () => {
  const df = createDataFrame([
    { symbol: "AAPL", timestamp: new Date("2023-01-01T10:00:00Z"), price: 100 },
    { symbol: "AAPL", timestamp: new Date("2023-01-01T11:00:00Z"), price: 110 },
    { symbol: "AAPL", timestamp: new Date("2023-01-02T10:00:00Z"), price: 120 },
    { symbol: "GOOG", timestamp: new Date("2023-01-01T10:00:00Z"), price: 200 },
    { symbol: "GOOG", timestamp: new Date("2023-01-01T11:00:00Z"), price: 210 },
    { symbol: "GOOG", timestamp: new Date("2023-01-02T10:00:00Z"), price: 220 },
    { symbol: "MSFT", timestamp: new Date("2023-01-01T10:00:00Z"), price: 300 },
  ]);

  // Filter out MSFT entirely, keep only AAPL and GOOG
  const filtered = df.filter((r: any) => r.symbol !== "MSFT");

  const result = filtered.groupBy("symbol").downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      price: { column: "price", fn: stats.mean },
    },
  });

  const out = [...result].map((r: any) => ({
    symbol: r.symbol,
    date: r.timestamp.toISOString().slice(0, 10),
    price: r.price,
  }));

  // AAPL: day1 mean(100,110)=105, day2 mean(120)=120
  // GOOG: day1 mean(200,210)=205, day2 mean(220)=220
  expect(out.length).toBe(4);
  const aapl = out.filter((r) => r.symbol === "AAPL");
  expect(aapl[0].price).toBe(105);
  expect(aapl[1].price).toBe(120);
  const goog = out.filter((r) => r.symbol === "GOOG");
  expect(goog[0].price).toBe(205);
  expect(goog[1].price).toBe(220);
});

Deno.test("downsample - grouped, filter removes some rows within groups", () => {
  const df = createDataFrame([
    { symbol: "AAPL", timestamp: new Date("2023-01-01T10:00:00Z"), price: 100, vol: 5 },
    { symbol: "AAPL", timestamp: new Date("2023-01-01T11:00:00Z"), price: 110, vol: 15 },
    { symbol: "AAPL", timestamp: new Date("2023-01-01T12:00:00Z"), price: 90, vol: 25 },
    { symbol: "GOOG", timestamp: new Date("2023-01-01T10:00:00Z"), price: 200, vol: 10 },
    { symbol: "GOOG", timestamp: new Date("2023-01-01T11:00:00Z"), price: 210, vol: 20 },
  ]);

  // Filter to only high-volume trades
  const filtered = df.filter((r: any) => r.vol >= 15);

  const result = filtered.groupBy("symbol").downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: {
      price: { column: "price", fn: stats.mean },
    },
  });

  const out = [...result].map((r: any) => ({
    symbol: r.symbol,
    price: r.price,
  }));

  // AAPL: filtered rows are vol=15 (price=110) and vol=25 (price=90) -> mean=100
  // GOOG: filtered row is vol=20 (price=210) -> mean=210
  expect(out.length).toBe(2);
  const aapl = out.find((r) => r.symbol === "AAPL");
  expect(aapl!.price).toBe(100);
  const goog = out.find((r) => r.symbol === "GOOG");
  expect(goog!.price).toBe(210);
});

Deno.test("downsample - filter keeps all rows, grouped", () => {
  const df = createDataFrame([
    { symbol: "AAPL", timestamp: new Date("2023-01-01T10:00:00Z"), price: 100 },
    { symbol: "AAPL", timestamp: new Date("2023-01-01T11:00:00Z"), price: 110 },
    { symbol: "GOOG", timestamp: new Date("2023-01-01T10:00:00Z"), price: 200 },
  ]);

  const allKept = df.filter((r: any) => r.price > 0);
  const result = allKept.groupBy("symbol").downsample({
    timeColumn: "timestamp",
    frequency: "1D",
    aggregations: { price: { column: "price", fn: stats.mean } },
  });

  const out = [...result].map((r: any) => ({ symbol: r.symbol, price: r.price }));
  expect(out.length).toBe(2);
  expect(out.find((r) => r.symbol === "AAPL")!.price).toBe(105);
  expect(out.find((r) => r.symbol === "GOOG")!.price).toBe(200);
});
