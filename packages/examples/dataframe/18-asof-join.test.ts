// import { createDataFrame } from "@tidy-ts/dataframe";
// import { expect } from "@std/expect";
// import { test } from "@tidy-ts/shims";

// /**
//  * As-of join matches each left row to the "nearest" right row on a key column
//  * (typically time). Useful for time-series: e.g. trades to quotes, events to logs.
//  * Key column must be numeric, bigint, or Date; data should be sorted by the key.
//  */

// test("As-of join - backward (nearest prior)", () => {
//   // Trades at times 1, 3, 6
//   const trades = createDataFrame([
//     { time: 1, symbol: "AAPL", quantity: 100 },
//     { time: 3, symbol: "AAPL", quantity: 200 },
//     { time: 6, symbol: "AAPL", quantity: 50 },
//   ]);

//   // Quotes at times 0, 2, 4, 7
//   const quotes = createDataFrame([
//     { time: 0, symbol: "AAPL", bid: 149.0, ask: 150.0 },
//     { time: 2, symbol: "AAPL", bid: 150.0, ask: 151.0 },
//     { time: 4, symbol: "AAPL", bid: 151.0, ask: 152.0 },
//     { time: 7, symbol: "AAPL", bid: 152.0, ask: 153.0 },
//   ]);

//   const joined = trades.asofJoin(quotes, "time", { direction: "backward" });

//   joined.print("Trades joined to nearest prior quote:");

//   expect(joined.nrows()).toBe(3);
//   // Right-side "symbol" is suffixed as symbol_y when it conflicts with left
//   expect(joined.toArray()).toEqual([
//     { time: 1, symbol: "AAPL", quantity: 100, symbol_y: "AAPL", bid: 149.0, ask: 150.0 },
//     { time: 3, symbol: "AAPL", quantity: 200, symbol_y: "AAPL", bid: 150.0, ask: 151.0 },
//     { time: 6, symbol: "AAPL", quantity: 50, symbol_y: "AAPL", bid: 151.0, ask: 152.0 },
//   ]);
// });

// test("As-of join - forward (nearest future)", () => {
//   const events = createDataFrame([
//     { timestamp: 1, event: "start" },
//     { timestamp: 5, event: "checkpoint" },
//   ]);

//   const logs = createDataFrame([
//     { timestamp: 2, message: "processing" },
//     { timestamp: 6, message: "done" },
//   ]);

//   const joined = events.asofJoin(logs, "timestamp", {
//     direction: "forward",
//     suffixes: { right: "_log" },
//   });

//   joined.print("Events joined to next log entry:");

//   expect(joined.nrows()).toBe(2);
//   expect(joined.toArray()).toEqual([
//     { timestamp: 1, event: "start", message: "processing" },
//     { timestamp: 5, event: "checkpoint", message: "done" },
//   ]);
// });

// test("As-of join - nearest (closest in either direction)", () => {
//   const orders = createDataFrame([
//     { time: 1, order_id: "a" },
//     { time: 4, order_id: "b" },
//     { time: 7, order_id: "c" },
//   ]);

//   const prices = createDataFrame([
//     { time: 0, price: 10 },
//     { time: 3, price: 20 },
//     { time: 6, price: 30 },
//     { time: 9, price: 40 },
//   ]);

//   const joined = orders.asofJoin(prices, "time", { direction: "nearest" });

//   joined.print("Orders joined to nearest price snapshot:");

//   expect(joined.nrows()).toBe(3);
//   expect(joined.toArray()).toEqual([
//     { time: 1, order_id: "a", price: 10 }, // 1 is closer to 0 than 3
//     { time: 4, order_id: "b", price: 20 }, // 4 is closer to 3 than 6 (tie → earlier)
//     { time: 7, order_id: "c", price: 30 }, // 7 is closer to 6 than 9
//   ]);
// });

// test("As-of join - with tolerance", () => {
//   const trades = createDataFrame([
//     { time: 1, qty: 10 },
//     { time: 10, qty: 20 },
//     { time: 100, qty: 5 },
//   ]);

//   const quotes = createDataFrame([
//     { time: 0, price: 100 },
//     { time: 5, price: 101 },
//     { time: 95, price: 102 },
//   ]);

//   // Backward: only match if left_time - right_time <= 5
//   const joined = trades.asofJoin(quotes, "time", {
//     direction: "backward",
//     tolerance: 5,
//   });

//   joined.print("Trades joined with tolerance 5:");

//   expect(joined.nrows()).toBe(3);
//   expect(joined.toArray()).toEqual([
//     { time: 1, qty: 10, price: 100 },   // 1-0=1 <= 5
//     { time: 10, qty: 20, price: 101 },  // 10-5=5 <= 5
//     { time: 100, qty: 5, price: 102 },  // 100-95=5 <= 5
//   ]);
// });

// test("As-of join - with group_by (e.g. per symbol)", () => {
//   const trades = createDataFrame([
//     { time: 1, symbol: "AAPL", quantity: 100 },
//     { time: 2, symbol: "GOOG", quantity: 50 },
//     { time: 3, symbol: "AAPL", quantity: 200 },
//     { time: 4, symbol: "GOOG", quantity: 75 },
//   ]);

//   const quotes = createDataFrame([
//     { time: 0, symbol: "AAPL", bid: 149.0 },
//     { time: 0, symbol: "GOOG", bid: 140.0 },
//     { time: 2, symbol: "AAPL", bid: 150.0 },
//     { time: 2, symbol: "GOOG", bid: 141.0 },
//     { time: 4, symbol: "AAPL", bid: 151.0 },
//     { time: 4, symbol: "GOOG", bid: 142.0 },
//   ]);

//   const joined = trades.asofJoin(quotes, "time", {
//     direction: "backward",
//     group_by: ["symbol"],
//   });

//   joined.print("Trades joined to quotes per symbol:");

//   expect(joined.nrows()).toBe(4);
//   // Right-side "symbol" is suffixed as symbol_y when it conflicts with left
//   expect(joined.toArray()).toEqual([
//     { time: 1, symbol: "AAPL", quantity: 100, symbol_y: "AAPL", bid: 149.0 },
//     { time: 2, symbol: "GOOG", quantity: 50, symbol_y: "GOOG", bid: 141.0 },
//     { time: 3, symbol: "AAPL", quantity: 200, symbol_y: "AAPL", bid: 150.0 },
//     { time: 4, symbol: "GOOG", quantity: 75, symbol_y: "GOOG", bid: 142.0 },
//   ]);
// });
