// deno-lint-ignore-file no-explicit-any
import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("upsample - grouped on filtered data", () => {
  const df = createDataFrame([
    { symbol: "AAPL", timestamp: new Date("2023-01-01T10:00:00Z"), price: 100 },
    { symbol: "AAPL", timestamp: new Date("2023-01-01T12:00:00Z"), price: 120 },
    { symbol: "GOOG", timestamp: new Date("2023-01-01T10:00:00Z"), price: 200 },
    { symbol: "GOOG", timestamp: new Date("2023-01-01T12:00:00Z"), price: 220 },
    { symbol: "MSFT", timestamp: new Date("2023-01-01T10:00:00Z"), price: 300 },
    { symbol: "MSFT", timestamp: new Date("2023-01-01T12:00:00Z"), price: 320 },
  ]);

  // Filter out MSFT
  const filtered = df.filter((r: any) => r.symbol !== "MSFT");

  const result = filtered.groupBy("symbol").upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "forward",
  });

  // Each group should have 3 rows: 10:00, 11:00, 12:00
  expect(result.nrows()).toBe(6);

  const aapl = [...result].filter((r: any) => r.symbol === "AAPL");
  expect(aapl.length).toBe(3);
  expect((aapl[0] as any).price).toBe(100);
  expect((aapl[1] as any).price).toBe(100); // forward filled
  expect((aapl[2] as any).price).toBe(120);

  const goog = [...result].filter((r: any) => r.symbol === "GOOG");
  expect(goog.length).toBe(3);
  expect((goog[0] as any).price).toBe(200);
  expect((goog[1] as any).price).toBe(200); // forward filled
  expect((goog[2] as any).price).toBe(220);

  // No MSFT rows should appear
  const msft = [...result].filter((r: any) => r.symbol === "MSFT");
  expect(msft.length).toBe(0);
});

Deno.test("upsample - grouped, filter removes rows within groups", () => {
  const df = createDataFrame([
    { symbol: "AAPL", timestamp: new Date("2023-01-01T10:00:00Z"), price: 100, vol: 5 },
    { symbol: "AAPL", timestamp: new Date("2023-01-01T11:00:00Z"), price: 110, vol: 15 },
    { symbol: "AAPL", timestamp: new Date("2023-01-01T12:00:00Z"), price: 120, vol: 25 },
    { symbol: "GOOG", timestamp: new Date("2023-01-01T10:00:00Z"), price: 200, vol: 10 },
    { symbol: "GOOG", timestamp: new Date("2023-01-01T12:00:00Z"), price: 220, vol: 20 },
  ]);

  // Filter to high volume only: AAPL keeps 11:00+12:00, GOOG keeps 12:00 only
  const filtered = df.filter((r: any) => r.vol >= 15);

  const result = filtered.groupBy("symbol").upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "forward",
  });

  const aapl = [...result].filter((r: any) => r.symbol === "AAPL");
  // AAPL filtered: 11:00(110), 12:00(120) -> upsample hourly -> 11:00, 12:00
  expect(aapl.length).toBe(2);
  expect((aapl[0] as any).price).toBe(110);
  expect((aapl[1] as any).price).toBe(120);

  // GOOG filtered: only 12:00(220) -> single point, no upsample needed
  const goog = [...result].filter((r: any) => r.symbol === "GOOG");
  expect(goog.length).toBe(1);
  expect((goog[0] as any).price).toBe(220);
});

Deno.test("upsample - filter keeps all rows, grouped", () => {
  const df = createDataFrame([
    { symbol: "AAPL", timestamp: new Date("2023-01-01T10:00:00Z"), price: 100 },
    { symbol: "AAPL", timestamp: new Date("2023-01-01T12:00:00Z"), price: 120 },
    { symbol: "GOOG", timestamp: new Date("2023-01-01T10:00:00Z"), price: 200 },
    { symbol: "GOOG", timestamp: new Date("2023-01-01T12:00:00Z"), price: 220 },
  ]);

  const allKept = df.filter((r: any) => r.price > 0);
  const result = allKept.groupBy("symbol").upsample({
    timeColumn: "timestamp",
    frequency: "1H",
    fillMethod: "forward",
  });

  expect(result.nrows()).toBe(6); // 3 per group
  const aapl = [...result].filter((r: any) => r.symbol === "AAPL");
  expect(aapl.length).toBe(3);
  expect((aapl[1] as any).price).toBe(100); // forward filled
});
