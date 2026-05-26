import { createDataFrame, writeCSV } from "@tidy-ts/dataframe";
import { Temporal } from "@tidy-ts/shims/temporal-polyfill";

await writeCSV(createDataFrame([
  { id: 1, ts: new Date("2024-03-04T09:30:00Z") },
  { id: 2, ts: new Date("2024-03-05T10:30:00Z") },
]), "/tmp/csv-date.csv");

await writeCSV(createDataFrame([
  { id: 1, ts: Temporal.Instant.from("2024-03-04T09:30:00Z") },
  { id: 2, ts: Temporal.Instant.from("2024-03-05T10:30:00Z") },
]), "/tmp/csv-instant.csv");

await writeCSV(createDataFrame([
  { id: 1, d: Temporal.PlainDate.from("2024-03-04") },
  { id: 2, d: Temporal.PlainDate.from("2024-03-05") },
]), "/tmp/csv-plaindate.csv");

console.log("=== Date ===");
console.log(await Deno.readTextFile("/tmp/csv-date.csv"));
console.log("=== Instant ===");
console.log(await Deno.readTextFile("/tmp/csv-instant.csv"));
console.log("=== PlainDate ===");
console.log(await Deno.readTextFile("/tmp/csv-plaindate.csv"));
