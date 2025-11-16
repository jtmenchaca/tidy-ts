import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("asofJoin() - basic backward join", () => {
  const trades = createDataFrame([
    { time: 1, symbol: "AAPL", quantity: 100 },
    { time: 3, symbol: "AAPL", quantity: 200 },
    { time: 6, symbol: "AAPL", quantity: 150 },
  ]);

  const quotes = createDataFrame([
    { time: 0, symbol: "AAPL", price: 150.0 },
    { time: 2, symbol: "AAPL", price: 151.0 },
    { time: 4, symbol: "AAPL", price: 152.0 },
    { time: 7, symbol: "AAPL", price: 153.0 },
  ]);

  const result = trades.asofJoin(quotes, "time", { direction: "backward" });

  expect(result.nrows()).toBe(3);
  expect(result[0].price).toBe(150.0); // matches time: 0 (backward)
  expect(result[1].price).toBe(151.0); // matches time: 2 (backward)
  expect(result[2].price).toBe(152.0); // matches time: 4 (backward)
});

Deno.test("asofJoin() - forward join", () => {
  const events = createDataFrame([
    { timestamp: 1, event: "start" },
    { timestamp: 3, event: "middle" },
    { timestamp: 5, event: "end" },
  ]);

  const measurements = createDataFrame([
    { timestamp: 2, value: 10 },
    { timestamp: 4, value: 20 },
    { timestamp: 6, value: 30 },
  ]);

  const result = events.asofJoin(measurements, "timestamp", {
    direction: "forward",
  });

  expect(result.nrows()).toBe(3);
  expect(result[0].value).toBe(10); // matches timestamp: 2 (forward)
  expect(result[1].value).toBe(20); // matches timestamp: 4 (forward)
  expect(result[2].value).toBe(30); // matches timestamp: 6 (forward)
});

Deno.test("asofJoin() - nearest join", () => {
  const orders = createDataFrame([
    { time: 1, order_id: "A" },
    { time: 5, order_id: "B" },
    { time: 9, order_id: "C" },
  ]);

  const prices = createDataFrame([
    { time: 0, price: 100 },
    { time: 3, price: 110 },
    { time: 6, price: 120 },
    { time: 10, price: 130 },
  ]);

  const result = orders.asofJoin(prices, "time", { direction: "nearest" });

  expect(result.nrows()).toBe(3);
  expect(result[0].price).toBe(100); // nearest to time: 1 is time: 0 (distance 1)
  expect(result[1].price).toBe(120); // nearest to time: 5 is time: 6 (distance 1)
  expect(result[2].price).toBe(130); // nearest to time: 9 is time: 10 (distance 1)
});

Deno.test("asofJoin() - with tolerance", () => {
  const trades = createDataFrame([
    { time: 1, symbol: "AAPL" },
    { time: 5, symbol: "AAPL" },
    { time: 10, symbol: "AAPL" },
  ]);

  const quotes = createDataFrame([
    { time: 0, price: 150 },
    { time: 3, price: 151 },
    { time: 7, price: 152 },
  ]);

  const result = trades.asofJoin(quotes, "time", {
    direction: "backward",
    tolerance: 2, // only match within 2 units
  });

  expect(result.nrows()).toBe(3);
  expect(result[0].price).toBe(150); // time: 1 matches time: 0 (within tolerance)
  expect(result[1].price).toBe(151); // time: 5 matches time: 3 (within tolerance)
  expect(result[2].price).toBeUndefined(); // time: 10 has no match within tolerance
});

Deno.test("asofJoin() - with group_by", () => {
  const trades = createDataFrame([
    { time: 1, symbol: "AAPL", quantity: 100 },
    { time: 2, symbol: "MSFT", quantity: 200 },
    { time: 3, symbol: "AAPL", quantity: 150 },
  ]);

  const quotes = createDataFrame([
    { time: 0, symbol: "AAPL", price: 150 },
    { time: 1, symbol: "MSFT", price: 300 },
    { time: 2, symbol: "AAPL", price: 151 },
  ]);

  const result = trades.asofJoin(quotes, "time", {
    direction: "backward",
    group_by: ["symbol"],
  });

  expect(result.nrows()).toBe(3);
  expect(result[0].price).toBe(150); // AAPL at time: 1 matches AAPL at time: 0
  expect(result[1].price).toBe(300); // MSFT at time: 2 matches MSFT at time: 1
  expect(result[2].price).toBe(151); // AAPL at time: 3 matches AAPL at time: 2
});
