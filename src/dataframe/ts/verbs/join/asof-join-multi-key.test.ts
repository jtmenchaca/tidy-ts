import { expect } from "@std/expect";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

Deno.test("asofJoin - basic backward join", () => {
  const left = createDataFrame([
    { timestamp: 100, symbol: "AAPL", price: 150 },
    { timestamp: 200, symbol: "AAPL", price: 155 },
    { timestamp: 300, symbol: "AAPL", price: 160 },
  ]);

  const right = createDataFrame([
    { timestamp: 90, symbol: "AAPL", volume: 1000 },
    { timestamp: 150, symbol: "AAPL", volume: 2000 },
    { timestamp: 250, symbol: "AAPL", volume: 3000 },
  ]);

  const result = left.asofJoin(right, "timestamp");

  // Type check: asof join should preserve all left columns and add right columns as possibly undefined
  const _basicTypeCheck: DataFrame<{
    timestamp: number; // Key field (required)
    symbol: string; // Left column (required)
    price: number; // Left column (required)
    symbol_y: string | undefined; // Right column (optional due to asof join)
    volume: number | undefined; // Right column (optional due to asof join)
  }> = result;

  expect(result.toArray()).toEqual([
    {
      timestamp: 100,
      symbol: "AAPL",
      price: 150,
      symbol_y: "AAPL",
      volume: 1000,
    }, // matches 90
    {
      timestamp: 200,
      symbol: "AAPL",
      price: 155,
      symbol_y: "AAPL",
      volume: 2000,
    }, // matches 150
    {
      timestamp: 300,
      symbol: "AAPL",
      price: 160,
      symbol_y: "AAPL",
      volume: 3000,
    }, // matches 250
  ]);
});

Deno.test("asofJoin - forward join", () => {
  const trades = createDataFrame([
    { time: 100, price: 50.0 },
    { time: 200, price: 51.0 },
    { time: 300, price: 52.0 },
  ]);

  const quotes = createDataFrame([
    { time: 150, bid: 49.5, ask: 50.5 },
    { time: 250, bid: 50.5, ask: 51.5 },
    { time: 350, bid: 51.5, ask: 52.5 },
  ]);

  const result = trades.asofJoin(quotes, "time", {
    direction: "forward",
  });

  // Type check: forward asof join
  const _forwardTypeCheck: DataFrame<{
    time: number; // Key field (required)
    price: number; // Left column (required)
    bid: number | undefined; // Right column (optional)
    ask: number | undefined; // Right column (optional)
  }> = result;

  expect(result.toArray()).toEqual([
    { time: 100, price: 50.0, bid: 49.5, ask: 50.5 }, // matches 150 (forward)
    { time: 200, price: 51.0, bid: 50.5, ask: 51.5 }, // matches 250 (forward)
    { time: 300, price: 52.0, bid: 51.5, ask: 52.5 }, // matches 350 (forward)
  ]);
});

Deno.test("asofJoin - nearest join", () => {
  const events = createDataFrame([
    { timestamp: 100, event: "start" },
    { timestamp: 250, event: "middle" },
    { timestamp: 400, event: "end" },
  ]);

  const measurements = createDataFrame([
    { timestamp: 80, value: 10 },
    { timestamp: 120, value: 20 },
    { timestamp: 240, value: 30 },
    { timestamp: 260, value: 40 },
    { timestamp: 380, value: 50 },
  ]);

  const result = events.asofJoin(measurements, "timestamp", {
    direction: "nearest",
  });

  // Type check: nearest asof join
  const _nearestTypeCheck: DataFrame<{
    timestamp: number; // Key field (required)
    event: string; // Left column (required)
    value: number | undefined; // Right column (optional)
  }> = result;

  expect(result.toArray()).toEqual([
    { timestamp: 100, event: "start", value: 10 }, // nearest to 80 (closer than 120)
    { timestamp: 250, event: "middle", value: 30 }, // nearest to 240 (closer than 260)
    { timestamp: 400, event: "end", value: 50 }, // nearest to 380
  ]);
});

Deno.test("asofJoin - with tolerance", () => {
  const orders = createDataFrame([
    { time: 100, order_id: 1, quantity: 100 },
    { time: 200, order_id: 2, quantity: 200 },
    { time: 350, order_id: 3, quantity: 150 },
  ]);

  const prices = createDataFrame([
    { time: 95, price: 50.0 },
    { time: 180, price: 51.0 },
    { time: 400, price: 52.0 },
  ]);

  const result = orders.asofJoin(prices, "time", {
    direction: "backward",
    tolerance: 20, // within 20 time units
  });

  // Type check: asof join with tolerance
  const _toleranceTypeCheck: DataFrame<{
    time: number; // Key field (required)
    order_id: number; // Left column (required)
    quantity: number; // Left column (required)
    price: number | undefined; // Right column (optional)
  }> = result;

  expect(result.toArray()).toEqual([
    { time: 100, order_id: 1, quantity: 100, price: 50.0 }, // 95 within tolerance
    { time: 200, order_id: 2, quantity: 200, price: 51.0 }, // 180 within tolerance
    { time: 350, order_id: 3, quantity: 150, price: undefined }, // 400 too far forward
  ]);
});

Deno.test("asofJoin - with group_by", () => {
  const trades = createDataFrame([
    { time: 100, symbol: "AAPL", price: 150 },
    { time: 200, symbol: "AAPL", price: 155 },
    { time: 150, symbol: "MSFT", price: 250 },
    { time: 250, symbol: "MSFT", price: 255 },
  ]);

  const quotes = createDataFrame([
    { time: 90, symbol: "AAPL", bid: 149, ask: 151 },
    { time: 180, symbol: "AAPL", bid: 154, ask: 156 },
    { time: 140, symbol: "MSFT", bid: 249, ask: 251 },
    { time: 240, symbol: "MSFT", bid: 254, ask: 256 },
  ]);

  const result = trades.asofJoin(quotes, "time", {
    group_by: ["symbol"],
  });

  // Type check: asof join with grouping
  const _groupByTypeCheck: DataFrame<{
    time: number; // Key field (required)
    symbol: string; // Left column and group key (required)
    price: number; // Left column (required)
    bid: number | undefined; // Right column (optional)
    ask: number | undefined; // Right column (optional)
    symbol_y: string | undefined; // Right conflicting column with suffix (optional)
  }> = result;

  expect(result.toArray()).toEqual([
    {
      time: 100,
      symbol: "AAPL",
      price: 150,
      symbol_y: "AAPL",
      bid: 149,
      ask: 151,
    }, // matches AAPL 90
    {
      time: 200,
      symbol: "AAPL",
      price: 155,
      symbol_y: "AAPL",
      bid: 154,
      ask: 156,
    }, // matches AAPL 180
    {
      time: 150,
      symbol: "MSFT",
      price: 250,
      symbol_y: "MSFT",
      bid: 249,
      ask: 251,
    }, // matches MSFT 140
    {
      time: 250,
      symbol: "MSFT",
      price: 255,
      symbol_y: "MSFT",
      bid: 254,
      ask: 256,
    }, // matches MSFT 240
  ]);
});

Deno.test("asofJoin - with suffixes for conflicting columns", () => {
  const events = createDataFrame([
    { timestamp: 100, value: "event1" },
    { timestamp: 200, value: "event2" },
  ]);

  const measurements = createDataFrame([
    { timestamp: 90, value: 42 },
    { timestamp: 180, value: 84 },
  ]);

  const result = events.asofJoin(measurements, "timestamp", {
    suffixes: { right: "_measure" },
  });

  // Type check: asof join with suffixes for conflicting columns
  const _suffixesTypeCheck: DataFrame<{
    timestamp: number; // Key field (required)
    value: string; // Left column (required)
    value_measure: number | undefined; // Right column with custom suffix (optional due to asof join)
  }> = result;

  expect(result.toArray()).toEqual([
    { timestamp: 100, value: "event1", value_measure: 42 },
    { timestamp: 200, value: "event2", value_measure: 84 },
  ]);
});
