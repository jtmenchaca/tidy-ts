import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

// Test data
const trades = createDataFrame([
  { time: 1, symbol: "AAPL", quantity: 100 },
  { time: 3, symbol: "GOOG", quantity: 200 },
]);

const quotes = createDataFrame([
  { time: 0, symbol: "AAPL", price: 150, bid: 149 },
  { time: 2, symbol: "GOOG", price: 2800, bid: 2799 },
]);

// 1. Basic asof join — shared key "time" matches
//    "symbol" is shared non-key: L keeps "symbol", R gets "symbol_y"
const basic = trades.asofJoin(quotes, "time");
const _basicTypeCheck: DataFrame<{
  time: number;
  symbol: string;
  quantity: number;
  price: number | undefined;
  bid: number | undefined;
  symbol_y: string | undefined;
}> = basic;

// 2. No overlapping non-key columns — clean merge with undefined
const left = createDataFrame([
  { time: 1, value: "A" },
]);
const right = createDataFrame([
  { time: 0, price: 10 },
]);
const noOverlap = left.asofJoin(right, "time");
const _noOverlapTypeCheck: DataFrame<{
  time: number;
  value: string;
  price: number | undefined;
}> = noOverlap;

// 3. With suffix options — uses Prettify + SuffixAwareAsofJoinResult path
const withSuffixes = trades.asofJoin(quotes, "time", {
  suffixes: { left: "_trade", right: "_quote" },
});
const _withSuffixesTypeCheck: DataFrame<{
  time: number;
  quantity: number;
  symbol_trade: string;
  price: number | undefined;
  bid: number | undefined;
  symbol_quote: string | undefined;
}> = withSuffixes;

// 4. Multiple shared non-key cols — join on "time"
//    "id" and "code" are shared non-key: L keeps originals, R gets _y suffix
const events = createDataFrame([
  { id: "a", time: 1, code: "X" },
]);
const logs = createDataFrame([
  { id: "a", time: 0, code: "Y", detail: "info" },
]);
const multiShared = events.asofJoin(logs, "time");
const _multiSharedTypeCheck: DataFrame<{
  id: string;
  time: number;
  code: string;
  detail: string | undefined;
  id_y: string | undefined;
  code_y: string | undefined;
}> = multiShared;
