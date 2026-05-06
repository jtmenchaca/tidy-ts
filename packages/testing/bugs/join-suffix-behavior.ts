import { createDataFrame } from "@tidy-ts/dataframe";

// What happens at RUNTIME when left and right share a non-key column?

const left = createDataFrame([
  { time: 1, symbol: "AAPL", quantity: 100 },
  { time: 3, symbol: "GOOG", quantity: 200 },
]);

const right = createDataFrame([
  { time: 0, symbol: "AAPL", price: 150 },
  { time: 2, symbol: "GOOG", price: 2800 },
]);

console.log("=== leftJoin (shared non-key: symbol) ===");
const lj = left.leftJoin(right, "time");
lj.print();
console.log("columns:", lj.columns());

console.log("\n=== innerJoin (shared non-key: symbol) ===");
const ij = left.innerJoin(right, "time");
ij.print();
console.log("columns:", ij.columns());

console.log("\n=== asofJoin (shared non-key: symbol) ===");
const aj = left.asofJoin(right, "time");
aj.print();
console.log("columns:", aj.columns());
