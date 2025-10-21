import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("asofJoin - basic backward join with numbers", () => {
  const left = createDataFrame([
    { time: 1, value: "A" },
    { time: 3, value: "B" },
    { time: 6, value: "C" },
  ]);

  const right = createDataFrame([
    { time: 0, price: 10 },
    { time: 2, price: 20 },
    { time: 4, price: 30 },
    { time: 7, price: 40 },
  ]);

  const result = left.asofJoin(right, "time", { direction: "backward" });

  expect(result.toArray()).toEqual([
    { time: 1, value: "A", price: 10 }, // matches time: 0 (backward)
    { time: 3, value: "B", price: 20 }, // matches time: 2 (backward)
    { time: 6, value: "C", price: 30 }, // matches time: 4 (backward)
  ]);
});

Deno.test("asofJoin - basic forward join with numbers", () => {
  const left = createDataFrame([
    { time: 1, value: "A" },
    { time: 3, value: "B" },
    { time: 6, value: "C" },
  ]);

  const right = createDataFrame([
    { time: 0, price: 10 },
    { time: 2, price: 20 },
    { time: 4, price: 30 },
    { time: 7, price: 40 },
  ]);

  const result = left.asofJoin(right, "time", { direction: "forward" });

  expect(result.toArray()).toEqual([
    { time: 1, value: "A", price: 20 }, // matches time: 2 (forward)
    { time: 3, value: "B", price: 30 }, // matches time: 4 (forward)
    { time: 6, value: "C", price: 40 }, // matches time: 7 (forward)
  ]);
});

Deno.test("asofJoin - nearest join with numbers", () => {
  const left = createDataFrame([
    { time: 1, value: "A" },
    { time: 3, value: "B" },
    { time: 5, value: "C" },
  ]);

  const right = createDataFrame([
    { time: 0, price: 10 },
    { time: 2, price: 20 },
    { time: 4, price: 30 },
    { time: 6, price: 40 },
  ]);

  const result = left.asofJoin(right, "time", { direction: "nearest" });

  expect(result.toArray()).toEqual([
    { time: 1, value: "A", price: 10 }, // nearest to 0 (distance 1)
    { time: 3, value: "B", price: 20 }, // nearest to 2 (distance 1) vs 4 (distance 1), picks earlier
    { time: 5, value: "C", price: 30 }, // nearest to 4 (distance 1) vs 6 (distance 1), picks earlier
  ]);
});

Deno.test("asofJoin - with tolerance", () => {
  const left = createDataFrame([
    { time: 1, value: "A" },
    { time: 5, value: "B" },
    { time: 10, value: "C" },
  ]);

  const right = createDataFrame([
    { time: 0, price: 10 },
    { time: 3, price: 20 },
    { time: 8, price: 30 },
  ]);

  const result = left.asofJoin(right, "time", {
    direction: "backward",
    tolerance: 2,
  });

  expect(result.toArray()).toEqual([
    { time: 1, value: "A", price: 10 }, // 0 is within tolerance (1 - 0 = 1 <= 2)
    { time: 5, value: "B", price: 20 }, // 3 is within tolerance (5 - 3 = 2 <= 2)
    { time: 10, value: "C", price: 30 }, // 8 is within tolerance (10 - 8 = 2 <= 2)
  ]);
});

Deno.test("asofJoin - with strict tolerance", () => {
  const left = createDataFrame([
    { time: 1, value: "A" },
    { time: 5, value: "B" },
    { time: 10, value: "C" },
  ]);

  const right = createDataFrame([
    { time: 0, price: 10 },
    { time: 3, price: 20 },
    { time: 8, price: 30 },
  ]);

  const result = left.asofJoin(right, "time", {
    direction: "backward",
    tolerance: 1,
  });

  expect(result.toArray()).toEqual([
    { time: 1, value: "A", price: 10 }, // 0 is within tolerance (1 - 0 = 1 <= 1)
    { time: 5, value: "B", price: undefined }, // 3 is NOT within tolerance (5 - 3 = 2 > 1)
    { time: 10, value: "C", price: undefined }, // 8 is NOT within tolerance (10 - 8 = 2 > 1)
  ]);
});

Deno.test("asofJoin - with dates", () => {
  const left = createDataFrame([
    { timestamp: new Date("2023-01-01T10:00:00"), event: "A" },
    { timestamp: new Date("2023-01-01T10:05:00"), event: "B" },
    { timestamp: new Date("2023-01-01T10:15:00"), event: "C" },
  ]);

  const right = createDataFrame([
    { timestamp: new Date("2023-01-01T09:58:00"), price: 10 },
    { timestamp: new Date("2023-01-01T10:02:00"), price: 20 },
    { timestamp: new Date("2023-01-01T10:12:00"), price: 30 },
  ]);

  const result = left.asofJoin(right, "timestamp", { direction: "backward" });

  expect(result.toArray()).toEqual([
    { timestamp: new Date("2023-01-01T10:00:00"), event: "A", price: 10 },
    { timestamp: new Date("2023-01-01T10:05:00"), event: "B", price: 20 },
    { timestamp: new Date("2023-01-01T10:15:00"), event: "C", price: 30 },
  ]);
});

Deno.test("asofJoin - with group_by", () => {
  const left = createDataFrame([
    { symbol: "AAPL", time: 1, order: "buy" },
    { symbol: "AAPL", time: 3, order: "sell" },
    { symbol: "MSFT", time: 2, order: "buy" },
    { symbol: "MSFT", time: 4, order: "sell" },
  ]);

  const right = createDataFrame([
    { symbol: "AAPL", time: 0, price: 100 },
    { symbol: "AAPL", time: 2, price: 102 },
    { symbol: "MSFT", time: 1, price: 200 },
    { symbol: "MSFT", time: 3, price: 205 },
  ]);

  const result = left.asofJoin(right, "time", {
    direction: "backward",
    group_by: ["symbol"],
  });

  expect(result.toArray()).toEqual([
    { symbol: "AAPL", time: 1, order: "buy", price: 100, symbol_y: "AAPL" }, // AAPL: 0 is closest backward
    { symbol: "AAPL", time: 3, order: "sell", price: 102, symbol_y: "AAPL" }, // AAPL: 2 is closest backward
    { symbol: "MSFT", time: 2, order: "buy", price: 200, symbol_y: "MSFT" }, // MSFT: 1 is closest backward
    { symbol: "MSFT", time: 4, order: "sell", price: 205, symbol_y: "MSFT" }, // MSFT: 3 is closest backward
  ]);
});

Deno.test("asofJoin - no matches", () => {
  const left = createDataFrame([
    { time: 1, value: "A" },
    { time: 2, value: "B" },
  ]);

  const right = createDataFrame([
    { time: 5, price: 10 },
    { time: 6, price: 20 },
  ]);

  const result = left.asofJoin(right, "time", { direction: "backward" });

  expect(result.toArray()).toEqual([
    { time: 1, value: "A", price: undefined },
    { time: 2, value: "B", price: undefined },
  ]);
});

Deno.test("asofJoin - column name conflicts with suffix", () => {
  const left = createDataFrame([
    { id: 1, time: 1, value: "A" },
    { id: 2, time: 3, value: "B" },
  ]);

  const right = createDataFrame([
    { id: 10, time: 0, value: "X" },
    { id: 20, time: 2, value: "Y" },
  ]);

  const result = left.asofJoin(right, "time", {
    direction: "backward",
    suffixes: { right: "_r" },
  });

  expect(result.toArray()).toEqual([
    { id: 1, time: 1, value: "A", id_r: 10, value_r: "X" },
    { id: 2, time: 3, value: "B", id_r: 20, value_r: "Y" },
  ]);
});

Deno.test("asofJoin - empty left DataFrame", () => {
  const left = createDataFrame<{ time: number; value: string }>([]);

  const right = createDataFrame([
    { time: 0, price: 10 },
    { time: 2, price: 20 },
  ]);

  const result = left.asofJoin(right, "time", { direction: "backward" });

  expect(result.toArray()).toEqual([]);
  expect(result.nrows()).toBe(0);
});

Deno.test("asofJoin - empty right DataFrame", () => {
  const left = createDataFrame([
    { time: 1, value: "A" },
    { time: 3, value: "B" },
  ]);

  const right = createDataFrame<{ time: number; price: number }>([]);

  const result = left.asofJoin(right, "time", { direction: "backward" });

  expect(result.toArray()).toEqual([
    { time: 1, value: "A", price: undefined },
    { time: 3, value: "B", price: undefined },
  ]);
});

Deno.test("asofJoin - with bigint keys", () => {
  const left = createDataFrame([
    { time: 1n, value: "A" },
    { time: 3n, value: "B" },
    { time: 6n, value: "C" },
  ]);

  const right = createDataFrame([
    { time: 0n, price: 10 },
    { time: 2n, price: 20 },
    { time: 4n, price: 30 },
  ]);

  const result = left.asofJoin(right, "time", { direction: "backward" });

  expect(result.toArray()).toEqual([
    { time: 1n, value: "A", price: 10 },
    { time: 3n, value: "B", price: 20 },
    { time: 6n, value: "C", price: 30 },
  ]);
});

Deno.test("asofJoin - exact matches", () => {
  const left = createDataFrame([
    { time: 1, value: "A" },
    { time: 2, value: "B" },
    { time: 3, value: "C" },
  ]);

  const right = createDataFrame([
    { time: 1, price: 10 },
    { time: 2, price: 20 },
    { time: 3, price: 30 },
  ]);

  const result = left.asofJoin(right, "time", { direction: "backward" });

  expect(result.toArray()).toEqual([
    { time: 1, value: "A", price: 10 },
    { time: 2, value: "B", price: 20 },
    { time: 3, value: "C", price: 30 },
  ]);
});

Deno.test("asofJoin - mixed group matching", () => {
  const left = createDataFrame([
    { symbol: "AAPL", time: 1, order: "buy" },
    { symbol: "MSFT", time: 1, order: "buy" },
    { symbol: "AAPL", time: 5, order: "sell" },
  ]);

  const right = createDataFrame([
    { symbol: "AAPL", time: 0, price: 100 },
    { symbol: "MSFT", time: 3, price: 200 }, // No match for MSFT at time 1 (backward)
    { symbol: "AAPL", time: 4, price: 105 },
  ]);

  const result = left.asofJoin(right, "time", {
    direction: "backward",
    group_by: ["symbol"],
  });

  expect(result.toArray()).toEqual([
    { symbol: "AAPL", time: 1, order: "buy", price: 100, symbol_y: "AAPL" }, // AAPL: 0 is closest backward
    {
      symbol: "MSFT",
      time: 1,
      order: "buy",
      price: undefined,
      symbol_y: undefined,
    }, // MSFT: no backward match
    { symbol: "AAPL", time: 5, order: "sell", price: 105, symbol_y: "AAPL" }, // AAPL: 4 is closest backward
  ]);
});

Deno.test("asofJoin - forward with no future matches", () => {
  const left = createDataFrame([
    { time: 5, value: "A" },
    { time: 10, value: "B" },
  ]);

  const right = createDataFrame([
    { time: 1, price: 10 },
    { time: 2, price: 20 },
  ]);

  const result = left.asofJoin(right, "time", { direction: "forward" });

  expect(result.toArray()).toEqual([
    { time: 5, value: "A", price: undefined }, // No forward match
    { time: 10, value: "B", price: undefined }, // No forward match
  ]);
});
