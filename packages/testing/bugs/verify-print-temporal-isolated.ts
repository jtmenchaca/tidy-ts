import { createDataFrame } from "@tidy-ts/dataframe";
import { Temporal } from "@tidy-ts/shims/temporal-polyfill";

// All-PlainDate column
const df = createDataFrame([
  { d: Temporal.PlainDate.from("2024-01-15") },
  { d: Temporal.PlainDate.from("2024-02-20") },
]);
console.log("=== rows from toRows() ===");
console.log(df.toRows());
console.log("\n=== direct column access ===");
console.log(df.d);
console.log("First element constructor:", df.d[0]?.constructor.name);
console.log("String of first element:", String(df.d[0]));
console.log("\n=== print() output ===");
df.print();
