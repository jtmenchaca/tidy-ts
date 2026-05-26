import { createDataFrame } from "@tidy-ts/dataframe";

const trades = createDataFrame([
  { time: new Date("2024-03-04T09:35:00Z"), symbol: "AAPL" },
  { time: new Date("2024-03-04T11:17:00Z"), symbol: "AAPL" },
  { time: new Date("2024-03-04T09:40:00Z"), symbol: "MSFT" },
]);

const quotes = createDataFrame([
  { time: new Date("2024-03-04T09:30:00Z"), symbol: "AAPL", price: 175 },
  { time: new Date("2024-03-04T10:30:00Z"), symbol: "AAPL", price: 176 },
  { time: new Date("2024-03-04T09:30:00Z"), symbol: "MSFT", price: 410 },
]);

const joined = trades.asofJoin(quotes, "time", { group_by: ["symbol"] });
console.log("columns:", joined.columns());
console.log("rows:", joined.toRows());
