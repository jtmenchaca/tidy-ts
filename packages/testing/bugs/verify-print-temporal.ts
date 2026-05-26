import { createDataFrame } from "@tidy-ts/dataframe";
import { Temporal } from "@tidy-ts/shims/temporal-polyfill";

const df = createDataFrame([
  { id: 1, d: Temporal.PlainDate.from("2024-01-15"), price: 100 },
  { id: 2, d: Temporal.PlainDate.from("2024-02-20"), price: 110 },
  { id: 3, dt: Temporal.PlainDateTime.from("2024-03-04T09:30:00"), price: 120 },
  { id: 4, inst: Temporal.Instant.from("2024-03-04T09:30:00Z"), price: 130 },
  { id: 5, zdt: Temporal.ZonedDateTime.from("2024-03-04T09:00:00-05:00[America/New_York]"), price: 140 },
]);
df.print();

console.log("\n=== single-column dfs ===");
createDataFrame([
  { d: Temporal.PlainDate.from("2024-01-15") },
  { d: Temporal.PlainDate.from("2024-02-20") },
]).print();
createDataFrame([
  { dt: Temporal.PlainDateTime.from("2024-03-04T09:30:00") },
  { dt: Temporal.PlainDateTime.from("2024-03-05T10:15:00") },
]).print();
createDataFrame([
  { inst: Temporal.Instant.from("2024-03-04T09:30:00Z") },
  { inst: Temporal.Instant.from("2024-03-05T10:15:00Z") },
]).print();
createDataFrame([
  { zdt: Temporal.ZonedDateTime.from("2024-03-04T09:00:00-05:00[America/New_York]") },
]).print();
